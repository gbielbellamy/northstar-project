import type { DayKey, RoadmapWeek } from '../types';

export const DAY_KEYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DAY_NAMES: Record<DayKey, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

/** Parse an ISO date as *local* midnight. `new Date('2026-07-15')` is UTC and drifts a day. */
export function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(override?: string | null): string {
  return override ?? toISO(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function dayKeyOf(iso: string): DayKey {
  // getDay(): 0 = Sunday. Our week starts Monday.
  const idx = (parseISO(iso).getDay() + 6) % 7;
  return DAY_KEYS[idx];
}

export function fmtShort(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

export function fmtLong(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function fmtRange(startISO: string, endISO: string): string {
  return `${fmtShort(startISO)} – ${fmtShort(endISO)}`;
}

/** Whole days from `a` to `b`. Negative when `b` is earlier. */
export function daysBetween(aISO: string, bISO: string): number {
  const ms = parseISO(bISO).getTime() - parseISO(aISO).getTime();
  return Math.round(ms / 86_400_000);
}

/** The roadmap week containing `today`; clamped to the first/last week outside the range. */
export function currentWeekNumber(roadmap: RoadmapWeek[], today: string): number {
  if (roadmap.length === 0) return 1;
  const sorted = [...roadmap].sort((a, b) => a.week - b.week);
  const hit = sorted.find((w) => today >= w.start && today <= w.end);
  if (hit) return hit.week;
  if (today < sorted[0].start) return sorted[0].week;
  return sorted[sorted.length - 1].week;
}

/** Minutes between two "HH:MM" strings. */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function hoursBetween(start: string, end: string): number {
  return minutesBetween(start, end) / 60;
}

/** True for Mon–Fri, false for Sat/Sun. */
export function isWeekday(iso: string): boolean {
  const dow = parseISO(iso).getDay();
  return dow !== 0 && dow !== 6;
}

/** Weekdays elapsed from `startISO` to `dateISO` inclusive of both ends. */
export function weekdaysSince(startISO: string, dateISO: string): number {
  let count = 0;
  let d = parseISO(startISO);
  const end = parseISO(dateISO);
  while (d.getTime() <= end.getTime()) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d = new Date(d.getTime());
    d.setDate(d.getDate() + 1);
  }
  return count;
}
