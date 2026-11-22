import type {
  ConfirmPaymentResponse,
  MarkPaidResponse,
  PayOSLinkResponse,
  PayOSStatusResponse,
  RecalculatePaymentsResponse,
  SessionPaymentsResponse,
} from '@/types';

import { apiClient, API_ENDPOINTS } from '../api';

export const paymentService = {
  getBySession: (sessionId: string) =>
    apiClient.get<SessionPaymentsResponse>(API_ENDPOINTS.payments.bySession(sessionId)),

  createPayosLink: (paymentId: string) =>
    apiClient.post<PayOSLinkResponse>(API_ENDPOINTS.payments.payosLink(paymentId)),

  getPayosStatus: (paymentId: string) =>
    apiClient.get<PayOSStatusResponse>(API_ENDPOINTS.payments.payosStatus(paymentId)),

  markPaid: (paymentId: string) =>
    apiClient.put<MarkPaidResponse>(API_ENDPOINTS.payments.markPaid(paymentId)),

  confirm: (paymentId: string) =>
    apiClient.put<ConfirmPaymentResponse>(API_ENDPOINTS.payments.confirm(paymentId)),

  recalculateForSession: (sessionId: string) =>
    apiClient.post<RecalculatePaymentsResponse>(
      API_ENDPOINTS.attendance.recalculatePayments(sessionId),
    ),
};
