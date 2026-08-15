import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { createSession, hashPassword, prisma, setSessionCookie } from '../_lib/auth.js';
import { seedAccount } from '../_lib/state.js';

/**
 * Creates a throwaway account, already filled with the sample content, and
 * signs the visitor straight in.
 *
 * One shared demo account would mean whatever the last visitor typed is what
 * the next one sees. A private account per visitor costs a few rows and cannot
 * be vandalised.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: `guest-${randomUUID()}@guest.northstar`,
      // Unreachable by design: a guest account is only ever entered through
      // the cookie handed out below.
      passwordHash: await hashPassword(randomUUID()),
      isGuest: true,
    },
  });

  await seedAccount(user.id, { withPlan: true, withSampleRecords: true });

  setSessionCookie(res, await createSession(user.id));
  res.status(201).json({ id: user.id, email: user.email, isGuest: true });
}
