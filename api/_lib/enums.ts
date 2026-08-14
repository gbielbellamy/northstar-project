/**
 * Converts between the domain strings the client uses ("Not contacted") and
 * the identifiers Prisma generates for them (NOT_CONTACTED).
 *
 * The database stores the readable form — that is what `@map` does in the
 * schema — but the generated client refers to enum members by identifier, so
 * something has to sit in between. Keeping it here means the routes never
 * think about it.
 */

function upper(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

/** Builds both directions from the list of readable values. */
function mapper<T extends string>(values: readonly T[]) {
  const toDb = new Map<string, string>(values.map((v) => [v, upper(v)]));
  const fromDb = new Map<string, T>(values.map((v) => [upper(v), v]));
  return {
    toDb(value: T): string {
      const hit = toDb.get(value);
      if (!hit) throw new Error(`Unknown value: ${value}`);
      return hit;
    },
    fromDb(value: string): T {
      const hit = fromDb.get(value);
      if (!hit) throw new Error(`Unknown stored value: ${value}`);
      return hit;
    },
    has(value: unknown): value is T {
      return typeof value === 'string' && toDb.has(value);
    },
  };
}

export const applicationStatus = mapper([
  'Saved',
  'Preparing',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Ghosted',
  'Withdrawn',
] as const);

export const roleFamily = mapper([
  'Full-Stack SWE',
  'Frontend SWE',
  'Technical Support',
  'Solutions Engineer',
  'Implementation Engineer',
  'QA Automation',
  'Customer Engineer',
] as const);

export const contactStatus = mapper([
  'Not contacted',
  'Drafted',
  'Sent',
  'Connected',
  'Replied',
  'Meeting scheduled',
  'Follow-up due',
  'No response',
] as const);

export const contactType = mapper([
  'Peer contact',
  'Hiring influencer',
  'Recruiter',
] as const);

export const companyPriority = mapper(['A', 'B', 'C'] as const);

export const companyStatus = mapper([
  'Researching',
  'Applying',
  'Applied',
  'Interviewing',
  'Rejected',
  'Offer',
  'Deprioritized',
] as const);
