/** The one place that talks to the API. Nothing else calls fetch. */

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
