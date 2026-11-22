import { formatSessionDateParts } from './format';

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

export const HOURS_OPTIONS = Array.from({ length: 24 }, (_, idx) =>
  String(idx).padStart(2, '0'),
);

export const MINUTES_OPTIONS = Array.from({ length: 12 }, (_, idx) =>
  String(idx * 5).padStart(2, '0'),
);

export const QUICK_TIME_PRESETS = [
  '07:00',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
] as const;

export interface CalendarDayCell {
  iso: string;
  day: number;
  isToday: boolean;
}

/** Formats a local `Date` as `YYYY-MM-DD`. */
export function toIsoDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Parses strict `YYYY-MM-DD` as a valid local calendar `Date`, rejecting invalid dates like Feb 31. */
export function parseIsoDateOnly(raw: string): Date | null {
  const match = raw.trim().match(ISO_DATE_REGEX);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

/** Returns local `YYYY-MM-DD` shifted by `offsetDays` from today. */
export function getRelativeIsoDate(offsetDays: number, baseDate = new Date()): string {
  const target = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + offsetDays,
  );
  return toIsoDateString(target);
}

/** Returns the next occurrence (excluding today) of `targetDayOfWeek` (`0`=Sun..`6`=Sat). */
export function getUpcomingWeekdayDate(targetDayOfWeek: number, baseDate = new Date()): string {
  const currentDay = baseDate.getDay();
  let diff = (targetDayOfWeek - currentDay + 7) % 7;
  if (diff === 0) diff = 7;
  return getRelativeIsoDate(diff, baseDate);
}

/**
 * Builds Monday-first 7-column calendar cells for the given year & zero-based month,
 * padded with leading/trailing `null`s so total length is always a multiple of 7.
 */
export function buildCalendarMonthCells(
  year: number,
  monthIndex: number,
  todayIso = toIsoDateString(new Date()),
): (CalendarDayCell | null)[] {
  const firstWeekdaySun0 = new Date(year, monthIndex, 1).getDay();
  const leadingBlanks = (firstWeekdaySun0 + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (CalendarDayCell | null)[] = [];
  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toIsoDateString(new Date(year, monthIndex, day));
    cells.push({
      iso,
      day,
      isToday: iso === todayIso,
    });
  }

  const trailingBlanks = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < trailingBlanks; i += 1) {
    cells.push(null);
  }

  return cells;
}

/** Formats `YYYY-MM-DD` into readable Vietnamese display (e.g. `Thứ Tư, 25/11/2026`). */
export function formatReadableDate(isoDate: string, compact = false): string {
  const parsed = parseIsoDateOnly(isoDate);
  if (!parsed) return '';

  const parts = formatSessionDateParts(isoDate);
  const weekday = compact ? parts.dayOfWeekShort : parts.dayOfWeekLong;
  return weekday ? `${weekday}, ${parts.slashDate}/${parts.year}` : `${parts.slashDate}/${parts.year}`;
}

/** Splits `"YYYY-MM-DD HH:mm"` (or ISO-like string) into `{ date, time }`. */
export function splitDeadlineValue(deadline: string): { date: string; time: string } {
  const trimmed = deadline.trim();
  if (!trimmed) return { date: '', time: '' };

  const tokens = trimmed.split(/[\sT]+/).filter(Boolean);
  let date = '';
  let time = '';

  for (const token of tokens) {
    if (!date && parseIsoDateOnly(token)) {
      date = token;
    } else if (!time && HHMM_REGEX.test(token.slice(0, 5))) {
      time = token.slice(0, 5);
    }
  }

  return { date, time };
}

/** Combines `date` (`YYYY-MM-DD`) and `time` (`HH:mm`, defaults to `20:00`) into `"YYYY-MM-DD HH:mm"`. */
export function combineDeadlineValue(date: string, time: string): string {
  const trimmedDate = date.trim();
  if (!trimmedDate) return '';

  const trimmedTime = time.trim();
  const safeTime = HHMM_REGEX.test(trimmedTime) ? trimmedTime : '20:00';
  return `${trimmedDate} ${safeTime}`;
}

function parseHhmmMinutes(hhmm: string): number | null {
  const match = hhmm.trim().match(HHMM_REGEX);
  if (!match) return null;
  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

/** Compares two `HH:mm` values chronologically. */
export function compareHhmm(a: string, b: string): number {
  const minA = parseHhmmMinutes(a);
  const minB = parseHhmmMinutes(b);
  if (minA !== null && minB !== null) {
    return minA - minB;
  }
  return a.localeCompare(b);
}

/** Returns an `HH:mm` end time `durationMinutes` after `startTime`, capped at `23:45`. */
export function suggestEndTime(startTime: string, durationMinutes = 90): string {
  const startMin = parseHhmmMinutes(startTime);
  if (startMin === null) return '20:00';

  const capped = Math.min(23 * 60 + 45, startMin + durationMinutes);
  const hours = String(Math.floor(capped / 60)).padStart(2, '0');
  const mins = String(capped % 60).padStart(2, '0');
  return `${hours}:${mins}`;
}
