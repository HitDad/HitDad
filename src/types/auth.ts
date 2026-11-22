import type { ApiSkillTier } from './common';

/**
 * Auth, OTP registration, and password recovery contracts
 * matching `/api/auth/*` in CSE HitDad API v1.2.4.
 */

export type UserRole = 'ADMIN' | 'MEMBER';

export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  phone: string | null;
  bankInfo: string | null;
  role: UserRole;
  membershipStatus: MembershipStatus;
  tier: ApiSkillTier;
  isGoalkeeper: boolean;
  avatar: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Accepts username or email in `username`. */
export interface LoginBody {
  username: string;
  password: string;
}

export interface LoginResponse extends AuthTokens {
  message: string;
  user: AuthUser;
}

export interface RegisterBody {
  username: string;
  password: string;
  displayName: string;
  email: string;
  phone?: string;
  verificationToken: string;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export interface RefreshTokenBody {
  refreshToken: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface SendOtpBody {
  email: string;
  phone?: string;
  username?: string;
}

export interface SendOtpResponse {
  message: string;
  email: string;
}

export interface VerifyOtpBody {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  verificationToken: string;
  email: string;
}

export interface ForgotPasswordSendOtpBody {
  emailOrUsername: string;
}

export interface ForgotPasswordSendOtpResponse {
  message: string;
  email: string;
  maskedEmail: string;
}

export interface ForgotPasswordVerifyOtpBody {
  email: string;
  otp: string;
}

export interface ForgotPasswordVerifyOtpResponse {
  message: string;
  resetToken: string;
  email: string;
}

export interface ForgotPasswordResetBody {
  email: string;
  resetToken: string;
  newPassword: string;
}
