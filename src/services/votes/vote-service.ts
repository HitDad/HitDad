import type {
  AdminAdjustVoteBody,
  CastVoteBody,
  CastVoteResponse,
  MessageResponse,
  SessionVotesResponse,
  UpdateVoteBody,
  UpdateVoteResponse,
} from '@/types';

import { apiClient, API_ENDPOINTS } from '../api';

export const voteService = {
  cast: (body: CastVoteBody) =>
    apiClient.post<CastVoteResponse>(API_ENDPOINTS.votes.cast, body),

  update: (voteId: string, body: UpdateVoteBody) =>
    apiClient.put<UpdateVoteResponse>(API_ENDPOINTS.votes.update(voteId), body),

  getBySession: (sessionId: string) =>
    apiClient.get<SessionVotesResponse>(API_ENDPOINTS.votes.bySession(sessionId)),

  adminAdjust: (body: AdminAdjustVoteBody) =>
    apiClient.post<MessageResponse>(API_ENDPOINTS.votes.adminAdjust, body),
};
