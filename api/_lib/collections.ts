import { prisma } from './prisma.js';
import * as e from './enums.js';

/**
 * One description per editable collection: which table it is, and how its
 * enum-backed fields convert in each direction.
 *
 * Without this the same conversion would be written out in the read route, the
 * create route and the update route, and the three would drift apart.
 */

type Row = Record<string, unknown>;
type Convert = (row: Row) => Row;

/** Applies a converter to the fields named, leaving everything else alone. */
function convert(fields: Record<string, { toDb: (v: never) => string; fromDb: (v: string) => string }>, dir: 'toDb' | 'fromDb'): Convert {
  return (row) => {
    const out: Row = { ...row };
    for (const [field, mapper] of Object.entries(fields)) {
      const value = row[field];
      if (value === null || value === undefined || value === '') continue;
      out[field] = mapper[dir](value as never);
    }
    return out;
  };
}

const DEFS = {
  roadmap: { model: 'roadmapWeek', enums: { status: e.status } },
  goals: { model: 'weeklyGoal', enums: { area: e.area, status: e.status, priority: e.priority } },
  schedule: { model: 'scheduleBlock', enums: { day: e.dayKey, area: e.area } },
  skills: { model: 'skill', enums: { priority: e.priority, category: e.skillCategory } },
  templates: { model: 'messageTemplate', enums: {} },
  oss: { model: 'ossContribution', enums: { kind: e.ossKind, stage: e.ossStage } },
  applications: {
    model: 'application',
    enums: { status: e.applicationStatus, family: e.roleFamily },
  },
  contacts: { model: 'contact', enums: { contactType: e.contactType, status: e.contactStatus } },
  companies: {
    model: 'company',
    enums: { priority: e.companyPriority, status: e.companyStatus },
  },
  exceptions: { model: 'dayException', enums: { kind: e.exceptionKind } },
  deferrals: { model: 'deferral', enums: { area: e.area } },
} as const;

export type CollectionName = keyof typeof DEFS;

export function isCollection(name: unknown): name is CollectionName {
  return typeof name === 'string' && name in DEFS;
}

/** Fields the client must never set: they identify the row or its owner. */
const READ_ONLY = new Set(['id', 'userId', 'createdAt', 'updatedAt', 'companyId']);

export function collection(name: CollectionName) {
  const def = DEFS[name];
  const enums = def.enums as Record<
    string,
    { toDb: (v: never) => string; fromDb: (v: string) => string }
  >;
  const toDb = convert(enums, 'toDb');
  const fromDb = convert(enums, 'fromDb');

  return {
    /** The Prisma delegate. Typed loosely on purpose — the shape varies. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: (prisma as any)[def.model],

    /** Strips what the client may not set, then converts the rest. */
    input(body: unknown): Row {
      if (typeof body !== 'object' || body === null) throw new Error('Expected an object');
      const clean: Row = {};
      for (const [k, v] of Object.entries(body as Row)) {
        if (READ_ONLY.has(k)) continue;
        clean[k] = v;
      }
      return toDb(clean);
    },

    output(row: Row): Row {
      const { userId: _userId, companyId: _companyId, ...rest } = row;
      void _userId;
      void _companyId;
      return fromDb(rest);
    },
  };
}
