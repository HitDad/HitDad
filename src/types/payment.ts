import type { SessionPayer, SessionStatus } from './session';
import type { UserSummary } from './user';

/**
 * Pitch fee settlement, manual confirmation, and PayOS VietQR contracts
 * matching `/api/payments/*` and recalculate-payments in CSE HitDad API v1.2.4.
 */

export type PaymentStatus = 'PENDING' | 'PAID' | 'CONFIRMED';

export interface PaymentItem {
  id: string;
  amount: number;
  status: PaymentStatus;
  orderCode: number | null;
  checkoutUrl: string | null;
  paymentLinkId: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bin: string | null;
  qrCode: string | null;
  description: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  sessionId: string;
  userId: string;
  user?: UserSummary;
}

export interface SessionPaymentsSummary {
  totalCost: number;
  pending: number;
  paid: number;
  confirmed: number;
  total: number;
}

export interface SessionPaymentsResponse {
  session: {
    id: string;
    totalCost: number | null;
    status: SessionStatus;
    payer: SessionPayer | null;
  };
  payments: PaymentItem[];
  summary: SessionPaymentsSummary;
}

export interface MarkPaidResponse {
  message: string;
  payment: PaymentItem;
}

export interface ConfirmPaymentResponse {
  message: string;
  payment: PaymentItem;
  sessionCompleted: boolean;
}

export interface PayOSLinkResponse {
  payment: PaymentItem;
  orderCode: number;
  checkoutUrl: string;
  qrCode: string;
  amount: number;
  description: string;
  accountName: string;
  accountNumber: string;
  bin: string;
}

export interface PayOSStatusResponse {
  status: PaymentStatus;
  payosStatus: string | null;
  payment: PaymentItem;
  isPaid: boolean;
}

export interface RecalculatePaymentsResponse {
  message: string;
  amountPerPerson: number;
  totalAttendees: number;
  attendedMembersCount: number;
  attendedGuestsCount: number;
  payments: PaymentItem[];
}
