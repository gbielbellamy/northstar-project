import { create } from 'zustand';
import { seedState } from '../data/seed';
import { api, type Collection } from '../lib/api';
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

type ListKey = Collection;

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
  /** False until the first load finishes. */
  ready: boolean;
  /** Set when a write failed, so the UI can say so. */
  error: string | null;

  load: () => Promise<void>;
  /** For an account created without one. */
  addStandardPlan: () => Promise<void>;
  clear: () => void;
  clearError: () => void;

  add: <K extends ListKey>(key: K, item: Omit<Entity[K], 'id'>) => string;
  update: <K extends ListKey>(key: K, id: string, patch: Partial<Entity[K]>) => void;
  remove: (key: ListKey, id: string) => void;

  setSettings: (patch: Partial<Settings>) => void;
  setReview: (week: number, review: WeeklyReview) => void;
  toggleLog: (dateISO: string, blockId: string, done: boolean) => void;

};

/**
 * The state lives on the server. This holds a copy of it so the UI stays
 * instant: every change is applied here first and sent afterwards, and a
 * failed write puts the message in `error` and reloads from the server rather
 * than leaving the screen showing something that was never saved.
 */

/** Temporary id for a row the server has not answered about yet. */
function tempId(prefix: string) {
  return `tmp-${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

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

/** An empty shape to render against before the first load answers. */
function blankState(): AppState {
  return {
    roadmap: [],
    goals: [],
    schedule: [],
    exceptions: [],
    deferrals: [],
    oss: [],
    applications: [],
    contacts: [],
    companies: [],
    skills: [],
    templates: [],
    reviews: {},
    dailyLog: {},
    settings: JSON.parse(JSON.stringify(seedState.settings)) as Settings,
  };
}

export const useStore = create<Store>()((set, get) => {
  /** Runs a write, and reloads from the server if it fails. */
  async function push(work: () => Promise<void>) {
    try {
      await work();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Could not save that.' });
      await get().load();
    }
  }

  return {
    ...blankState(),
    ready: false,
    error: null,

    load: async () => {
      const state = await api.state();
      set({ ...state, ready: true, error: null });
    },

    addStandardPlan: async () => {
      await api.loadStandardPlan();
      await get().load();
    },

    clear: () => set({ ...blankState(), ready: false, error: null }),

    clearError: () => set({ error: null }),

    add: (key, item) => {
      const id = tempId(ID_PREFIX[key]);
      set((s) => ({ [key]: [...(s[key] as unknown[]), { ...item, id }] }) as Partial<Store>);

      push(async () => {
        const saved = (await api.create<{ id: string }>(key, item)) as { id: string };
        // Swap the temporary id for the real one, in place, so anything the
        // user changed in the meantime survives.
        set((s) => ({
          [key]: (s[key] as { id: string }[]).map((row) =>
            row.id === id ? { ...row, ...saved } : row,
          ),
        }) as Partial<Store>);
      });

      return id;
    },

    update: (key, id, patch) => {
      set(
        (s) =>
          ({
            [key]: (s[key] as { id: string }[]).map((row) =>
              row.id === id ? { ...row, ...patch } : row,
            ),
          }) as Partial<Store>,
      );
      push(() => api.update(key, id, patch).then(() => undefined));
    },

    remove: (key, id) => {
      set(
        (s) =>
          ({
            [key]: (s[key] as { id: string }[]).filter((row) => row.id !== id),
          }) as Partial<Store>,
      );
      push(() => api.remove(key, id));
    },

    setSettings: (patch) => {
      set((s) => ({ settings: { ...s.settings, ...patch } }));
      push(() => api.settings(patch).then(() => undefined));
    },

    setReview: (week, review) => {
      set((s) => ({ reviews: { ...s.reviews, [String(week)]: review } }));
      push(() => api.review(week, review));
    },

    toggleLog: (dateISO, blockId, done) => {
      set((s) => ({
        dailyLog: {
          ...s.dailyLog,
          [dateISO]: { ...(s.dailyLog[dateISO] ?? {}), [blockId]: done },
        },
      }));
      push(() => api.log(dateISO, blockId, done));
    },
  };
});
