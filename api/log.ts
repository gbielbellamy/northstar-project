import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma, withUser } from './_lib/auth.js';

/** Ticks or un-ticks one block on one day. */
export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

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
});
