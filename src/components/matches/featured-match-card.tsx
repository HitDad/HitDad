import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Elevation, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SessionDetail } from '@/types';
import {
  formatDeadlineLabel,
  formatSessionDateParts,
  formatTimeRange,
  getSessionStatusMeta,
} from '@/utils/format';
import { extractTimeSlotIdsFromVote } from '@/utils/sessions';

export interface FeaturedMatchCardProps {
  session: SessionDetail;
  currentUserId?: string;
  contextBadge?: string;
  quickJoining?: boolean;
  onPress: () => void;
  onQuickJoin?: () => void;
}

/**
 * Elevated hero card on the Home tab replicating Figma `Match card / Featured` (`EL-401154e0`).
 */
export function FeaturedMatchCard({
  session,
  currentUserId,
  contextBadge,
  quickJoining = false,
  onPress,
  onQuickJoin,
}: FeaturedMatchCardProps) {
  const colors = useTheme();
  const dateParts = formatSessionDateParts(session.playDate);
  const statusMeta = getSessionStatusMeta(session.status, Boolean(session.teams));

  const joinCount = session.votes
    ? session.votes.filter((v) => v.status === 'JOIN').length
    : (session._count?.votes ?? 0);
  const remaining = Math.max(0, session.maxPlayers - joinCount);
  const progressPct =
    session.maxPlayers > 0 ? Math.min(100, Math.round((joinCount / session.maxPlayers) * 100)) : 0;

  const myVote = currentUserId
    ? session.votes?.find((v) => v.userId === currentUserId)
    : undefined;

  const selectedSlotIds = extractTimeSlotIdsFromVote(myVote);
  const matchedSlot = session.timeSlots?.find((slot) => selectedSlotIds.includes(slot.id));
  const voteDisplayTime = matchedSlot
    ? formatTimeRange(matchedSlot.startTime, matchedSlot.endTime)
    : formatTimeRange(session.startTime, session.endTime);

  const canQuickVote =
    !session.isVoteLocked && (session.status === 'VOTING' || session.status === 'CONFIRMED');

  const statusChipColors = {
    primary: { bg: colors.primary, text: colors.onPrimary },
    success: { bg: colors.successBackground, text: colors.success },
    neutral: { bg: colors.surfaceMuted, text: colors.textSecondary },
    danger: { bg: colors.dangerBackground, text: colors.danger },
  }[statusMeta.tone];

  const deadlineText = formatDeadlineLabel(session.voteDeadline);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        Elevation.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.topRow}>
        <View style={[styles.dateBlock, { backgroundColor: colors.primarySurface }]}>
          <Text numberOfLines={1} style={[Typography.caption11, { color: colors.primary }]}>
            {dateParts.dayOfWeekShort}
          </Text>
          <Text numberOfLines={1} style={[Typography.date36, { color: colors.primary }]}>
            {dateParts.dayNumber}
          </Text>
          <Text numberOfLines={1} style={[Typography.caption11, { color: colors.textSecondary }]}>
            {dateParts.monthLabel}
          </Text>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.chipRow}>
            {contextBadge ? (
              <View style={[styles.chip, { backgroundColor: colors.primarySurface }]}>
                <Text numberOfLines={1} style={[Typography.chip12, { color: colors.primary }]}>
                  {contextBadge}
                </Text>
              </View>
            ) : null}
            <View style={[styles.chip, { backgroundColor: statusChipColors.bg }]}>
              <Text numberOfLines={1} style={[Typography.chip12, { color: statusChipColors.text }]}>
                {statusMeta.label}
              </Text>
            </View>
            {session.isVoteLocked ? (
              <View style={[styles.chip, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="lock-closed" size={11} color={colors.textSecondary} />
                <Text numberOfLines={1} style={[Typography.chip12, { color: colors.textSecondary }]}>
                  Đã khoá
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[Typography.cardTitle24, { color: colors.text }]} numberOfLines={2}>
            {session.title}
          </Text>

          <View style={styles.metaLine}>
            <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
            <Text
              numberOfLines={1}
              style={[Typography.meta13, styles.metaText, { color: colors.textSecondary }]}>
              {formatTimeRange(session.startTime, session.endTime)}
            </Text>
          </View>

          <View style={styles.metaLine}>
            <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
            <Text
              style={[Typography.meta13, styles.metaText, { color: colors.textSecondary }]}
              numberOfLines={1}>
              {session.location}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.slotsSection}>
        <View style={styles.labelRow}>
          <Text style={[Typography.metaStrong13, { color: colors.text }]}>
            {joinCount}/{session.maxPlayers} người
          </Text>
          <Text style={[Typography.small12, { color: colors.textSecondary }]}>
            {remaining > 0 ? `Còn ${remaining} chỗ` : 'Đủ quân số'}
          </Text>
        </View>

        <View style={[styles.meterTrack, { backgroundColor: colors.primarySurface }]}>
          <View
            style={[
              styles.meterFill,
              { backgroundColor: colors.primary, width: `${progressPct}%` },
            ]}
          />
        </View>

        {deadlineText && !session.isVoteLocked ? (
          <Text style={[Typography.headerSub11, { color: colors.textSecondary }]}>
            {deadlineText}
          </Text>
        ) : null}
      </View>

      {myVote?.status === 'JOIN' ? (
        <View style={[styles.statusBanner, { backgroundColor: colors.primarySurface }]}>
          <View style={styles.bannerLeft}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text
              style={[Typography.metaStrong13, styles.bannerText, { color: colors.primary }]}
              numberOfLines={2}>
              {session.isVoteLocked
                ? 'Đã tham gia, trận đã chốt'
                : `Đã tham gia, vote ${voteDisplayTime}`}
            </Text>
          </View>
          <Text style={[Typography.metaStrong13, styles.bannerAction, { color: colors.primary }]}>
            Chi tiết
          </Text>
        </View>
      ) : myVote?.status === 'DECLINE' ? (
        <View style={[styles.statusBanner, { backgroundColor: colors.surfaceMuted }]}>
          <View style={styles.bannerLeft}>
            <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
            <Text
              style={[Typography.meta13, styles.bannerText, { color: colors.textSecondary }]}
              numberOfLines={2}>
              Bạn đã báo vắng buổi này
            </Text>
          </View>
          <Text style={[Typography.metaStrong13, styles.bannerAction, { color: colors.primary }]}>
            Đổi lựa chọn
          </Text>
        </View>
      ) : canQuickVote && onQuickJoin ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onQuickJoin();
          }}
          disabled={quickJoining}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: colors.primary },
            quickJoining && styles.ctaDisabled,
            pressed && !quickJoining && styles.ctaPressed,
          ]}>
          {quickJoining ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : null}
          <Text style={[Typography.button15, { color: colors.onPrimary }]}>Tham gia</Text>
        </Pressable>
      ) : (
        <View style={[styles.statusBanner, { backgroundColor: colors.surfaceMuted }]}>
          <Text
            style={[Typography.meta13, styles.bannerText, { color: colors.textSecondary }]}
            numberOfLines={2}>
            Xem thông tin chi tiết trận đấu
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.hairline,
    padding: Spacing.lg,
    gap: 14,
  },
  cardPressed: {
    opacity: 0.94,
  },
  topRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  dateBlock: {
    minWidth: 64,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: Radius.card,
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    flexShrink: 1,
  },
  slotsSection: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  meterTrack: {
    height: 8,
    borderRadius: Radius.xs,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: Radius.xs,
  },
  statusBanner: {
    borderRadius: Radius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  bannerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    flex: 1,
    flexShrink: 1,
  },
  bannerAction: {
    flexShrink: 0,
  },
  ctaButton: {
    height: 48,
    borderRadius: Radius.card,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaPressed: {
    opacity: 0.88,
  },
});
