import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSession, hashPassword, prisma, setSessionCookie } from '../_lib/auth.js';
import { isInvalid, readCredentials } from '../_lib/validate.js';
import { seedAccount } from '../_lib/state.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const parsed = readCredentials(req.body);
  if (isInvalid(parsed)) {
    res.status(400).json(parsed);
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) {
    res.status(409).json({ error: 'That email is already registered' });
    return;
  }

  const user = await prisma.user.create({
    data: { email: parsed.email, passwordHash: await hashPassword(parsed.password) },
  });

  // The plan is the product, so a new account gets it unless asked not to.
  // Sample companies and applications never come with a real account: they
  // are noise the person would have to delete before starting.
  const withPlan = (req.body as { withPlan?: unknown }).withPlan !== false;
  await seedAccount(user.id, { withPlan, withSampleRecords: false });

  setSessionCookie(res, await createSession(user.id));
  res.status(201).json({ id: user.id, email: user.email });
}
