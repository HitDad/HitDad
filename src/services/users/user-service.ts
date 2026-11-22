import type { UserQRCodeResponse } from '@/types';

import { apiClient, API_ENDPOINTS } from '../api';

export const userService = {
  getQrCode: (userId: string) =>
    apiClient.get<UserQRCodeResponse>(API_ENDPOINTS.users.userQrCode(userId)),
};
