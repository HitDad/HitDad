/**
 * Centralized REST endpoint registry matching CSE HitDad API v1.2.4
 * (`https://cse-punchdad-api.onrender.com/api-docs/`).
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  'https://cse-punchdad-api.onrender.com';

const seg = (value: string) => encodeURIComponent(value);

export const API_ENDPOINTS = {
  system: {
    health: '/api/health',
  },
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
    sendOtp: '/api/auth/send-otp',
    verifyOtp: '/api/auth/verify-otp',
    forgotPasswordSendOtp: '/api/auth/forgot-password/send-otp',
    forgotPasswordVerifyOtp: '/api/auth/forgot-password/verify-otp',
    forgotPasswordReset: '/api/auth/forgot-password/reset',
  },
  users: {
    members: '/api/users/members',
    exportExcel: '/api/users/export-excel',
    membershipRequests: '/api/users/membership-requests',
    membershipRequestsCount: '/api/users/membership-requests/count',
    reviewMembershipRequest: (userId: string) => `/api/users/membership-requests/${seg(userId)}`,
    updateTier: (userId: string) => `/api/users/${seg(userId)}/tier`,
    updateGoalkeeper: (userId: string) => `/api/users/${seg(userId)}/goalkeeper`,
    profile: '/api/users/profile',
    changePassword: '/api/users/change-password',
    avatar: '/api/users/avatar',
    qrCode: '/api/users/qr-code',
    userQrCode: (id: string) => `/api/users/${seg(id)}/qr-code`,
    removeMember: (userId: string) => `/api/users/${seg(userId)}`,
  },
  sessions: {
    list: '/api/sessions',
    create: '/api/sessions',
    detail: (id: string) => `/api/sessions/${seg(id)}`,
    update: (id: string) => `/api/sessions/${seg(id)}`,
    cancel: (id: string) => `/api/sessions/${seg(id)}`,
    forceDelete: (id: string) => `/api/sessions/${seg(id)}/force`,
    addTimeSlot: (id: string) => `/api/sessions/${seg(id)}/time-slots`,
  },
  votes: {
    cast: '/api/votes',
    adminAdjust: '/api/votes/admin/adjust',
    update: (id: string) => `/api/votes/${seg(id)}`,
    bySession: (sessionId: string) => `/api/votes/session/${seg(sessionId)}`,
  },
  teams: {
    suggestions: (sessionId: string) => `/api/sessions/${seg(sessionId)}/teams/suggestions`,
    generate: (sessionId: string) => `/api/sessions/${seg(sessionId)}/teams/generate`,
    save: (sessionId: string) => `/api/sessions/${seg(sessionId)}/teams`,
    clear: (sessionId: string) => `/api/sessions/${seg(sessionId)}/teams`,
  },
  attendance: {
    dashboard: (sessionId: string) => `/api/sessions/${seg(sessionId)}/attendance`,
    mark: (sessionId: string) => `/api/sessions/${seg(sessionId)}/attendance`,
    bulk: (sessionId: string) => `/api/sessions/${seg(sessionId)}/attendance/bulk`,
    lockVote: (sessionId: string) => `/api/sessions/${seg(sessionId)}/lock-vote`,
    addGuest: (sessionId: string) => `/api/sessions/${seg(sessionId)}/guests`,
    updateGuest: (sessionId: string, guestId: string) =>
      `/api/sessions/${seg(sessionId)}/guests/${seg(guestId)}`,
    removeGuest: (sessionId: string, guestId: string) =>
      `/api/sessions/${seg(sessionId)}/guests/${seg(guestId)}`,
    recalculatePayments: (sessionId: string) =>
      `/api/sessions/${seg(sessionId)}/recalculate-payments`,
  },
  payments: {
    bySession: (sessionId: string) => `/api/payments/session/${seg(sessionId)}`,
    markPaid: (id: string) => `/api/payments/${seg(id)}/mark-paid`,
    confirm: (id: string) => `/api/payments/${seg(id)}/confirm`,
    payosLink: (id: string) => `/api/payments/${seg(id)}/payos-link`,
    payosStatus: (id: string) => `/api/payments/${seg(id)}/payos-status`,
    payosConfirmWebhook: '/api/payments/payos-confirm-webhook',
  },
  notifications: {
    config: '/api/notifications/config',
    subscriptions: '/api/notifications/subscriptions',
    removeSubscription: (id: string) => `/api/notifications/subscriptions/${seg(id)}`,
    testPush: '/api/notifications/test',
    send: '/api/notifications/send',
    list: '/api/notifications',
    unreadCount: '/api/notifications/unread-count',
    readAll: '/api/notifications/read-all',
    markRead: (id: string) => `/api/notifications/${seg(id)}/read`,
    remove: (id: string) => `/api/notifications/${seg(id)}`,
  },
  feedback: {
    create: '/api/feedback',
    list: '/api/feedback',
    update: (id: string) => `/api/feedback/${seg(id)}`,
  },
} as const;
