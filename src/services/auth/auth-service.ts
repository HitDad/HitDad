import type {
  AuthTokens,
  ForgotPasswordResetBody,
  ForgotPasswordSendOtpBody,
  ForgotPasswordSendOtpResponse,
  ForgotPasswordVerifyOtpBody,
  ForgotPasswordVerifyOtpResponse,
  LoginBody,
  LoginResponse,
  MeResponse,
  MessageResponse,
  RefreshTokenBody,
  RegisterBody,
  RegisterResponse,
  SendOtpBody,
  SendOtpResponse,
  VerifyOtpBody,
  VerifyOtpResponse,
} from '@/types';

import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

export const authService = {
  login: (body: LoginBody) =>
    apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, body, { auth: false }),

  register: (body: RegisterBody) =>
    apiClient.post<RegisterResponse>(API_ENDPOINTS.auth.register, body, { auth: false }),

  refresh: (body: RefreshTokenBody) =>
    apiClient.post<AuthTokens>(API_ENDPOINTS.auth.refresh, body, { auth: false }),

  getMe: () => apiClient.get<MeResponse>(API_ENDPOINTS.auth.me, { auth: true }),

  sendRegisterOtp: (body: SendOtpBody) =>
    apiClient.post<SendOtpResponse>(API_ENDPOINTS.auth.sendOtp, body, { auth: false }),

  verifyRegisterOtp: (body: VerifyOtpBody) =>
    apiClient.post<VerifyOtpResponse>(API_ENDPOINTS.auth.verifyOtp, body, { auth: false }),

  sendForgotPasswordOtp: (body: ForgotPasswordSendOtpBody) =>
    apiClient.post<ForgotPasswordSendOtpResponse>(
      API_ENDPOINTS.auth.forgotPasswordSendOtp,
      body,
      { auth: false },
    ),

  verifyForgotPasswordOtp: (body: ForgotPasswordVerifyOtpBody) =>
    apiClient.post<ForgotPasswordVerifyOtpResponse>(
      API_ENDPOINTS.auth.forgotPasswordVerifyOtp,
      body,
      { auth: false },
    ),

  resetForgotPassword: (body: ForgotPasswordResetBody) =>
    apiClient.post<MessageResponse>(API_ENDPOINTS.auth.forgotPasswordReset, body, { auth: false }),
};
