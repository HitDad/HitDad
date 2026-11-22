import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthAlert, AuthButton, AuthInput, AuthScreenShell } from '@/components/auth';
import { DatePickerField, TimePickerField } from '@/components/ui/date-time-picker';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiClientError } from '@/services/api';
import { sessionService } from '@/services/sessions';
import type { SessionStatus, TimeSlotInput } from '@/types';
import {
  combineDeadlineValue,
  compareHhmm,
  getUpcomingWeekdayDate,
  parseIsoDateOnly,
  splitDeadlineValue,
  suggestEndTime,
  toIsoDateString,
} from '@/utils/date-time-picker';
import { formatSessionDateParts } from '@/utils/format';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function shiftIsoDate(playDateStr: string, offsetDays: number): string {
  const parsed = parseIsoDateOnly(playDateStr);
  if (!parsed) return '';
  const target = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate() + offsetDays,
  );
  return toIsoDateString(target);
}

function buildDeadlineBefore(playDateStr: string, daysBefore: number, time = '20:00'): string {
  const shifted = shiftIsoDate(playDateStr, -daysBefore);
  return shifted ? combineDeadlineValue(shifted, time) : '';
}

function toIsoDeadline(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.includes(' ') ? trimmed.replace(' ', 'T') : trimmed;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function formatDeadlineInput(isoDate: string | null): string {
  if (!isoDate) return '';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function CreateSessionScreen() {
  const colors = useTheme();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';
  const isEditing = Boolean(sessionId);

  const defaultPlayDate = getUpcomingWeekdayDate(3);
  const [title, setTitle] = useState('Đá tối thứ Tư');
  const [playDate, setPlayDate] = useState(defaultPlayDate);
  const [timeSlots, setTimeSlots] = useState<TimeSlotInput[]>([
    { startTime: '18:30', endTime: '20:30' },
    { startTime: '19:00', endTime: '21:00' },
  ]);
  const [location, setLocation] = useState('Sân Mười Thọ');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [minPlayers, setMinPlayers] = useState('12');
  const [maxPlayers, setMaxPlayers] = useState('22');
  const [voteDeadline, setVoteDeadline] = useState(() =>
    buildDeadlineBefore(defaultPlayDate, 2, '20:00'),
  );
  const deadlineParts = splitDeadlineValue(voteDeadline);

  const [existingStatus, setExistingStatus] = useState<SessionStatus | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;

    async function loadExisting() {
      try {
        const res = await sessionService.getDetail(sessionId);
        if (!active) return;
        const s = res.session;
        setExistingStatus(s.status);
        setTitle(s.title);
        const dateParts = formatSessionDateParts(s.playDate);
        if (dateParts.isoDateOnly) {
          setPlayDate(dateParts.isoDateOnly);
        }
        if (s.timeSlots && s.timeSlots.length > 0) {
          setTimeSlots(
            s.timeSlots.map((slot) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          );
        } else {
          setTimeSlots([{ startTime: s.startTime, endTime: s.endTime }]);
        }
        setLocation(s.location);
        setGoogleMapsUrl(s.googleMapsUrl ?? '');
        setMinPlayers(String(s.minPlayers));
        setMaxPlayers(String(s.maxPlayers));
        setVoteDeadline(formatDeadlineInput(s.voteDeadline));
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof ApiClientError ? error.message : 'Không thể tải thông tin trận.',
          );
        }
      } finally {
        if (active) setLoadingExisting(false);
      }
    }

    void loadExisting();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const updateSlot = (index: number, key: keyof TimeSlotInput, value: string) => {
    setTimeSlots((prev) =>
      prev.map((slot, idx) => {
        if (idx !== index) return slot;
        if (key === 'startTime' && compareHhmm(value, slot.endTime) >= 0) {
          return { ...slot, startTime: value, endTime: suggestEndTime(value, 120) };
        }
        return { ...slot, [key]: value };
      }),
    );
  };

  const addSlot = () => {
    setTimeSlots((prev) => [...prev, { startTime: '20:00', endTime: '21:30' }]);
  };

  const removeSlot = (index: number) => {
    setTimeSlots((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedDate = playDate.trim();
    const trimmedLocation = location.trim();
    const trimmedMaps = googleMapsUrl.trim();
    const minNum = Number.parseInt(minPlayers, 10);
    const maxNum = Number.parseInt(maxPlayers, 10);

    if (!trimmedTitle) {
      setErrorMessage('Vui lòng nhập tên buổi đá.');
      return;
    }
    if (!DATE_REGEX.test(trimmedDate)) {
      setErrorMessage('Ngày đá phải đúng định dạng YYYY-MM-DD (ví dụ 2026-11-25).');
      return;
    }
    if (!trimmedLocation) {
      setErrorMessage('Vui lòng nhập tên sân thi đấu.');
      return;
    }
    if (trimmedMaps && !/^https?:\/\//i.test(trimmedMaps)) {
      setErrorMessage('Link Google Maps phải bắt đầu bằng http:// hoặc https://.');
      return;
    }
    if (!Number.isFinite(minNum) || minNum < 2 || !Number.isFinite(maxNum) || maxNum < minNum) {
      setErrorMessage('Số lượng tối thiểu phải >= 2 và không lớn hơn tối đa.');
      return;
    }

    const validSlots = timeSlots.map((s) => ({
      startTime: s.startTime.trim(),
      endTime: s.endTime.trim(),
    }));
    const hasInvalidSlot = validSlots.some(
      (s) => !HHMM_REGEX.test(s.startTime) || !HHMM_REGEX.test(s.endTime),
    );
    if (validSlots.length === 0 || hasInvalidSlot) {
      setErrorMessage('Mỗi khung giờ cần đúng định dạng HH:mm (ví dụ 18:30 và 20:30).');
      return;
    }

    const deadlineIso = toIsoDeadline(voteDeadline);
    if (voteDeadline.trim() && !deadlineIso) {
      setErrorMessage('Hạn chốt vote cần định dạng YYYY-MM-DD HH:mm (ví dụ 2026-11-23 20:00).');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const primarySlot = validSlots[0];
      const canEditTimeSlots =
        !isEditing ||
        (existingStatus !== 'BOOKED' &&
          existingStatus !== 'COMPLETED' &&
          existingStatus !== 'CANCELLED');
      const payload = {
        title: trimmedTitle,
        playDate: trimmedDate,
        startTime: primarySlot.startTime,
        endTime: primarySlot.endTime,
        ...(canEditTimeSlots ? { timeSlots: validSlots } : {}),
        location: trimmedLocation,
        googleMapsUrl: trimmedMaps || undefined,
        minPlayers: minNum,
        maxPlayers: maxNum,
        voteDeadline: deadlineIso,
      };

      const res = isEditing
        ? await sessionService.update(sessionId, payload)
        : await sessionService.create(payload);

      router.replace({ pathname: '/matches/[id]', params: { id: res.session.id } });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Không thể lưu trận đấu. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      header={{
        variant: 'back',
        backLabel: 'Quay lại',
        onBack: () => router.back(),
        title: isEditing ? 'SỬA TRẬN' : 'TẠO TRẬN',
        subtitle: 'Thành viên được báo ngay khi bạn tạo',
      }}
      footer={
        <AuthButton
          label={isEditing ? 'Lưu thay đổi' : 'Tạo trận đấu'}
          onPress={() => void handleSubmit()}
          loading={submitting}
          disabled={loadingExisting}
        />
      }>
      {loadingExisting ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {errorMessage ? (
            <AuthAlert title="Chưa thể lưu trận đấu" message={errorMessage} />
          ) : null}

          <View style={styles.form}>
            <AuthInput
              label="Tên buổi"
              placeholder="Đá tối thứ Tư"
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.fieldGroup}>
              <DatePickerField
                label="Ngày đá"
                value={playDate}
                onChange={setPlayDate}
                placeholder="Chọn ngày đá"
              />
              <View style={styles.chipRow}>
                {[
                  { label: 'Thứ Tư tới', dow: 3 },
                  { label: 'Thứ Sáu tới', dow: 5 },
                  { label: 'Chủ Nhật tới', dow: 0 },
                ].map((preset) => (
                  <Pressable
                    key={preset.label}
                    onPress={() => {
                      const nextDate = getUpcomingWeekdayDate(preset.dow);
                      setPlayDate(nextDate);
                      setVoteDeadline(buildDeadlineBefore(nextDate, 2, '20:00'));
                    }}
                    style={({ pressed }) => [
                      styles.presetChip,
                      { backgroundColor: colors.primarySurface },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[Typography.chip12, { color: colors.primary }]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.slotHeader}>
                <Text style={[Typography.metaStrong13, { color: colors.text }]}>
                  Khung giờ để vote
                </Text>
                <Pressable onPress={addSlot} hitSlop={8}>
                  <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
                    + Thêm khung giờ
                  </Text>
                </Pressable>
              </View>

              <View style={styles.slotsList}>
                {timeSlots.map((slot, idx) => (
                  <View key={idx} style={styles.slotRow}>
                    <View style={styles.timePickerWrap}>
                      <TimePickerField
                        title="Giờ bắt đầu"
                        value={slot.startTime}
                        onChange={(val) => updateSlot(idx, 'startTime', val)}
                      />
                    </View>
                    <Text style={[Typography.title14, { color: colors.textSecondary }]}>–</Text>
                    <View style={styles.timePickerWrap}>
                      <TimePickerField
                        title="Giờ kết thúc"
                        value={slot.endTime}
                        onChange={(val) => updateSlot(idx, 'endTime', val)}
                      />
                    </View>
                    {timeSlots.length > 1 ? (
                      <Pressable
                        onPress={() => removeSlot(idx)}
                        hitSlop={8}
                        accessibilityLabel="Xóa khung giờ">
                        <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
              <Text style={[Typography.headerSub11, { color: colors.textSecondary }]}>
                Thành viên chọn một hoặc nhiều trong các khung giờ này
              </Text>
            </View>

            <AuthInput
              label="Sân"
              placeholder="Sân Mười Thọ"
              value={location}
              onChangeText={setLocation}
            />

            <AuthInput
              label="Link Google Maps (không bắt buộc)"
              placeholder="https://maps.app.goo.gl/..."
              value={googleMapsUrl}
              onChangeText={setGoogleMapsUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <View style={styles.twoCol}>
              <View style={styles.halfCol}>
                <AuthInput
                  label="Tối thiểu"
                  placeholder="12"
                  value={minPlayers}
                  onChangeText={setMinPlayers}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfCol}>
                <AuthInput
                  label="Tối đa"
                  placeholder="22"
                  value={maxPlayers}
                  onChangeText={setMaxPlayers}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.slotHeader}>
                <Text style={[Typography.metaStrong13, { color: colors.text }]}>
                  Hạn chốt vote (không bắt buộc)
                </Text>
                {voteDeadline.trim() ? (
                  <Pressable onPress={() => setVoteDeadline('')} hitSlop={8}>
                    <Text style={[Typography.metaStrong13, { color: colors.primary }]}>Xoá hạn</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.deadlineRow}>
                <View style={styles.deadlineDateCol}>
                  <DatePickerField
                    compact
                    value={deadlineParts.date}
                    placeholder="Chọn ngày"
                    onChange={(nextDate) =>
                      setVoteDeadline(combineDeadlineValue(nextDate, deadlineParts.time || '20:00'))
                    }
                  />
                </View>
                <View style={styles.deadlineTimeCol}>
                  <TimePickerField
                    compact
                    title="Giờ chốt vote"
                    value={deadlineParts.time}
                    placeholder="Giờ"
                    onChange={(nextTime) =>
                      setVoteDeadline(
                        combineDeadlineValue(
                          deadlineParts.date || shiftIsoDate(playDate, -2) || playDate,
                          nextTime,
                        ),
                      )
                    }
                  />
                </View>
              </View>

              <Text style={[Typography.headerSub11, { color: colors.textSecondary }]}>
                Sau giờ này khung giờ nhiều phiếu nhất được chốt
              </Text>

              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => setVoteDeadline(buildDeadlineBefore(playDate, 2, '20:00'))}
                  style={({ pressed }) => [
                    styles.presetChip,
                    { backgroundColor: colors.primarySurface },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[Typography.chip12, { color: colors.primary }]}>
                    20:00 trước 2 ngày
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setVoteDeadline(buildDeadlineBefore(playDate, 1, '18:00'))}
                  style={({ pressed }) => [
                    styles.presetChip,
                    { backgroundColor: colors.primarySurface },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[Typography.chip12, { color: colors.primary }]}>
                    18:00 trước 1 ngày
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </>
      )}
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  form: {
    gap: Spacing.lg,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotsList: {
    gap: Spacing.sm,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timePickerWrap: {
    flex: 1,
    minWidth: 0,
  },
  deadlineRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  deadlineDateCol: {
    flex: 1.45,
    minWidth: 0,
  },
  deadlineTimeCol: {
    flex: 0.95,
    minWidth: 0,
  },
  twoCol: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfCol: {
    flex: 1,
  },
  pressed: {
    opacity: 0.78,
  },
});
