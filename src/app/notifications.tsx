import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthAlert, AuthButton, AuthHeader } from '@/components/auth';
import { NotificationRow } from '@/components/notifications';
import { BorderWidth, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiClientError } from '@/services/api';
import { notificationService } from '@/services/notifications';
import type { NotificationItem, PaginationMeta } from '@/types';
import { getNotificationDateGroup } from '@/utils/format';

const PAGE_LIMIT = 20;

export default function NotificationsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (page = 1, append = false, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      if (append) setLoadingMore(true);

      try {
        const res = await notificationService.list({
          page,
          limit: PAGE_LIMIT,
          unreadOnly: unreadOnly || undefined,
        });
        setNotifications((prev) => (append ? [...prev, ...res.notifications] : res.notifications));
        setUnreadCount(res.unreadCount);
        setPagination(res.pagination);
        setErrorMessage(null);
      } catch (error) {
        if (error instanceof ApiClientError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Không thể tải thông báo. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [unreadOnly],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void fetchNotifications(1, false, false);
    }, [fetchNotifications]),
  );

  const sections = useMemo(() => {
    const order: ('Hôm nay' | 'Hôm qua' | 'Trước đó')[] = ['Hôm nay', 'Hôm qua', 'Trước đó'];
    const map = new Map<string, NotificationItem[]>();

    for (const item of notifications) {
      const group = getNotificationDateGroup(item.createdAt);
      const list = map.get(group);
      if (list) {
        list.push(item);
      } else {
        map.set(group, [item]);
      }
    }

    return order
      .filter((title) => (map.get(title)?.length ?? 0) > 0)
      .map((title) => ({ title, data: map.get(title) ?? [] }));
  }, [notifications]);

  const handlePressNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      void notificationService.markRead(item.id).catch(() => undefined);
    }

    const targetSessionId = item.data?.sessionId;
    if (typeof targetSessionId === 'string' && targetSessionId) {
      const upperType = item.type.toUpperCase();
      if (upperType.includes('PAYMENT') || upperType.includes('BILL')) {
        router.push({ pathname: '/matches/payment', params: { sessionId: targetSessionId } });
        return;
      }
      router.push({ pathname: '/matches/[id]', params: { id: targetSessionId } });
    }
  };

  const handleDeleteNotification = async (item: NotificationItem) => {
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
    if (!item.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    try {
      await notificationService.remove(item.id);
    } catch {
      void fetchNotifications(1, false, false);
    }
  };

  const handleReadAll = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationService.readAll();
      setNotifications((prev) =>
        unreadOnly ? [] : prev.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const hasMore = Boolean(pagination && pagination.page < pagination.totalPages);

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar style="light" />
      <AuthHeader
        variant="back"
        backLabel="Lịch đá"
        onBack={() => router.back()}
        title="THÔNG BÁO"
        subtitle={`${unreadCount} chưa đọc`}
      />

      <View
        style={[
          styles.filterBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}>
        <View style={styles.filterInner}>
          <View style={styles.filterChips}>
            <Pressable
              onPress={() => setUnreadOnly(false)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: !unreadOnly ? colors.primary : colors.surface,
                  borderColor: !unreadOnly ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  Typography.chip12,
                  { color: !unreadOnly ? colors.onPrimary : colors.textSecondary },
                ]}>
                Tất cả
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setUnreadOnly(true)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: unreadOnly ? colors.primary : colors.surface,
                  borderColor: unreadOnly ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  Typography.chip12,
                  { color: unreadOnly ? colors.onPrimary : colors.textSecondary },
                ]}>
                Chưa đọc {unreadCount}
              </Text>
            </Pressable>
          </View>

          {unreadCount > 0 ? (
            <Pressable
              onPress={() => void handleReadAll()}
              disabled={markingAll}
              hitSlop={8}
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
                {markingAll ? 'Đang xử lý...' : 'Đọc hết'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorWrap}>
          <AuthAlert title="Không thể tải thông báo" message={errorMessage} />
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void fetchNotifications(1, false, true)}
              tintColor={colors.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.groupHeader}>
              <Text style={[Typography.metaStrong13, { color: colors.textSecondary }]}>
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => {
                void handlePressNotification(item);
              }}
              onDelete={() => {
                void handleDeleteNotification(item);
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={[styles.emptyIconBadge, { backgroundColor: colors.primarySurface }]}>
                  <Ionicons name="notifications-outline" size={28} color={colors.primary} />
                </View>
                <Text style={[Typography.section15, { color: colors.text }]}>
                  Chưa có thông báo mới
                </Text>
                <Text
                  style={[
                    Typography.small12,
                    styles.emptyBody,
                    { color: colors.textSecondary },
                  ]}>
                  Khi chủ kèo mở vote lịch đá mới, công bố đội hình hoặc nhắc thanh toán VietQR,
                  thông báo sẽ xuất hiện tại đây.
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoadMore}>
                <AuthButton
                  label="Tải thêm thông báo"
                  variant="secondary"
                  loading={loadingMore}
                  onPress={() => {
                    if (pagination) {
                      void fetchNotifications(pagination.page + 1, true, false);
                    }
                  }}
                />
              </View>
            ) : undefined
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.screen) + 12 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  filterBar: {
    borderBottomWidth: BorderWidth.hairline,
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.md,
  },
  filterInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: BorderWidth.default,
  },
  errorWrap: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.md,
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    width: '100%',
    alignSelf: 'center',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    alignSelf: 'center',
  },
  groupHeader: {
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  emptyWrapper: {
    paddingHorizontal: Spacing.screen,
    paddingVertical: 48,
  },
  emptyCard: {
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.default,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emptyBody: {
    textAlign: 'center',
  },
  footerLoadMore: {
    padding: Spacing.screen,
  },
  pressed: {
    opacity: 0.78,
  },
});
