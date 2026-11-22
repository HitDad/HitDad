import type { ApiSkillTier } from './common';
import type { UserSummary } from './user';

/**
 * Match sessions, time slots, voting, balanced team generation,
 * matchday attendance, and guest player contracts matching CSE HitDad API v1.2.4.
 */

export type SessionStatus = 'VOTING' | 'CONFIRMED' | 'BOOKED' | 'COMPLETED' | 'CANCELLED';

export type VoteStatus = 'JOIN' | 'DECLINE' | 'MAYBE';

export type AdminVoteStatus = VoteStatus | 'NONE';

export interface TimeSlotInput {
  startTime: string;
  endTime: string;
}

export interface TimeSlot {
  id: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  _count?: {
    votes: number;
  };
}

export interface TimeSlotVoteRef {
  timeSlotId: string;
}

export interface VoteItem {
  id: string;
  status: VoteStatus;
  votedAt: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  checkInNote: string | null;
  sessionId: string;
  userId: string;
  user?: UserSummary;
  timeSlotVotes?: TimeSlotVoteRef[];
}

export interface AbsenceLog {
  id: string;
  sessionId: string;
  userId: string;
  reason: string | null;
  reportedAt: string;
  isLate: boolean;
  minutesBeforeMatch: number | null;
}

export interface SessionPayer {
  id: string;
  displayName: string;
  bankInfo: string | null;
  phone: string | null;
  avatar: string | null;
}

export interface TeamPlayer {
  userId: string;
  displayName: string;
  avatar: string | null;
  tier: ApiSkillTier;
  tierScore: number;
  isGoalkeeper: boolean;
  votedAt?: string;
  voteOrder?: number;
}

export interface GeneratedTeam {
  name?: string;
  teamNumber?: number;
  players: TeamPlayer[];
  totalScore?: number;
  averageScore?: number;
  goalkeeperCount?: number;
  [key: string]: unknown;
}

export interface TeamBalanceResult {
  generatedAt: string;
  teamCount: number;
  totalVoters: number;
  activePlayersCount: number;
  reservesCount: number;
  teams: GeneratedTeam[];
  reserves: TeamPlayer[];
  variance: number;
}

export interface SessionDetail {
  id: string;
  title: string;
  playDate: string;
  startTime: string;
  endTime: string;
  location: string;
  googleMapsUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  totalCost: number | null;
  splitCount: number | null;
  status: SessionStatus;
  cancellationNote: string | null;
  teams: TeamBalanceResult | Record<string, unknown> | null;
  voteDeadline: string | null;
  isVoteLocked: boolean;
  voteLockedAt: string | null;
  selectedTimeSlotId: string | null;
  createdById: string;
  payerId: string | null;
  createdAt: string;
  createdBy?: UserSummary;
  payer?: SessionPayer | null;
  votes?: VoteItem[];
  timeSlots?: TimeSlot[];
  _count?: {
    votes: number;
  };
}

export type SessionDetailWithDebt = SessionDetail & {
  unpaidPreviousPayment?: Record<string, unknown> | null;
};

export interface SessionsListResponse {
  sessions: SessionDetail[];
}

export interface SessionDetailResponse {
  session: SessionDetailWithDebt;
}

export interface SessionMutationResponse {
  message: string;
  session: SessionDetail;
}

export interface CreateSessionBody {
  title: string;
  playDate: string;
  startTime: string;
  endTime: string;
  timeSlots?: TimeSlotInput[];
  location: string;
  googleMapsUrl?: string;
  minPlayers: number;
  maxPlayers: number;
  voteDeadline?: string;
}

export interface UpdateSessionBody {
  title?: string;
  playDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  googleMapsUrl?: string;
  minPlayers?: number;
  maxPlayers?: number;
  totalCost?: number;
  splitCount?: number;
  payerId?: string;
  status?: SessionStatus;
  voteDeadline?: string;
  cancellationNote?: string;
  timeSlots?: TimeSlotInput[];
  selectedTimeSlotId?: string;
}

export interface CancelSessionBody {
  cancellationNote?: string;
}

export interface AddTimeSlotResponse {
  message: string;
  timeSlot: TimeSlot;
}

export interface CastVoteBody {
  sessionId: string;
  status: 'JOIN' | 'DECLINE';
  reason?: string;
  timeSlotIds?: string[];
}

export interface CastVoteResponse {
  message: string;
  vote: VoteItem;
  sessionConfirmed: boolean;
  joinCount: number;
  absenceLog: AbsenceLog | null;
}

export interface UpdateVoteBody {
  status: 'JOIN' | 'DECLINE';
  reason?: string;
  timeSlotIds?: string[];
}

export interface UpdateVoteResponse {
  message: string;
  vote: VoteItem;
  absenceLog: AbsenceLog | null;
}

export interface AdminAdjustVoteBody {
  sessionId: string;
  userId: string;
  status: AdminVoteStatus;
  reason?: string;
  timeSlotIds?: string[];
}

export interface SessionVotesSummary {
  join: number;
  decline: number;
  maybe: number;
  total: number;
}

export interface SessionVotesResponse {
  votes: VoteItem[];
  summary: SessionVotesSummary;
}

export interface TeamSuggestionsResponse {
  totalJoin: number;
  memberCount: number;
  guestCount: number;
  suggestions: {
    recommended: number;
    available: number[];
  };
}

export interface GenerateTeamsBody {
  teamCount?: number;
  goalkeeperOverrides?: Record<string, boolean>;
  useAttendedOnly?: boolean;
}

export interface GenerateTeamsResponse {
  result: TeamBalanceResult;
}

export interface SaveTeamsBody {
  teams: TeamBalanceResult | Record<string, unknown>;
}

export type GuestStatus = 'RESERVE' | 'PLAYING';

export interface GuestPlayer {
  id: string;
  sessionId: string;
  name: string;
  phone: string | null;
  tier: ApiSkillTier;
  isGoalkeeper: boolean;
  status: GuestStatus;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  note: string | null;
  isPaid: boolean;
  addedAt: string;
}

export interface GuestBody {
  name?: string;
  phone?: string;
  tier?: string;
  isGoalkeeper?: boolean;
  status?: GuestStatus;
  isCheckedIn?: boolean;
  note?: string;
  isPaid?: boolean;
}

export type CreateGuestBody = GuestBody & {
  name: string;
};

export interface AttendanceSummary {
  totalVoters: number;
  joinedCount: number;
  maybeCount: number;
  declinedCount: number;
  attendedMembersCount: number;
  unattendedMembersCount: number;
  attendedGuestsCount: number;
  totalGuestsCount: number;
  reserveGuestsCount: number;
  playingGuestsCount: number;
  totalAttendedOnPitch: number;
  lateCancellationsCount: number;
  noShowsCount: number;
  totalWarningsCount: number;
  isMatchStarted: boolean;
  isVoteLocked: boolean;
  voteLockedAt: string | null;
  matchStartTime: string;
  minutesToMatch: number;
}

export interface AttendanceWarnings {
  lateCancellations: Record<string, unknown>[];
  noShows: Record<string, unknown>[];
}

export interface AttendanceDashboardResponse {
  session: SessionDetail;
  joined: VoteItem[];
  maybe: VoteItem[];
  declined: VoteItem[];
  guests: GuestPlayer[];
  absenceLogs: AbsenceLog[];
  warnings: AttendanceWarnings;
  summary: AttendanceSummary;
}

export interface MarkAttendanceBody {
  userId: string;
  isCheckedIn?: boolean;
  checkInNote?: string;
}

export interface MarkAttendanceResponse {
  message: string;
  vote: VoteItem;
}

export interface BulkAttendanceBody {
  isCheckedIn?: boolean;
}

export interface BulkAttendanceResponse {
  message: string;
  count: number;
}

export interface LockVoteBody {
  isLocked?: boolean;
}

export interface LockVoteResponse {
  message: string;
  isVoteLocked: boolean;
  voteLockedAt: string | null;
  session: SessionDetail;
}
