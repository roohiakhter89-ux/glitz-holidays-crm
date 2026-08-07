#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays — FRONTEND  |  PHASE 8: Leads workspace
# ------------------------------------------------------------------------------
# Adds the screens where the selling actually happens:
#
#   /leads       inbox — search, stage + source filters, pagination, score
#   /leads/[id]  the file — call/WhatsApp/email actions, stage + owner control,
#                trip requirements, score breakdown, activity timeline, and the
#                attribution panel (campaign, keyword, gclid) that lets you
#                trace a booking back to the ad that produced it
#
# Also adds: styled native Select + Textarea, shared enums/helpers, and the
# timeline component. Human entries outrank machine entries visually — a note
# about what the client said matters more than "Status NEW -> CONTACTED".
#
# RUN FROM YOUR PROJECT ROOT (the folder containing frontend/):
#   cd ~/Desktop/glitz
#   bash phase-8.sh
#
# Overwrites src/lib/api.ts (adds types only). Safe to re-run.
# Options: SKIP_BUILD=1
# ==============================================================================
set -euo pipefail

say()  { printf "\n\033[1;36m==>\033[0m %s\n" "$1"; }
ok()   { printf "\033[1;32m  ok\033[0m %s\n" "$1"; }
warn() { printf "\033[1;33m  ! \033[0m %s\n" "$1"; }
die()  { printf "\033[1;31m  x \033[0m %s\n" "$1"; exit 1; }

say "Checking location"
if [ -d frontend/src ]; then
  cd frontend
elif [ -d src/app ] && [ -f package.json ] && grep -q '"next"' package.json; then
  : # already inside frontend/
else
  die "Can't find the frontend. Run this from your project root (the folder containing frontend/)."
fi
[ -f src/components/ui/panel.tsx ] || die "Phase 7 files missing — run phase-7.sh first."
ok "frontend found ($(pwd))"

say "Writing leads workspace"
mkdir -p "src/lib"
cat > 'src/lib/constants.ts' << 'GLITZEOF'
export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'QUOTATION_SENT',
  'NEGOTIATION',
  'CONFIRMED',
  'FUTURE_FOLLOWUP',
  'CANCELLED',
  'LOST',
] as const;

export const LEAD_SOURCES = [
  'GOOGLE_ADS',
  'META_ADS',
  'INSTAGRAM',
  'FACEBOOK',
  'LANDING_PAGE',
  'WEBSITE',
  'ORGANIC',
  'REFERRAL',
  'WALK_IN',
  'PHONE',
  'WHATSAPP',
  'TRADE_FAIR',
  'EMAIL',
  'B2B_AGENT',
  'OTHER',
] as const;

export const ACTIVITY_TYPES = [
  'NOTE',
  'CALL',
  'WHATSAPP',
  'EMAIL',
  'MEETING',
] as const;

/** Turn NEGOTIATION into "Negotiation", QUOTATION_SENT into "Quotation sent". */
export function humanise(value: string): string {
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Digits only, with country code, for a wa.me link. */
export function whatsappHref(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCode = digits.length === 10 ? `91${digits}` : digits;
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${withCode}${q}`;
}
GLITZEOF
mkdir -p "src/lib"
cat > 'src/lib/api.ts' << 'GLITZEOF'
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

export interface ActivityRow {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  user?: { id: string; name: string } | null;
}

export interface LeadDetail extends LeadRow {
  city: string | null;
  country: string | null;
  travelDate: string | null;
  nights: number | null;
  adults: number | null;
  children: number | null;
  budget: number | null;
  message: string | null;
  scoreNotes: string | null;
  lostReason: string | null;
  enquiryCount: number;
  lastContact: string | null;
  nextFollowUp: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  gclid: string | null;
  fbclid: string | null;
  landingPage: string | null;
  referrer: string | null;
  keyword: string | null;
  device: string | null;
  activities: ActivityRow[];
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}
GLITZEOF
mkdir -p "src/components/ui"
cat > 'src/components/ui/select.tsx' << 'GLITZEOF'
'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Native select, styled. Deliberately not a Radix listbox: operators filter
 * this screen dozens of times a day and the native control is faster with a
 * keyboard, works on mobile, and never traps focus.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'h-9 w-full appearance-none rounded-md border border-ink-700 bg-ink-950/60',
        'pl-3 pr-8 text-sm text-ink-100',
        'transition-[border-color,box-shadow,background-color] duration-150 ease-out',
        'hover:border-ink-600',
        'focus:border-signal-500 focus:bg-ink-950 focus:outline-none',
        'focus:shadow-[0_0_0_3px_rgba(53,146,150,0.15)]',
        'disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden
      strokeWidth={1.75}
      className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-500"
    />
  </div>
));
Select.displayName = 'Select';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-md border border-ink-700 bg-ink-950/60 px-3 py-2 text-sm text-ink-100',
      'placeholder:text-ink-500 resize-y min-h-[76px]',
      'transition-[border-color,box-shadow,background-color] duration-150 ease-out',
      'hover:border-ink-600',
      'focus:border-signal-500 focus:bg-ink-950 focus:outline-none',
      'focus:shadow-[0_0_0_3px_rgba(53,146,150,0.15)]',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
GLITZEOF
mkdir -p "src/components"
cat > 'src/components/timeline.tsx' << 'GLITZEOF'
'use client';

import {
  Phone,
  MessageCircle,
  Mail,
  Users,
  StickyNote,
  GitCommitHorizontal,
  RefreshCw,
  UserCheck,
  Cpu,
} from 'lucide-react';
import type { ActivityRow } from '@/lib/api';
import { relativeDate } from '@/lib/format';
import { humanise } from '@/lib/constants';

const ICONS: Record<string, typeof Phone> = {
  CALL: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  MEETING: Users,
  NOTE: StickyNote,
  STATUS_CHANGE: GitCommitHorizontal,
  RE_ENQUIRY: RefreshCw,
  ASSIGNMENT: UserCheck,
  SYSTEM: Cpu,
};

/**
 * A vertical rail. System entries are dimmed so a human's note about what the
 * client actually said outranks "Status NEW -> CONTACTED" visually.
 */
export function Timeline({ items }: { items: ActivityRow[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-ink-500">
        Nothing logged yet. Record the first call or note above.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      <span
        aria-hidden
        className="absolute left-[11px] top-2 bottom-2 w-px bg-ink-800"
      />
      {items.map((item, i) => {
        const Icon = ICONS[item.type] ?? StickyNote;
        const machine = ['SYSTEM', 'STATUS_CHANGE', 'ASSIGNMENT'].includes(
          item.type,
        );
        return (
          <li
            key={item.id}
            className="rise relative flex gap-3 py-3"
            style={{ animationDelay: `${Math.min(i, 10) * 22}ms` }}
          >
            <span
              className={
                'relative z-10 mt-0.5 grid size-[23px] shrink-0 place-items-center rounded-full border ' +
                (machine
                  ? 'border-ink-800 bg-ink-900 text-ink-600'
                  : 'border-ink-700 bg-ink-850 text-ink-300')
              }
            >
              <Icon className="size-3" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={
                  'text-[13px] leading-relaxed ' +
                  (machine ? 'text-ink-500' : 'text-ink-100')
                }
              >
                {item.content}
              </p>
              <p className="mt-1 text-[11px] text-ink-600">
                {humanise(item.type)}
                {item.user?.name ? ` · ${item.user.name}` : ''} ·{' '}
                {relativeDate(item.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
GLITZEOF
mkdir -p "src/app/(app)/leads"
cat > 'src/app/(app)/leads/page.tsx' << 'GLITZEOF'
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, X, Inbox } from 'lucide-react';
import { api, ApiError, type LeadRow, type Paged } from '@/lib/api';
import { Panel } from '@/components/ui/panel';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Stage, Chip } from '@/components/ui/badge';
import { ScoreMeter } from '@/components/margin-ribbon';
import { LEAD_SOURCES, LEAD_STATUSES, humanise } from '@/lib/constants';
import { relativeDate } from '@/lib/format';

export default function LeadsPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    if (source) params.set('source', source);

    try {
      const res = await api.get<Paged<LeadRow>>(`/leads?${params}`);
      setRows(res.data);
      setMeta({ total: res.total, page: res.page, pages: res.pages });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load leads.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, source]);

  // debounce so typing in search doesn't hammer the API
  useEffect(() => {
    const t = setTimeout(load, search ? 280 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const filtered = Boolean(search || status || source);

  function clearFilters() {
    setSearch('');
    setStatus('');
    setSource('');
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-8">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-50">
            Leads
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-400">
            {meta.total} enquir{meta.total === 1 ? 'y' : 'ies'}
            {filtered ? ' matching your filters' : ' in the pipeline'}
          </p>
        </div>
      </header>

      {/* Filters — a toolbar, not a panel. It is chrome, not content. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search
            aria-hidden
            strokeWidth={1.75}
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-500"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Name, phone, email or destination"
            className="pl-8"
            aria-label="Search leads"
          />
        </div>

        <div className="w-[168px]">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by stage"
          >
            <option value="">All stages</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {humanise(s)}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-[168px]">
          <Select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by source"
          >
            <option value="">All sources</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {humanise(s)}
              </option>
            ))}
          </Select>
        </div>

        {filtered && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" strokeWidth={1.75} />
            Clear
          </Button>
        )}
      </div>

      <Panel className="overflow-hidden">
        {error ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-loss-400">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={load}>
              Try again
            </Button>
          </div>
        ) : loading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Inbox
              aria-hidden
              strokeWidth={1.25}
              className="mx-auto size-6 text-ink-600"
            />
            <p className="mt-3 text-[13px] text-ink-300">
              {filtered ? 'No leads match those filters' : 'No leads yet'}
            </p>
            <p className="mt-1 text-[12px] text-ink-500">
              {filtered
                ? 'Widen the search or clear the filters.'
                : 'Point a landing page form at /api/leads/capture and they arrive here.'}
            </p>
            {filtered && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.09em] text-ink-500">
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Trip</th>
                <th className="px-5 py-2.5 font-medium">Source</th>
                <th className="px-5 py-2.5 font-medium">Stage</th>
                <th className="px-5 py-2.5 font-medium">Owner</th>
                <th className="px-5 py-2.5 font-medium">Score</th>
                <th className="px-5 py-2.5 text-right font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead, i) => (
                <tr
                  key={lead.id}
                  className="group rise border-b border-ink-800/60 transition-colors duration-150 last:border-0 hover:bg-ink-850"
                  style={{ animationDelay: `${Math.min(i, 12) * 18}ms` }}
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-ink-100 transition-colors group-hover:text-signal-300"
                    >
                      {lead.name}
                    </Link>
                    <div className="tabular mt-0.5 text-[11px] text-ink-500">
                      {lead.phone}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-300">
                    {lead.destination ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Chip>{humanise(lead.source)}</Chip>
                  </td>
                  <td className="px-5 py-3">
                    <Stage value={lead.status} />
                  </td>
                  <td className="px-5 py-3 text-ink-400">
                    {lead.assignedTo?.name ?? (
                      <span className="text-warn-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <ScoreMeter score={lead.score} />
                  </td>
                  <td className="tabular px-5 py-3 text-right text-[12px] text-ink-500">
                    {relativeDate(lead.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="tabular text-[12px] text-ink-500">
            Page {meta.page} of {meta.pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= meta.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-ink-800/60">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <div className="h-3 w-40 animate-pulse rounded bg-ink-800" />
          <div className="h-3 w-24 animate-pulse rounded bg-ink-850" />
          <div className="ml-auto h-3 w-16 animate-pulse rounded bg-ink-850" />
        </div>
      ))}
    </div>
  );
}
GLITZEOF
mkdir -p "src/app/(app)/leads/[id]"
cat > 'src/app/(app)/leads/[id]/page.tsx' << 'GLITZEOF'
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Phone as PhoneIcon, Mail } from 'lucide-react';
import {
  api,
  ApiError,
  tokenStore,
  type LeadDetail,
  type UserRow,
} from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Select, Textarea } from '@/components/ui/select';
import { Label } from '@/components/ui/input';
import { Chip } from '@/components/ui/badge';
import { ScoreMeter } from '@/components/margin-ribbon';
import { Timeline } from '@/components/timeline';
import {
  ACTIVITY_TYPES,
  LEAD_STATUSES,
  humanise,
  whatsappHref,
} from '@/lib/constants';
import { money, shortDate } from '@/lib/format';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [staff, setStaff] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [noteType, setNoteType] = useState<string>('CALL');
  const [note, setNote] = useState('');

  const canAssign = ['OWNER', 'SUPER_ADMIN', 'SALES_MANAGER'].includes(
    tokenStore.user()?.role ?? '',
  );

  const load = useCallback(async () => {
    try {
      const data = await api.get<LeadDetail>(`/leads/${id}`);
      setLead(data);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 404
            ? 'That lead does not exist, or it is not assigned to you.'
            : e.message
          : 'Could not load this lead.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canAssign) return;
    api
      .get<UserRow[]>('/users')
      .then((u) => setStaff(u.filter((x) => x.isActive)))
      .catch(() => setStaff([]));
  }, [canAssign]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      await api.patch(`/leads/${id}`, body);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  }

  async function logActivity() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.post(`/leads/${id}/activities`, {
        type: noteType,
        content: note.trim(),
      });
      setNote('');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save that.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <div className="h-4 w-40 animate-pulse rounded bg-ink-800" />
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <Button variant="ghost" size="sm" onClick={() => router.push('/leads')}>
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Back to leads
        </Button>
        <Panel className="mt-4 border-loss-500/40 bg-loss-500/5">
          <PanelBody>
            <p className="text-[13px] text-ink-100">{error}</p>
          </PanelBody>
        </Panel>
      </div>
    );
  }

  if (!lead) return null;

  const attribution = [
    ['Source', humanise(lead.source)],
    ['Campaign', lead.utmCampaign],
    ['Medium', lead.utmMedium],
    ['Keyword', lead.utmTerm ?? lead.keyword],
    ['Ad content', lead.utmContent],
    ['Landing page', lead.landingPage],
    ['Google click id', lead.gclid],
    ['Meta click id', lead.fbclid],
    ['Device', lead.device],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-3"
        onClick={() => router.push('/leads')}
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Leads
      </Button>

      {/* Header: identity + the three things you actually do next */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-ink-50">
              {lead.name}
            </h1>
            {lead.enquiryCount > 1 && (
              <Chip className="border-warn-500/40 text-warn-400">
                {lead.enquiryCount} enquiries
              </Chip>
            )}
          </div>
          <p className="tabular mt-1 text-[13px] text-ink-400">
            {lead.phone}
            {lead.email ? ` · ${lead.email}` : ''}
            {lead.city ? ` · ${lead.city}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href={`tel:${lead.phone}`}>
              <PhoneIcon className="size-4" strokeWidth={1.75} />
              Call
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a
              href={whatsappHref(
                lead.phone,
                `Hello ${lead.name}, this is Glitz Holidays regarding your Kashmir enquiry.`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" strokeWidth={1.75} />
              WhatsApp
            </a>
          </Button>
          {lead.email && (
            <Button asChild variant="secondary" size="sm">
              <a href={`mailto:${lead.email}`}>
                <Mail className="size-4" strokeWidth={1.75} />
                Email
              </a>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href={`/quotes/new?leadId=${lead.id}`}>Build quotation</Link>
          </Button>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-400"
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Left: the conversation */}
        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <PanelTitle>Log what happened</PanelTitle>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <div className="flex gap-2">
                <div className="w-[150px]">
                  <Select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    aria-label="Activity type"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {humanise(t)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What did they say? Dates, budget, objections — the things you will not remember next week."
              />
              <div className="flex justify-end">
                <Button onClick={logActivity} disabled={saving || !note.trim()}>
                  {saving ? 'Saving…' : 'Save entry'}
                </Button>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>History</PanelTitle>
              <span className="tabular text-[11px] text-ink-500">
                {lead.activities.length} entries
              </span>
            </PanelHeader>
            <PanelBody className="pt-1">
              <Timeline items={lead.activities} />
            </PanelBody>
          </Panel>
        </div>

        {/* Right: the facts */}
        <div className="space-y-4">
          <Panel>
            <PanelHeader>
              <PanelTitle>Stage</PanelTitle>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="stage">Pipeline stage</Label>
                <Select
                  id="stage"
                  value={lead.status}
                  disabled={saving}
                  onChange={(e) => patch({ status: e.target.value })}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {humanise(s)}
                    </option>
                  ))}
                </Select>
              </div>

              {canAssign && (
                <div className="space-y-1.5">
                  <Label htmlFor="owner">Owner</Label>
                  <Select
                    id="owner"
                    value={lead.assignedTo?.id ?? ''}
                    disabled={saving}
                    onChange={(e) =>
                      patch({ assignedToId: e.target.value || null })
                    }
                  >
                    <option value="">Unassigned</option>
                    {staff.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>The trip</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <dl className="space-y-2.5 text-[13px]">
                <Row label="Destination" value={lead.destination} />
                <Row
                  label="Travel date"
                  value={lead.travelDate ? shortDate(lead.travelDate) : null}
                />
                <Row
                  label="Nights"
                  value={lead.nights ? String(lead.nights) : null}
                />
                <Row
                  label="Party"
                  value={
                    lead.adults
                      ? `${lead.adults} adult${lead.adults === 1 ? '' : 's'}${
                          lead.children ? `, ${lead.children} child` : ''
                        }`
                      : null
                  }
                />
                <Row
                  label="Budget"
                  value={lead.budget ? money(lead.budget) : null}
                  mono
                />
              </dl>
              {lead.message && (
                <p className="mt-4 border-t border-ink-800 pt-3 text-[13px] leading-relaxed text-ink-300">
                  {lead.message}
                </p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Score</PanelTitle>
              <ScoreMeter score={lead.score} />
            </PanelHeader>
            {lead.scoreNotes && (
              <PanelBody className="pt-3">
                <p className="text-[11px] leading-relaxed text-ink-500">
                  {lead.scoreNotes}
                </p>
              </PanelBody>
            )}
          </Panel>

          {/* This panel is why you can trace a booking back to a keyword. */}
          <Panel>
            <PanelHeader>
              <PanelTitle>Where this came from</PanelTitle>
            </PanelHeader>
            <PanelBody>
              {attribution.length === 0 ? (
                <p className="text-[12px] text-ink-500">
                  No campaign data — this lead did not arrive through a tracked link.
                </p>
              ) : (
                <dl className="space-y-2.5 text-[13px]">
                  {attribution.map(([label, value]) => (
                    <Row key={label} label={label} value={value} mono />
                  ))}
                </dl>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-ink-500">
        {label}
      </dt>
      <dd
        className={
          'min-w-0 truncate text-right text-ink-200 ' +
          (mono ? 'tabular text-[12px]' : '')
        }
        title={value ?? undefined}
      >
        {value ?? <span className="text-ink-600">—</span>}
      </dd>
    </div>
  );
}
GLITZEOF
ok "wrote 6 files"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  say "Production build (type-checks everything)"
  npm run build || die "Build failed — see errors above."
  ok "build passed"
fi

say "Committing"
cd ..
if git rev-parse --git-dir >/dev/null 2>&1; then
  git add -A
  git commit -qm "Phase 8: leads inbox + lead detail with timeline and attribution" || warn "commit skipped"
  ok "committed"
else
  warn "no git repo at project root — skipping commit"
fi

say "PHASE 8 COMPLETE"
cat << 'GLITZEOF'

Run both servers:

  cd backend  && npm run start:dev     # :3000
  cd frontend && npm run dev           # :3001

Then:

  1. Open http://localhost:3001/leads

  2. If it's empty, post a test lead from Git Bash so there's something to work
     with (this is exactly what a landing page would send):

     curl -X POST http://localhost:3000/api/leads/capture \
       -H "Content-Type: application/json" \
       -d '{"name":"Rahul Sharma","phone":"+91 98100 11223",
            "email":"rahul@example.com","destination":"Kashmir",
            "nights":5,"adults":2,"budget":45000,
            "message":"Srinagar Gulmarg Pahalgam in October, family trip.",
            "source":"GOOGLE_ADS","utmSource":"google","utmMedium":"cpc",
            "utmCampaign":"kashmir-family","utmTerm":"kashmir tour package",
            "gclid":"TEST-GCLID-123","landingPage":"go.falcontrails.in/kashmir"}'

  3. Refresh, open the lead, and check:
     - "Where this came from" shows campaign, keyword and click id
     - Changing the stage writes an entry into History by itself
     - Logging a call appears instantly in the timeline
     - The WhatsApp button opens a chat with a pre-filled greeting

Note: the "Build quotation" button points at /quotes/new, which doesn't exist
yet — that's phase 9.

GLITZEOF
