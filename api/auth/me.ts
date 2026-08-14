import type { VercelRequest, VercelResponse } from '@vercel/node';
import { currentUserId, prisma } from '../_lib/auth';

/** Who am I? Returns 200 with the user, or 200 with null — not an error. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const userId = await currentUserId(req);
  if (!userId) {
    res.status(200).json({ user: null });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  res.status(200).json({ user });
}
