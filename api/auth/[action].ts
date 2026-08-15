import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import {
  clearSessionCookie,
  createSession,
  currentUserId,
  hashPassword,
  prisma,
  setSessionCookie,
  verifyPassword,
} from '../_lib/auth.js';
import { isInvalid, readCredentials } from '../_lib/validate.js';
import { seedAccount } from '../_lib/state.js';

/**
 * Every auth action behind one function.
 *
 * They were a file each, which reads better, but the hosting plan allows
 * twelve serverless functions and six of them were auth. Grouping by
 * resource keeps the count down without mixing unrelated concerns.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action;

  switch (action) {
    case 'register':
      return register(req, res);
    case 'login':
      return login(req, res);
    case 'guest':
      return guest(req, res);
    case 'logout':
      return logout(req, res);
    case 'me':
      return me(req, res);
    case 'account':
      return deleteAccount(req, res);
    default:
      res.status(404).json({ error: 'Unknown action' });
  }
}

async function register(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);

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
  // Sample companies and applications never come with a real account.
  const withPlan = (req.body as { withPlan?: unknown }).withPlan !== false;
  await seedAccount(user.id, { withPlan, withSampleRecords: false });

  setSessionCookie(res, await createSession(user.id));
  res.status(201).json({ id: user.id, email: user.email });
}

async function login(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);

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

async function guest(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);

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

async function logout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  clearSessionCookie(res);
  res.status(204).end();
}

/** Who am I? Returns 200 with the user, or 200 with null — not an error. */
async function me(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res);

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

/**
 * Deletes the account and everything in it. The rest goes with it because the
 * schema says `onDelete: Cascade`.
 */
async function deleteAccount(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return methodNotAllowed(res);

  const userId = await currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not signed in' });
    return;
  }

  await prisma.user.delete({ where: { id: userId } });
  clearSessionCookie(res);
  res.status(204).end();
}

function methodNotAllowed(res: VercelResponse) {
  res.status(405).json({ error: 'Method not allowed' });
}
