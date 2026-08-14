import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { createSession, hashPassword, prisma, setSessionCookie } from '../_lib/auth';
import * as enums from '../_lib/enums';
import { seedState } from '../../src/data/seed';

/**
 * Creates a throwaway account, already filled with the sample content, and
 * signs the visitor straight in.
 *
 * The alternative — one shared demo account — means whatever the last visitor
 * typed is what the next one sees. A private account per visitor costs a few
 * rows and cannot be vandalised. They are cleaned up by age; see
 * api/cron/prune-guests.ts.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const id = randomUUID();
  const user = await prisma.user.create({
    data: {
      email: `guest-${id}@guest.northstar`,
      // No one signs in as a guest twice: the account is reachable only
      // through the cookie handed out below.
      passwordHash: await hashPassword(randomUUID()),
      isGuest: true,
    },
  });

  const companyIds = new Map<string, string>();
  const companies = seedState.companies.map((c) => {
    const rowId = randomUUID();
    companyIds.set(c.name.trim().toLowerCase(), rowId);
    return {
      id: rowId,
      userId: user.id,
      name: c.name,
      sector: c.sector,
      size: c.size,
      location: c.location,
      workMode: c.workMode,
      priority: enums.companyPriority.toDb(c.priority) as never,
      fitScore: c.fitScore,
      primaryRoles: c.primaryRoles,
      secondaryRoles: c.secondaryRoles,
      whyItFits: c.whyItFits,
      stack: c.stack,
      careersUrl: c.careersUrl,
      linkedinUrl: c.linkedinUrl,
      nextAction: c.nextAction,
      status: enums.companyStatus.toDb(c.status) as never,
      lastReviewed: c.lastReviewed,
      notes: c.notes,
    };
  });

  const contacts = seedState.contacts.map((c) => ({
    id: randomUUID(),
    userId: user.id,
    companyId: companyIds.get(c.company.trim().toLowerCase()) ?? null,
    company: c.company,
    person: c.person,
    targetProfile: c.targetProfile,
    contactType: enums.contactType.toDb(c.contactType) as never,
    status: enums.contactStatus.toDb(c.status) as never,
    searchUrl: c.searchUrl,
    companyUrl: c.companyUrl,
    link: c.link,
    angle: c.angle,
    week: c.week,
    lastContact: c.lastContact,
    dateSent: c.dateSent,
    followup: c.followup,
    meeting: c.meeting,
    nextAction: c.nextAction,
    notes: c.notes,
  }));

  const applications = seedState.applications.map((a) => ({
    id: randomUUID(),
    userId: user.id,
    company: a.company,
    role: a.role,
    family: a.family ? (enums.roleFamily.toDb(a.family) as never) : null,
    status: enums.applicationStatus.toDb(a.status) as never,
    url: a.url,
    location: a.location,
    salary: a.salary,
    week: a.week,
    dateFound: a.dateFound,
    deadline: a.deadline,
    dateApplied: a.dateApplied,
    followup: a.followup,
    interviewStage: a.interviewStage,
    resumeVersion: a.resumeVersion,
    contact: a.contact,
    nextAction: a.nextAction,
    result: a.result,
    notes: a.notes,
  }));

  // One transaction: a guest lands on a full app or on nothing, never on a
  // half-seeded account.
  await prisma.$transaction([
    prisma.company.createMany({ data: companies }),
    prisma.contact.createMany({ data: contacts }),
    prisma.application.createMany({ data: applications }),
  ]);

  setSessionCookie(res, await createSession(user.id));
  res.status(201).json({ id: user.id, email: user.email, isGuest: true });
}
