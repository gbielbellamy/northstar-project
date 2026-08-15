import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma, withUser } from '../_lib/auth.js';

/**
 * The three things that belong to the user rather than to a collection:
 * settings, the weekly review, and the daily log. Grouped into one function
 * to stay within the hosting plan's limit.
 */
export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  switch (req.query.part) {
    case 'settings':
      return settings(req, res, userId);
    case 'reviews':
      return review(req, res, userId);
    case 'log':
      return log(req, res, userId);
    default:
      res.status(404).json({ error: 'Unknown resource' });
  }
});

/** Settings are one JSON document, so a patch merges rather than replaces. */
async function settings(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method !== 'PATCH') return methodNotAllowed(res);
  if (typeof req.body !== 'object' || req.body === null) {
    res.status(400).json({ error: 'Expected an object' });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { settings: true },
  });
  const current = (user.settings as Record<string, unknown> | null) ?? {};
  const patch = req.body as Record<string, unknown>;

  const merged = {
    ...current,
    ...patch,
    // targets is nested; a plain spread would drop the fields the patch did
    // not mention.
    targets: {
      ...((current.targets as object) ?? {}),
      ...((patch.targets as object) ?? {}),
    },
  };

  await prisma.user.update({ where: { id: userId }, data: { settings: merged } });
  res.status(200).json(merged);
}

/** One review per week, so this is an upsert. */
async function review(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method !== 'PUT') return methodNotAllowed(res);

  const { week, review: incoming } = (req.body ?? {}) as {
    week?: unknown;
    review?: Record<string, unknown>;
  };
  if (typeof week !== 'number' || typeof incoming !== 'object' || incoming === null) {
    res.status(400).json({ error: 'Expected a week number and a review' });
    return;
  }

  const { id: _id, userId: _userId, week: _week, ...fields } = incoming;
  void _id;
  void _userId;
  void _week;

  const saved = await prisma.weeklyReview.upsert({
    where: { userId_week: { userId, week } },
    create: { userId, week, ...fields },
    update: fields,
  });
  res.status(200).json(saved);
}

/** Ticks or un-ticks one block on one day. */
async function log(req: VercelRequest, res: VercelResponse, userId: string) {
  if (req.method !== 'PUT') return methodNotAllowed(res);

  const { date, blockId, done } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof date !== 'string' || typeof blockId !== 'string' || typeof done !== 'boolean') {
    res.status(400).json({ error: 'Expected date, blockId and done' });
    return;
  }

  await prisma.dailyLogEntry.upsert({
    where: { userId_date_blockId: { userId, date, blockId } },
    create: { userId, date, blockId, done },
    update: { done },
  });
  res.status(204).end();
}

function methodNotAllowed(res: VercelResponse) {
  res.status(405).json({ error: 'Method not allowed' });
}
