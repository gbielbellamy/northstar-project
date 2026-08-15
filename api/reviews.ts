import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma, withUser } from './_lib/auth.js';

/** Saves the review for one week. One per week, so this is an upsert. */
export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { week, review } = (req.body ?? {}) as { week?: unknown; review?: Record<string, unknown> };
  if (typeof week !== 'number' || typeof review !== 'object' || review === null) {
    res.status(400).json({ error: 'Expected a week number and a review' });
    return;
  }

  const { id: _id, userId: _userId, week: _week, ...fields } = review;
  void _id;
  void _userId;
  void _week;

  const saved = await prisma.weeklyReview.upsert({
    where: { userId_week: { userId, week } },
    create: { userId, week, ...fields },
    update: fields,
  });
  res.status(200).json(saved);
});
