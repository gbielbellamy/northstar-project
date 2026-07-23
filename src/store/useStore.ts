import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedState } from '../data/seed';
import type {
  AppState,
  Application,
  Company,
  Contact,
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
  | 'applications'
  | 'contacts'
  | 'companies'
  | 'skills'
  | 'templates';

type Entity = {
  roadmap: RoadmapWeek;
  goals: WeeklyGoal;
  schedule: ScheduleBlock;
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

function newId(prefix: string) {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}

const ID_PREFIX: Record<ListKey, string> = {
  roadmap: 'rw',
  goals: 'g',
  schedule: 'sb',
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
      version: 1,
      /** Persist only the data, never the action functions. */
      partialize: (s): AppState => ({
        roadmap: s.roadmap,
        goals: s.goals,
        schedule: s.schedule,
        applications: s.applications,
        contacts: s.contacts,
        companies: s.companies,
        skills: s.skills,
        templates: s.templates,
        reviews: s.reviews,
        dailyLog: s.dailyLog,
        settings: s.settings,
      }),
      /**
       * A saved state from an older build can be missing keys added since.
       * Fill any gap from the seed instead of crashing on undefined.
       */
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>;
        const seed = cloneSeed();
        return {
          ...current,
          ...seed,
          ...saved,
          settings: { ...seed.settings, ...(saved.settings ?? {}) },
        };
      },
    },
  ),
);
