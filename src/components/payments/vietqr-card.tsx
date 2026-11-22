import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth';
import { BorderWidth, Elevation, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatBankAccountNumber } from '@/utils/qr-code';

export interface VietQRCardProps {
  qrImageUri: string | null;
  loadingQr?: boolean;
  isFallbackStaticQr?: boolean;
  accountName: string;
  bankLabel: string | null;
  accountNumber: string | null;
  transferMemo: string | null;
  copiedField: 'account' | 'memo' | null;
  onCopyAccount?: () => void;
  onCopyMemo?: () => void;
  onRetryQr?: () => void;
}

/**
 * Elevated VietQR card replicating Figma `Payment card` (`#1:529`) for screen `03 Thanh toán`
 * with solid white scan zone, copyable account/memo fields, and zoom modal.
 */
export function VietQRCard({
  qrImageUri,
  loadingQr = false,
  isFallbackStaticQr = false,
  accountName,
  bankLabel,
  accountNumber,
  transferMemo,
  copiedField,
  onCopyAccount,
  onCopyMemo,
  onRetryQr,
}: VietQRCardProps) {
  const colors = useTheme();
  const [zoomVisible, setZoomVisible] = useState(false);

  return (
    <>
      <View
        style={[
          styles.card,
          Elevation.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        {isFallbackStaticQr ? (
          <View style={[styles.fallbackChip, { backgroundColor: colors.warningBackground }]}>
            <Ionicons name="qr-code-outline" size={13} color={colors.warning} />
            <Text numberOfLines={1} style={[Typography.chip12, { color: colors.warning }]}>
              QR cá nhân của người ứng tiền
            </Text>
          </View>
        ) : null}

        <View style={styles.mainRow}>
          <View
            style={[
              styles.qrFrame,
              {
                backgroundColor: Palette.white,
                borderColor: colors.border,
              },
            ]}>
            {loadingQr ? (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[Typography.headerSub11, { color: Palette.ink2 }]}>Đang tạo QR</Text>
              </View>
            ) : qrImageUri ? (
              <Pressable
                onPress={() => setZoomVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Phóng to mã QR"
                style={({ pressed }) => [styles.qrTouchable, pressed && styles.pressed]}>
                <Image
                  source={{ uri: qrImageUri }}
                  style={styles.qrImage}
                  contentFit="contain"
                />
                <View style={styles.zoomHint}>
                  <Ionicons name="expand-outline" size={12} color={Palette.navy} />
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={onRetryQr}
                disabled={!onRetryQr}
                accessibilityRole="button"
                style={({ pressed }) => [styles.qrPlaceholder, pressed && styles.pressed]}>
                <Ionicons name="qr-code-outline" size={28} color={Palette.ink2} />
                <Text style={[Typography.chip12, { color: colors.primary }]}>
                  {onRetryQr ? 'Tải lại QR' : 'Chưa có QR'}
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.accountCol}>
            <Text numberOfLines={2} style={[Typography.title14, { color: colors.text }]}>
              {accountName}
            </Text>

            {bankLabel ? (
              <Text numberOfLines={2} style={[Typography.small12, { color: colors.textSecondary }]}>
                {bankLabel}
              </Text>
            ) : null}

            {accountNumber ? (
              <Pressable
                onPress={onCopyAccount}
                disabled={!onCopyAccount}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Sao chép số tài khoản"
                style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}>
                <Text
                  numberOfLines={1}
                  style={[Typography.metaStrong13, styles.accountNumText, { color: colors.text }]}>
                  {formatBankAccountNumber(accountNumber)}
                </Text>
                <View style={styles.copyInline}>
                  <Ionicons
                    name={copiedField === 'account' ? 'checkmark-circle' : 'copy-outline'}
                    size={15}
                    color={copiedField === 'account' ? colors.success : colors.primary}
                  />
                  {copiedField === 'account' ? (
                    <Text style={[Typography.headerSub11, { color: colors.success }]}>Đã chép</Text>
                  ) : null}
                </View>
              </Pressable>
            ) : null}

            {transferMemo ? (
              <Pressable
                onPress={onCopyMemo}
                disabled={!onCopyMemo}
                accessibilityRole="button"
                accessibilityLabel="Sao chép nội dung chuyển khoản"
                style={({ pressed }) => [
                  styles.memoBox,
                  { backgroundColor: colors.primarySurface },
                  pressed && styles.pressed,
                ]}>
                <Text
                  numberOfLines={2}
                  style={[Typography.chip12, styles.memoText, { color: colors.primary }]}>
                  {transferMemo}
                </Text>
                <Ionicons
                  name={copiedField === 'memo' ? 'checkmark-circle' : 'copy-outline'}
                  size={15}
                  color={copiedField === 'memo' ? colors.success : colors.primary}
                  style={styles.memoIcon}
                />
              </Pressable>
            ) : null}

            {copiedField === 'memo' ? (
              <Text style={[Typography.headerSub11, { color: colors.success }]}>
                Đã sao chép nội dung chuyển khoản
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <Modal
        visible={zoomVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomVisible(false)}>
        <View style={styles.zoomOverlay}>
          <Pressable style={styles.zoomBackdrop} onPress={() => setZoomVisible(false)} />
          <View style={[styles.zoomCard, { backgroundColor: Palette.white }]}>
            {qrImageUri ? (
              <Image source={{ uri: qrImageUri }} style={styles.zoomQrImage} contentFit="contain" />
            ) : null}
            <Text style={[Typography.title14, styles.zoomTitle, { color: Palette.navy }]}>
              {accountName}
            </Text>
            {accountNumber ? (
              <Text style={[Typography.meta13, { color: Palette.ink2 }]}>
                {bankLabel ? `${bankLabel} · ` : ''}
                {formatBankAccountNumber(accountNumber)}
              </Text>
            ) : null}
            {transferMemo ? (
              <Text style={[Typography.chip12, styles.zoomMemo, { color: Palette.blue }]}>
                ND: {transferMemo}
              </Text>
            ) : null}
            <AuthButton
              label="Đóng"
              variant="secondary"
              onPress={() => setZoomVisible(false)}
              style={styles.zoomCloseBtn}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.hairline,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fallbackChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qrFrame: {
    width: 130,
    height: 130,
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
    padding: 6,
    flexShrink: 0,
    overflow: 'hidden',
  },
  qrTouchable: {
    flex: 1,
    position: 'relative',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  zoomHint: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  accountCol: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountNumText: {
    flexShrink: 1,
  },
  copyInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  memoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.md,
    marginTop: 2,
  },
  memoText: {
    flex: 1,
    flexShrink: 1,
  },
  memoIcon: {
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.78,
  },
  zoomOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screen,
  },
  zoomBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 42, 107, 0.55)',
  },
  zoomCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  zoomQrImage: {
    width: 260,
    height: 260,
  },
  zoomTitle: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  zoomMemo: {
    textAlign: 'center',
  },
  zoomCloseBtn: {
    alignSelf: 'stretch',
    marginTop: Spacing.sm,
  },
});
