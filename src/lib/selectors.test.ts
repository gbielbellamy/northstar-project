import { describe, expect, it } from 'vitest';
import { completionPct, daysSinceApplied, funnel, goalsForWeek, outreachStats } from './selectors';
import type {
  Application,
  ApplicationStatus,
  Contact,
  ContactStatus,
  Status,
  WeeklyGoal,
} from '../types';

const TODAY = '2026-08-06';

function app(status: ApplicationStatus, extra: Partial<Application> = {}): Application {
  return {
    id: `ap-${Math.random()}`,
    company: 'Acme',
    role: 'Developer',
    family: 'Full-Stack SWE',
    status,
    url: '',
    location: '',
    salary: '',
    week: 1,
    dateFound: '2026-08-01',
    deadline: '',
    dateApplied: '2026-08-03',
    followup: '',
    interviewStage: '',
    resumeVersion: '',
    contact: '',
    nextAction: '',
    result: '',
    notes: '',
    ...extra,
  };
}

function contact(status: ContactStatus, extra: Partial<Contact> = {}): Contact {
  return {
    id: `ct-${Math.random()}`,
    company: 'Acme',
    person: '',
    targetProfile: '',
    contactType: 'Peer contact',
    status,
    searchUrl: '',
    companyUrl: '',
    link: '',
    angle: '',
    week: 1,
    lastContact: '',
    dateSent: '',
    followup: '',
    meeting: '',
    nextAction: '',
    notes: '',
    ...extra,
  };
}

function goal(week: number, status: Status): WeeklyGoal {
  return {
    id: `g-${week}-${Math.random()}`,
    week,
    area: 'Project',
    title: '',
    detail: '',
    definitionOfDone: '',
    status,
    priority: 'High',
    plannedHours: 1,
    evidenceUrl: '',
    notes: '',
  };
}

describe('completionPct', () => {
  it('is zero with no goals, rather than dividing by zero', () => {
    expect(completionPct([])).toBe(0);
    expect(completionPct([goal(1, 'Done')], 2)).toBe(0);
  });

  it('counts only Done', () => {
    const goals = [goal(1, 'Done'), goal(1, 'In progress'), goal(1, 'Blocked'), goal(1, 'Done')];
    expect(completionPct(goals)).toBe(50);
  });

  it('narrows to one week when asked', () => {
    const goals = [goal(1, 'Done'), goal(2, 'Not started')];
    expect(completionPct(goals, 1)).toBe(100);
    expect(completionPct(goals, 2)).toBe(0);
  });

  it('rounds to whole percent', () => {
    expect(completionPct([goal(1, 'Done'), goal(1, 'Done'), goal(1, 'Not started')])).toBe(67);
  });
});

describe('goalsForWeek', () => {
  it('returns only that week', () => {
    const goals = [goal(1, 'Done'), goal(2, 'Done'), goal(1, 'Done')];
    expect(goalsForWeek(goals, 1)).toHaveLength(2);
  });
});

describe('funnel', () => {
  it('reports nothing sent as a null rate, not zero percent', () => {
    // Zero would wrongly read as "sent, and nobody replied".
    const f = funnel([app('Saved'), app('Preparing')], TODAY);
    expect(f.total).toBe(2);
    expect(f.sent).toBe(0);
    expect(f.responseRate).toBeNull();
  });

  it('counts anything out the door as sent', () => {
    const f = funnel(
      [
        app('Saved'),
        app('Preparing'),
        app('Applied'),
        app('Interviewing'),
        app('Offer'),
        app('Rejected'),
        app('Ghosted'),
      ],
      TODAY,
    );
    expect(f.sent).toBe(5);
  });

  it('counts a rejection as a response', () => {
    // The rate measures replies, not outcomes.
    const f = funnel([app('Applied'), app('Rejected'), app('Interviewing'), app('Offer')], TODAY);
    expect(f.responded).toBe(3);
    expect(f.responseRate).toBe(75);
  });

  it('does not count a ghosting as a response', () => {
    const f = funnel([app('Applied'), app('Ghosted')], TODAY);
    expect(f.responded).toBe(0);
    expect(f.responseRate).toBe(0);
  });

  it('counts only interviews and offers as live', () => {
    const f = funnel([app('Interviewing'), app('Offer'), app('Applied'), app('Rejected')], TODAY);
    expect(f.active).toBe(2);
    expect(f.interviewing).toBe(1);
    expect(f.offers).toBe(1);
  });

  describe('follow-ups due', () => {
    it('counts one that has come due', () => {
      const f = funnel([app('Applied', { followup: '2026-08-05' })], TODAY);
      expect(f.followupsDue).toBe(1);
    });

    it('counts one due today', () => {
      expect(funnel([app('Applied', { followup: TODAY })], TODAY).followupsDue).toBe(1);
    });

    it('ignores one still in the future', () => {
      expect(funnel([app('Applied', { followup: '2026-08-20' })], TODAY).followupsDue).toBe(0);
    });

    it('ignores an application with no follow-up set', () => {
      expect(funnel([app('Applied', { followup: '' })], TODAY).followupsDue).toBe(0);
    });

    it('never chases a conversation that is already over', () => {
      // Ghosted included: a follow-up that can never be cleared is noise.
      const closed = (['Offer', 'Rejected', 'Withdrawn', 'Ghosted'] as const).map((s) =>
        app(s, { followup: '2026-08-01' }),
      );
      expect(funnel(closed, TODAY).followupsDue).toBe(0);
    });
  });
});

describe('daysSinceApplied', () => {
  it('is null when it has not gone out', () => {
    expect(daysSinceApplied(app('Saved', { dateApplied: '' }), TODAY)).toBeNull();
  });

  it('counts days since it did', () => {
    expect(daysSinceApplied(app('Applied', { dateApplied: '2026-08-01' }), TODAY)).toBe(5);
  });
});

describe('outreachStats', () => {
  it('counts every status where a message actually went out', () => {
    const contacts = [
      contact('Not contacted'),
      contact('Drafted'),
      contact('Sent'),
      contact('Connected'),
      contact('Replied'),
      contact('Meeting scheduled'),
      contact('Follow-up due'),
      contact('No response'),
    ];
    const o = outreachStats(contacts, TODAY);
    expect(o.totalTargets).toBe(8);
    // A draft has not been sent.
    expect(o.contacted).toBe(6);
  });

  it('counts a booked meeting as a reply', () => {
    const o = outreachStats([contact('Replied'), contact('Meeting scheduled')], TODAY);
    expect(o.replied).toBe(2);
    expect(o.meetings).toBe(1);
  });

  it('counts follow-ups that have come due', () => {
    const contacts = [
      contact('Sent', { followup: '2026-08-01' }),
      contact('Sent', { followup: TODAY }),
      contact('Sent', { followup: '2026-09-01' }),
      contact('Sent', { followup: '' }),
    ];
    expect(outreachStats(contacts, TODAY).followupsDue).toBe(2);
  });
});
