import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthAlert, AuthButton } from '@/components/auth';
import { FeaturedMatchCard, MatchRowCard } from '@/components/matches';
import {
  BorderWidth,
  FontFamilies,
  MaxContentWidth,
  Palette,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ApiClientError } from '@/services/api';
import { notificationService } from '@/services/notifications';
import { sessionService } from '@/services/sessions';
import { voteService } from '@/services/votes';
import type { SessionDetail } from '@/types';
import { formatSessionDateParts, getUserInitials } from '@/utils/format';
import {
  partitionScheduleSessions,
} from '@/utils/sessions';

type LobbyTab = 'upcoming' | 'done';
type DoneFilter = 'all' | 'completed' | 'cancelled';

export default function ScheduleScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<LobbyTab>('upcoming');
  const [doneFilter, setDoneFilter] = useState<DoneFilter>('all');
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [referenceNow, setReferenceNow] = useState(() => Date.now());
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quickJoiningId, setQuickJoiningId] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const [sessionsRes, unreadRes] = await Promise.all([
        sessionService.list(),
        notificationService.getUnreadCount().catch(() => ({ unreadCount: 0 })),
      ]);
      setSessions(sessionsRes.sessions);
      setReferenceNow(Date.now());
      setUnreadCount(unreadRes.unreadCount);
      setErrorMessage(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Không thể tải lịch đá. Kéo xuống để thử lại.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchDashboard(false);
    }, [fetchDashboard]),
  );

  const { upcoming: upcomingSessions, done: pastSessions } = useMemo(
    () => partitionScheduleSessions(sessions, referenceNow),
    [sessions, referenceNow],
  );

  const completedCount = useMemo(
    () => pastSessions.filter((s) => s.status !== 'CANCELLED').length,
    [pastSessions],
  );
  const cancelledCount = useMemo(
    () => pastSessions.filter((s) => s.status === 'CANCELLED').length,
    [pastSessions],
  );

  const filteredPastSessions = useMemo(() => {
    if (doneFilter === 'completed') {
      return pastSessions.filter((s) => s.status !== 'CANCELLED');
    }
    if (doneFilter === 'cancelled') {
      return pastSessions.filter((s) => s.status === 'CANCELLED');
    }
    return pastSessions;
  }, [pastSessions, doneFilter]);

  const groupedPastSections = useMemo(() => {
    const groups = new Map<string, { title: string; items: SessionDetail[] }>();
    for (const item of filteredPastSessions) {
      const dateParts = formatSessionDateParts(item.playDate);
      const key = dateParts.monthKey || dateParts.monthHeading;
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(key, { title: dateParts.monthHeading, items: [item] });
      }
    }
    return Array.from(groups.entries()).map(([key, group]) => ({
      key,
      title: group.title,
      items: group.items,
    }));
  }, [filteredPastSessions]);

  const handleQuickJoin = async (session: SessionDetail) => {
    if (session.timeSlots && session.timeSlots.length > 1) {
      router.push({ pathname: '/matches/[id]', params: { id: session.id } });
      return;
    }

    setQuickJoiningId(session.id);
    setErrorMessage(null);
    try {
      const defaultSlotId = session.timeSlots?.[0]?.id;
      await voteService.cast({
        sessionId: session.id,
        status: 'JOIN',
        timeSlotIds: defaultSlotId ? [defaultSlotId] : undefined,
      });
      await fetchDashboard(false);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Không thể ghi nhận tham gia lúc này.');
      }
    } finally {
      setQuickJoiningId(null);
    }
  };

  const featuredSession = upcomingSessions[0];
  const otherUpcoming = upcomingSessions.slice(1);
  const hasHeaderOverlap =
    activeTab === 'upcoming' && !loading && Boolean(featuredSession) && !errorMessage;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void fetchDashboard(true)}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}>
        {/* Blue Hero Header matching Figma 01 Lịch đá */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.primary,
              paddingTop: insets.top + 6,
              paddingBottom: hasHeaderOverlap ? 48 : 20,
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
              <View style={styles.brandLeft}>
                <View style={[styles.crestCircle, { backgroundColor: Palette.white }]}>
                  <Image
                    source={require('@/assets/images/hitdad-crest.png')}
                    style={styles.crestImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.brandTextGroup}>
                  <Text numberOfLines={1} style={[Typography.title14, { color: colors.onPrimary }]}>
                    HitDad
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[Typography.headerSub11, { color: colors.onPrimaryMuted }]}>
                    CSE FC HCMUT
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRight}>
                <Pressable
                  onPress={() => router.push('/notifications')}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Thông báo"
                  style={({ pressed }) => [
                    styles.bellButton,
                    { backgroundColor: colors.onPrimaryOverlay },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="notifications-outline" size={20} color={colors.onPrimary} />
                  {unreadCount > 0 ? (
                    <View
                      style={[
                        styles.bellBadge,
                        { backgroundColor: Palette.white, borderColor: colors.primary },
                      ]}>
                      <Text
                        numberOfLines={1}
                        style={[styles.bellBadgeText, { color: colors.primary }]}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>

                <Pressable
                  onPress={() => router.push('/(tabs)/profile')}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Tài khoản cá nhân"
                  style={({ pressed }) => [
                    styles.avatarButton,
                    { backgroundColor: Palette.white },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[Typography.chip12, { color: colors.primary }]}>
                    {getUserInitials(user?.displayName ?? 'HD')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.titleRow}>
              <Text
                style={[Typography.display40, styles.titleText, { color: colors.onPrimary }]}>
                Lịch đá
              </Text>
            </View>

            <View style={styles.segmentedRow}>
              <View style={styles.segmentTabs}>
                <Pressable
                  onPress={() => setActiveTab('upcoming')}
                  style={({ pressed }) => [
                    styles.segmentPill,
                    {
                      backgroundColor:
                        activeTab === 'upcoming' ? Palette.white : colors.onPrimaryOverlaySoft,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      Typography.tab13,
                      { color: activeTab === 'upcoming' ? colors.primary : colors.onPrimary },
                    ]}>
                    Sắp tới
                  </Text>
                  <Text
                    style={[
                      Typography.chip12,
                      {
                        color:
                          activeTab === 'upcoming' ? colors.primary : colors.onPrimaryMuted,
                      },
                    ]}>
                    {upcomingSessions.length}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab('done')}
                  style={({ pressed }) => [
                    styles.segmentPill,
                    {
                      backgroundColor:
                        activeTab === 'done' ? Palette.white : colors.onPrimaryOverlaySoft,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      Typography.tab13,
                      { color: activeTab === 'done' ? colors.primary : colors.onPrimary },
                    ]}>
                    Đã đá
                  </Text>
                  <Text
                    style={[
                      Typography.chip12,
                      { color: activeTab === 'done' ? colors.primary : colors.onPrimaryMuted },
                    ]}>
                    {pastSessions.length}
                  </Text>
                </Pressable>
              </View>

              {isAdmin ? (
                <Pressable
                  onPress={() => router.push('/matches/create')}
                  accessibilityRole="button"
                  accessibilityLabel="Tạo trận đấu mới"
                  style={({ pressed }) => [
                    styles.createMiniBtn,
                    { backgroundColor: Palette.white },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    style={[Typography.tab13, { color: colors.primary }]}>
                    Tạo trận
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {errorMessage ? (
            <AuthAlert title="Có lỗi xảy ra" message={errorMessage} />
          ) : null}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : activeTab === 'upcoming' ? (
            upcomingSessions.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <Ionicons name="calendar-outline" size={32} color={colors.primary} />
                <Text style={[Typography.section15, { color: colors.text }]}>
                  Chưa có kèo đá sắp tới
                </Text>
                <Text
                  style={[Typography.small12, styles.emptyDesc, { color: colors.textSecondary }]}>
                  {isAdmin
                    ? 'Tạo trận đấu mới để anh em CLB bắt đầu bình chọn khung giờ.'
                    : 'Khi ban cán sự mở kèo mới, thông tin trận đấu sẽ hiển thị tại đây.'}
                </Text>
                {pastSessions.length > 0 ? (
                  <View style={styles.emptyActions}>
                    <AuthButton
                      label="Xem các trận đã đá"
                      variant="secondary"
                      onPress={() => setActiveTab('done')}
                    />
                  </View>
                ) : null}
              </View>
            ) : (
              <>
                {featuredSession ? (
                  <View style={hasHeaderOverlap ? styles.featuredOverlap : undefined}>
                    <FeaturedMatchCard
                      session={featuredSession}
                      currentUserId={user?.id}
                      quickJoining={quickJoiningId === featuredSession.id}
                      onPress={() =>
                        router.push({
                          pathname: '/matches/[id]',
                          params: { id: featuredSession.id },
                        })
                      }
                      onQuickJoin={() => {
                        void handleQuickJoin(featuredSession);
                      }}
                    />
                  </View>
                ) : null}

                {otherUpcoming.length > 0 ? (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                      <Text style={[Typography.section15, styles.sectionTitle, { color: colors.text }]}>
                        Lịch sắp tới khác
                      </Text>
                      <Text
                        style={[
                          Typography.small12,
                          styles.sectionCount,
                          { color: colors.textSecondary },
                        ]}>
                        {otherUpcoming.length} trận
                      </Text>
                    </View>
                    <View style={styles.listGap}>
                      {otherUpcoming.map((item) => (
                        <MatchRowCard
                          key={item.id}
                          session={item}
                          variant="upcoming"
                          currentUserId={user?.id}
                          onPress={() =>
                            router.push({ pathname: '/matches/[id]', params: { id: item.id } })
                          }
                        />
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            )
          ) : (
            <View style={styles.doneWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}>
                {(
                  [
                    { key: 'all', label: `Tất cả · ${pastSessions.length}` },
                    { key: 'completed', label: `Hoàn thành · ${completedCount}` },
                    { key: 'cancelled', label: `Đã huỷ · ${cancelledCount}` },
                  ] as const
                ).map((chip) => {
                  const selected = doneFilter === chip.key;
                  return (
                    <Pressable
                      key={chip.key}
                      onPress={() => setDoneFilter(chip.key)}
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

              {groupedPastSections.length === 0 ? (
                <View
                  style={[
                    styles.emptyCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  <Ionicons name="football-outline" size={32} color={colors.textSecondary} />
                  <Text style={[Typography.section15, { color: colors.text }]}>
                    Chưa có trận nào trong mục này
                  </Text>
                </View>
              ) : (
                groupedPastSections.map((group) => (
                  <View key={group.key} style={styles.sectionBlock}>
                    <View style={styles.sectionHeader}>
                      <Text style={[Typography.section15, styles.sectionTitle, { color: colors.text }]}>
                        {group.title}
                      </Text>
                      <Text
                        style={[
                          Typography.small12,
                          styles.sectionCount,
                          { color: colors.textSecondary },
                        ]}>
                        {group.items.length} trận
                      </Text>
                    </View>
                    <View style={styles.listGap}>
                      {group.items.map((item) => (
                        <MatchRowCard
                          key={item.id}
                          session={item}
                          variant="done"
                          currentUserId={user?.id}
                          onPress={() =>
                            router.push({ pathname: '/matches/[id]', params: { id: item.id } })
                          }
                        />
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  brandLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  crestCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  crestImage: {
    width: 26,
    height: 26,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    minHeight: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadgeText: {
    fontFamily: FontFamilies.beVietnamSemiBold,
    fontSize: 10,
    lineHeight: 12,
    includeFontPadding: false,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  titleText: {
    flexShrink: 1,
  },
  createMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  segmentedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  body: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  featuredOverlap: {
    marginTop: -38,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
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
  sectionCount: {
    flexShrink: 0,
  },
  listGap: {
    gap: 10,
  },
  doneWrapper: {
    gap: Spacing.lg,
  },
  filterRow: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.default,
  },
  emptyCard: {
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.default,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyDesc: {
    textAlign: 'center',
  },
  emptyActions: {
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pressed: {
    opacity: 0.78,
  },
});
