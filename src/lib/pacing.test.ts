import { describe, expect, it } from 'vitest';
import {
  contentWeek,
  currentRoadmapWeek,
  lagFor,
  nominalWeek,
  roadmapWeekRange,
  sessionsPerNominalWeek,
} from './pacing';
import type { Area, Deferral, DayKey, ScheduleBlock } from '../types';

/** Monday 3 August 2026 — the same Monday the app's own plan starts on. */
const START = '2026-08-03';

function block(id: string, day: DayKey, area: Area | null, extra: Partial<ScheduleBlock> = {}): ScheduleBlock {
  return {
    id,
    day,
    start: '09:00',
    end: '10:00',
    area,
    label: id,
    optional: false,
    fromWeek: null,
    toWeek: null,
    ...extra,
  };
}

function deferral(area: Area, date = START, blockId = 'x'): Deferral {
  return { id: `df-${Math.random()}`, date, blockId, area };
}

/** Project three mornings a week, contributions twice — the app's own shape. */
const SCHEDULE: ScheduleBlock[] = [
  block('mon-proj', 'Mon', 'Project'),
  block('tue-oss', 'Tue', 'Contributions'),
  block('wed-proj', 'Wed', 'Project'),
  block('thu-oss', 'Thu', 'Contributions'),
  block('fri-proj', 'Fri', 'Project'),
  block('mon-lunch', 'Mon', null),
];

describe('nominalWeek', () => {
  it('is week one on the first day', () => {
    expect(nominalWeek(START, START)).toBe(1);
  });

  it('stays in week one all the way to Friday', () => {
    expect(nominalWeek(START, '2026-08-07')).toBe(1);
  });

  it('rolls over on the next Monday', () => {
    expect(nominalWeek(START, '2026-08-10')).toBe(2);
  });

  it('never goes below one, even before the programme starts', () => {
    expect(nominalWeek(START, '2026-07-01')).toBe(1);
  });
});

describe('sessionsPerNominalWeek', () => {
  it('counts a single area across the week', () => {
    expect(sessionsPerNominalWeek(SCHEDULE, 'Project', 1)).toBe(3);
    expect(sessionsPerNominalWeek(SCHEDULE, 'Contributions', 1)).toBe(2);
  });

  it('respects a block that only applies from a later week', () => {
    const phased = [...SCHEDULE, block('fri-oss', 'Fri', 'Contributions', { fromWeek: 5 })];
    expect(sessionsPerNominalWeek(phased, 'Contributions', 4)).toBe(2);
    expect(sessionsPerNominalWeek(phased, 'Contributions', 5)).toBe(3);
  });
});

describe('lagFor', () => {
  it('counts only the skips for that area', () => {
    const deferrals = [deferral('Project'), deferral('Project'), deferral('Contributions')];
    expect(lagFor(deferrals, 'Project')).toBe(2);
    expect(lagFor(deferrals, 'Contributions')).toBe(1);
    expect(lagFor(deferrals, 'Learning')).toBe(0);
  });
});

describe('contentWeek', () => {
  it('keeps pace with the calendar when nothing is skipped', () => {
    // Third Project session of week one falls on the Friday.
    expect(contentWeek(SCHEDULE, [], START, 'Project', '2026-08-07')).toBe(1);
    // The following Friday is the sixth, so still exactly on schedule.
    expect(contentWeek(SCHEDULE, [], START, 'Project', '2026-08-14')).toBe(2);
  });

  it('falls behind by a whole week once a week of sessions is skipped', () => {
    const skipped = [deferral('Project'), deferral('Project'), deferral('Project')];
    expect(contentWeek(SCHEDULE, skipped, START, 'Project', '2026-08-14')).toBe(1);
  });

  it('lags for the skipped area only', () => {
    const skipped = [deferral('Project'), deferral('Project'), deferral('Project')];
    expect(contentWeek(SCHEDULE, skipped, START, 'Contributions', '2026-08-14')).toBe(2);
  });

  it('never drops below week one, however much is skipped', () => {
    const skipped = Array.from({ length: 20 }, () => deferral('Project'));
    expect(contentWeek(SCHEDULE, skipped, START, 'Project', '2026-08-07')).toBe(1);
  });

  it('recovers when the skip is undone', () => {
    const skipped = [deferral('Project')];
    const behind = contentWeek(SCHEDULE, skipped, START, 'Project', '2026-08-10');
    const restored = contentWeek(SCHEDULE, [], START, 'Project', '2026-08-10');
    expect(behind).toBeLessThanOrEqual(restored);
    expect(restored).toBe(2);
  });
});

describe('roadmapWeekRange', () => {
  it('starts week one on the first Project session', () => {
    expect(roadmapWeekRange(SCHEDULE, [], START, 1)).toEqual({
      start: '2026-08-03',
      end: '2026-08-09',
    });
  });

  it('runs Monday to Sunday', () => {
    expect(roadmapWeekRange(SCHEDULE, [], START, 2)).toEqual({
      start: '2026-08-10',
      end: '2026-08-16',
    });
  });

  it('pushes every later week out when Project falls behind', () => {
    // One skip moves the start to the next session: Wednesday, not Monday.
    const shifted = roadmapWeekRange(SCHEDULE, [deferral('Project')], START, 1);
    expect(shifted.start).toBe('2026-08-05');
    expect(shifted.end).toBe('2026-08-11');
  });

  it('is not moved by a skip in another area', () => {
    const untouched = roadmapWeekRange(SCHEDULE, [deferral('Contributions')], START, 1);
    expect(untouched.start).toBe('2026-08-03');
  });
});

describe('currentRoadmapWeek', () => {
  it("follows Project's content week", () => {
    expect(currentRoadmapWeek(SCHEDULE, [], START, '2026-08-14')).toBe(2);
  });

  it('stays behind while Project has unrecovered skips', () => {
    const skipped = [deferral('Project'), deferral('Project'), deferral('Project')];
    expect(currentRoadmapWeek(SCHEDULE, skipped, START, '2026-08-14')).toBe(1);
  });
});
