/** Minimal input checks. Every route validates before it touches the database. */

export type Invalid = { error: string };

export function readCredentials(body: unknown): { email: string; password: string } | Invalid {
  if (typeof body !== 'object' || body === null) return { error: 'Expected a JSON body' };
  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
    return { error: 'A valid email is required' };
  }
  // Long enough to resist guessing, capped because bcrypt ignores anything
  // past 72 bytes and a huge input is just work for the server.
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return { error: 'Password must be between 8 and 72 characters' };
  }
  return { email: email.trim().toLowerCase(), password };
}

export function isInvalid(v: object): v is Invalid {
  return 'error' in v;
}
