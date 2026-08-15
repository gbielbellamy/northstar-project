/** The one place that talks to the API. Nothing else calls fetch. */

import type { AppState, Settings, WeeklyReview } from '../types';

export type User = { id: string; email: string; isGuest?: boolean };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    // The session lives in a cookie, which the browser only sends when asked.
    credentials: 'same-origin',
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (body as { error?: string } | null)?.error ?? 'Something went wrong. Try again.';
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const auth = {
  me: () => request<{ user: User | null }>('/api/auth/me'),

  register: (email: string, password: string, withPlan: boolean) =>
    request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, withPlan }),
    }),

  login: (email: string, password: string) =>
    request<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  guest: () => request<User>('/api/auth/guest', { method: 'POST' }),

  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),

  deleteAccount: () => request<void>('/api/auth/account', { method: 'DELETE' }),
};

/** The collections that are edited row by row. */
export type Collection =
  | 'roadmap'
  | 'goals'
  | 'schedule'
  | 'skills'
  | 'templates'
  | 'oss'
  | 'applications'
  | 'contacts'
  | 'companies'
  | 'exceptions'
  | 'deferrals';

export const api = {
  /** Everything the user has, in one request. */
  state: () => request<AppState>('/api/state'),

  create: <T>(collection: Collection, item: unknown) =>
    request<T>(`/api/items/${collection}`, { method: 'POST', body: JSON.stringify(item) }),

  update: <T>(collection: Collection, id: string, patch: unknown) =>
    request<T>(`/api/items/${collection}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  remove: (collection: Collection, id: string) =>
    request<void>(`/api/items/${collection}/${id}`, { method: 'DELETE' }),

  settings: (patch: Partial<Settings>) =>
    request<Settings>('/api/user/settings', { method: 'PATCH', body: JSON.stringify(patch) }),

  review: (week: number, review: WeeklyReview) =>
    request<void>('/api/user/reviews', { method: 'PUT', body: JSON.stringify({ week, review }) }),

  /** Replaces everything in the account with an exported backup. */
  import: (state: AppState) =>
    request<void>('/api/state', { method: 'PUT', body: JSON.stringify(state) }),

  log: (date: string, blockId: string, done: boolean) =>
    request<void>('/api/user/log', { method: 'PUT', body: JSON.stringify({ date, blockId, done }) }),
};
