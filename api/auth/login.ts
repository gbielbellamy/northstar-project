import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSession, prisma, setSessionCookie, verifyPassword } from '../_lib/auth.js';
import { isInvalid, readCredentials } from '../_lib/validate.js';

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

  const user = await prisma.user.findUnique({ where: { email: parsed.email } });
  const ok = user ? await verifyPassword(parsed.password, user.passwordHash) : false;

  // One message for both a wrong password and an unknown address. Saying which
  // it was would tell an attacker whether the account exists.
  if (!user || !ok) {
    res.status(401).json({ error: 'Email or password is incorrect' });
    return;
  }

  setSessionCookie(res, await createSession(user.id));
  res.status(200).json({ id: user.id, email: user.email });
}
