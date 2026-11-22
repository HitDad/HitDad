import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SessionPaymentsResponse } from '@/types';
import { formatVnd, getUserInitials } from '@/utils/format';
import { resolvePaymentTotals } from '@/utils/payments';

export interface PaymentSummaryCardProps {
  paymentsData: SessionPaymentsResponse;
  currentUserId?: string;
  sessionTotalCost?: number | string | null;
  splitCount?: number | null;
  onPressPayment: () => void;
}

/**
 * Payment summary card matching Figma `HD/Payment summary` (`#137:736`) for states `02g` and `02h`.
 */
export function PaymentSummaryCard({
  paymentsData,
  currentUserId,
  sessionTotalCost,
  splitCount,
  onPressPayment,
}: PaymentSummaryCardProps) {
  const colors = useTheme();
  const payer = paymentsData.session.payer;
  const summary = paymentsData.summary;
  const { totalCost, splitCount: effectiveSplitCount, perPerson } = resolvePaymentTotals(
    paymentsData,
    { totalCost: sessionTotalCost, splitCount },
  );

  const myPayment = currentUserId
    ? paymentsData.payments.find((p) => p.userId === currentUserId)
    : undefined;

  const payerSubline =
    [payer?.bankInfo, payer?.phone].filter(Boolean).join(' · ') ||
    'Chạm bên dưới để xem QR & danh sách thu tiền';

  const shareBanner = (() => {
    if (!myPayment) {
      return {
        bg: colors.backgroundElement,
        title: 'Xem chi tiết quyết toán',
        subtitle: `Theo dõi ${summary.total} khoản đóng tiền`,
        chipLabel: null as string | null,
        chipBg: colors.surface,
        chipBorder: colors.border,
        chipText: colors.textSecondary,
      };
    }

    if (myPayment.status === 'CONFIRMED') {
      return {
        bg: colors.backgroundElement,
        title: `Bạn đã trả ${formatVnd(myPayment.amount)}`,
        subtitle: 'Admin đã xác nhận, xem biên nhận',
        chipLabel: 'Đã trả',
        chipBg: colors.surface,
        chipBorder: colors.border,
        chipText: colors.textSecondary,
      };
    }

    if (myPayment.status === 'PAID') {
      return {
        bg: colors.primarySurface,
        title: `Phần của bạn: ${formatVnd(myPayment.amount)}`,
        subtitle: 'Đã báo chuyển, đang chờ xác nhận',
        chipLabel: 'Đang xác nhận',
        chipBg: colors.primary,
        chipBorder: colors.primary,
        chipText: colors.onPrimary,
      };
    }

    return {
      bg: colors.primarySurface,
      title: `Phần của bạn: ${formatVnd(myPayment.amount)}`,
      subtitle: 'Chạm để lấy mã VietQR thanh toán',
      chipLabel: 'Chưa trả',
      chipBg: colors.navy,
      chipBorder: colors.navy,
      chipText: Palette.white,
    };
  })();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.recipientRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          {payer?.avatar ? (
            <Image source={{ uri: payer.avatar }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Text style={[Typography.title14, { color: colors.onPrimary }]}>
              {getUserInitials(payer?.displayName ?? 'HD')}
            </Text>
          )}
        </View>
        <View style={styles.recipientText}>
          <Text numberOfLines={1} style={[Typography.title14, { color: colors.text }]}>
            {payer ? `Người nhận: ${payer.displayName}` : 'Chưa chỉ định người ứng tiền'}
          </Text>
          <Text numberOfLines={1} style={[Typography.small12, { color: colors.textSecondary }]}>
            {payerSubline}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.totalRow}>
        <View style={styles.totalLabelCol}>
          <Text style={[Typography.meta13, { color: colors.textSecondary }]}>Tổng chi phí</Text>
          <Text numberOfLines={1} style={[Typography.small12, { color: colors.textSecondary }]}>
            {effectiveSplitCount > 0
              ? `${formatVnd(perPerson)}/người · ${effectiveSplitCount} người`
              : 'Chưa chia khoản đóng tiền'}
          </Text>
        </View>
        <Text style={[Typography.section15, styles.totalAmount, { color: colors.text }]}>
          {formatVnd(totalCost)}
        </Text>
      </View>

      <View style={styles.progressChips}>
        <View style={[styles.chip, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <Text numberOfLines={1} style={[Typography.chip12, { color: colors.onPrimary }]}>
            {summary.confirmed} đã xác nhận
          </Text>
        </View>
        <View
          style={[
            styles.chip,
            { backgroundColor: colors.primarySurface, borderColor: colors.primarySurface },
          ]}>
          <Text numberOfLines={1} style={[Typography.chip12, { color: colors.primary }]}>
            {summary.paid} đã chuyển
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text numberOfLines={1} style={[Typography.chip12, { color: colors.textSecondary }]}>
            {summary.pending} chờ chuyển
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onPressPayment}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.shareBanner,
          { backgroundColor: shareBanner.bg },
          pressed && styles.pressed,
        ]}>
        <View style={styles.shareTextCol}>
          <Text numberOfLines={1} style={[Typography.title14, { color: colors.text }]}>
            {shareBanner.title}
          </Text>
          <Text numberOfLines={2} style={[Typography.small12, { color: colors.textSecondary }]}>
            {shareBanner.subtitle}
          </Text>
        </View>
        {shareBanner.chipLabel ? (
          <View
            style={[
              styles.shareChip,
              {
                backgroundColor: shareBanner.chipBg,
                borderColor: shareBanner.chipBorder,
              },
            ]}>
            <Text numberOfLines={1} style={[Typography.chip12, { color: shareBanner.chipText }]}>
              {shareBanner.chipLabel}
            </Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.default,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  recipientText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  divider: {
    height: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  totalLabelCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  totalAmount: {
    flexShrink: 0,
  },
  progressChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.default,
  },
  shareBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.card,
    gap: 10,
  },
  shareTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  shareChip: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.default,
  },
  pressed: {
    opacity: 0.84,
  },
});
