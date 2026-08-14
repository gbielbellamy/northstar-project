import { describe, expect, it } from 'vitest';
import {
  addDays,
  currentWeekNumber,
  dayKeyOf,
  daysBetween,
  hoursBetween,
  isWeekday,
  minutesBetween,
  parseISO,
  toISO,
  todayISO,
  weekdaysSince,
} from './dates';
import type { RoadmapWeek } from '../types';

function week(n: number, start: string, end: string): RoadmapWeek {
  return {
    id: `rw-${n}`,
    week: n,
    start,
    end,
    theme: '',
    projectDirection: '',
    definitionOfDone: '',
    status: 'Not started',
    notes: '',
  };
}

describe('parseISO', () => {
  it('reads the date as local midnight, not UTC', () => {
    // new Date('2026-07-15') parses as UTC, which lands on the 14th west of
    // Greenwich. This is why the helper exists.
    const d = parseISO('2026-07-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });

  it('round-trips through toISO', () => {
    expect(toISO(parseISO('2026-02-28'))).toBe('2026-02-28');
    expect(toISO(parseISO('2026-12-31'))).toBe('2026-12-31');
  });
});

describe('addDays', () => {
  it('crosses a month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('goes backwards', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('survives a daylight-saving change', () => {
    // Clocks go forward in Europe on 29 March 2026.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
  });
});

describe('dayKeyOf', () => {
  it('treats Monday as the first day of the week', () => {
    expect(dayKeyOf('2026-08-03')).toBe('Mon');
    expect(dayKeyOf('2026-08-08')).toBe('Sat');
    expect(dayKeyOf('2026-08-09')).toBe('Sun');
  });
});

describe('daysBetween', () => {
  it('counts whole days forward', () => {
    expect(daysBetween('2026-08-03', '2026-08-13')).toBe(10);
  });

  it('is negative when the second date is earlier', () => {
    expect(daysBetween('2026-08-13', '2026-08-03')).toBe(-10);
  });

  it('is zero for the same day', () => {
    expect(daysBetween('2026-08-03', '2026-08-03')).toBe(0);
  });

  it('is not thrown off by a daylight-saving change', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });
});

describe('currentWeekNumber', () => {
  const roadmap = [
    week(1, '2026-08-03', '2026-08-09'),
    week(2, '2026-08-10', '2026-08-16'),
    week(3, '2026-08-17', '2026-08-23'),
  ];

  it('finds the week containing the date', () => {
    expect(currentWeekNumber(roadmap, '2026-08-12')).toBe(2);
  });

  it('includes both ends of the range', () => {
    expect(currentWeekNumber(roadmap, '2026-08-10')).toBe(2);
    expect(currentWeekNumber(roadmap, '2026-08-16')).toBe(2);
  });

  it('clamps to the first week before the programme starts', () => {
    expect(currentWeekNumber(roadmap, '2026-07-01')).toBe(1);
  });

  it('clamps to the last week after it ends', () => {
    expect(currentWeekNumber(roadmap, '2027-01-01')).toBe(3);
  });

  it('does not depend on the roadmap being sorted', () => {
    const shuffled = [roadmap[2], roadmap[0], roadmap[1]];
    expect(currentWeekNumber(shuffled, '2026-07-01')).toBe(1);
    expect(currentWeekNumber(shuffled, '2027-01-01')).toBe(3);
  });

  it('falls back to week one with no roadmap', () => {
    expect(currentWeekNumber([], '2026-08-12')).toBe(1);
  });
});

describe('time of day', () => {
  it('measures minutes between two clock times', () => {
    expect(minutesBetween('09:00', '12:45')).toBe(225);
  });

  it('measures hours, including fractions', () => {
    expect(hoursBetween('09:00', '12:45')).toBe(3.75);
    expect(hoursBetween('15:30', '15:45')).toBe(0.25);
  });
});

describe('weekdays', () => {
  it('knows Saturday and Sunday are not weekdays', () => {
    expect(isWeekday('2026-08-07')).toBe(true);
    expect(isWeekday('2026-08-08')).toBe(false);
    expect(isWeekday('2026-08-09')).toBe(false);
  });

  it('counts weekdays inclusive of both ends', () => {
    // Mon 3rd to Fri 7th August: five working days.
    expect(weekdaysSince('2026-08-03', '2026-08-07')).toBe(5);
  });

  it('skips the weekend in between', () => {
    // Mon 3rd to Mon 10th: five plus one, the weekend not counted.
    expect(weekdaysSince('2026-08-03', '2026-08-10')).toBe(6);
  });

  it('counts a single weekday as one', () => {
    expect(weekdaysSince('2026-08-03', '2026-08-03')).toBe(1);
  });
});

describe('todayISO', () => {
  it('prefers the override when one is set', () => {
    expect(todayISO('2026-01-01')).toBe('2026-01-01');
  });

  it('falls back to the real date', () => {
    expect(todayISO(null)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
