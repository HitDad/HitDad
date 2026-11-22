import type {
  AddTimeSlotResponse,
  CancelSessionBody,
  CreateSessionBody,
  LockVoteBody,
  LockVoteResponse,
  MessageResponse,
  SessionDetailResponse,
  SessionMutationResponse,
  SessionsListResponse,
  SessionStatus,
  TimeSlotInput,
  UpdateSessionBody,
} from '@/types';

import { apiClient, API_ENDPOINTS } from '../api';

export const sessionService = {
  list: (status?: SessionStatus) =>
    apiClient.get<SessionsListResponse>(API_ENDPOINTS.sessions.list, {
      query: status ? { status } : undefined,
    }),

  getDetail: (id: string) =>
    apiClient.get<SessionDetailResponse>(API_ENDPOINTS.sessions.detail(id)),

  create: (body: CreateSessionBody) =>
    apiClient.post<SessionMutationResponse>(API_ENDPOINTS.sessions.create, body),

  update: (id: string, body: UpdateSessionBody) =>
    apiClient.put<SessionMutationResponse>(API_ENDPOINTS.sessions.update(id), body),

  cancel: (id: string, body?: CancelSessionBody) =>
    apiClient.delete<MessageResponse>(API_ENDPOINTS.sessions.cancel(id), {
      body: body ?? {},
    }),

  addTimeSlot: (id: string, body: TimeSlotInput) =>
    apiClient.post<AddTimeSlotResponse>(API_ENDPOINTS.sessions.addTimeSlot(id), body),

  lockVote: (id: string, body?: LockVoteBody) =>
    apiClient.post<LockVoteResponse>(API_ENDPOINTS.attendance.lockVote(id), body ?? {}),
};
