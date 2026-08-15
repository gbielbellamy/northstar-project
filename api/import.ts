import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma, withUser } from './_lib/auth.js';
import { collection, type CollectionName } from './_lib/collections.js';

/**
 * Replaces everything in the account with an exported backup.
 *
 * It is a replace rather than a merge on purpose: restoring a backup should
 * leave you with exactly what was in it, not with the backup mixed into
 * whatever is there now. The whole thing runs in one transaction, so a
 * malformed file cannot leave the account half-wiped.
 */

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

export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payload = req.body as Record<string, unknown> | null;
  if (!payload || !Array.isArray(payload.roadmap) || !Array.isArray(payload.goals)) {
    res.status(400).json({ error: "That file isn't a Northstar backup" });
    return;
  }

  try {
    const writes = [];

    for (const name of COLLECTIONS) {
      const c = collection(name);
      writes.push(c.table.deleteMany({ where: { userId } }));

      const rows = payload[name];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      writes.push(
        c.table.createMany({ data: rows.map((row) => ({ ...c.input(row), userId })) }),
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
      Object.entries(blocks).map(([blockId, done]) => ({ userId, date, blockId, done })),
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
});
