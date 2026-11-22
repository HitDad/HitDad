import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PaymentItem } from '@/types';
import { formatVnd, getUserInitials } from '@/utils/format';

export interface PaymentMemberRowProps {
  item: PaymentItem;
  isCurrentUser: boolean;
  canConfirm: boolean;
  confirming?: boolean;
  onConfirm?: () => void;
}

function formatPaymentTime(iso: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${hh}:${min} · ${dd}/${mm}`;
}

/**
 * Member payment status row with optional Payer/Admin confirmation action.
 */
export function PaymentMemberRow({
  item,
  isCurrentUser,
  canConfirm,
  confirming = false,
  onConfirm,
}: PaymentMemberRowProps) {
  const colors = useTheme();
  const displayName = item.user?.displayName ?? 'Thành viên';

  const statusMeta = {
    CONFIRMED: {
      label: 'Đã xác nhận',
      bg: colors.successBackground,
      text: colors.success,
    },
    PAID: {
      label: 'Đã báo chuyển',
      bg: colors.primarySurface,
      text: colors.primary,
    },
    PENDING: {
      label: 'Chờ chuyển',
      bg: colors.warningBackground,
      text: colors.warning,
    },
  }[item.status];

  const confirmedTime = formatPaymentTime(item.confirmedAt);
  const paidTime = formatPaymentTime(item.paidAt);

  const subline =
    item.status === 'CONFIRMED'
      ? confirmedTime
        ? `Xác nhận lúc ${confirmedTime}`
        : 'Đã hoàn tất'
      : item.status === 'PAID'
        ? paidTime
          ? `Báo chuyển lúc ${paidTime}`
          : 'Đang chờ xác nhận'
        : 'Chưa thanh toán';

  const showConfirmBtn = canConfirm && item.status !== 'CONFIRMED' && Boolean(onConfirm);

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={[styles.avatar, { backgroundColor: colors.primarySurface }]}>
        {item.user?.avatar ? (
          <Image source={{ uri: item.user.avatar }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <Text style={[Typography.chip12, { color: colors.primary }]}>
            {getUserInitials(displayName)}
          </Text>
        )}
      </View>

      <View style={styles.infoCol}>
        <Text numberOfLines={1} style={[Typography.title14, { color: colors.text }]}>
          {displayName}
          {isCurrentUser ? ' (Bạn)' : ''}
        </Text>
        <Text numberOfLines={1} style={[Typography.small12, { color: colors.textSecondary }]}>
          {subline}
        </Text>
        {showConfirmBtn ? (
          <View style={[styles.inlineBadge, { backgroundColor: statusMeta.bg }]}>
            <Text numberOfLines={1} style={[Typography.headerSub11, { color: statusMeta.text }]}>
              {statusMeta.label}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rightCol}>
        <Text style={[Typography.metaStrong13, { color: colors.text }]}>
          {formatVnd(item.amount)}
        </Text>

        {showConfirmBtn ? (
          <Pressable
            onPress={onConfirm}
            disabled={confirming}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.confirmBtn,
              { backgroundColor: colors.primary },
              confirming && styles.confirmDisabled,
              pressed && !confirming && styles.pressed,
            ]}>
            {confirming ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text numberOfLines={1} style={[Typography.chip12, { color: colors.onPrimary }]}>
                Xác nhận
              </Text>
            )}
          </Pressable>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text numberOfLines={1} style={[Typography.chip12, { color: statusMeta.text }]}>
              {statusMeta.label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.card,
    borderWidth: BorderWidth.hairline,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  inlineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  confirmBtn: {
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
});
