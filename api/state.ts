import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { prisma, withUser } from './_lib/auth.js';
import { collection, type CollectionName } from './_lib/collections.js';
import { loadState, seedAccount } from './_lib/state.js';

const COLLECTIONS: CollectionName[] = [
  'roadmap',
  'goals',
  'schedule',
  'skills',
  'templates',
  'oss',
  'applications',
  'contacts',
  'companies',
  'exceptions',
  'deferrals',
];

/**
 * GET returns everything the user has, in one request.
 * POST fills an empty account with the standard plan.
 * PUT replaces everything with an exported backup.
 */
export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  if (req.method === 'GET') {
    res.status(200).json(await loadState(userId));
    return;
  }
  if (req.method === 'POST') {
    return addStandardPlan(res, userId);
  }
  if (req.method === 'PUT') {
    return restore(req, res, userId);
  }
  res.status(405).json({ error: 'Method not allowed' });
});

/**
 * For an account that started empty and now wants the plan after all. Refuses
 * if there is one already, rather than seeding a second copy on top.
 */
async function addStandardPlan(res: VercelResponse, userId: string) {
  const existing = await prisma.roadmapWeek.count({ where: { userId } });
  if (existing > 0) {
    res.status(409).json({ error: 'This account already has a plan' });
    return;
  }
  await seedAccount(userId, { withPlan: true, withSampleRecords: false });
  res.status(204).end();
}

/**
 * A replace rather than a merge: restoring a backup should leave exactly what
 * was in it. One transaction, so a malformed file cannot half-wipe an account.
 */
async function restore(req: VercelRequest, res: VercelResponse, userId: string) {
  const payload = req.body as Record<string, unknown> | null;
  if (!payload || !Array.isArray(payload.roadmap) || !Array.isArray(payload.goals)) {
    res.status(400).json({ error: "That file isn't a Northstar backup" });
    return;
  }

  try {
    const writes = [];

    // Schedule blocks get new ids, and the daily log and the deferrals point
    // at the old ones. Generating the ids here means both can be translated;
    // without this a restored backup loses every session already ticked off.
    const newBlockId = new Map<string, string>();

    for (const name of COLLECTIONS) {
      const c = collection(name);
      writes.push(c.table.deleteMany({ where: { userId } }));

      const rows = payload[name];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      writes.push(
        c.table.createMany({
          data: rows.map((row) => {
            const data = { ...c.input(row), userId };
            if (name === 'schedule') {
              const id = randomUUID();
              newBlockId.set(String((row as { id?: unknown }).id ?? ''), id);
              return { ...data, id };
            }
            if (name === 'deferrals') {
              const was = String((row as { blockId?: unknown }).blockId ?? '');
              return { ...data, blockId: newBlockId.get(was) ?? was };
            }
            return data;
          }),
        }),
      );
    }

    writes.push(prisma.weeklyReview.deleteMany({ where: { userId } }));
    const reviews = (payload.reviews ?? {}) as Record<string, Record<string, unknown>>;
    const reviewRows = Object.entries(reviews).map(([week, review]) => {
      const { id: _id, userId: _userId, week: _week, ...fields } = review;
      void _id;
      void _userId;
      void _week;
      return { userId, week: Number(week), ...fields };
    });
    if (reviewRows.length > 0) {
      writes.push(prisma.weeklyReview.createMany({ data: reviewRows as never }));
    }

    writes.push(prisma.dailyLogEntry.deleteMany({ where: { userId } }));
    const log = (payload.dailyLog ?? {}) as Record<string, Record<string, boolean>>;
    const logRows = Object.entries(log).flatMap(([date, blocks]) =>
      Object.entries(blocks).flatMap(([blockId, done]) => {
        const id = newBlockId.get(blockId);
        // A tick against a block the backup no longer contains has nothing to
        // point at, so it is dropped rather than left dangling.
        return id ? [{ userId, date, blockId: id, done }] : [];
      }),
    );
    if (logRows.length > 0) writes.push(prisma.dailyLogEntry.createMany({ data: logRows }));

    if (payload.settings && typeof payload.settings === 'object') {
      writes.push(
        prisma.user.update({
          where: { id: userId },
          data: { settings: payload.settings as never },
        }),
      );
    }

    await prisma.$transaction(writes);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: `Could not restore that file: ${(error as Error).message}` });
  }
}
