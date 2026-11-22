import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationItem } from '@/types';
import { formatRelativeTime } from '@/utils/format';

export interface NotificationRowProps {
  item: NotificationItem;
  onPress: () => void;
  onDelete: () => void;
}

function getNotificationIcon(type: string): ComponentProps<typeof Ionicons>['name'] {
  const upper = type.toUpperCase();
  if (upper.includes('PAYMENT') || upper.includes('BILL')) return 'card-outline';
  if (upper.includes('TEAM')) return 'people-outline';
  if (upper.includes('MEMBER')) return 'shield-checkmark-outline';
  if (upper.includes('SESSION') || upper.includes('VOTE')) return 'time-outline';
  return 'notifications-outline';
}

/**
 * Notification row item replicating Figma `HD/Notification row` (`EL-bcabe8b6`).
 */
export function NotificationRow({ item, onPress, onDelete }: NotificationRowProps) {
  const colors = useTheme();
  const iconName = getNotificationIcon(item.type);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: item.isRead ? colors.surface : colors.backgroundSelected,
          borderBottomColor: colors.surfaceMuted,
        },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconTile, { backgroundColor: colors.primarySurface }]}>
        <Ionicons name={iconName} size={20} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={[Typography.title14, styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={[Typography.small12, styles.timestamp, { color: colors.textSecondary }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Text style={[Typography.small12, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.body}
        </Text>
      </View>

      <View style={styles.rightActions}>
        {!item.isRead ? (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        ) : null}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Xóa thông báo"
          style={({ pressed }) => pressed && styles.pressed}>
          <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.screen,
    gap: Spacing.md,
    borderBottomWidth: BorderWidth.hairline,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  timestamp: {
    flexShrink: 0,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.72,
  },
});
