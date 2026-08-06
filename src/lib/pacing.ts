/**
 * Elastic scheduling. A block's weekday slot never moves — Monday 09:00 is
 * always Project — but which *content* (which week's goal, which roadmap
 * theme) counts as current for a given area on a given date can fall behind
 * if you skip a session. This module is the pure-function core of that: no
 * React, no store, just schedule + deferrals + programStart in, dates and
 * week numbers out.
 *
 * Two week-number concepts, kept deliberately separate:
 *  - "Nominal week" is pure elapsed time (`nominalWeek`) — it decides the
 *    physical template: which slot has which area, and template changes like
 *    Contributions phasing in at week 5 (`blockAppliesTo`). Never affected by
 *    lag.
 *  - "Content week" (`contentWeek`) is which WeeklyGoal is actually being
 *    worked on for a given area — this is what lags behind when sessions are
 *    skipped. Project's content week doubles as the roadmap's current week.
 */
import { addDays, dayKeyOf, isWeekday, weekdaysSince } from './dates';
import { blockAppliesTo, type Area, type Deferral, type ScheduleBlock } from '../types';

/** Pure elapsed time since the programme began — never affected by any lag. */
export function nominalWeek(programStart: string, date: string): number {
  return Math.max(1, Math.ceil(weekdaysSince(programStart, date) / 5));
}

/** How many of `area`'s slots exist in the given nominal week, per the template. */
export function sessionsPerNominalWeek(
  schedule: ScheduleBlock[],
  area: Area,
  week: number,
): number {
  return schedule.filter((b) => b.area === area && blockAppliesTo(b, week)).length;
}

/** How many sessions of `area` have been explicitly skipped and not undone. */
export function lagFor(deferrals: Deferral[], area: Area): number {
  return deferrals.filter((d) => d.area === area).length;
}

/**
 * How many times `area` has actually occurred, from `programStart` up to and
 * including `date`, per the template in force on each of those days.
 */
function occurrenceIndexUpTo(
  schedule: ScheduleBlock[],
  programStart: string,
  area: Area,
  date: string,
): number {
  let count = 0;
  let d = programStart;
  // A stretched plan is still only ever a handful of years of weekdays at
  // worst; a day-by-day walk is simple and cheap enough here.
  for (let guard = 0; guard < 20_000 && d <= date; guard++) {
    if (isWeekday(d)) {
      const week = nominalWeek(programStart, d);
      count += schedule.filter(
        (b) => b.area === area && b.day === dayKeyOf(d) && blockAppliesTo(b, week),
      ).length;
    }
    if (d === date) break;
    d = addDays(d, 1);
  }
  return count;
}

/** The calendar date of `area`'s Nth occurrence (1-based) after `programStart`. */
function occurrenceDate(
  schedule: ScheduleBlock[],
  programStart: string,
  area: Area,
  occurrenceIndex: number,
): string {
  if (occurrenceIndex < 1) return programStart;
  let count = 0;
  let d = programStart;
  for (let guard = 0; guard < 20_000; guard++) {
    if (isWeekday(d)) {
      const week = nominalWeek(programStart, d);
      count += schedule.filter(
        (b) => b.area === area && b.day === dayKeyOf(d) && blockAppliesTo(b, week),
      ).length;
      if (count >= occurrenceIndex) return d;
    }
    d = addDays(d, 1);
  }
  return d;
}

/**
 * Which week's goal is currently active for `area` on `date`. Falls behind
 * the nominal week whenever `area` has unrecovered skips.
 */
export function contentWeek(
  schedule: ScheduleBlock[],
  deferrals: Deferral[],
  programStart: string,
  area: Area,
  date: string,
): number {
  const occurred = occurrenceIndexUpTo(schedule, programStart, area, date);
  const target = occurred - lagFor(deferrals, area);
  if (target <= 0) return 1;

  let running = 0;
  for (let week = 1; week < 10_000; week++) {
    running += sessionsPerNominalWeek(schedule, area, week);
    if (running >= target) return week;
  }
  return 1;
}

/** Project's content week doubles as the roadmap's current week. */
export function currentRoadmapWeek(
  schedule: ScheduleBlock[],
  deferrals: Deferral[],
  programStart: string,
  today: string,
): number {
  return contentWeek(schedule, deferrals, programStart, 'Project', today);
}

/**
 * The computed Monday–Sunday date range for roadmap week `weekNumber`,
 * shifted later by however many Project sessions are currently unrecovered.
 * Replaces reading `RoadmapWeek.start/end` directly for display — `start` is
 * the calendar date of that week's first Project session, and `end` is six
 * days after it, matching the Monday/Sunday shape every call site expects.
 */
export function roadmapWeekRange(
  schedule: ScheduleBlock[],
  deferrals: Deferral[],
  programStart: string,
  weekNumber: number,
): { start: string; end: string } {
  let offset = 0;
  for (let w = 1; w < weekNumber; w++) {
    offset += sessionsPerNominalWeek(schedule, 'Project', w);
  }
  const lag = lagFor(deferrals, 'Project');
  const first = offset + lag + 1;
  const start = occurrenceDate(schedule, programStart, 'Project', first);
  return { start, end: addDays(start, 6) };
}
