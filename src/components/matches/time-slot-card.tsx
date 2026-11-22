import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TimeSlot } from '@/types';
import { formatTimeRange } from '@/utils/format';
import { getTimeSlotFallbackCount } from '@/utils/sessions';

export interface TimeSlotCardProps {
  slot: TimeSlot;
  votesCount?: number;
  isFinalSlot?: boolean;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/**
 * Votable kickoff window card displayed in Match Detail (`02 Chi tiết trận`).
 */
export function TimeSlotCard({
  slot,
  votesCount,
  isFinalSlot = false,
  selected,
  disabled = false,
  onPress,
}: TimeSlotCardProps) {
  const colors = useTheme();
  const displayVotesCount =
    typeof votesCount === 'number' ? votesCount : getTimeSlotFallbackCount(slot);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? colors.backgroundSelected : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? BorderWidth.active : BorderWidth.default,
        },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <View style={styles.left}>
        <View style={styles.topLine}>
          <Text style={[Typography.time20, { color: colors.text }]}>
            {formatTimeRange(slot.startTime, slot.endTime)}
          </Text>
          {isFinalSlot ? (
            <View style={[styles.finalChip, { backgroundColor: colors.primarySurface }]}>
              <Text numberOfLines={1} style={[Typography.headerSub11, { color: colors.primary }]}>
                Đã chốt
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[Typography.small12, { color: colors.textSecondary }]}>
          {displayVotesCount} phiếu
        </Text>
      </View>

      <View
        style={[
          styles.checkCircle,
          {
            backgroundColor: selected ? colors.primary : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}>
        {selected ? <Ionicons name="checkmark" size={14} color={colors.onPrimary} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    borderRadius: Radius.card,
    gap: Spacing.md,
  },
  left: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  finalChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: BorderWidth.default,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
