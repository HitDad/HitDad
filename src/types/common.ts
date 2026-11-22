/**
 * Shared primitives, skill tier helpers, pagination, and API error contracts
 * matching CSE HitDad API v1.2.4.
 */

/** UI badge keys supported by `TierColors` in `src/constants/theme.ts`. */
export type SkillTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'Mới';

/** Raw tier value returned by or sent to the API (`null` means unassigned / "Chưa xếp"). */
export type ApiSkillTier = 'S' | 'A' | 'B' | 'C' | 'D' | (string & {}) | null;

const VALID_TIERS = new Set<SkillTier>(['S', 'A', 'B', 'C', 'D']);

/** Maps a nullable API tier string to a UI `SkillTier` badge key (`'Mới'` for null/unknown). */
export function normalizeSkillTier(tier: string | null | undefined): SkillTier {
  if (!tier) return 'Mới';
  const upper = tier.trim().toUpperCase();
  if (VALID_TIERS.has(upper as SkillTier)) {
    return upper as SkillTier;
  }
  return 'Mới';
}

export interface ErrorResponse {
  error: string;
}

export interface ValidationErrorItem {
  msg?: string;
  path?: string;
  location?: string;
  value?: unknown;
}

export interface ValidationErrorResponse {
  errors: ValidationErrorItem[];
}

export type MembershipErrorCode = 'MEMBERSHIP_PENDING' | 'MEMBERSHIP_REJECTED';

export interface MembershipErrorResponse {
  code: MembershipErrorCode;
  error: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MessageResponse {
  message: string;
}
