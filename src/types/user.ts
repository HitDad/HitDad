import type { AuthUser, UserRole } from './auth';
import type { ApiSkillTier } from './common';

/**
 * Member directory, membership approval, profile, avatar, and VietQR contracts
 * matching `/api/users/*` in CSE HitDad API v1.2.4.
 */

export interface UserSummary {
  id: string;
  displayName: string;
  avatar: string | null;
}

export interface UserMember {
  id: string;
  username: string;
  email?: string | null;
  displayName: string;
  role: UserRole;
  tier: ApiSkillTier;
  isGoalkeeper: boolean;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  _count?: {
    votes: number;
  };
}

export interface MembersListResponse {
  members: UserMember[];
}

export interface MembershipRequest {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  membershipStatus: 'PENDING';
}

export interface MembershipRequestsResponse {
  requests: MembershipRequest[];
}

export interface MembershipRequestsCountResponse {
  count: number;
}

export type ReviewMembershipDecision = 'APPROVED' | 'REJECTED';

export interface ReviewMembershipBody {
  decision: ReviewMembershipDecision;
}

export interface UpdateTierBody {
  tier: ApiSkillTier;
}

export interface UpdateTierResponse {
  message: string;
  user: Pick<UserMember, 'id' | 'username' | 'displayName' | 'role' | 'tier'>;
}

export interface UpdateGoalkeeperBody {
  isGoalkeeper: boolean;
}

export interface UpdateProfileBody {
  displayName: string;
  phone?: string;
  bankInfo?: string;
  isGoalkeeper?: boolean;
}

export interface UpdateProfileResponse {
  message: string;
  user: Omit<AuthUser, 'membershipStatus'>;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

/** `avatar` must be a Base64 data URI (PNG, JPEG, WebP, max 2MB). */
export interface UploadAvatarBody {
  avatar: string;
}

/** `qrCodeImage` must be a Base64 data URI (PNG, JPEG, WebP, max 2MB). */
export interface UploadQRCodeBody {
  qrCodeImage: string;
}

export interface UserQRCodeResponse {
  userId: string;
  displayName: string;
  qrCodeImage: string | null;
}
