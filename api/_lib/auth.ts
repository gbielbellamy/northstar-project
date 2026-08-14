import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma.js';

const COOKIE = 'northstar_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/**
 * Cost factor for the password hash. Deliberately slow: the whole point is
 * that an attacker with a stolen database cannot try many guesses per second.
 * 12 is a few hundred milliseconds, which a login can afford.
 */
const BCRYPT_ROUNDS = 12;

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(value);
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Signs a session token carrying nothing but the user id. */
export async function createSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

/**
 * The cookie is httpOnly so no script can read it, which is what stops an XSS
 * from stealing the session; Secure so it never travels over plain HTTP; and
 * SameSite=Lax so another site cannot make the browser send it along with a
 * cross-site request.
 */
function cookie(value: string, maxAge: number): string {
  const parts = [
    `${COOKIE}=${value}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}

export function setSessionCookie(res: VercelResponse, token: string): void {
  res.setHeader('Set-Cookie', cookie(token, MAX_AGE_SECONDS));
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', cookie('', 0));
}

function readCookie(req: VercelRequest, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

/** The signed-in user's id, or null. Never trusts anything but the signature. */
export async function currentUserId(req: VercelRequest): Promise<string | null> {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    // Expired, tampered with, or signed by a different secret.
    return null;
  }
}

/**
 * Wraps a handler so it only runs for a signed-in user, and hands it the id.
 * Every route that touches user data goes through this — it is the single
 * place authorisation can be got wrong, so there is only one of it.
 */
export function withUser(
  handler: (req: VercelRequest, res: VercelResponse, userId: string) => Promise<void>,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const userId = await currentUserId(req);
    if (!userId) {
      res.status(401).json({ error: 'Not signed in' });
      return;
    }
    await handler(req, res, userId);
  };
}

export { prisma };
