import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthAlert, AuthButton } from '@/components/auth';
import { PaymentMemberRow, VietQRCard } from '@/components/payments';
import {
  BorderWidth,
  Elevation,
  MaxContentWidth,
  Palette,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ApiClientError } from '@/services/api';
import { paymentService } from '@/services/payments';
import { sessionService } from '@/services/sessions';
import { userService } from '@/services/users';
import type {
  PaymentItem,
  PayOSLinkResponse,
  SessionDetail,
  SessionPaymentsResponse,
  UserQRCodeResponse,
} from '@/types';
import { formatSessionDateParts, formatVnd, parseVndAmount } from '@/utils/format';
import { resolvePaymentTotals } from '@/utils/payments';
import { getVietBankName, toQrImageUri } from '@/utils/qr-code';

type MemberFilter = 'all' | 'actionable' | 'pending' | 'confirmed';
type DisplayState = 'pending' | 'confirming' | 'confirmed' | 'overview';

const PAYOS_POLL_INTERVAL_MS = 4000;
const MANUAL_POLL_INTERVAL_MS = 5000;

function formatConfirmTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${hh}:${min}, ${dd}/${mm}`;
}

export default function MatchPaymentScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';

  const [screenFocused, setScreenFocused] = useState(false);
  const [paymentsData, setPaymentsData] = useState<SessionPaymentsResponse | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [payosLink, setPayosLink] = useState<PayOSLinkResponse | null>(null);
  const [staticQrResponse, setStaticQrResponse] = useState<UserQRCodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrNotice, setQrNotice] = useState<string | null>(null);
  const [isConfirmingView, setIsConfirmingView] = useState(false);
  const [copiedField, setCopiedField] = useState<'account' | 'memo' | null>(null);

  const [markingPaid, setMarkingPaid] = useState(false);
  const [pollingNow, setPollingNow] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [showCostEditor, setShowCostEditor] = useState(false);
  const [costInput, setCostInput] = useState('');
  const [savingCost, setSavingCost] = useState(false);
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');

  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  const requestedPayosForIdRef = useRef<string | null>(null);
  const pollInFlightRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPayerStaticQr = useCallback(async (payerId: string | null | undefined) => {
    if (!payerId) return;
    try {
      const qrRes = await userService.getQrCode(payerId);
      setStaticQrResponse(qrRes);
    } catch {
      // Optional static QR fallback — ignore if user has no uploaded QR
    }
  }, []);

  const ensurePayosOrFallbackQr = useCallback(
    async (payment: PaymentItem, payerId: string | null | undefined) => {
      if (payment.status !== 'PENDING') return;
      if (payment.qrCode && payment.checkoutUrl) return;
      if (requestedPayosForIdRef.current === payment.id) return;

      requestedPayosForIdRef.current = payment.id;
      setLoadingQr(true);
      setQrNotice(null);

      try {
        const res = await paymentService.createPayosLink(payment.id);
        setPayosLink(res);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Cổng PayOS tạm chưa tạo được mã VietQR động.';
        setQrNotice(`${message} Đang hiển thị QR cá nhân của người ứng tiền (nếu có).`);
        await fetchPayerStaticQr(payerId);
      } finally {
        setLoadingQr(false);
      }
    },
    [fetchPayerStaticQr],
  );

  const loadPayments = useCallback(
    async (isRefresh = false) => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      }

      try {
        const [paymentsRes, detailRes] = await Promise.all([
          paymentService.getBySession(sessionId),
          sessionService.getDetail(sessionId).catch(() => null),
        ]);

        setPaymentsData(paymentsRes);
        if (detailRes) {
          setSessionDetail(detailRes.session);
        }

        const resolvedCost =
          parseVndAmount(paymentsRes.session.totalCost) ||
          parseVndAmount(detailRes?.session.totalCost) ||
          parseVndAmount(paymentsRes.summary?.totalCost);
        if (resolvedCost > 0) {
          setCostInput((prev) => prev || String(Math.round(resolvedCost)));
        }

        setErrorBanner(null);

        const mine = currentUserId
          ? paymentsRes.payments.find((p) => p.userId === currentUserId)
          : undefined;

        if (mine?.status === 'CONFIRMED') {
          setIsConfirmingView(false);
        } else if (mine?.status === 'PENDING') {
          void ensurePayosOrFallbackQr(mine, paymentsRes.session.payer?.id);
        }
      } catch (error) {
        if (error instanceof ApiClientError) {
          setErrorBanner(error.message);
        } else {
          setErrorBanner('Không thể tải thông tin thanh toán.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sessionId, currentUserId, ensurePayosOrFallbackQr],
  );

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      void loadPayments(false);
      return () => {
        setScreenFocused(false);
      };
    }, [loadPayments]),
  );

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const myPayment = useMemo(
    () =>
      currentUserId ? paymentsData?.payments.find((p) => p.userId === currentUserId) : undefined,
    [paymentsData, currentUserId],
  );

  const payer = paymentsData?.session.payer ?? sessionDetail?.payer ?? null;
  const hasOrderCode = Boolean(payosLink?.orderCode || myPayment?.orderCode);

  const checkPaymentStatus = useCallback(
    async (manual = false) => {
      if (!myPayment || !sessionId || pollInFlightRef.current) return;

      pollInFlightRef.current = true;
      if (manual) {
        setPollingNow(true);
      }

      try {
        if (hasOrderCode) {
          const statusRes = await paymentService.getPayosStatus(myPayment.id);
          if (statusRes.isPaid || statusRes.status === 'CONFIRMED') {
            setIsConfirmingView(false);
            setInfoBanner('Thanh toán đã được xác nhận thành công!');
            await loadPayments(false);
            return;
          }
          if (statusRes.status !== myPayment.status) {
            await loadPayments(false);
          } else if (manual) {
            setInfoBanner(
              'Chưa ghi nhận giao dịch về tài khoản. Hệ thống vẫn đang tự động kiểm tra.',
            );
          }
        } else {
          const fresh = await paymentService.getBySession(sessionId);
          setPaymentsData(fresh);
          const updatedMine = currentUserId
            ? fresh.payments.find((p) => p.userId === currentUserId)
            : undefined;
          if (updatedMine?.status === 'CONFIRMED') {
            setIsConfirmingView(false);
            setInfoBanner('Người thu / Admin đã xác nhận khoản thanh toán của bạn!');
          } else if (manual) {
            setInfoBanner(
              'Người thu chưa bấm xác nhận. Bạn có thể rời màn hình và quay lại sau.',
            );
          }
        }
      } catch (error) {
        if (manual) {
          setErrorBanner(
            error instanceof ApiClientError
              ? error.message
              : 'Không thể kiểm tra trạng thái thanh toán lúc này.',
          );
        }
      } finally {
        pollInFlightRef.current = false;
        if (manual) {
          setPollingNow(false);
        }
      }
    },
    [myPayment, sessionId, hasOrderCode, currentUserId, loadPayments],
  );

  useEffect(() => {
    if (!screenFocused || !myPayment || myPayment.status === 'CONFIRMED') return;

    const shouldPoll = hasOrderCode || myPayment.status === 'PAID';
    if (!shouldPoll) return;

    const intervalMs = hasOrderCode ? PAYOS_POLL_INTERVAL_MS : MANUAL_POLL_INTERVAL_MS;
    const timer = setInterval(() => {
      void checkPaymentStatus(false);
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [screenFocused, myPayment, hasOrderCode, checkPaymentStatus]);

  const activeQrRaw =
    payosLink?.qrCode || myPayment?.qrCode || staticQrResponse?.qrCodeImage || null;
  const qrImageUri = useMemo(() => toQrImageUri(activeQrRaw), [activeQrRaw]);
  const isFallbackStaticQr =
    !payosLink?.qrCode && !myPayment?.qrCode && Boolean(staticQrResponse?.qrCodeImage);

  const effectiveCheckoutUrl = payosLink?.checkoutUrl || myPayment?.checkoutUrl || null;
  const effectiveAccountName =
    payosLink?.accountName ||
    myPayment?.accountName ||
    payer?.displayName ||
    'Thủ quỹ CLB HitDad';
  const effectiveBin = payosLink?.bin || myPayment?.bin;
  const effectiveBankLabel = getVietBankName(effectiveBin) ?? payer?.bankInfo ?? null;
  const effectiveAccountNumber =
    payosLink?.accountNumber || myPayment?.accountNumber || payer?.phone || null;

  const dateParts = formatSessionDateParts(sessionDetail?.playDate ?? '');
  const fallbackMemoDate = dateParts.slashDate !== '--/--' ? dateParts.slashDate.replace('/', '') : '';
  const effectiveMemo =
    payosLink?.description ||
    myPayment?.description ||
    (`HITDAD ${fallbackMemoDate} ${user?.displayName ?? ''}`.trim() || 'HITDAD TIEN SAN');

  const isAdmin = user?.role === 'ADMIN';
  const isPayer = Boolean(user?.id && payer?.id === user.id);
  const canManagePayments = isAdmin || isPayer;

  const displayState: DisplayState = (() => {
    if (!myPayment) return 'overview';
    if (myPayment.status === 'CONFIRMED') return 'confirmed';
    if (myPayment.status === 'PAID' || isConfirmingView) return 'confirming';
    return 'pending';
  })();

  const summary = paymentsData?.summary ?? {
    totalCost: 0,
    pending: 0,
    paid: 0,
    confirmed: 0,
    total: 0,
  };
  const {
    totalCost,
    splitCount: effectiveSplitCount,
    perPerson,
  } = resolvePaymentTotals(paymentsData, sessionDetail);
  const myShareAmount = myPayment
    ? myPayment.amount !== null && myPayment.amount !== undefined
      ? parseVndAmount(myPayment.amount)
      : perPerson
    : perPerson;

  const handleCopy = async (field: 'account' | 'memo', value: string | null) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    setCopiedField(field);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleOpenBankApp = async () => {
    if (!effectiveCheckoutUrl) return;
    setErrorBanner(null);
    setIsConfirmingView(true);
    try {
      await WebBrowser.openBrowserAsync(effectiveCheckoutUrl);
    } catch {
      await Linking.openURL(effectiveCheckoutUrl).catch(() => undefined);
    } finally {
      void checkPaymentStatus(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!myPayment || markingPaid) return;
    setMarkingPaid(true);
    setErrorBanner(null);
    setInfoBanner(null);

    try {
      const res = await paymentService.markPaid(myPayment.id);
      setIsConfirmingView(true);
      setInfoBanner(res.message || 'Đã ghi nhận báo chuyển khoản. Đang chờ xác nhận.');
      await loadPayments(false);
    } catch (error) {
      setErrorBanner(
        error instanceof ApiClientError
          ? error.message
          : 'Không thể đánh dấu đã chuyển khoản lúc này.',
      );
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleConfirmPayment = async (payment: PaymentItem) => {
    if (!canManagePayments || confirmingId) return;
    setConfirmingId(payment.id);
    setErrorBanner(null);
    setInfoBanner(null);

    try {
      const res = await paymentService.confirm(payment.id);
      setInfoBanner(
        res.sessionCompleted
          ? 'Đã xác nhận! Toàn bộ thành viên đã nộp đủ, trận đấu chuyển sang Hoàn thành.'
          : res.message || `Đã xác nhận khoản đóng tiền của ${payment.user?.displayName ?? 'thành viên'}.`,
      );
      await loadPayments(false);
    } catch (error) {
      setErrorBanner(
        error instanceof ApiClientError
          ? error.message
          : 'Không thể xác nhận khoản thanh toán.',
      );
    } finally {
      setConfirmingId(null);
    }
  };

  const handleRecalculate = async () => {
    if (!sessionId || !isAdmin || recalculating) return;
    setRecalculating(true);
    setErrorBanner(null);
    setInfoBanner(null);

    try {
      const res = await paymentService.recalculateForSession(sessionId);
      setInfoBanner(
        res.message ||
          `Đã tính lại tiền sân: ${formatVnd(res.amountPerPerson)}/người (${res.totalAttendees} người).`,
      );
      await loadPayments(false);
    } catch (error) {
      setErrorBanner(
        error instanceof ApiClientError
          ? error.message
          : 'Không thể tính lại tiền sân lúc này.',
      );
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaveTotalCost = async () => {
    if (!sessionId || !isAdmin || savingCost) return;
    const digitsOnly = costInput.replace(/[^\d]/g, '');
    const numericCost = Number.parseInt(digitsOnly, 10);
    if (!Number.isFinite(numericCost) || numericCost <= 0) {
      setErrorBanner('Vui lòng nhập tổng chi phí hợp lệ (lớn hơn 0đ).');
      return;
    }

    setSavingCost(true);
    setErrorBanner(null);
    setInfoBanner(null);

    try {
      await sessionService.update(sessionId, {
        totalCost: numericCost,
        payerId: payer?.id ?? user?.id,
      });

      const recalc = await paymentService.recalculateForSession(sessionId).catch(() => null);
      setShowCostEditor(false);
      setInfoBanner(
        recalc?.message ??
          `Đã cập nhật tổng chi phí ${formatVnd(numericCost)}. Nếu chưa có khoản thu, hãy điểm danh và bấm "Tính lại tiền sân".`,
      );
      await loadPayments(false);
    } catch (error) {
      setErrorBanner(
        error instanceof ApiClientError
          ? error.message
          : 'Không thể cập nhật tổng chi phí.',
      );
    } finally {
      setSavingCost(false);
    }
  };

  const filteredPayments = useMemo(() => {
    const list = paymentsData?.payments ?? [];
    if (memberFilter === 'actionable') return list.filter((p) => p.status === 'PAID');
    if (memberFilter === 'pending') return list.filter((p) => p.status === 'PENDING');
    if (memberFilter === 'confirmed') return list.filter((p) => p.status === 'CONFIRMED');
    return list;
  }, [paymentsData, memberFilter]);

  const headerChipLabel = (() => {
    if (displayState === 'confirmed') return 'Đã trả';
    if (displayState === 'confirming') return 'Đang xác nhận';
    if (displayState === 'pending') return 'Chưa trả';
    if (summary.total > 0) return `${summary.confirmed}/${summary.total} đã thu`;
    return totalCost > 0 ? 'Đã có chi phí' : 'Chưa chốt phí';
  })();

  const heroMeta = (() => {
    if (displayState === 'confirmed' && myPayment) {
      return {
        label: 'Bạn đã trả',
        amount: formatVnd(myShareAmount),
        caption: 'Admin / người ứng tiền đã xác nhận nhận tiền',
      };
    }
    if (displayState === 'confirming' && myPayment) {
      return {
        label: 'Phần của bạn',
        amount: formatVnd(myShareAmount),
        caption: hasOrderCode
          ? 'Đang chờ tiền về tài khoản người thu'
          : 'Đã báo chuyển khoản, chờ người thu xác nhận',
      };
    }
    if (displayState === 'pending' && myPayment) {
      return {
        label: 'Phần của bạn',
        amount: formatVnd(myShareAmount),
        caption: payer
          ? `Chuyển cho ${payer.displayName}`
          : 'Quét mã VietQR hoặc chuyển khoản theo thông tin bên dưới',
      };
    }
    return {
      label: 'Tổng chi phí trận',
      amount: formatVnd(totalCost),
      caption:
        summary.total > 0
          ? `${formatVnd(perPerson)}/người · ${summary.total} người đóng tiền`
          : 'Admin có thể nhập tổng chi phí và chia tiền bên dưới',
    };
  })();

  const subtitleText = sessionDetail
    ? dateParts.slashDate !== '--/--'
      ? `${sessionDetail.title}, ${dateParts.slashDate}`
      : sessionDetail.title
    : 'Quyết toán tiền sân';

  const hasHeroOverlap = !loading && Boolean(paymentsData) && !errorBanner && !infoBanner;

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadPayments(true)}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}>
        {/* Blue Hero Header matching Figma 03 / 03b / 03c */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.primary,
              paddingTop: insets.top + 6,
              paddingBottom: hasHeroOverlap ? 48 : 22,
            },
          ]}>
          <Image
            source={require('@/assets/images/hitdad-pitch-lines.png')}
            style={styles.pitchOverlay}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />

          <View style={styles.headerInner}>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Quay lại"
                style={({ pressed }) => [
                  styles.backBtn,
                  { backgroundColor: colors.onPrimaryOverlay },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="arrow-back" size={18} color={colors.onPrimary} />
              </Pressable>

              <View style={styles.headerTitleCol}>
                <Text numberOfLines={1} style={[Typography.title14, { color: colors.onPrimary }]}>
                  Thanh toán
                </Text>
                <Text
                  numberOfLines={1}
                  style={[Typography.headerSub11, { color: colors.onPrimaryMuted }]}>
                  {subtitleText}
                </Text>
              </View>

              <View style={[styles.headerChip, { backgroundColor: Palette.white }]}>
                <Text numberOfLines={1} style={[Typography.chip12, { color: colors.primary }]}>
                  {headerChipLabel}
                </Text>
              </View>
            </View>

            <View style={styles.heroAmountBlock}>
              <Text style={[Typography.meta13, { color: colors.onPrimaryMuted }]}>
                {heroMeta.label}
              </Text>
              <Text style={[Typography.money60, { color: colors.onPrimary }]}>
                {heroMeta.amount}
              </Text>
              <Text numberOfLines={2} style={[Typography.meta13, { color: colors.onPrimaryMuted }]}>
                {heroMeta.caption}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {errorBanner ? <AuthAlert title="Thông báo lỗi" message={errorBanner} /> : null}
          {infoBanner ? (
            <AuthAlert variant="success" title="Cập nhật thanh toán" message={infoBanner} />
          ) : null}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : !paymentsData ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[Typography.section15, { color: colors.text }]}>
                Chưa thể tải dữ liệu thanh toán
              </Text>
              <AuthButton label="Thử lại" onPress={() => void loadPayments(false)} />
            </View>
          ) : (
            <>
              {/* Top Interactive State Card (03 / 03c / 03b) */}
              {displayState === 'pending' && myPayment ? (
                <View style={hasHeroOverlap ? styles.heroCardOverlap : undefined}>
                  {qrNotice ? (
                    <View style={styles.noticeGap}>
                      <AuthAlert variant="info" title="Đang dùng QR dự phòng" message={qrNotice} />
                    </View>
                  ) : null}

                  <VietQRCard
                    qrImageUri={qrImageUri}
                    loadingQr={loadingQr}
                    isFallbackStaticQr={isFallbackStaticQr}
                    accountName={effectiveAccountName}
                    bankLabel={effectiveBankLabel}
                    accountNumber={effectiveAccountNumber}
                    transferMemo={effectiveMemo}
                    copiedField={copiedField}
                    onCopyAccount={() => void handleCopy('account', effectiveAccountNumber)}
                    onCopyMemo={() => void handleCopy('memo', effectiveMemo)}
                    onRetryQr={() => {
                      requestedPayosForIdRef.current = null;
                      void ensurePayosOrFallbackQr(myPayment, payer?.id);
                    }}
                  />

                  {effectiveCheckoutUrl ? (
                    <AuthButton
                      label="Đã chuyển khoản / Đưa tiền mặt"
                      variant="secondary"
                      onPress={() => void handleMarkPaid()}
                      loading={markingPaid}
                      style={styles.secondaryActionBtn}
                    />
                  ) : null}
                </View>
              ) : null}

              {displayState === 'confirming' && myPayment ? (
                <View
                  style={[
                    styles.card,
                    Elevation.card,
                    hasHeroOverlap && styles.heroCardOverlap,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <View style={styles.stateRow}>
                    <View style={[styles.stateIcon, { backgroundColor: colors.primarySurface }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                    <View style={styles.stateTextCol}>
                      <Text style={[Typography.title14, { color: colors.text }]}>
                        {hasOrderCode
                          ? 'Đang tự động kiểm tra giao dịch PayOS'
                          : 'Đã báo chuyển khoản thành công'}
                      </Text>
                      <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                        {hasOrderCode
                          ? 'Hệ thống tự động cập nhật ngay khi tiền về tài khoản. Nếu bạn đưa tiền mặt, người thu cũng có thể bấm xác nhận.'
                          : 'Khoản đóng tiền của bạn đang chờ người ứng tiền hoặc Admin xác nhận.'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inlineBtnsRow}>
                    <AuthButton
                      label="Kiểm tra ngay"
                      variant="secondary"
                      onPress={() => void checkPaymentStatus(true)}
                      loading={pollingNow}
                      style={styles.flex}
                    />
                    {myPayment.status === 'PENDING' ? (
                      <AuthButton
                        label="Xem lại mã QR"
                        variant="secondary"
                        onPress={() => setIsConfirmingView(false)}
                        style={styles.flex}
                      />
                    ) : null}
                  </View>
                </View>
              ) : null}

              {displayState === 'confirmed' && myPayment ? (
                <View
                  style={[
                    styles.card,
                    Elevation.card,
                    hasHeroOverlap && styles.heroCardOverlap,
                    { backgroundColor: colors.surface, borderColor: colors.success },
                  ]}>
                  <View style={styles.stateRow}>
                    <View style={[styles.stateIcon, { backgroundColor: colors.successBackground }]}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    </View>
                    <View style={styles.stateTextCol}>
                      <Text style={[Typography.title14, { color: colors.success }]}>
                        {dateParts.slashDate !== '--/--'
                          ? `Đã gạch nợ buổi ${dateParts.slashDate}`
                          : 'Đã hoàn tất thanh toán'}
                      </Text>
                      <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                        {formatConfirmTimestamp(myPayment.confirmedAt)
                          ? `Xác nhận lúc ${formatConfirmTimestamp(myPayment.confirmedAt)}`
                          : 'Khoản tiền sân của bạn đã được xác nhận'}
                        {payer ? ` · Người thu: ${payer.displayName}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Bill Split Summary Card (Figma Bill split aligned with API v1.2.4) */}
              <View
                style={[
                  styles.card,
                  displayState === 'overview' && hasHeroOverlap && styles.heroCardOverlap,
                  displayState === 'overview' && hasHeroOverlap && Elevation.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.billRow}>
                  <Text style={[Typography.meta13, { color: colors.textSecondary }]}>
                    Tổng chi phí trận
                  </Text>
                  <Text style={[Typography.metaStrong13, { color: colors.text }]}>
                    {formatVnd(totalCost)}
                  </Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={[Typography.meta13, { color: colors.textSecondary }]}>
                    {effectiveSplitCount > 0
                      ? `Chia đều ${effectiveSplitCount} người`
                      : 'Số người chia tiền'}
                  </Text>
                  <Text style={[Typography.metaStrong13, { color: colors.text }]}>
                    {effectiveSplitCount > 0 ? `÷ ${effectiveSplitCount}` : '--'}
                  </Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={[Typography.meta13, { color: colors.textSecondary }]}>
                    Người ứng tiền
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[Typography.metaStrong13, styles.billRightText, { color: colors.text }]}>
                    {payer?.displayName ?? 'Chưa chỉ định'}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.billRow}>
                  <Text style={[Typography.metaStrong13, { color: colors.text }]}>
                    {displayState === 'confirmed'
                      ? 'Bạn đã chuyển'
                      : myPayment
                        ? 'Bạn cần chuyển'
                        : 'Mỗi người'}
                  </Text>
                  <Text style={[Typography.section15, { color: colors.primary }]}>
                    {formatVnd(myShareAmount)}
                  </Text>
                </View>
              </View>

              {/* Collection Progress & Members Breakdown */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Text style={[Typography.section15, styles.sectionTitle, { color: colors.text }]}>
                    Tiến độ đóng tiền
                  </Text>
                  <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                    {summary.confirmed}/{summary.total} đã xác nhận
                  </Text>
                </View>

                <View style={styles.progressChips}>
                  <View style={[styles.summaryChip, { backgroundColor: colors.successBackground }]}>
                    <Text style={[Typography.chip12, { color: colors.success }]}>
                      Đã xác nhận · {summary.confirmed}
                    </Text>
                  </View>
                  <View style={[styles.summaryChip, { backgroundColor: colors.primarySurface }]}>
                    <Text style={[Typography.chip12, { color: colors.primary }]}>
                      Đã báo chuyển · {summary.paid}
                    </Text>
                  </View>
                  <View style={[styles.summaryChip, { backgroundColor: colors.warningBackground }]}>
                    <Text style={[Typography.chip12, { color: colors.warning }]}>
                      Chờ chuyển · {summary.pending}
                    </Text>
                  </View>
                </View>

                {paymentsData.payments.length > 0 ? (
                  <>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.filterRow}>
                      {(
                        [
                          { key: 'all', label: `Tất cả · ${paymentsData.payments.length}` },
                          { key: 'actionable', label: `Chờ xác nhận · ${summary.paid}` },
                          { key: 'pending', label: `Chưa trả · ${summary.pending}` },
                          { key: 'confirmed', label: `Đã xác nhận · ${summary.confirmed}` },
                        ] as const
                      ).map((chip) => {
                        const selected = memberFilter === chip.key;
                        return (
                          <Pressable
                            key={chip.key}
                            onPress={() => setMemberFilter(chip.key)}
                            style={({ pressed }) => [
                              styles.filterChip,
                              {
                                backgroundColor: selected ? colors.primary : colors.surface,
                                borderColor: selected ? colors.primary : colors.border,
                              },
                              pressed && styles.pressed,
                            ]}>
                            <Text
                              style={[
                                Typography.chip12,
                                { color: selected ? colors.onPrimary : colors.textSecondary },
                              ]}>
                              {chip.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {filteredPayments.length === 0 ? (
                      <View
                        style={[
                          styles.emptyMemberBox,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                        ]}>
                        <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                          Không có thành viên nào trong mục này.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.memberList}>
                        {filteredPayments.map((item) => (
                          <PaymentMemberRow
                            key={item.id}
                            item={item}
                            isCurrentUser={item.userId === user?.id}
                            canConfirm={canManagePayments}
                            confirming={confirmingId === item.id}
                            onConfirm={() => {
                              void handleConfirmPayment(item);
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <View
                    style={[
                      styles.emptyMemberBox,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}>
                    <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                      Chưa có danh sách chia tiền cho trận này. Admin cần cập nhật tổng chi phí và
                      bấm Tính lại tiền sân sau khi điểm danh.
                    </Text>
                  </View>
                )}
              </View>

              {/* Admin Cost & Recalculate Controls */}
              {isAdmin ? (
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <View style={styles.sectionHeader}>
                    <Text style={[Typography.section15, { color: colors.text }]}>
                      Quản lý chi phí (Admin)
                    </Text>
                    <Pressable
                      onPress={() => setShowCostEditor((prev) => !prev)}
                      hitSlop={6}
                      accessibilityRole="button"
                      style={({ pressed }) => pressed && styles.pressed}>
                      <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
                        {showCostEditor ? 'Đóng' : 'Sửa tổng chi phí'}
                      </Text>
                    </Pressable>
                  </View>

                  {showCostEditor ? (
                    <View style={styles.costEditor}>
                      <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                        Nhập tổng chi phí trận (VND)
                      </Text>
                      <View style={styles.costInputRow}>
                        <TextInput
                          value={costInput}
                          onChangeText={setCostInput}
                          placeholder="Ví dụ: 900000"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="number-pad"
                          style={[
                            styles.costInput,
                            Typography.body14,
                            {
                              backgroundColor: colors.backgroundElement,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                        />
                        <Pressable
                          onPress={() => void handleSaveTotalCost()}
                          disabled={savingCost}
                          accessibilityRole="button"
                          style={({ pressed }) => [
                            styles.saveCostBtn,
                            { backgroundColor: colors.primary },
                            savingCost && styles.disabled,
                            pressed && !savingCost && styles.pressed,
                          ]}>
                          {savingCost ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                          ) : (
                            <Text style={[Typography.chip12, { color: colors.onPrimary }]}>
                              Lưu & Chia
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  <AuthButton
                    label="Tính lại tiền sân"
                    variant="secondary"
                    onPress={() => void handleRecalculate()}
                    loading={recalculating}
                  />
                  <Text style={[Typography.headerSub11, { color: colors.textSecondary }]}>
                    Tự động chia tổng chi phí cho tổng số thành viên và khách đã check-in.
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky Footer Action Bar matching Figma Footer */}
      {!loading && paymentsData ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.footerInner}>
            {displayState === 'pending' && myPayment ? (
              effectiveCheckoutUrl ? (
                <>
                  <AuthButton
                    label="Mở app ngân hàng"
                    onPress={() => void handleOpenBankApp()}
                  />
                  <Text
                    style={[Typography.small12, styles.footerCaption, { color: colors.textSecondary }]}>
                    Tự gạch nợ khi tiền về tài khoản admin
                  </Text>
                </>
              ) : (
                <>
                  <AuthButton
                    label="Đã chuyển khoản / Đưa tiền mặt"
                    onPress={() => void handleMarkPaid()}
                    loading={markingPaid}
                  />
                  <Text
                    style={[Typography.small12, styles.footerCaption, { color: colors.textSecondary }]}>
                    Người thu / Admin sẽ xác nhận sau khi nhận tiền
                  </Text>
                </>
              )
            ) : displayState === 'confirming' ? (
              <>
                <AuthButton
                  label={effectiveCheckoutUrl ? 'Mở lại app ngân hàng' : 'Kiểm tra trạng thái ngay'}
                  onPress={() => {
                    if (effectiveCheckoutUrl) {
                      void handleOpenBankApp();
                    } else {
                      void checkPaymentStatus(true);
                    }
                  }}
                  loading={!effectiveCheckoutUrl && pollingNow}
                />
                <Text
                  style={[Typography.small12, styles.footerCaption, { color: colors.textSecondary }]}>
                  Thường mất dưới 1 phút. Bạn có thể rời màn này.
                </Text>
              </>
            ) : displayState === 'confirmed' ? (
              <>
                <AuthButton label="Về Lịch đá" onPress={() => router.replace('/(tabs)')} />
                <Text
                  style={[Typography.small12, styles.footerCaption, { color: colors.textSecondary }]}>
                  {dateParts.slashDate !== '--/--'
                    ? `Đã gạch nợ buổi ${dateParts.slashDate}`
                    : 'Đã hoàn tất thanh toán trận đấu'}
                </Text>
              </>
            ) : (
              <>
                <AuthButton label="Quay lại trận đấu" onPress={() => router.back()} />
                <Text
                  style={[Typography.small12, styles.footerCaption, { color: colors.textSecondary }]}>
                  Theo dõi và xác nhận thanh toán theo từng thành viên
                </Text>
              </>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    overflow: 'hidden',
    paddingHorizontal: Spacing.screen,
  },
  pitchOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.16,
  },
  headerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: 14,
  },
  topBar: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTitleCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  headerChip: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  heroAmountBlock: {
    gap: 2,
  },
  body: {
    padding: Spacing.screen,
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  heroCardOverlap: {
    marginTop: -38,
  },
  noticeGap: {
    marginBottom: Spacing.md,
  },
  secondaryActionBtn: {
    marginTop: Spacing.md,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.default,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stateTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  inlineBtnsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  billRightText: {
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
  },
  sectionBlock: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
  },
  progressChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  filterRow: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.default,
  },
  memberList: {
    gap: Spacing.sm,
  },
  emptyMemberBox: {
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
    padding: Spacing.md,
  },
  costEditor: {
    gap: Spacing.sm,
  },
  costInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  costInput: {
    flex: 1,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.default,
    paddingHorizontal: 12,
  },
  saveCostBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  footer: {
    borderTopWidth: BorderWidth.hairline,
    paddingTop: 12,
    paddingHorizontal: Spacing.screen,
  },
  footerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: 8,
  },
  footerCaption: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.78,
  },
});
