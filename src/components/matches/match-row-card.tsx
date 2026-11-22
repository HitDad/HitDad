import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SessionDetail } from '@/types';
import {
  formatSessionDateParts,
  formatTimeRange,
  formatVnd,
  getSessionStatusMeta,
  parseVndAmount,
} from '@/utils/format';

export interface MatchRowCardProps {
  session: SessionDetail;
  variant?: 'upcoming' | 'done';
  currentUserId?: string;
  onPress: () => void;
}

/**
 * Compact session list row replicating Figma `Match row` (`EL-b57eb0d9` / `EL-eddb854a`).
 */
export function MatchRowCard({
  session,
  variant = 'upcoming',
  currentUserId,
  onPress,
}: MatchRowCardProps) {
  const colors = useTheme();
  const dateParts = formatSessionDateParts(session.playDate);
  const isDone = variant === 'done';
  const effectiveStatus = isDone && session.status !== 'CANCELLED' ? 'COMPLETED' : session.status;
  const statusMeta = getSessionStatusMeta(effectiveStatus, Boolean(session.teams));

  const joinCount = session.votes
    ? session.votes.filter((v) => v.status === 'JOIN').length
    : (session._count?.votes ?? 0);

  const myVote = currentUserId
    ? session.votes?.find((v) => v.userId === currentUserId)
    : undefined;

  const totalCostNum = parseVndAmount(session.totalCost);
  const splitCountNum = Math.round(parseVndAmount(session.splitCount));
  const perPersonCost =
    totalCostNum > 0 && splitCountNum > 0 ? Math.round(totalCostNum / splitCountNum) : null;

  const subtitle = isDone
    ? perPersonCost
      ? `${splitCountNum || joinCount} người · ${formatVnd(perPersonCost)}/người`
      : totalCostNum > 0
        ? `${joinCount} người · ${formatVnd(totalCostNum)}`
        : `${joinCount} người tham gia · ${session.location}`
    : `${joinCount}/${session.maxPlayers} người · ${formatTimeRange(session.startTime, session.endTime)}`;

  const badgeLabel =
    !isDone && myVote?.status === 'JOIN'
      ? 'Đã tham gia'
      : !isDone && myVote?.status === 'DECLINE'
        ? 'Báo vắng'
        : statusMeta.label;

  const isHighlightedChip = !isDone && myVote?.status === 'JOIN';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: isDone ? colors.backgroundElement : colors.surface,
          borderColor: colors.border,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.dateCol}>
        <Text
          numberOfLines={1}
          style={[
            Typography.date26,
            { color: isDone ? colors.textSecondary : colors.primary },
          ]}>
          {dateParts.dayNumber}
        </Text>
        <Text numberOfLines={1} style={[Typography.caption11, { color: colors.textSecondary }]}>
          {dateParts.monthLabel}
        </Text>
      </View>

      <View style={styles.textCol}>
        <Text style={[Typography.title14, { color: colors.text }]} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={[Typography.small12, { color: colors.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.chip,
          isHighlightedChip
            ? { backgroundColor: colors.primarySurface, borderColor: colors.primarySurface }
            : { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <Text
          numberOfLines={1}
          style={[
            Typography.chip12,
            {
              color: isHighlightedChip
                ? colors.primary
                : statusMeta.tone === 'danger'
                  ? colors.danger
                  : colors.textSecondary,
            },
          ]}>
          {badgeLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
  },
  pressed: {
    opacity: 0.85,
  },
  dateCol: {
    minWidth: 46,
    flexShrink: 0,
    alignItems: 'center',
    gap: 2,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  chip: {
    flexShrink: 0,
    maxWidth: 132,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.default,
  },
});
