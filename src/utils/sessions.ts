import type { SessionDetail, TimeSlot, TimeSlotVoteRef, VoteItem } from '@/types';

import { parseDateSafely } from './format';

const HHMM_PREFIX_REGEX = /^(\d{1,2}):(\d{2})/;
const DEFAULT_MATCH_DURATION_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SessionTimeWindow {
  startMs: number;
  endMs: number;
}

export function isActiveSession(session: SessionDetail): boolean {
  return session.status === 'VOTING' || session.status === 'CONFIRMED' || session.status === 'BOOKED';
}

export function isPastSession(session: SessionDetail): boolean {
  return session.status === 'COMPLETED' || session.status === 'CANCELLED';
}

function parseHoursMinutes(raw: string | undefined | null): { hours: number; minutes: number } | null {
  if (!raw) return null;
  const match = raw.trim().match(HHMM_PREFIX_REGEX);
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function getCreatedAtMs(session: SessionDetail): number {
  const ms = new Date(session.createdAt).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Computes the local start and end timestamp window for a session using `playDate` combined with
 * `selectedTimeSlotId` (when matched) or the earliest kickoff / latest end across `startTime`,
 * `endTime`, and `timeSlots`.
 */
export function getSessionTimeWindow(session: SessionDetail): SessionTimeWindow | null {
  const baseDate = parseDateSafely(session.playDate);
  if (!baseDate) return null;

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();

  const matchedSlot = session.selectedTimeSlotId
    ? session.timeSlots?.find((slot) => slot.id === session.selectedTimeSlotId)
    : undefined;

  const timePairs: { startTime?: string; endTime?: string }[] = matchedSlot
    ? [
        {
          startTime: matchedSlot.startTime || session.startTime,
          endTime: matchedSlot.endTime || session.endTime,
        },
      ]
    : [
        { startTime: session.startTime, endTime: session.endTime },
        ...(session.timeSlots ?? []).map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      ];

  const startTimestamps: number[] = [];
  for (const pair of timePairs) {
    const parsedStart = parseHoursMinutes(pair.startTime);
    if (parsedStart) {
      startTimestamps.push(
        new Date(year, month, day, parsedStart.hours, parsedStart.minutes, 0, 0).getTime(),
      );
    }
  }

  const dayStartMs = new Date(year, month, day, 0, 0, 0, 0).getTime();
  const hasAnyStart = startTimestamps.length > 0;
  const startMs = hasAnyStart ? Math.min(...startTimestamps) : dayStartMs;

  const endTimestamps: number[] = [];
  for (const pair of timePairs) {
    const parsedEnd = parseHoursMinutes(pair.endTime);
    if (!parsedEnd) continue;
    let candidateEndMs = new Date(
      year,
      month,
      day,
      parsedEnd.hours,
      parsedEnd.minutes,
      0,
      0,
    ).getTime();
    const parsedStart = parseHoursMinutes(pair.startTime);
    const pairStartMs = parsedStart
      ? new Date(year, month, day, parsedStart.hours, parsedStart.minutes, 0, 0).getTime()
      : startMs;
    if (candidateEndMs < pairStartMs) {
      candidateEndMs += DAY_MS;
    }
    endTimestamps.push(candidateEndMs);
  }

  if (!hasAnyStart && endTimestamps.length === 0) {
    return {
      startMs: dayStartMs,
      endMs: new Date(year, month, day, 23, 59, 59, 999).getTime(),
    };
  }

  const endMs =
    endTimestamps.length > 0 ? Math.max(...endTimestamps) : startMs + DEFAULT_MATCH_DURATION_MS;

  return { startMs, endMs };
}

/** Returns `true` when the session has a valid date/time window whose end has already passed. */
export function isSessionPastByTime(session: SessionDetail, nowMs = Date.now()): boolean {
  const window = getSessionTimeWindow(session);
  return window !== null && window.endMs < nowMs;
}

/** Returns `true` for matches that belong in the "Đã đá" tab (completed, cancelled, or past-dated). */
export function isDoneSession(session: SessionDetail, nowMs = Date.now()): boolean {
  return isPastSession(session) || isSessionPastByTime(session, nowMs);
}

/** Returns `true` for active matches that are ongoing or scheduled in the future. */
export function isUpcomingSession(session: SessionDetail, nowMs = Date.now()): boolean {
  return isActiveSession(session) && !isSessionPastByTime(session, nowMs);
}

/**
 * Orders active sessions so ongoing or nearest upcoming matches always appear first (asc),
 * followed by stale past-dated active matches (most recent first), and invalid dates last.
 */
export function sortUpcomingSessions(
  sessions: SessionDetail[],
  nowMs = Date.now(),
): SessionDetail[] {
  const futureOrOngoing: { session: SessionDetail; window: SessionTimeWindow }[] = [];
  const pastActive: { session: SessionDetail; window: SessionTimeWindow }[] = [];
  const invalid: SessionDetail[] = [];

  for (const session of sessions) {
    const window = getSessionTimeWindow(session);
    if (!window) {
      invalid.push(session);
    } else if (window.endMs >= nowMs) {
      futureOrOngoing.push({ session, window });
    } else {
      pastActive.push({ session, window });
    }
  }

  futureOrOngoing.sort((a, b) => {
    if (a.window.startMs !== b.window.startMs) return a.window.startMs - b.window.startMs;
    if (a.window.endMs !== b.window.endMs) return a.window.endMs - b.window.endMs;
    return getCreatedAtMs(b.session) - getCreatedAtMs(a.session);
  });

  pastActive.sort((a, b) => {
    if (b.window.startMs !== a.window.startMs) return b.window.startMs - a.window.startMs;
    if (b.window.endMs !== a.window.endMs) return b.window.endMs - a.window.endMs;
    return getCreatedAtMs(b.session) - getCreatedAtMs(a.session);
  });

  invalid.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));

  return [
    ...futureOrOngoing.map((entry) => entry.session),
    ...pastActive.map((entry) => entry.session),
    ...invalid,
  ];
}

/**
 * Orders past sessions newest-first by local kickoff time, placing invalid dates last.
 */
export function sortPastSessions(sessions: SessionDetail[]): SessionDetail[] {
  const valid: { session: SessionDetail; window: SessionTimeWindow }[] = [];
  const invalid: SessionDetail[] = [];

  for (const session of sessions) {
    const window = getSessionTimeWindow(session);
    if (window) {
      valid.push({ session, window });
    } else {
      invalid.push(session);
    }
  }

  valid.sort((a, b) => {
    if (b.window.startMs !== a.window.startMs) return b.window.startMs - a.window.startMs;
    if (b.window.endMs !== a.window.endMs) return b.window.endMs - a.window.endMs;
    return getCreatedAtMs(b.session) - getCreatedAtMs(a.session);
  });

  invalid.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));

  return [...valid.map((entry) => entry.session), ...invalid];
}

/**
 * Strictly partitions sessions into sorted `upcoming` ("Sắp tới") and `done` ("Đã đá") lists so
 * every past-dated, completed, or cancelled session lands in `done` with zero duplicates or gaps.
 */
export function partitionScheduleSessions(
  sessions: SessionDetail[],
  nowMs = Date.now(),
): { upcoming: SessionDetail[]; done: SessionDetail[] } {
  const upcomingRaw: SessionDetail[] = [];
  const doneRaw: SessionDetail[] = [];

  for (const session of sessions) {
    if (isDoneSession(session, nowMs)) {
      doneRaw.push(session);
    } else if (isUpcomingSession(session, nowMs)) {
      upcomingRaw.push(session);
    } else {
      doneRaw.push(session);
    }
  }

  return {
    upcoming: sortUpcomingSessions(upcomingRaw, nowMs),
    done: sortPastSessions(doneRaw),
  };
}

function readPositiveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  return null;
}

/**
 * Extracts unique time-slot IDs from a `VoteItem`'s `timeSlotVotes`, handling flat IDs,
 * string entries, and nested `timeSlot: { id }` relations.
 */
export function extractTimeSlotIdsFromVote(vote: VoteItem | null | undefined): string[] {
  const rawEntries = vote?.timeSlotVotes as (TimeSlotVoteRef | string)[] | undefined;
  if (!Array.isArray(rawEntries) || rawEntries.length === 0) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of rawEntries) {
    let slotId = '';
    if (typeof entry === 'string') {
      slotId = entry.trim();
    } else if (entry && typeof entry === 'object') {
      slotId = (entry.timeSlotId ?? entry.timeSlot?.id ?? '').trim();
    }

    if (slotId && !seen.has(slotId)) {
      seen.add(slotId);
      result.push(slotId);
    }
  }

  return result;
}

/**
 * Merges votes from `GET /api/votes/session/{sessionId}` (`primaryVotes`) and
 * `GET /api/sessions/{id}` (`sessionVotes`), preserving `timeSlotVotes` when present in either.
 */
export function mergeSessionVotes(
  primaryVotes: VoteItem[],
  sessionVotes?: VoteItem[],
): VoteItem[] {
  const merged: VoteItem[] = [];

  const upsert = (vote: VoteItem, preferExistingSlotsOnEmpty: boolean) => {
    const existingIndex = merged.findIndex(
      (entry) =>
        (Boolean(entry.id) && Boolean(vote.id) && entry.id === vote.id) ||
        (Boolean(entry.userId) && Boolean(vote.userId) && entry.userId === vote.userId),
    );

    if (existingIndex === -1) {
      merged.push(vote);
      return;
    }

    const existing = merged[existingIndex];
    const nextSlots = extractTimeSlotIdsFromVote(vote);
    const prevSlots = extractTimeSlotIdsFromVote(existing);

    merged[existingIndex] = {
      ...existing,
      ...vote,
      isCheckedIn: Boolean(vote.isCheckedIn ?? existing.isCheckedIn),
      timeSlotVotes:
        preferExistingSlotsOnEmpty && nextSlots.length === 0 && prevSlots.length > 0
          ? existing.timeSlotVotes
          : vote.timeSlotVotes ?? existing.timeSlotVotes,
    };
  };

  for (const sv of sessionVotes ?? []) {
    upsert(sv, false);
  }
  for (const pv of primaryVotes) {
    upsert(pv, true);
  }

  return merged;
}

/**
 * Resolves a slot's vote count directly from slot relations or `_count` fields when per-vote
 * `timeSlotVotes` mappings are not present on the fetched votes array.
 */
export function getTimeSlotFallbackCount(
  slot: TimeSlot,
  joinVoteIds?: Set<string>,
  joinUserIds?: Set<string>,
  hasVotesList = false,
): number {
  const slotEntries = slot.votes ?? slot.timeSlotVotes;
  if (Array.isArray(slotEntries)) {
    const uniqueVoters = new Set<string>();

    slotEntries.forEach((entry, index) => {
      const explicitStatus = entry.vote?.status;
      if (explicitStatus && explicitStatus !== 'JOIN') {
        return;
      }

      const voteId = entry.vote?.id ?? entry.voteId;
      const userId = entry.vote?.userId ?? entry.userId;

      if (hasVotesList && !explicitStatus && (voteId || userId)) {
        const isJoinVote = Boolean(voteId && joinVoteIds?.has(voteId));
        const isJoinUser = Boolean(userId && joinUserIds?.has(userId));
        if (!isJoinVote && !isJoinUser) {
          return;
        }
      }

      const dedupeKey = userId || voteId || entry.id || `idx:${index}`;
      uniqueVoters.add(dedupeKey);
    });

    return uniqueVoters.size;
  }

  return (
    readPositiveNumber(slot._count?.votes) ??
    readPositiveNumber(slot._count?.timeSlotVotes) ??
    readPositiveNumber(slot.votesCount) ??
    readPositiveNumber(slot.voteCount) ??
    0
  );
}

/**
 * Derives authoritative per-slot `JOIN` vote counts for each time slot in a match session,
 * preferring deduplicated `JOIN` voters from merged votes over un-filtered backend counters.
 */
export function resolveTimeSlotVoteCounts(
  timeSlots: TimeSlot[],
  primaryVotes: VoteItem[],
  sessionVotes?: VoteItem[],
): Record<string, number> {
  const mergedVotes = mergeSessionVotes(primaryVotes, sessionVotes);
  const joinVoteIds = new Set<string>();
  const joinUserIds = new Set<string>();
  const joinCountsBySlot = new Map<string, Set<string>>();
  let anyVoteHasSlotSelections = false;

  for (const vote of mergedVotes) {
    const slotIds = extractTimeSlotIdsFromVote(vote);
    if (slotIds.length > 0) {
      anyVoteHasSlotSelections = true;
    }
    if (vote.status !== 'JOIN') continue;

    if (vote.id) joinVoteIds.add(vote.id);
    if (vote.userId) joinUserIds.add(vote.userId);

    const voterKey = vote.userId || vote.id;
    if (!voterKey) continue;

    for (const slotId of slotIds) {
      let voters = joinCountsBySlot.get(slotId);
      if (!voters) {
        voters = new Set<string>();
        joinCountsBySlot.set(slotId, voters);
      }
      voters.add(voterKey);
    }
  }

  const maxJoiners = Math.max(joinUserIds.size, joinVoteIds.size);
  const hasVotesList = mergedVotes.length > 0;
  const counts: Record<string, number> = {};

  for (const slot of timeSlots) {
    if (hasVotesList && maxJoiners === 0) {
      counts[slot.id] = 0;
    } else if (anyVoteHasSlotSelections) {
      counts[slot.id] = joinCountsBySlot.get(slot.id)?.size ?? 0;
    } else {
      const fallback = getTimeSlotFallbackCount(slot, joinVoteIds, joinUserIds, hasVotesList);
      counts[slot.id] = hasVotesList ? Math.min(fallback, maxJoiners) : fallback;
    }
  }

  return counts;
}
