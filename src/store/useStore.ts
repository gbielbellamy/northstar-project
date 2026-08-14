import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedState } from '../data/seed';
import { backfillCompanies, repairFollowups } from '../lib/applications';
import { newId } from '../lib/ids';
import type {
  AppState,
  Application,
  Company,
  Contact,
  DayException,
  Deferral,
  OssContribution,
  MessageTemplate,
  RoadmapWeek,
  ScheduleBlock,
  Settings,
  Skill,
  WeeklyGoal,
  WeeklyReview,
} from '../types';

const STORAGE_KEY = 'career-transition-os';

/** Collections that are plain arrays of objects carrying an `id`. */
type ListKey =
  | 'roadmap'
  | 'goals'
  | 'schedule'
  | 'exceptions'
  | 'deferrals'
  | 'oss'
  | 'applications'
  | 'contacts'
  | 'companies'
  | 'skills'
  | 'templates';

type Entity = {
  roadmap: RoadmapWeek;
  goals: WeeklyGoal;
  schedule: ScheduleBlock;
  exceptions: DayException;
  deferrals: Deferral;
  oss: OssContribution;
  applications: Application;
  contacts: Contact;
  companies: Company;
  skills: Skill;
  templates: MessageTemplate;
};

export type Store = AppState & {
  /** Add an item to any list. Generates the id for you. */
  add: <K extends ListKey>(key: K, item: Omit<Entity[K], 'id'>) => string;
  /** Patch an item in any list by id. */
  update: <K extends ListKey>(key: K, id: string, patch: Partial<Entity[K]>) => void;
  /** Remove an item from any list by id. */
  remove: (key: ListKey, id: string) => void;

  setSettings: (patch: Partial<Settings>) => void;
  setReview: (week: number, review: WeeklyReview) => void;
  toggleLog: (dateISO: string, blockId: string, done: boolean) => void;

  replaceAll: (next: AppState) => void;
  reset: () => void;
};

const ID_PREFIX: Record<ListKey, string> = {
  roadmap: 'rw',
  goals: 'g',
  schedule: 'sb',
  exceptions: 'ex',
  deferrals: 'df',
  oss: 'os',
  applications: 'ap',
  contacts: 'ct',
  companies: 'co',
  skills: 'sk',
  templates: 'tp',
};

/** Deep clone that works in every browser we care about. */
function cloneSeed(): AppState {
  return JSON.parse(JSON.stringify(seedState)) as AppState;
}

/** Fills missing fields on an older saved skill from the seed entry of the same name. */
function normaliseSkill(saved: Partial<Skill> & { skill?: string }): Skill {
  const seeded = seedState.skills.find(
    (s) => s.skill.toLowerCase() === (saved.skill ?? '').toLowerCase(),
  );
  return {
    id: saved.id ?? newId('sk'),
    skill: saved.skill ?? '',
    currentLevel: saved.currentLevel ?? seeded?.currentLevel ?? '',
    target: saved.target ?? seeded?.target ?? '',
    priority: saved.priority ?? seeded?.priority ?? 'Medium',
    evidence: saved.evidence ?? seeded?.evidence ?? '',
    action: saved.action ?? seeded?.action ?? '',
    why: saved.why ?? seeded?.why ?? '',
    miniProject: saved.miniProject ?? seeded?.miniProject ?? '',
    miniProjectDod: saved.miniProjectDod ?? seeded?.miniProjectDod ?? '',
    resources: saved.resources ?? seeded?.resources ?? [],
    sessions: saved.sessions ?? seeded?.sessions ?? [],
    category: saved.category ?? seeded?.category ?? 'Foundations',
    badge: saved.badge ?? seeded?.badge ?? (saved.skill ?? '?').slice(0, 2).toUpperCase(),
    colour: saved.colour ?? seeded?.colour ?? '#8b5cf6',
    icon: saved.icon ?? seeded?.icon ?? '',
    optional: saved.optional ?? seeded?.optional ?? false,
  };
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...cloneSeed(),

      add: (key, item) => {
        const id = newId(ID_PREFIX[key]);
        set((s) => ({ [key]: [...(s[key] as unknown[]), { ...item, id }] }) as Partial<Store>);
        return id;
      },

      update: (key, id, patch) =>
        set(
          (s) =>
            ({
              [key]: (s[key] as { id: string }[]).map((row) =>
                row.id === id ? { ...row, ...patch } : row,
              ),
            }) as Partial<Store>,
        ),

      remove: (key, id) =>
        set(
          (s) =>
            ({
              [key]: (s[key] as { id: string }[]).filter((row) => row.id !== id),
            }) as Partial<Store>,
        ),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      setReview: (week, review) =>
        set((s) => ({ reviews: { ...s.reviews, [String(week)]: review } })),

      toggleLog: (dateISO, blockId, done) =>
        set((s) => ({
          dailyLog: {
            ...s.dailyLog,
            [dateISO]: { ...(s.dailyLog[dateISO] ?? {}), [blockId]: done },
          },
        })),

      replaceAll: (next) => set(() => ({ ...next })),

      reset: () => set(() => ({ ...cloneSeed() })),
    }),
    {
      name: STORAGE_KEY,
      version: 5,
      /** Persist only the data, never the action functions. */
      partialize: (s): AppState => ({
        roadmap: s.roadmap,
        goals: s.goals,
        schedule: s.schedule,
        exceptions: s.exceptions,
        deferrals: s.deferrals,
        oss: s.oss,
        applications: s.applications,
        contacts: s.contacts,
        companies: s.companies,
        skills: s.skills,
        templates: s.templates,
        reviews: s.reviews,
        dailyLog: s.dailyLog,
        settings: s.settings,
      }),
      /** Old skills predate the learning path, so give them the new shape. */
      migrate: (persisted, version) => {
        const saved = (persisted ?? {}) as Partial<AppState>;
        if (version < 2) {
          return { ...saved, skills: (saved.skills ?? []).map(normaliseSkill) };
        }
        return saved;
      },

      /**
       * Fills gaps from the seed. Replaces the plan (weeks, goals, schedule,
       * skills) when the seed's planVersion is ahead of the saved one.
       * Recorded data is never overwritten.
       */
      merge: (persisted, current) => {
        const seed = cloneSeed();
        // Nothing stored yet: take the seed whole, sample log and reviews
        // included. The stale-plan path below clears those, which is correct
        // for an upgrade but would leave a first visit empty.
        if (persisted == null) return { ...current, ...seed };

        const saved = persisted as Partial<AppState>;
        const planIsStale = (saved.settings?.planVersion ?? 0) < seed.settings.planVersion;

        const settings: Settings = {
          ...seed.settings,
          ...(saved.settings ?? {}),
          // Nested, so a spread alone would drop any target added since.
          targets: { ...seed.settings.targets, ...(saved.settings?.targets ?? {}) },
          planVersion: seed.settings.planVersion,
        };
        if (planIsStale) {
          settings.programStart = seed.settings.programStart;
          settings.currentWeek = seed.settings.currentWeek;
        }

        const applications = repairFollowups(saved.applications ?? []);
        const linked = backfillCompanies(
          applications,
          saved.companies ?? seed.companies,
          saved.contacts ?? seed.contacts,
        );

        return {
          ...current,
          ...seed,
          ...saved,
          roadmap: planIsStale ? seed.roadmap : (saved.roadmap ?? seed.roadmap),
          goals: planIsStale ? seed.goals : (saved.goals ?? seed.goals),
          schedule: planIsStale ? seed.schedule : (saved.schedule ?? seed.schedule),
          skills: (planIsStale ? seed.skills : (saved.skills ?? seed.skills)).map(normaliseSkill),
          templates: planIsStale ? seed.templates : (saved.templates ?? seed.templates),
          // Logs are keyed to a timetable that no longer exists.
          reviews: planIsStale ? {} : (saved.reviews ?? {}),
          dailyLog: planIsStale ? {} : (saved.dailyLog ?? {}),
          exceptions: saved.exceptions ?? [],
          // Deferrals reference blockIds from the replaced schedule.
          deferrals: planIsStale ? [] : (saved.deferrals ?? []),
          oss: saved.oss ?? [],
          applications,
          companies: linked.companies,
          contacts: linked.contacts,
          settings,
        };
      },
    },
  ),
);
