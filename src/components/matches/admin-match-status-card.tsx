import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthAlert, AuthButton, AuthInput } from '@/components/auth';
import { BorderWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SessionDetail, SessionStatus, UpdateSessionBody } from '@/types';
import {
  formatTimeRange,
  formatVnd,
  getSessionStatusMeta,
  parseVndAmount,
  type SessionStatusMeta,
} from '@/utils/format';

export interface AdminMatchStatusCardProps {
  session: SessionDetail;
  slotVoteCounts: Record<string, number>;
  isPastMatch: boolean;
  currentUserId?: string;
  submitting: boolean;
  onSubmit: (payload: UpdateSessionBody) => Promise<void> | void;
}

interface StatusOptionConfig {
  status: SessionStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: SessionStatusMeta['tone'];
  description: string;
}

const SESSION_STATUS_OPTIONS: readonly StatusOptionConfig[] = [
  {
    status: 'VOTING',
    label: 'Đang vote giờ',
    icon: 'time-outline',
    tone: 'primary',
    description: 'Mở bình chọn khung giờ và đăng ký tham gia.',
  },
  {
    status: 'CONFIRMED',
    label: 'Đã đủ người',
    icon: 'people-outline',
    tone: 'success',
    description: 'Đã đủ số lượng tối thiểu, sẵn sàng đặt sân.',
  },
  {
    status: 'BOOKED',
    label: 'Đã chốt sân',
    icon: 'calendar-outline',
    tone: 'primary',
    description: 'Đã đặt sân và chốt khung giờ thi đấu.',
  },
  {
    status: 'COMPLETED',
    label: 'Đã đá',
    icon: 'checkmark-done-outline',
    tone: 'neutral',
    description: 'Buổi đá đã kết thúc, chuyển sang mục Đã đá.',
  },
  {
    status: 'CANCELLED',
    label: 'Đã huỷ',
    icon: 'close-circle-outline',
    tone: 'danger',
    description: 'Huỷ buổi đá và thông báo lý do cho thành viên.',
  },
] as const;

const CANCEL_REASON_PRESETS = [
  'Trời mưa lớn, sân ngập',
  'Không đủ quân số',
  'Sân bận / đổi lịch',
] as const;

function resolveDefaultSlotId(
  session: SessionDetail,
  slotVoteCounts: Record<string, number>,
): string {
  const slots = session.timeSlots ?? [];
  if (slots.length === 0) return '';

  if (
    session.selectedTimeSlotId &&
    slots.some((slot) => slot.id === session.selectedTimeSlotId)
  ) {
    return session.selectedTimeSlotId;
  }

  let bestSlot = slots[0];
  let bestCount = slotVoteCounts[bestSlot.id] ?? 0;
  for (let i = 1; i < slots.length; i += 1) {
    const count = slotVoteCounts[slots[i].id] ?? 0;
    if (count > bestCount) {
      bestSlot = slots[i];
      bestCount = count;
    }
  }
  return bestSlot.id;
}

function getTonePalette(
  tone: SessionStatusMeta['tone'],
  colors: ReturnType<typeof useTheme>,
) {
  switch (tone) {
    case 'primary':
      return {
        bg: colors.primarySurface,
        border: colors.primary,
        text: colors.primary,
      };
    case 'success':
      return {
        bg: colors.successBackground,
        border: colors.success,
        text: colors.success,
      };
    case 'danger':
      return {
        bg: colors.dangerBackground,
        border: colors.dangerBorder,
        text: colors.dangerText,
      };
    case 'neutral':
    default:
      return {
        bg: colors.surfaceMuted,
        border: colors.textSecondary,
        text: colors.text,
      };
  }
}

/**
 * Admin status-transition panel inside Match Detail backed by `PUT /api/sessions/{id}`.
 */
export function AdminMatchStatusCard({
  session,
  slotVoteCounts,
  isPastMatch,
  currentUserId,
  submitting,
  onSubmit,
}: AdminMatchStatusCardProps) {
  const colors = useTheme();

  const initialCost = Math.round(parseVndAmount(session.totalCost));
  const initialSlotId = session.selectedTimeSlotId ?? '';

  const [selectedStatus, setSelectedStatus] = useState<SessionStatus>(session.status);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(() =>
    session.status === 'BOOKED' ? initialSlotId : resolveDefaultSlotId(session, slotVoteCounts),
  );
  const [costInput, setCostInput] = useState<string>(() =>
    initialCost > 0 ? String(initialCost) : '',
  );
  const [cancellationNote, setCancellationNote] = useState<string>(
    session.cancellationNote ?? '',
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSelectStatus = (next: SessionStatus) => {
    setSelectedStatus(next);
    setValidationError(null);
    if (next === 'BOOKED' && !selectedSlotId) {
      setSelectedSlotId(resolveDefaultSlotId(session, slotVoteCounts));
    }
  };

  const digits = costInput.replace(/[^\d]/g, '');
  const parsedInputCost = digits ? Number.parseInt(digits, 10) : 0;

  const hasChanges =
    selectedStatus !== session.status ||
    (selectedStatus === 'BOOKED' &&
      (selectedSlotId !== initialSlotId || parsedInputCost !== initialCost)) ||
    (selectedStatus === 'CANCELLED' &&
      cancellationNote.trim() !== (session.cancellationNote ?? '').trim());

  const currentStatusMeta = getSessionStatusMeta(session.status, Boolean(session.teams));
  const currentBadgeTone = getTonePalette(currentStatusMeta.tone, colors);
  const selectedOption =
    SESSION_STATUS_OPTIONS.find((item) => item.status === selectedStatus) ??
    SESSION_STATUS_OPTIONS[0];

  const handleSubmit = () => {
    if (submitting || !hasChanges) return;
    setValidationError(null);

    const payload: UpdateSessionBody = { status: selectedStatus };

    if (selectedStatus === 'BOOKED') {
      if (selectedSlotId) {
        payload.selectedTimeSlotId = selectedSlotId;
      }
      if (costInput.trim().length > 0) {
        if (parsedInputCost <= 0) {
          setValidationError('Tổng tiền sân phải lớn hơn 0đ (hoặc để trống nếu chưa chốt phí).');
          return;
        }
        payload.totalCost = parsedInputCost;
        if (session.payerId || currentUserId) {
          payload.payerId = session.payerId ?? currentUserId;
        }
      }
    }

    if (selectedStatus === 'CANCELLED') {
      const trimmed = cancellationNote.trim();
      if (!trimmed) {
        setValidationError('Vui lòng nhập lý do huỷ trận trước khi xác nhận.');
        return;
      }
      if (trimmed.length > 500) {
        setValidationError('Lý do huỷ trận tối đa 500 ký tự.');
        return;
      }
      payload.cancellationNote = trimmed;
    }

    void onSubmit(payload);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[Typography.metaStrong13, { color: colors.text }]}>
          Trạng thái trận đấu
        </Text>
        <View style={[styles.currentBadge, { backgroundColor: currentBadgeTone.bg }]}>
          <Text numberOfLines={1} style={[Typography.chip12, { color: currentBadgeTone.text }]}>
            {currentStatusMeta.label}
          </Text>
        </View>
      </View>

      {isPastMatch && session.status !== 'COMPLETED' && session.status !== 'CANCELLED' ? (
        <Text style={[Typography.headerSub11, { color: colors.textSecondary }]}>
          {`Trận đã qua giờ đá nhưng trạng thái hệ thống vẫn là "${currentStatusMeta.label}". Bạn có thể chuyển sang Đã đá.`}
        </Text>
      ) : null}

      <View style={styles.pillsGrid}>
        {SESSION_STATUS_OPTIONS.map((option) => {
          const isSelected = option.status === selectedStatus;
          const tonePalette = getTonePalette(option.tone, colors);

          return (
            <Pressable
              key={option.status}
              onPress={() => handleSelectStatus(option.status)}
              disabled={submitting}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: submitting }}
              style={({ pressed }) => [
                styles.statusPill,
                isSelected
                  ? {
                      backgroundColor: tonePalette.bg,
                      borderColor: tonePalette.border,
                      borderWidth: BorderWidth.active,
                    }
                  : {
                      backgroundColor: colors.canvas,
                      borderColor: colors.border,
                      borderWidth: BorderWidth.default,
                    },
                pressed && !submitting && styles.pressed,
              ]}>
              <Ionicons
                name={option.icon}
                size={15}
                color={isSelected ? tonePalette.text : colors.textSecondary}
              />
              <Text
                numberOfLines={1}
                style={[
                  Typography.chip12,
                  { color: isSelected ? tonePalette.text : colors.text },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[Typography.small12, { color: colors.textSecondary }]}>
        {selectedOption.description}
      </Text>

      {selectedStatus === 'BOOKED' ? (
        <View
          style={[
            styles.contextPanel,
            { backgroundColor: colors.canvas, borderColor: colors.border },
          ]}>
          {session.timeSlots && session.timeSlots.length > 0 ? (
            <View style={styles.slotSection}>
              <Text style={[Typography.metaStrong13, { color: colors.text }]}>
                Khung giờ chốt sân
              </Text>
              <View style={styles.slotChipsRow}>
                {session.timeSlots.map((slot) => {
                  const isSlotSelected = selectedSlotId === slot.id;
                  const count = slotVoteCounts[slot.id] ?? 0;

                  return (
                    <Pressable
                      key={slot.id}
                      onPress={() => setSelectedSlotId(slot.id)}
                      disabled={submitting}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSlotSelected, disabled: submitting }}
                      style={({ pressed }) => [
                        styles.slotChip,
                        isSlotSelected
                          ? {
                              backgroundColor: colors.primarySurface,
                              borderColor: colors.primary,
                              borderWidth: BorderWidth.active,
                            }
                          : {
                              backgroundColor: colors.surface,
                              borderColor: colors.border,
                              borderWidth: BorderWidth.default,
                            },
                        pressed && !submitting && styles.pressed,
                      ]}>
                      <Text
                        numberOfLines={1}
                        style={[
                          Typography.chip12,
                          { color: isSlotSelected ? colors.primary : colors.text },
                        ]}>
                        {`${formatTimeRange(slot.startTime, slot.endTime)} · ${count} phiếu`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <AuthInput
            label="Tổng tiền sân (VNĐ, không bắt buộc)"
            placeholder="VD: 600000"
            keyboardType="number-pad"
            value={costInput}
            onChangeText={(text) => {
              setCostInput(text);
              setValidationError(null);
            }}
            helperText={
              parsedInputCost > 0
                ? `Sẽ lưu ${formatVnd(parsedInputCost)} và tạo khoản chia tiền cho thành viên.`
                : 'Để trống nếu muốn nhập chi phí sau tại mục Quyết toán.'
            }
          />
        </View>
      ) : null}

      {selectedStatus === 'CANCELLED' ? (
        <View
          style={[
            styles.cancelPanel,
            { backgroundColor: colors.dangerBackground, borderColor: colors.dangerBorder },
          ]}>
          <View style={styles.cancelHeaderRow}>
            <Text style={[Typography.metaStrong13, { color: colors.dangerText }]}>
              Lý do huỷ trận *
            </Text>
            <Text style={[Typography.headerSub11, { color: colors.dangerText }]}>
              {`${cancellationNote.trim().length}/500`}
            </Text>
          </View>

          <View style={styles.presetRow}>
            {CANCEL_REASON_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                onPress={() => {
                  setCancellationNote(preset);
                  setValidationError(null);
                }}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.presetChip,
                  { backgroundColor: colors.surface, borderColor: colors.dangerBorder },
                  pressed && !submitting && styles.pressed,
                ]}>
                <Text numberOfLines={1} style={[Typography.headerSub11, { color: colors.dangerText }]}>
                  {preset}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            multiline
            maxLength={500}
            textAlignVertical="top"
            value={cancellationNote}
            onChangeText={(text) => {
              setCancellationNote(text);
              setValidationError(null);
            }}
            placeholder="Nhập lý do huỷ trận để thông báo đến thành viên..."
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.reasonInput,
              Typography.body14,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>
      ) : null}

      {validationError ? (
        <AuthAlert title="Chưa thể cập nhật" message={validationError} />
      ) : null}

      <AuthButton
        label={selectedStatus === 'CANCELLED' ? 'Xác nhận huỷ trận' : 'Cập nhật trạng thái'}
        onPress={handleSubmit}
        disabled={!hasChanges || submitting}
        loading={submitting}
        style={
          selectedStatus === 'CANCELLED' && hasChanges
            ? { backgroundColor: colors.danger }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  contextPanel: {
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  slotSection: {
    gap: Spacing.sm,
  },
  slotChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  cancelPanel: {
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cancelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.hairline,
  },
  reasonInput: {
    minHeight: 84,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pressed: {
    opacity: 0.78,
  },
});
