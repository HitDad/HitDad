import type { SessionStatus } from '@/types';

const SHORT_WEEKDAYS = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'] as const;
const LONG_WEEKDAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const;

export interface SessionDateParts {
  dayNumber: string;
  monthNumber: number;
  year: number;
  monthKey: string;
  monthLabel: string;
  monthHeading: string;
  dateDisplay: string;
  slashDate: string;
  dayOfWeekShort: string;
  dayOfWeekLong: string;
  isoDateOnly: string;
}

/** Parses a VND numeric value from either a JS number or Prisma Decimal / formatted string. */
export function parseVndAmount(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;

    if (/^-?\d{1,3}(\.\d{3})+$/.test(trimmed)) {
      const normalized = Number(trimmed.replace(/\./g, ''));
      return Number.isFinite(normalized) ? normalized : 0;
    }

    if (/^-?\d{1,3}(,\d{3})+(?:\.\d+)?$/.test(trimmed)) {
      const normalized = Number(trimmed.replace(/,/g, ''));
      return Number.isFinite(normalized) ? normalized : 0;
    }

    const direct = Number(trimmed);
    if (Number.isFinite(direct)) return direct;

    const stripped = trimmed.replace(/[^\d.-]/g, '');
    const fallback = stripped ? Number(stripped) : Number.NaN;
    return Number.isFinite(fallback) ? fallback : 0;
  }
  if (value && typeof value === 'object') {
    const coerced = Number(String(value));
    return Number.isFinite(coerced) ? coerced : 0;
  }
  return 0;
}

/** Formats VND integer amount cleanly across Hermes/JSC/Web (e.g. `50000` -> `50.000đ`). */
export function formatVnd(amount: number | string | null | undefined): string {
  const rounded = Math.round(parseVndAmount(amount));
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${digits}đ`;
}

export function parseDateSafely(raw: string): Date | null {
  if (!raw) return null;
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.\d+)?Z)?$/);
  if (dateOnlyMatch) {
    const year = Number.parseInt(dateOnlyMatch[1], 10);
    const month = Number.parseInt(dateOnlyMatch[2], 10);
    const day = Number.parseInt(dateOnlyMatch[3], 10);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatSessionDateParts(isoDate: string): SessionDateParts {
  const parsed = parseDateSafely(isoDate);
  if (!parsed) {
    return {
      dayNumber: '--',
      monthNumber: 0,
      year: 0,
      monthKey: '',
      monthLabel: '',
      monthHeading: 'Khác',
      dateDisplay: '--.--',
      slashDate: '--/--',
      dayOfWeekShort: '',
      dayOfWeekLong: '',
      isoDateOnly: '',
    };
  }

  const year = parsed.getFullYear();
  const monthNumber = parsed.getMonth() + 1;
  const day = parsed.getDate();
  const dow = parsed.getDay();

  const dd = String(day).padStart(2, '0');
  const mm = String(monthNumber).padStart(2, '0');
  const currentYear = new Date().getFullYear();

  return {
    dayNumber: dd,
    monthNumber,
    year,
    monthKey: `${year}-${mm}`,
    monthLabel: `Th ${monthNumber}`,
    monthHeading: year === currentYear ? `Tháng ${monthNumber}` : `Tháng ${monthNumber}/${year}`,
    dateDisplay: `${dd}.${mm}`,
    slashDate: `${dd}/${mm}`,
    dayOfWeekShort: SHORT_WEEKDAYS[dow] ?? '',
    dayOfWeekLong: LONG_WEEKDAYS[dow] ?? '',
    isoDateOnly: `${year}-${mm}-${dd}`,
  };
}

export function formatTimeRange(startTime: string, endTime: string): string {
  if (!startTime && !endTime) return '--:--';
  if (!endTime) return startTime;
  return `${startTime} – ${endTime}`;
}

export function formatDeadlineLabel(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;

  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  return `Chốt lúc ${hh}:${min}, ${dd}/${mm}`;
}

export function formatRelativeTime(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs < 60_000) return 'Vừa xong';

  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins} phút`;

  const sameDay =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();

  const diffHours = Math.floor(diffMins / 60);
  if (sameDay && diffHours < 12) return `${diffHours} giờ`;

  if (sameDay || getNotificationDateGroup(isoDate) === 'Hôm qua') {
    const hh = String(parsed.getHours()).padStart(2, '0');
    const min = String(parsed.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  }

  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

export function getNotificationDateGroup(isoDate: string): 'Hôm nay' | 'Hôm qua' | 'Trước đó' {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'Trước đó';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfItem = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfItem) / 86_400_000);

  if (diffDays <= 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  return 'Trước đó';
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export interface SessionStatusMeta {
  label: string;
  tone: 'primary' | 'success' | 'neutral' | 'danger';
}

export function getSessionStatusMeta(status: SessionStatus, hasTeams = false): SessionStatusMeta {
  switch (status) {
    case 'VOTING':
      return { label: 'Đang vote giờ', tone: 'primary' };
    case 'CONFIRMED':
      return { label: 'Đã đủ người', tone: 'success' };
    case 'BOOKED':
      return { label: hasTeams ? 'Đã chia đội' : 'Đã chốt sân', tone: 'primary' };
    case 'COMPLETED':
      return { label: 'Đã đá', tone: 'neutral' };
    case 'CANCELLED':
      return { label: 'Đã huỷ', tone: 'danger' };
    default:
      return { label: status, tone: 'neutral' };
  }
}
