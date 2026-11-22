import type {
  MarkNotificationReadResponse,
  MessageResponse,
  NotificationsListResponse,
  PushConfigResponse,
  PushSubscriptionSummary,
  ReadAllNotificationsResponse,
  RegisterPushSubscriptionBody,
  UnreadCountResponse,
  UnregisterPushSubscriptionBody,
} from '@/types';

import { apiClient, API_ENDPOINTS } from '../api';

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const notificationService = {
  list: (params?: ListNotificationsParams) =>
    apiClient.get<NotificationsListResponse>(API_ENDPOINTS.notifications.list, {
      query: params ? { ...params } : undefined,
    }),

  getUnreadCount: () =>
    apiClient.get<UnreadCountResponse>(API_ENDPOINTS.notifications.unreadCount),

  markRead: (id: string) =>
    apiClient.put<MarkNotificationReadResponse>(API_ENDPOINTS.notifications.markRead(id)),

  readAll: () =>
    apiClient.put<ReadAllNotificationsResponse>(API_ENDPOINTS.notifications.readAll),

  remove: (id: string) =>
    apiClient.delete<MessageResponse>(API_ENDPOINTS.notifications.remove(id)),

  getConfig: () =>
    apiClient.get<PushConfigResponse>(API_ENDPOINTS.notifications.config, { auth: false }),

  registerSubscription: (body: RegisterPushSubscriptionBody) =>
    apiClient.post<{ message: string; subscription: PushSubscriptionSummary }>(
      API_ENDPOINTS.notifications.subscriptions,
      body,
    ),

  unregisterSubscription: (body: UnregisterPushSubscriptionBody) =>
    apiClient.delete<MessageResponse>(API_ENDPOINTS.notifications.subscriptions, { body }),
};
