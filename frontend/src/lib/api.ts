/**
 * Single place that talks to the NestJS backend.
 *
 * NOTE ON TOKEN STORAGE: the JWT lives in localStorage. That is readable by
 * any script running on the page, so it is only acceptable because this is an
 * internal tool on a domain you control. If Glitz ever becomes a product sold
 * to other DMCs, move to an httpOnly cookie set by the backend.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const TOKEN_KEY = 'glitz.token';
const USER_KEY = 'glitz.user';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string, user: SessionUser) {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  user(): SessionUser | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = tokenStore.get();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Check that the backend is running.',
      0,
    );
  }

  if (res.status === 401) {
    tokenStore.clear();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError('Your session has expired. Sign in again.', 401);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.message === 'string') message = body.message;
      else if (Array.isArray(body?.message)) message = body.message.join(', ');
    } catch {
      /* keep the default message */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ---- shapes returned by the backend (kept minimal on purpose) ------------

export interface LeadStats {
  total: number;
  unassigned: number;
  byStatus: { status: string; count: number }[];
  bySource: { source: string; count: number }[];
}

export interface BookingStats {
  bookings: number;
  totalSell: number;
  totalReceived: number;
  totalOutstanding: number;
  vendorOutstanding: number;
  totalQuotedProfit: number;
  totalActualProfit: number;
  profitVariance: number;
  averageMarginPercent: number;
  byStatus: { status: string; count: number }[];
}

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  destination: string | null;
  status: string;
  source: string;
  score: number;
  createdAt: string;
  assignedTo?: { id: string; name: string } | null;
}

export interface Paged<T> {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: T[];
}
