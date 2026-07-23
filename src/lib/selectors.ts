import { daysBetween, todayISO } from './dates';
import {
  ACTIVE_STATUSES,
  RESPONDED_STATUSES,
  type Application,
  type Contact,
  type WeeklyGoal,
} from '../types';

/* ---------- Weekly progress ---------- */

export function goalsForWeek(goals: WeeklyGoal[], week: number): WeeklyGoal[] {
  return goals.filter((g) => g.week === week);
}

export function completionPct(goals: WeeklyGoal[], week?: number): number {
  const list = week === undefined ? goals : goalsForWeek(goals, week);
  if (list.length === 0) return 0;
  const done = list.filter((g) => g.status === 'Done').length;
  return Math.round((done / list.length) * 100);
}

/* ---------- Application funnel ---------- */

export type Funnel = {
  total: number;
  /** Everything past "Saved"/"Preparing" — i.e. actually out the door. */
  sent: number;
  responded: number;
  /** Of the applications actually sent, how many came back. */
  responseRate: number | null;
  interviewing: number;
  offers: number;
  active: number;
  ghosted: number;
  rejected: number;
  followupsDue: number;
};

const SENT_STATUSES = new Set(['Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted']);

export function funnel(applications: Application[], today = todayISO()): Funnel {
  const total = applications.length;
  const sent = applications.filter((a) => SENT_STATUSES.has(a.status)).length;
  const responded = applications.filter((a) => RESPONDED_STATUSES.includes(a.status)).length;
  const interviewing = applications.filter((a) => a.status === 'Interviewing').length;
  const offers = applications.filter((a) => a.status === 'Offer').length;
  const active = applications.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;
  const ghosted = applications.filter((a) => a.status === 'Ghosted').length;
  const rejected = applications.filter((a) => a.status === 'Rejected').length;
  const followupsDue = applications.filter(
    (a) => a.followup !== '' && a.followup <= today && !['Offer', 'Rejected', 'Withdrawn'].includes(a.status),
  ).length;

  return {
    total,
    sent,
    responded,
    responseRate: sent === 0 ? null : Math.round((responded / sent) * 100),
    interviewing,
    offers,
    active,
    ghosted,
    rejected,
    followupsDue,
  };
}

/** Days since the application went out. Null when it hasn't been sent yet. */
export function daysSinceApplied(a: Application, today = todayISO()): number | null {
  if (!a.dateApplied) return null;
  return daysBetween(a.dateApplied, today);
}

/* ---------- Networking ---------- */

export type OutreachStats = {
  totalTargets: number;
  contacted: number;
  replied: number;
  meetings: number;
  followupsDue: number;
};

const CONTACTED_STATUSES = new Set(['Sent', 'Connected', 'Replied', 'Meeting scheduled', 'Follow-up due', 'No response']);
const REPLIED_STATUSES = new Set(['Replied', 'Meeting scheduled']);

export function outreachStats(contacts: Contact[], today = todayISO()): OutreachStats {
  return {
    totalTargets: contacts.length,
    contacted: contacts.filter((c) => CONTACTED_STATUSES.has(c.status)).length,
    replied: contacts.filter((c) => REPLIED_STATUSES.has(c.status)).length,
    meetings: contacts.filter((c) => c.status === 'Meeting scheduled').length,
    followupsDue: contacts.filter((c) => c.followup !== '' && c.followup <= today).length,
  };
}
