import { prisma } from './prisma.js';
import * as e from './enums.js';
import { seedState } from '../../src/data/seed.js';
import { addDays, daysBetween, todayISO } from '../../src/lib/dates.js';
import type { AppState, Settings } from '../../src/types/index.js';

/**
 * The demo content is written as if today were this date. Everything is moved
 * by the difference when an account is created, so a visitor next year sees
 * the same four weeks of history rather than a plan that finished long ago.
 */
const SEED_TODAY = '2026-08-15';

/** Shifts an ISO date by `days`, leaving blanks alone. */
function shift(value: string, days: number): string {
  return value ? addDays(value, days) : value;
}

/**
 * Assembles the whole state for one user, and seeds a new account.
 *
 * The client loads everything once and then works against it, so reading is a
 * single round trip rather than nine. Writes go through the per-collection
 * routes instead, which is why there is no `saveState`.
 */

/** Rows come back with columns the client has no use for. */
function strip<T extends { userId?: unknown }>(row: T) {
  const { userId: _userId, ...rest } = row;
  void _userId;
  return rest;
}

export async function loadState(userId: string): Promise<AppState> {
  const [
    user,
    roadmap,
    goals,
    schedule,
    skills,
    templates,
    oss,
    applications,
    contacts,
    companies,
    exceptions,
    deferrals,
    reviews,
    dailyLog,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { settings: true } }),
    prisma.roadmapWeek.findMany({ where: { userId }, orderBy: { week: 'asc' } }),
    prisma.weeklyGoal.findMany({ where: { userId }, orderBy: { week: 'asc' } }),
    prisma.scheduleBlock.findMany({ where: { userId }, orderBy: { start: 'asc' } }),
    prisma.skill.findMany({ where: { userId } }),
    prisma.messageTemplate.findMany({ where: { userId } }),
    prisma.ossContribution.findMany({ where: { userId } }),
    prisma.application.findMany({ where: { userId } }),
    prisma.contact.findMany({ where: { userId } }),
    prisma.company.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
    prisma.dayException.findMany({ where: { userId } }),
    prisma.deferral.findMany({ where: { userId } }),
    prisma.weeklyReview.findMany({ where: { userId } }),
    prisma.dailyLogEntry.findMany({ where: { userId } }),
  ]);

  const settings: Settings = {
    ...seedState.settings,
    ...((user.settings as Partial<Settings> | null) ?? {}),
    targets: {
      ...seedState.settings.targets,
      ...((user.settings as { targets?: Settings['targets'] } | null)?.targets ?? {}),
    },
  };

  return {
    roadmap: roadmap.map((r) => ({ ...strip(r), status: e.status.fromDb(r.status) })),
    goals: goals.map((g) => ({
      ...strip(g),
      area: e.area.fromDb(g.area),
      status: e.status.fromDb(g.status),
      priority: e.priority.fromDb(g.priority),
    })),
    schedule: schedule.map((b) => ({
      ...strip(b),
      day: e.dayKey.fromDb(b.day),
      area: b.area ? e.area.fromDb(b.area) : null,
      sessionDone: b.sessionDone ?? undefined,
      steps: b.steps.length > 0 ? b.steps : undefined,
    })),
    skills: skills.map((s) => ({
      ...strip(s),
      priority: e.priority.fromDb(s.priority),
      category: e.skillCategory.fromDb(s.category),
      resources: s.resources as never,
      sessions: s.sessions as never,
    })),
    templates: templates.map(strip),
    oss: oss.map((o) => ({
      ...strip(o),
      kind: e.ossKind.fromDb(o.kind),
      stage: e.ossStage.fromDb(o.stage),
    })),
    applications: applications.map((a) => ({
      ...strip(a),
      status: e.applicationStatus.fromDb(a.status),
      family: a.family ? e.roleFamily.fromDb(a.family) : '',
    })),
    contacts: contacts.map((c) => {
      // companyId is the relation; the client keys contacts by company name.
      const { userId: _userId, companyId: _companyId, ...rest } = c;
      void _userId;
      void _companyId;
      return {
        ...rest,
        contactType: e.contactType.fromDb(c.contactType),
        status: e.contactStatus.fromDb(c.status),
      };
    }),
    companies: companies.map((c) => ({
      ...strip(c),
      priority: e.companyPriority.fromDb(c.priority),
      status: e.companyStatus.fromDb(c.status),
    })),
    exceptions: exceptions.map((x) => ({ ...strip(x), kind: e.exceptionKind.fromDb(x.kind) })),
    deferrals: deferrals.map((d) => ({ ...strip(d), area: e.area.fromDb(d.area) })),
    reviews: Object.fromEntries(
      reviews.map((r) => [String(r.week), strip(r)]),
    ) as AppState['reviews'],
    dailyLog: dailyLog.reduce<AppState['dailyLog']>((acc, row) => {
      (acc[row.date] ??= {})[row.blockId] = row.done;
      return acc;
    }, {}),
    settings,
  } as AppState;
}

/**
 * Fills a brand-new account.
 *
 * `withPlan` gives it the ten-week roadmap, the timetable and the skill paths —
 * the framework, which is the product. Sample companies and applications are
 * only for the guest demo: on a real account they are noise someone has to
 * delete before they can start.
 */
export async function seedAccount(
  userId: string,
  { withPlan, withSampleRecords }: { withPlan: boolean; withSampleRecords: boolean },
): Promise<void> {
  const today = todayISO();

  // A demo keeps its four weeks of history, so it moves with the calendar. A
  // real account starts this week, with nothing done yet.
  const days = withSampleRecords
    ? daysBetween(SEED_TODAY, today)
    : daysBetween(seedState.settings.programStart, today) -
      ((new Date(`${today}T00:00:00`).getDay() + 6) % 7);

  const writes = [];

  if (withPlan) {
    writes.push(
      prisma.roadmapWeek.createMany({
        data: seedState.roadmap.map((r) => ({
          userId,
          week: r.week,
          start: shift(r.start, days),
          end: shift(r.end, days),
          theme: r.theme,
          projectDirection: r.projectDirection,
          definitionOfDone: r.definitionOfDone,
          status: e.status.toDb(withSampleRecords ? r.status : 'Not started') as never,
          notes: r.notes,
        })),
      }),
      prisma.weeklyGoal.createMany({
        data: seedState.goals.map((g) => ({
          userId,
          week: g.week,
          area: e.area.toDb(g.area) as never,
          title: g.title,
          detail: g.detail,
          definitionOfDone: g.definitionOfDone,
          // Progress belongs to the demo. A real account starts clean.
          status: e.status.toDb(withSampleRecords ? g.status : 'Not started') as never,
          priority: e.priority.toDb(g.priority) as never,
          plannedHours: g.plannedHours,
          evidenceUrl: withSampleRecords ? g.evidenceUrl : '',
          notes: g.notes,
        })),
      }),
      prisma.scheduleBlock.createMany({
        data: seedState.schedule.map((b) => ({
          userId,
          day: e.dayKey.toDb(b.day) as never,
          start: b.start,
          end: b.end,
          area: b.area ? (e.area.toDb(b.area) as never) : null,
          label: b.label,
          optional: b.optional,
          sessionDone: b.sessionDone ?? null,
          steps: b.steps ?? [],
          fromWeek: b.fromWeek ?? null,
          toWeek: b.toWeek ?? null,
        })),
      }),
      prisma.skill.createMany({
        data: seedState.skills.map((s) => ({
          userId,
          skill: s.skill,
          currentLevel: s.currentLevel,
          target: s.target,
          priority: e.priority.toDb(s.priority) as never,
          evidence: s.evidence,
          action: s.action,
          why: s.why,
          miniProject: s.miniProject,
          miniProjectDod: s.miniProjectDod,
          category: e.skillCategory.toDb(s.category) as never,
          badge: s.badge,
          colour: s.colour,
          icon: s.icon,
          optional: s.optional,
          resources: s.resources as never,
          sessions: s.sessions as never,
        })),
      }),
      prisma.messageTemplate.createMany({
        data: seedState.templates.map((t) => ({
          userId,
          useCase: t.useCase,
          template: t.template,
        })),
      }),
    );
  }

  if (withSampleRecords) {
    writes.push(
      prisma.company.createMany({
        data: seedState.companies.map((c) => ({
          userId,
          name: c.name,
          sector: c.sector,
          size: c.size,
          location: c.location,
          workMode: c.workMode,
          priority: e.companyPriority.toDb(c.priority) as never,
          fitScore: c.fitScore,
          primaryRoles: c.primaryRoles,
          secondaryRoles: c.secondaryRoles,
          whyItFits: c.whyItFits,
          stack: c.stack,
          careersUrl: c.careersUrl,
          linkedinUrl: c.linkedinUrl,
          nextAction: c.nextAction,
          status: e.companyStatus.toDb(c.status) as never,
          lastReviewed: shift(c.lastReviewed, days),
          notes: c.notes,
        })),
      }),
      prisma.contact.createMany({
        data: seedState.contacts.map((c) => ({
          userId,
          company: c.company,
          person: c.person,
          targetProfile: c.targetProfile,
          contactType: e.contactType.toDb(c.contactType) as never,
          status: e.contactStatus.toDb(c.status) as never,
          searchUrl: c.searchUrl,
          companyUrl: c.companyUrl,
          link: c.link,
          angle: c.angle,
          week: c.week,
          lastContact: shift(c.lastContact, days),
          dateSent: shift(c.dateSent, days),
          followup: shift(c.followup, days),
          meeting: shift(c.meeting, days),
          nextAction: c.nextAction,
          notes: c.notes,
        })),
      }),
      prisma.application.createMany({
        data: seedState.applications.map((a) => ({
          userId,
          company: a.company,
          role: a.role,
          family: a.family ? (e.roleFamily.toDb(a.family) as never) : null,
          status: e.applicationStatus.toDb(a.status) as never,
          url: a.url,
          location: a.location,
          salary: a.salary,
          week: a.week,
          dateFound: shift(a.dateFound, days),
          deadline: shift(a.deadline, days),
          dateApplied: shift(a.dateApplied, days),
          followup: shift(a.followup, days),
          interviewStage: a.interviewStage,
          resumeVersion: a.resumeVersion,
          contact: a.contact,
          nextAction: a.nextAction,
          result: a.result,
          notes: a.notes,
        })),
      }),
      prisma.ossContribution.createMany({
        data: seedState.oss.map((o) => ({
          userId,
          project: o.project,
          repoUrl: o.repoUrl,
          title: o.title,
          kind: e.ossKind.toDb(o.kind) as never,
          stage: e.ossStage.toDb(o.stage) as never,
          issueUrl: o.issueUrl,
          prUrl: o.prUrl,
          why: o.why,
          reviewLesson: o.reviewLesson,
          dateStarted: shift(o.dateStarted, days),
          dateMerged: shift(o.dateMerged, days),
          notes: o.notes,
        })),
      }),
      prisma.dayException.createMany({
        data: seedState.exceptions.map((x) => ({
          userId,
          date: shift(x.date, days),
          kind: e.exceptionKind.toDb(x.kind) as never,
          note: x.note,
          hoursOwed: x.hoursOwed,
          recoverOn: shift(x.recoverOn, days),
          recovered: x.recovered,
        })),
      }),
      prisma.dailyLogEntry.createMany({
        data: Object.entries(seedState.dailyLog).flatMap(([date, blocks]) =>
          Object.entries(blocks).map(([blockId, done]) => ({
            userId,
            date: shift(date, days),
            // Block ids are generated per account, so the seed's ids mean
            // nothing here. They are rewritten once the blocks exist.
            blockId,
            done,
          })),
        ),
      }),
    );
  }

  if (writes.length > 0) await prisma.$transaction(writes);

  await prisma.user.update({
    where: { id: userId },
    data: { settings: { programStart: shift(seedState.settings.programStart, days) } },
  });

  if (withSampleRecords) await linkDemoProgress(userId, days);
}

/**
 * The seed refers to schedule blocks and deferrals by ids that only exist in
 * the seed. Once the account's own blocks are in the database, the log and the
 * deferrals are pointed at the real ones.
 */
async function linkDemoProgress(userId: string, days: number): Promise<void> {
  const blocks = await prisma.scheduleBlock.findMany({
    where: { userId },
    select: { id: true, day: true, start: true, area: true },
  });

  /** Matches a seed block to the account's copy by where it sits in the week. */
  function realId(seedBlockId: string): string | null {
    const seedBlock = seedState.schedule.find((b) => b.id === seedBlockId);
    if (!seedBlock) return null;
    const hit = blocks.find(
      (b) => e.dayKey.fromDb(b.day) === seedBlock.day && b.start === seedBlock.start,
    );
    return hit?.id ?? null;
  }

  const log = Object.entries(seedState.dailyLog).flatMap(([date, entries]) =>
    Object.entries(entries).flatMap(([seedBlockId, done]) => {
      const id = realId(seedBlockId);
      return id ? [{ userId, date: shift(date, days), blockId: id, done }] : [];
    }),
  );

  const deferrals = seedState.deferrals.flatMap((d) => {
    const id = realId(d.blockId);
    return id
      ? [{ userId, date: shift(d.date, days), blockId: id, area: e.area.toDb(d.area) as never }]
      : [];
  });

  await prisma.$transaction([
    prisma.dailyLogEntry.deleteMany({ where: { userId } }),
    prisma.dailyLogEntry.createMany({ data: log }),
    prisma.deferral.createMany({ data: deferrals }),
  ]);
}
