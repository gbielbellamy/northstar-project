import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma, withUser } from './_lib/auth.js';

/**
 * Settings are stored as one JSON document, so a patch merges into whatever is
 * there rather than replacing it.
 */
export default withUser(async (req: VercelRequest, res: VercelResponse, userId: string) => {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
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
    // targets is a nested object; a plain spread would drop the fields the
    // patch did not mention.
    targets: {
      ...((current.targets as object) ?? {}),
      ...((patch.targets as object) ?? {}),
    },
  };

  await prisma.user.update({ where: { id: userId }, data: { settings: merged } });
  res.status(200).json(merged);
});
