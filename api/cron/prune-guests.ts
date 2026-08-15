import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma.js';

/**
 * Deletes guest accounts older than a week.
 *
 * Every visitor who presses "try it without an account" gets a real account
 * with a couple of hundred rows. Nobody comes back to one, so without this the
 * database fills up with abandoned demos.
 *
 * Their contents go with them: the schema cascades from User.
 */
const MAX_AGE_DAYS = 7;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel signs its own cron requests with this header. Without the check the
  // endpoint is a public button for deleting other people's demos.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Not authorised' });
    return;
  }

  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.user.deleteMany({
    where: { isGuest: true, createdAt: { lt: cutoff } },
  });

  res.status(200).json({ deleted: count, olderThan: cutoff.toISOString() });
}
