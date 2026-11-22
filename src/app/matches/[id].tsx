import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthAlert, AuthButton } from '@/components/auth';
import { AdminMatchStatusCard, TimeSlotCard } from '@/components/matches';
import { LeaveRequestModal } from '@/components/modals';
import { PaymentSummaryCard } from '@/components/payments';
import { TimePickerField } from '@/components/ui/date-time-picker';
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
import { voteService } from '@/services/votes';
import type {
  SessionDetailWithDebt,
  SessionPaymentsResponse,
  SessionVotesSummary,
  UpdateSessionBody,
  VoteItem,
} from '@/types';
import { compareHhmm, suggestEndTime } from '@/utils/date-time-picker';
import {
  formatDeadlineLabel,
  formatSessionDateParts,
  formatTimeRange,
  formatVnd,
  getSessionStatusMeta,
  parseVndAmount,
} from '@/utils/format';
import {
  extractTimeSlotIdsFromVote,
  isDoneSession,
  mergeSessionVotes,
  resolveTimeSlotVoteCounts,
} from '@/utils/sessions';

const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function MatchDetailScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const sessionId = typeof params.id === 'string' ? params.id : '';

  const [session, setSession] = useState<SessionDetailWithDebt | null>(null);
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [voteSummary, setVoteSummary] = useState<SessionVotesSummary | null>(null);
  const [paymentsData, setPaymentsData] = useState<SessionPaymentsResponse | null>(null);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [referenceNow, setReferenceNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  const [showAddSlotForm, setShowAddSlotForm] = useState(false);
  const [newSlotStart, setNewSlotStart] = useState('20:00');
  const [newSlotEnd, setNewSlotEnd] = useState('21:30');
  const [addingSlot, setAddingSlot] = useState(false);

  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveModalError, setLeaveModalError] = useState<string | null>(null);

  const [lockingVote, setLockingVote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadMatch = useCallback(
    async (isRefresh = false) => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      }

      try {
        const [detailRes, votesRes, paymentsRes] = await Promise.all([
          sessionService.getDetail(sessionId),
          voteService.getBySession(sessionId),
          paymentService.getBySession(sessionId).catch(() => null),
        ]);
        const mergedVotes = mergeSessionVotes(votesRes.votes, detailRes.session.votes);
        setSession(detailRes.session);
        setVotes(mergedVotes);
        setVoteSummary(votesRes.summary);
        setPaymentsData(paymentsRes);
        setReferenceNow(Date.now());

        const existingMyVote = mergedVotes.find((v) => v.userId === user?.id);
        const existingSlotIds = extractTimeSlotIdsFromVote(existingMyVote);
        if (existingSlotIds.length > 0) {
          setSelectedSlotIds(existingSlotIds);
        } else if (detailRes.session.timeSlots?.length === 1) {
          setSelectedSlotIds([detailRes.session.timeSlots[0].id]);
        }

        setErrorBanner(null);
      } catch (error) {
        if (error instanceof ApiClientError) {
          setErrorBanner(error.message);
        } else {
          setErrorBanner('Không thể tải thông tin trận đấu.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sessionId, user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      void loadMatch(false);
    }, [loadMatch]),
  );

  const myVote = useMemo(
    () => votes.find((v) => v.userId === user?.id),
    [votes, user?.id],
  );
  const slotVoteCounts = useMemo(
    () => resolveTimeSlotVoteCounts(session?.timeSlots ?? [], votes, session?.votes),
    [session, votes],
  );
  const myPayment = useMemo(
    () => paymentsData?.payments.find((p) => p.userId === user?.id),
    [paymentsData, user?.id],
  );
  const hasSettlementSection =
    Boolean(paymentsData) &&
    ((paymentsData?.payments.length ?? 0) > 0 ||
      parseVndAmount(paymentsData?.session.totalCost) > 0 ||
      parseVndAmount(paymentsData?.summary?.totalCost) > 0 ||
      parseVndAmount(session?.totalCost) > 0);
  const unpaidPrevSessionId =
    session?.unpaidPreviousPayment &&
    typeof session.unpaidPreviousPayment.sessionId === 'string'
      ? session.unpaidPreviousPayment.sessionId
      : null;
  const unpaidPrevAmount = session?.unpaidPreviousPayment
    ? parseVndAmount(session.unpaidPreviousPayment.amount)
    : 0;

  const isAdmin = user?.role === 'ADMIN';
  const joinCount = voteSummary?.join ?? votes.filter((v) => v.status === 'JOIN').length;
  const maxPlayers = session?.maxPlayers ?? 0;
  const remainingSpots = Math.max(0, maxPlayers - joinCount);
  const progressPct =
    maxPlayers > 0 ? Math.min(100, Math.round((joinCount / maxPlayers) * 100)) : 0;

  const isPastMatch = Boolean(session && isDoneSession(session, referenceNow));
  const hasAttended = Boolean(myVote?.isCheckedIn);

  const canVote =
    Boolean(session) &&
    !isPastMatch &&
    !session?.isVoteLocked &&
    (session?.status === 'VOTING' || session?.status === 'CONFIRMED');

  const toggleSlot = (slotId: string) => {
    setSelectedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId],
    );
  };

  const handleJoinOrUpdate = async () => {
    if (!session || !canVote) return;

    const slotsCount = session.timeSlots?.length ?? 0;
    let slotIds: string[] | undefined =
      selectedSlotIds.length > 0 ? selectedSlotIds : undefined;

    if (slotsCount > 1 && (!slotIds || slotIds.length === 0)) {
      setErrorBanner('Vui lòng chọn ít nhất một khung giờ trước khi xác nhận tham gia.');
      return;
    }

    if (slotsCount === 1 && (!slotIds || slotIds.length === 0) && session.timeSlots?.[0]?.id) {
      slotIds = [session.timeSlots[0].id];
      setSelectedSlotIds(slotIds);
    }

    setErrorBanner(null);
    setInfoBanner(null);
    setSubmittingVote(true);

    try {
      const res =
        myVote?.id !== undefined
          ? await voteService.update(myVote.id, { status: 'JOIN', timeSlotIds: slotIds })
          : await voteService.cast({
              sessionId: session.id,
              status: 'JOIN',
              timeSlotIds: slotIds,
            });

      setInfoBanner(res.message);
      await loadMatch(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorBanner(error.message);
      } else {
        setErrorBanner('Không thể gửi bình chọn. Vui lòng thử lại.');
      }
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleConfirmDecline = async (reason: string) => {
    if (!session) return;
    setLeaveModalError(null);
    setSubmittingVote(true);

    try {
      const res =
        myVote?.id !== undefined
          ? await voteService.update(myVote.id, { status: 'DECLINE', reason })
          : await voteService.cast({ sessionId: session.id, status: 'DECLINE', reason });

      setLeaveModalVisible(false);
      if (res.absenceLog?.isLate) {
        setInfoBanner(
          `${res.message} (Lưu ý: hệ thống ghi nhận báo vắng sát giờ thi đấu).`,
        );
      } else {
        setInfoBanner(res.message);
      }
      await loadMatch(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setLeaveModalError(error.message);
      } else {
        setLeaveModalError('Không thể ghi nhận báo vắng. Vui lòng thử lại.');
      }
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleAddTimeSlot = async () => {
    if (!session) return;
    const start = newSlotStart.trim();
    const end = newSlotEnd.trim();
    if (!HHMM_REGEX.test(start) || !HHMM_REGEX.test(end)) {
      setErrorBanner('Khung giờ phải đúng định dạng HH:mm (ví dụ 20:00).');
      return;
    }

    setErrorBanner(null);
    setAddingSlot(true);
    try {
      const res = await sessionService.addTimeSlot(session.id, {
        startTime: start,
        endTime: end,
      });
      setSelectedSlotIds((prev) => [...prev, res.timeSlot.id]);
      setShowAddSlotForm(false);
      setInfoBanner(res.message);
      await loadMatch(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorBanner(error.message);
      } else {
        setErrorBanner('Không thể thêm khung giờ.');
      }
    } finally {
      setAddingSlot(false);
    }
  };

  const handleToggleLockVote = async () => {
    if (!session || !isAdmin) return;
    setLockingVote(true);
    setErrorBanner(null);
    try {
      const res = await sessionService.lockVote(session.id, {
        isLocked: !session.isVoteLocked,
      });
      setInfoBanner(res.message);
      await loadMatch(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorBanner(error.message);
      } else {
        setErrorBanner('Không thể cập nhật trạng thái khoá bình chọn.');
      }
    } finally {
      setLockingVote(false);
    }
  };

  const handleUpdateStatus = async (payload: UpdateSessionBody) => {
    if (!session || !isAdmin || updatingStatus) return;
    setUpdatingStatus(true);
    setErrorBanner(null);
    setInfoBanner(null);
    try {
      const res = await sessionService.update(session.id, payload);
      const nextStatus = payload.status ?? res.session?.status ?? session.status;
      const nextLabel = getSessionStatusMeta(
        nextStatus,
        Boolean(res.session?.teams ?? session.teams),
      ).label;
      await loadMatch(false);
      setInfoBanner(`Đã cập nhật trạng thái trận sang "${nextLabel}".`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorBanner(error.message);
      } else {
        setErrorBanner('Không thể cập nhật trạng thái trận đấu.');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenDirections = () => {
    if (!session) return;
    const url =
      session.googleMapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.location)}`;
    void Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={[styles.centerRoot, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.centerRoot, { backgroundColor: colors.canvas }]}>
        <AuthAlert
          title="Không tìm thấy trận đấu"
          message={errorBanner ?? 'Trận đấu không tồn tại hoặc đã bị xoá.'}
        />
        <AuthButton label="Quay lại Lịch đá" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  const dateParts = formatSessionDateParts(session.playDate);
  const effectiveStatus =
    isPastMatch && session.status !== 'CANCELLED' ? 'COMPLETED' : session.status;
  const statusMeta = getSessionStatusMeta(effectiveStatus, Boolean(session.teams));
  const deadlineText = formatDeadlineLabel(session.voteDeadline);

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadMatch(true)}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, Spacing.screen) + 20 }}>
        {/* Blue Hero Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.primary, paddingTop: insets.top + 6 },
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
                style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
                <View style={[styles.circleBtn, { backgroundColor: colors.onPrimaryOverlay }]}>
                  <Ionicons name="arrow-back" size={18} color={colors.onPrimary} />
                </View>
                <Text
                  numberOfLines={1}
                  style={[Typography.title14, styles.backTitle, { color: colors.onPrimary }]}>
                  Chi tiết trận
                </Text>
              </Pressable>

              {isAdmin ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/matches/create',
                      params: { sessionId: session.id },
                    })
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Chỉnh sửa trận đấu"
                  style={({ pressed }) => [
                    styles.circleBtn,
                    { backgroundColor: colors.onPrimaryOverlay },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="create-outline" size={18} color={colors.onPrimary} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.chipRow}>
              <View style={[styles.headerChip, { backgroundColor: Palette.white }]}>
                <Text style={[Typography.chip12, { color: colors.primary }]}>
                  {statusMeta.label}
                </Text>
              </View>
              {!isPastMatch ? (
                <View style={[styles.headerChip, { backgroundColor: colors.onPrimaryOverlaySoft }]}>
                  <Text style={[Typography.chip12, { color: colors.onPrimary }]}>
                    {remainingSpots > 0 ? `Còn ${remainingSpots} chỗ` : 'Đủ quân số'}
                  </Text>
                </View>
              ) : null}
              {session.isVoteLocked ? (
                <View style={[styles.headerChip, { backgroundColor: colors.onPrimaryOverlaySoft }]}>
                  <Ionicons name="lock-closed" size={12} color={colors.onPrimary} />
                  <Text style={[Typography.chip12, { color: colors.onPrimary }]}>Đã khoá vote</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.heroDateRow}>
              <Text style={[Typography.hero64, { color: colors.onPrimary }]}>
                {dateParts.dateDisplay}
              </Text>
              <View style={styles.heroMetaCol}>
                <Text style={[Typography.section15, { color: colors.onPrimary }]}>
                  {dateParts.dayOfWeekLong}
                </Text>
                <Text style={[Typography.meta13, { color: Palette.sky }]}>
                  {formatTimeRange(session.startTime, session.endTime)}
                </Text>
              </View>
            </View>

            <Text style={[Typography.title14, { color: colors.onPrimary }]}>{session.title}</Text>
            {session.createdBy ? (
              <Text style={[Typography.meta13, { color: colors.onPrimaryMuted }]}>
                {session.createdBy.displayName} tạo kèo
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          {session.unpaidPreviousPayment ? (
            <View style={styles.debtWrap}>
              <AuthAlert
                variant="warning"
                title="Bạn còn khoản tiền sân chưa thanh toán"
                message={
                  unpaidPrevAmount > 0
                    ? `Hệ thống tạm khoá bình chọn cho tới khi bạn hoàn tất thanh toán ${formatVnd(unpaidPrevAmount)} của buổi đá trước.`
                    : 'Hệ thống tạm khoá bình chọn cho tới khi bạn hoàn tất thanh toán buổi đá trước.'
                }
              />
              {unpaidPrevSessionId ? (
                <AuthButton
                  label="Thanh toán buổi trước ngay"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/matches/payment',
                      params: { sessionId: unpaidPrevSessionId },
                    })
                  }
                />
              ) : null}
            </View>
          ) : null}

          {errorBanner ? <AuthAlert title="Thông báo lỗi" message={errorBanner} /> : null}
          {infoBanner ? (
            <AuthAlert variant="success" title="Đã cập nhật" message={infoBanner} />
          ) : null}

          {/* Venue & Participation Card */}
          <View
            style={[
              styles.card,
              Elevation.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.venueRow}>
              <View style={styles.venueInfo}>
                <Text style={[Typography.section15, { color: colors.text }]}>
                  {session.location}
                </Text>
                <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                  {deadlineText ??
                    `Giờ thi đấu: ${formatTimeRange(session.startTime, session.endTime)}`}
                </Text>
              </View>
              <Pressable
                onPress={handleOpenDirections}
                hitSlop={6}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.directionsBtn,
                  { backgroundColor: colors.primarySurface },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="navigate-outline" size={15} color={colors.primary} />
                <Text style={[Typography.chip12, { color: colors.primary }]}>Chỉ đường</Text>
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.meterBlock}>
              <View style={styles.meterHeader}>
                <Text style={[Typography.title14, { color: colors.text }]}>
                  {joinCount}/{session.maxPlayers} người tham gia
                </Text>
                <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                  Cần tối thiểu {session.minPlayers} để giữ sân
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
            </View>

            {voteSummary ? (
              <View style={styles.summaryChips}>
                <View style={[styles.summaryChip, { backgroundColor: colors.primarySurface }]}>
                  <Text style={[Typography.chip12, { color: colors.primary }]}>
                    Tham gia {voteSummary.join}
                  </Text>
                </View>
                <View style={[styles.summaryChip, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[Typography.chip12, { color: colors.textSecondary }]}>
                    Báo vắng {voteSummary.decline}
                  </Text>
                </View>
                {voteSummary.maybe > 0 ? (
                  <View style={[styles.summaryChip, { backgroundColor: colors.warningBackground }]}>
                    <Text style={[Typography.chip12, { color: colors.warning }]}>
                      Có thể {voteSummary.maybe}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Time Slot Selection */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={[Typography.section15, { color: colors.text }]}>
                {isPastMatch ? 'Khung giờ' : 'Chọn khung giờ'}
              </Text>
              {canVote ? (
                <Pressable
                  onPress={() => setShowAddSlotForm((prev) => !prev)}
                  hitSlop={6}
                  accessibilityRole="button"
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
                    {showAddSlotForm ? 'Đóng' : '+ Thêm khung giờ'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {canVote && showAddSlotForm ? (
              <View
                style={[
                  styles.addSlotBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                  Chọn khung giờ muốn đề xuất
                </Text>
                <View style={styles.addSlotInputs}>
                  <View style={styles.timePickerWrap}>
                    <TimePickerField
                      compact
                      title="Giờ bắt đầu"
                      value={newSlotStart}
                      onChange={(val) => {
                        setNewSlotStart(val);
                        if (compareHhmm(val, newSlotEnd) >= 0) {
                          setNewSlotEnd(suggestEndTime(val, 90));
                        }
                      }}
                    />
                  </View>
                  <Text style={[Typography.title14, { color: colors.textSecondary }]}>–</Text>
                  <View style={styles.timePickerWrap}>
                    <TimePickerField
                      compact
                      title="Giờ kết thúc"
                      value={newSlotEnd}
                      onChange={setNewSlotEnd}
                    />
                  </View>
                  <Pressable
                    onPress={() => void handleAddTimeSlot()}
                    disabled={addingSlot}
                    style={({ pressed }) => [
                      styles.addSlotSubmit,
                      { backgroundColor: colors.primary },
                      pressed && styles.pressed,
                    ]}>
                    {addingSlot ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <Text style={[Typography.chip12, { color: colors.onPrimary }]}>Thêm</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : null}

            {session.timeSlots && session.timeSlots.length > 0 ? (
              <View style={styles.slotList}>
                {session.timeSlots.map((slot) => (
                  <TimeSlotCard
                    key={slot.id}
                    slot={slot}
                    votesCount={slotVoteCounts[slot.id] ?? 0}
                    isFinalSlot={session.selectedTimeSlotId === slot.id}
                    selected={selectedSlotIds.includes(slot.id)}
                    disabled={!canVote}
                    onPress={() => toggleSlot(slot.id)}
                  />
                ))}
              </View>
            ) : (
              <View
                style={[
                  styles.emptySlotBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                  Trận đấu sử dụng khung giờ cố định{' '}
                  {formatTimeRange(session.startTime, session.endTime)}.
                </Text>
              </View>
            )}
          </View>

          {/* Participation / Current Vote Banner */}
          {session.status === 'CANCELLED' ? (
            <AuthAlert
              variant="error"
              title="Trận đấu đã bị huỷ"
              message={session.cancellationNote?.trim() || 'Ban quản trị đã huỷ buổi đá này.'}
            />
          ) : isPastMatch ? (
            <AuthAlert
              variant={hasAttended ? 'success' : 'info'}
              title={hasAttended ? 'Bạn đã tham gia' : 'Bạn không tham gia'}
            />
          ) : myVote?.status === 'DECLINE' ? (
            <AuthAlert
              variant="info"
              title="Bạn đã báo không tham gia"
              message="Bạn vẫn có thể bấm Tham gia bên dưới nếu đổi lịch và bình chọn chưa bị khoá."
            />
          ) : myVote?.status === 'JOIN' ? (
            <AuthAlert
              variant="success"
              title="Bạn đã đăng ký tham gia buổi này"
              message="Có thể chọn thêm khung giờ khác rồi bấm Cập nhật bình chọn."
            />
          ) : null}

          {/* Vote Action Buttons */}
          {canVote ? (
            <View style={styles.voteActions}>
              <AuthButton
                label={myVote?.status === 'JOIN' ? 'Cập nhật bình chọn' : 'Tham gia'}
                onPress={() => void handleJoinOrUpdate()}
                loading={submittingVote}
              />
              <AuthButton
                label={myVote?.status === 'JOIN' ? 'Xin nghỉ' : 'Không tham gia'}
                variant="secondary"
                onPress={() => {
                  setLeaveModalError(null);
                  setLeaveModalVisible(true);
                }}
                disabled={submittingVote}
              />
            </View>
          ) : !isPastMatch && session.isVoteLocked && myVote?.status === 'JOIN' ? (
            <AuthButton
              label="Xin nghỉ"
              variant="secondary"
              onPress={() => {
                setLeaveModalError(null);
                setLeaveModalVisible(true);
              }}
            />
          ) : null}

          {/* Cost & Payment Summary (Figma 02g / 02h) */}
          {hasSettlementSection && paymentsData ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[Typography.section15, { color: colors.text }]}>
                  Chi phí & Thanh toán
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/matches/payment',
                      params: { sessionId: session.id },
                    })
                  }
                  hitSlop={6}
                  accessibilityRole="button"
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Text style={[Typography.metaStrong13, { color: colors.primary }]}>Chi tiết</Text>
                </Pressable>
              </View>

              <PaymentSummaryCard
                paymentsData={paymentsData}
                currentUserId={user?.id}
                sessionTotalCost={session.totalCost}
                splitCount={session.splitCount}
                onPressPayment={() =>
                  router.push({
                    pathname: '/matches/payment',
                    params: { sessionId: session.id },
                  })
                }
              />

              {myPayment?.status === 'PENDING' ? (
                <AuthButton
                  label={`Thanh toán ${formatVnd(myPayment.amount)}`}
                  onPress={() =>
                    router.push({
                      pathname: '/matches/payment',
                      params: { sessionId: session.id },
                    })
                  }
                />
              ) : null}
            </View>
          ) : null}

          {/* Teams Published Banner (placeholder hook for T-20/T-21) */}
          {session.teams ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.primarySurface, borderColor: colors.borderActive },
              ]}>
              <View style={styles.venueRow}>
                <View style={styles.venueInfo}>
                  <Text style={[Typography.title14, { color: colors.primary }]}>
                    Đội hình đã được công bố
                  </Text>
                  <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                    Hiển thị chi tiết 4 đội hình & check-in tại sân sẽ được tích hợp ở Task T-20 /
                    T-21.
                  </Text>
                </View>
                <Ionicons name="people" size={22} color={colors.primary} />
              </View>
            </View>
          ) : null}

          {/* Admin Controls */}
          {isAdmin ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[Typography.section15, { color: colors.text }]}>
                Quản trị kèo (Admin)
              </Text>

              <AdminMatchStatusCard
                key={`${session.id}:${session.status}:${session.selectedTimeSlotId ?? ''}:${session.totalCost ?? ''}:${session.cancellationNote ?? ''}`}
                session={session}
                slotVoteCounts={slotVoteCounts}
                isPastMatch={isPastMatch}
                currentUserId={user?.id}
                submitting={updatingStatus}
                onSubmit={handleUpdateStatus}
              />

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.adminButtons}>
                {!hasSettlementSection ? (
                  <AuthButton
                    label="Quyết toán & Chia tiền sân"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/matches/payment',
                        params: { sessionId: session.id },
                      })
                    }
                  />
                ) : null}
                {!isPastMatch && session.status !== 'CANCELLED' ? (
                  <AuthButton
                    label={session.isVoteLocked ? 'Mở lại bình chọn' : 'Chốt danh sách'}
                    variant="secondary"
                    onPress={() => void handleToggleLockVote()}
                    loading={lockingVote}
                  />
                ) : null}
                <AuthButton
                  label="Chỉnh sửa thông tin trận"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/matches/create',
                      params: { sessionId: session.id },
                    })
                  }
                />
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <LeaveRequestModal
        visible={leaveModalVisible}
        mode={myVote?.status === 'JOIN' ? 'leave' : 'decline'}
        sessionTitle={session.title}
        dateLabel={dateParts.slashDate}
        location={session.location}
        isVoteLocked={session.isVoteLocked}
        submitting={submittingVote}
        errorMessage={leaveModalError}
        onClose={() => setLeaveModalVisible(false)}
        onConfirm={(reason) => {
          void handleConfirmDecline(reason);
        }}
      />
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
  centerRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.screen,
    gap: Spacing.lg,
  },
  header: {
    overflow: 'hidden',
    paddingHorizontal: Spacing.screen,
    paddingBottom: 22,
  },
  pitchOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.16,
  },
  headerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: 10,
  },
  topBar: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  backRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backTitle: {
    flexShrink: 1,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 2,
  },
  heroMetaCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  body: {
    padding: Spacing.screen,
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  debtWrap: {
    gap: Spacing.sm,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.default,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  venueInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  divider: {
    height: 1,
  },
  meterBlock: {
    gap: 6,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
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
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
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
  slotList: {
    gap: Spacing.sm,
  },
  emptySlotBox: {
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
    padding: Spacing.md,
  },
  addSlotBox: {
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  addSlotInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timePickerWrap: {
    flex: 1,
    minWidth: 0,
  },
  addSlotSubmit: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  voteActions: {
    gap: Spacing.sm,
  },
  adminButtons: {
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.78,
  },
});
