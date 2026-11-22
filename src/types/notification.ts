import type { PaginationMeta } from './common';

/**
 * Push notification registration and in-app notification feed contracts
 * matching `/api/notifications/*` in CSE HitDad API v1.2.4.
 */

export type PushChannel = 'WEB_PUSH' | 'FCM' | 'EXPO';

export type PushPlatform = 'IOS_PWA' | 'ANDROID_APK' | 'WEB' | 'OTHER';

export type PushStatus = 'PENDING' | 'SENT' | 'PARTIAL' | 'FAILED' | 'SKIPPED' | 'NO_DEVICE';

export interface PushConfigResponse {
  webPushEnabled: boolean;
  vapidPublicKey: string | null;
  fcmEnabled: boolean;
  expoEnabled: boolean;
  supportedChannels: PushChannel[];
}

export interface PushSubscriptionSummary {
  id: string;
  channel: PushChannel;
  platform: PushPlatform;
  deviceName: string | null;
  appVersion: string | null;
  endpointOrigin: string | null;
  tokenPreview: string | null;
  isActive: boolean;
  failureCount: number;
  lastError: string | null;
  lastSuccessAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPushSubscriptionBody {
  channel?: PushChannel;
  platform?: PushPlatform;
  deviceName?: string;
  appVersion?: string;
  token?: string;
  subscription?: Record<string, unknown>;
}

export interface UnregisterPushSubscriptionBody {
  subscriptionId?: string;
  endpoint?: string;
  token?: string;
  channel?: PushChannel;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  pushStatus: PushStatus;
  pushSentCount: number;
  pushFailedCount: number;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: PaginationMeta;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkNotificationReadResponse {
  message: string;
  notification: NotificationItem;
}

export interface ReadAllNotificationsResponse {
  message: string;
  updatedCount: number;
}

export interface TestPushBody {
  title?: string;
  body?: string;
  url?: string;
  subscriptionId?: string;
  data?: Record<string, unknown>;
}

export type SendAdminNotificationTarget = 'ALL' | 'USERS' | 'SESSION_JOINED' | 'SESSION_UNPAID';

export interface SendAdminNotificationBody {
  title: string;
  body: string;
  target?: SendAdminNotificationTarget;
  userIds?: string[];
  sessionId?: string;
  type?: string;
  url?: string;
  excludeSelf?: boolean;
  data?: Record<string, unknown>;
}
