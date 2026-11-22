import type { SessionPaymentsResponse } from '@/types';

import { parseVndAmount } from './format';

export interface PaymentSessionMeta {
  totalCost?: number | string | null;
  splitCount?: number | string | null;
}

export interface ResolvedPaymentTotals {
  totalCost: number;
  splitCount: number;
  perPerson: number;
  paymentsSum: number;
}

function pickFirstPositive(values: unknown[]): number {
  for (const value of values) {
    const parsed = parseVndAmount(value);
    if (parsed > 0) return parsed;
  }
  return 0;
}

/**
 * Resolves total match cost, split count, and per-person fee from `SessionPaymentsResponse`
 * and optional session metadata, handling numeric strings and missing session totals cleanly.
 */
export function resolvePaymentTotals(
  paymentsData: SessionPaymentsResponse | null | undefined,
  sessionMeta?: PaymentSessionMeta | null,
): ResolvedPaymentTotals {
  const payments = paymentsData?.payments ?? [];
  const paymentsSum = payments.reduce((sum, item) => sum + parseVndAmount(item.amount), 0);

  const totalCost = pickFirstPositive([
    paymentsData?.session?.totalCost,
    sessionMeta?.totalCost,
    paymentsData?.summary?.totalCost,
    paymentsSum,
  ]);

  const rawSplitCount = pickFirstPositive([
    sessionMeta?.splitCount,
    paymentsData?.summary?.total,
    payments.length,
  ]);
  const splitCount = Math.round(rawSplitCount);

  let perPerson = 0;
  if (totalCost > 0 && splitCount > 0) {
    perPerson = Math.round(totalCost / splitCount);
  } else {
    for (const item of payments) {
      const amount = parseVndAmount(item.amount);
      if (amount > 0) {
        perPerson = Math.round(amount);
        break;
      }
    }
  }

  return { totalCost, splitCount, perPerson, paymentsSum };
}
