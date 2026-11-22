import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthAlert, AuthButton } from '@/components/auth';
import { BorderWidth, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const DECLINE_PRESETS = [
  'Bận học / thi',
  'Bận việc',
  'Ốm / chấn thương',
  'Không có xe',
  'Về quê',
  'Lý do khác',
] as const;

const LEAVE_PRESETS = [
  'Ốm / chấn thương',
  'Việc gấp',
  'Kẹt xe',
  'Thời tiết xấu',
  'Lý do khác',
] as const;

const MAX_NOTE_LENGTH = 100;

export interface LeaveRequestModalProps {
  visible: boolean;
  mode: 'decline' | 'leave';
  sessionTitle: string;
  dateLabel: string;
  location: string;
  isVoteLocked?: boolean;
  submitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Bottom-sheet modal replicating Figma `02 Overlay – Lý do không tham gia` (`#162:1605`)
 * and `02f Overlay – Xin nghỉ` (`#165:1677`).
 */
export function LeaveRequestModal({
  visible,
  mode,
  dateLabel,
  location,
  isVoteLocked = false,
  submitting = false,
  errorMessage = null,
  onClose,
  onConfirm,
}: LeaveRequestModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <LeaveRequestSheetContent
          mode={mode}
          dateLabel={dateLabel}
          location={location}
          isVoteLocked={isVoteLocked}
          submitting={submitting}
          errorMessage={errorMessage}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </Modal>
  );
}

function LeaveRequestSheetContent({
  mode,
  dateLabel,
  location,
  isVoteLocked,
  submitting,
  errorMessage,
  onClose,
  onConfirm,
}: Omit<LeaveRequestModalProps, 'visible' | 'sessionTitle'>) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const presets = mode === 'leave' ? LEAVE_PRESETS : DECLINE_PRESETS;

  const [selectedPreset, setSelectedPreset] = useState<string>(presets[0]);
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (isVoteLocked) return;
    const trimmedNote = note.trim();

    if (selectedPreset === 'Lý do khác' && !trimmedNote) {
      setLocalError('Vui lòng nhập lý do cụ thể bên dưới.');
      return;
    }

    setLocalError(null);
    const finalReason =
      selectedPreset === 'Lý do khác'
        ? trimmedNote
        : trimmedNote
          ? `${selectedPreset}: ${trimmedNote}`
          : selectedPreset;

    onConfirm(finalReason);
  };

  const title = mode === 'leave' ? 'Xin nghỉ buổi này' : 'Chọn lý do không tham gia';
  const subtitle =
    mode === 'leave'
      ? `Buổi ${dateLabel}, ${location}. Báo muộn có thể ảnh hưởng việc chia đội.`
      : `Buổi ${dateLabel}, ${location}. Chỉ admin xem được lý do.`;
  const confirmLabel =
    mode === 'leave' ? 'Gửi xác nhận xin nghỉ' : 'Xác nhận không tham gia';
  const noteLabel =
    mode === 'leave' ? 'Nhắn admin (không bắt buộc)' : 'Ghi thêm (không bắt buộc)';
  const notePlaceholder =
    mode === 'leave'
      ? 'Ví dụ: có thể nhờ dự bị vào thay'
      : 'Ví dụ: tuần sau mình đi lại được';

  return (
    <KeyboardAvoidingView
      style={styles.overlayRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: Math.max(insets.bottom, Spacing.screen),
          },
        ]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetBody}>
          <View style={styles.headerBlock}>
            <Text style={[Typography.cardTitle24, { color: colors.text }]}>{title}</Text>
            <Text style={[Typography.small12, { color: colors.textSecondary }]}>{subtitle}</Text>
          </View>

          {isVoteLocked ? (
            <AuthAlert
              variant="warning"
              title="Danh sách đã chốt"
              message="Bình chọn đã khoá — thành viên không thể tự đổi trạng thái trên hệ thống. Vui lòng liên hệ Admin để điều chỉnh quân số."
            />
          ) : null}

          {localError || errorMessage ? (
            <AuthAlert
              variant="error"
              title="Không thể gửi"
              message={localError ?? errorMessage ?? ''}
            />
          ) : null}

          <View style={styles.section}>
            <Text style={[Typography.metaStrong13, { color: colors.text }]}>Lý do phổ biến</Text>
            <View style={styles.chipsWrap}>
              {presets.map((preset) => {
                const selected = selectedPreset === preset;
                return (
                  <Pressable
                    key={preset}
                    disabled={isVoteLocked}
                    onPress={() => {
                      setSelectedPreset(preset);
                      if (localError) setLocalError(null);
                    }}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primarySurface : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        Typography.chip12,
                        { color: selected ? colors.primary : colors.textSecondary },
                      ]}>
                      {preset}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.noteLabelRow}>
              <Text style={[Typography.metaStrong13, { color: colors.text }]}>{noteLabel}</Text>
              <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                {note.length}/{MAX_NOTE_LENGTH}
              </Text>
            </View>
            <TextInput
              value={note}
              editable={!isVoteLocked}
              onChangeText={(text) => {
                setNote(text.slice(0, MAX_NOTE_LENGTH));
                if (localError) setLocalError(null);
              }}
              placeholder={notePlaceholder}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={MAX_NOTE_LENGTH}
              style={[
                styles.noteInput,
                Typography.body14,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
          </View>

          <View style={styles.actions}>
            <AuthButton
              label={confirmLabel}
              onPress={handleConfirm}
              loading={submitting}
              disabled={isVoteLocked}
              style={{ backgroundColor: colors.danger }}
            />
            <AuthButton
              label="Thôi, vẫn đi"
              variant="secondary"
              onPress={onClose}
              disabled={submitting}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 42, 107, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: 10,
    paddingHorizontal: Spacing.screen,
    maxHeight: '88%',
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    alignSelf: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetBody: {
    gap: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerBlock: {
    gap: 4,
  },
  section: {
    gap: Spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.default,
  },
  noteLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteInput: {
    minHeight: 76,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.default,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  actions: {
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.78,
  },
});
