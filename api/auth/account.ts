import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearSessionCookie, prisma, withUser } from '../_lib/auth.js';

/**
 * Deletes the signed-in account and everything in it.
 *
 * The companies, contacts and applications go with it because the schema says
 * `onDelete: Cascade` — the right to erasure is a property of the data model
 * rather than code that can be forgotten.
 */
export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  await prisma.user.delete({ where: { id: userId } });
  clearSessionCookie(res);
  res.status(204).end();
});
