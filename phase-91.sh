#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays — FRONTEND  |  PHASE 9: Quotation builder
# ------------------------------------------------------------------------------
#   /quotes           every quotation, with each tier's price and margin dot
#   /quotes/new       start one from a lead
#   /quotes/[id]      the builder
#
# HOW THE BUILDER WORKS
#   Tiers (Budget / Standard / Deluxe / anything) sit in a comparison strip at
#   the top — price and margin health visible at a glance. Selecting one opens
#   its full line editor below. Duplicate a tier to build the next one.
#
#   Lines come from your supplier book (search by city, room type and season,
#   then set rooms x nights) or by hand. Quantity, units, net cost and markup
#   are edited inline; Enter or blur commits, Escape reverts.
#
#   THE SERVER OWNS THE MATH. Every edit posts to the backend and the totals it
#   returns are what render. The alternative — recalculating in the browser —
#   means two implementations of your markup rules, and the day they disagree
#   you quote a wrong price.
#
#   The right rail shows the margin ribbon, both margin% (profit/sell) and
#   markup% (profit/cost) — different numbers — and the pricing advisory. Price
#   a tier below your minimum margin or below your break-even per file and it
#   tells you exactly how much to add.
#
# RUN FROM YOUR PROJECT ROOT (the folder containing frontend/):
#   cd ~/Desktop/glitz
#   bash phase-9.sh
#
# Safe to re-run. Options: SKIP_BUILD=1
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
  :
else
  die "Can't find the frontend. Run this from your project root (the folder containing frontend/)."
fi
[ -f 'src/app/(app)/leads/page.tsx' ] || die "Phase 8 files missing — run phase-8.sh first."
ok "frontend found ($(pwd))"

say "Writing quotation builder"
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

export const SERVICE_TYPES = [
  'HOTEL',
  'TRANSPORT',
  'ACTIVITY',
  'FLIGHT',
  'GUIDE',
  'MEAL',
  'PERMIT',
  'MISC',
] as const;

export const MARKUP_MODES = [
  { value: 'INHERIT', label: 'Default markup' },
  { value: 'PERCENT', label: 'Percent' },
  { value: 'FIXED', label: 'Flat amount' },
  { value: 'MANUAL', label: 'Set sell price' },
] as const;

export const SEASONS = ['PEAK', 'SHOULDER', 'OFF', 'FESTIVE'] as const;

export const QUOTE_STATUSES = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'REVISED',
] as const;

/** What the markupValue field means for each mode. */
export const MARKUP_HINT: Record<string, string> = {
  INHERIT: 'Uses your settings for this service type',
  PERCENT: '% on this line',
  FIXED: '₹ added on top',
  MANUAL: '₹ total sell for this line',
};
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

// ---- quotes ---------------------------------------------------------------

export interface QuoteLineRow {
  id: string;
  serviceType: string;
  description: string;
  vendorId: string | null;
  vendorRateId: string | null;
  quantity: number;
  units: number;
  unitNet: number;
  markupMode: string;
  markupValue: number | null;
  lineNet: number;
  lineSell: number;
  sortOrder: number;
  notes: string | null;
}

export interface Advisory {
  breakEvenPerFile: number | null;
  minSellForPolicy: number;
  minSellForBreakEven: number | null;
  suggestedMinSell: number;
  shortfall: number;
  ok: boolean;
  warnings: string[];
}

export interface QuoteOptionRow {
  id: string;
  quoteId: string;
  name: string;
  sortOrder: number;
  isRecommended: boolean;
  adults: number;
  children: number;
  nights: number;
  markupPercent: number | null;
  totalNet: number;
  totalSell: number;
  totalMargin: number;
  marginPercent: number;
  markupPercentEffective: number;
  perPersonSell: number;
  lines: QuoteLineRow[];
  advisory?: Advisory;
}

export interface QuoteDetail {
  id: string;
  quoteNumber: string;
  title: string | null;
  status: string;
  leadId: string;
  validUntil: string | null;
  notes: string | null;
  terms: string | null;
  createdAt: string;
  lead: { id: string; name: string; phone: string; email: string | null };
  options: QuoteOptionRow[];
}

export interface QuoteListRow {
  id: string;
  quoteNumber: string;
  title: string | null;
  status: string;
  createdAt: string;
  lead: { id: string; name: string; phone: string };
  options: { id: string; name: string; totalSell: number; marginPercent: number }[];
}

export interface VendorRateRow {
  id: string;
  variant: string;
  season: string;
  mealPlan: string | null;
  rateBasis: string;
  netRate: number;
  rackRate: number | null;
  vendor: {
    id: string;
    name: string;
    type: string;
    city: string | null;
    contactRedacted?: boolean;
  };
}

export interface PricingSettings {
  defaultMarkupPercent: number;
  minMarginPercent: number;
  monthlyOverhead: number | null;
  filesPerMonth: number | null;
  roundTo: number;
  gstPercent: number;
}
GLITZEOF
mkdir -p "src/components"
cat > 'src/components/rate-picker.tsx' << 'GLITZEOF'
'use client';

import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { api, type VendorRateRow } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/badge';
import { SEASONS, humanise } from '@/lib/constants';
import { money } from '@/lib/format';

/**
 * Pulls contracted rates straight out of the supplier book into a quote.
 * Retyping a net rate is how the wrong number ends up in a client's hands.
 */
export function RatePicker({
  onPick,
  busy,
}: {
  onPick: (rate: VendorRateRow, quantity: number, units: number) => void;
  busy?: boolean;
}) {
  const [city, setCity] = useState('');
  const [variant, setVariant] = useState('');
  const [season, setSeason] = useState('PEAK');
  const [rates, setRates] = useState<VendorRateRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const p = new URLSearchParams();
    if (city.trim()) p.set('city', city.trim());
    if (variant.trim()) p.set('variant', variant.trim());
    if (season) p.set('season', season);
    try {
      setRates(await api.get<VendorRateRow[]>(`/vendors/rates/search?${p}`));
    } catch {
      setRates([]);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="City — Srinagar"
          className="w-[160px]"
          aria-label="City"
        />
        <Input
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Room or vehicle"
          className="w-[170px]"
          aria-label="Variant"
        />
        <div className="w-[130px]">
          <Select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            aria-label="Season"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {humanise(s)}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" size="md" onClick={search} disabled={loading}>
          <Search className="size-4" strokeWidth={1.75} />
          {loading ? 'Searching…' : 'Find rates'}
        </Button>
      </div>

      {searched && rates.length === 0 && (
        <p className="text-[12px] text-ink-500">
          No contracted rates match. Add the line by hand below, or add the rate
          under Suppliers first.
        </p>
      )}

      {rates.length > 0 && (
        <div className="max-h-[240px] overflow-y-auto rounded-md border border-ink-800">
          {rates.map((r) => (
            <RateRow key={r.id} rate={r} onPick={onPick} busy={busy} />
          ))}
        </div>
      )}
    </div>
  );
}

function RateRow({
  rate,
  onPick,
  busy,
}: {
  rate: VendorRateRow;
  onPick: (r: VendorRateRow, q: number, u: number) => void;
  busy?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [units, setUnits] = useState(1);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-ink-800/60 px-3 py-2.5 last:border-0 transition-colors hover:bg-ink-850">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink-100">
          {rate.vendor.name}
          <span className="text-ink-500"> · {rate.variant}</span>
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <Chip>{humanise(rate.vendor.type)}</Chip>
          {rate.mealPlan && <Chip>{rate.mealPlan}</Chip>}
          {rate.vendor.city && (
            <span className="text-[11px] text-ink-600">{rate.vendor.city}</span>
          )}
        </div>
      </div>

      <span className="tabular text-[13px] text-ink-200">
        {money(rate.netRate)}
      </span>

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="tabular h-8 w-12 rounded border border-ink-700 bg-ink-950/60 px-1.5 text-center text-[12px] text-ink-100 focus:border-signal-500 focus:outline-none"
          aria-label="Quantity"
          title="Rooms / vehicles"
        />
        <span className="text-[11px] text-ink-600">×</span>
        <input
          type="number"
          min={1}
          value={units}
          onChange={(e) => setUnits(Math.max(1, Number(e.target.value)))}
          className="tabular h-8 w-12 rounded border border-ink-700 bg-ink-950/60 px-1.5 text-center text-[12px] text-ink-100 focus:border-signal-500 focus:outline-none"
          aria-label="Units"
          title="Nights / days"
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => onPick(rate, quantity, units)}
        >
          <Plus className="size-4" strokeWidth={1.75} />
          Add
        </Button>
      </div>
    </div>
  );
}
GLITZEOF
mkdir -p "src/app/(app)/quotes"
cat > 'src/app/(app)/quotes/page.tsx' << 'GLITZEOF'
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { api, ApiError, type QuoteListRow } from '@/lib/api';
import { Panel } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Stage } from '@/components/ui/badge';
import { marginHealth, money, relativeDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function QuotesPage() {
  const [rows, setRows] = useState<QuoteListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<QuoteListRow[]>('/quotes')
      .then(setRows)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'Could not load quotations.'),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink-50">
          Quotations
        </h1>
        <p className="mt-0.5 text-[13px] text-ink-400">
          {rows.length} quotation{rows.length === 1 ? '' : 's'}
        </p>
      </header>

      <Panel className="overflow-hidden">
        {error ? (
          <div className="px-5 py-10 text-center text-[13px] text-loss-400">
            {error}
          </div>
        ) : loading ? (
          <div className="divide-y divide-ink-800/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4">
                <div className="h-3 w-44 animate-pulse rounded bg-ink-800" />
                <div className="ml-auto h-3 w-20 animate-pulse rounded bg-ink-850" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <FileText
              aria-hidden
              strokeWidth={1.25}
              className="mx-auto size-6 text-ink-600"
            />
            <p className="mt-3 text-[13px] text-ink-300">No quotations yet</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Open a lead and choose “Build quotation”.
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-4">
              <Link href="/leads">Go to leads</Link>
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.09em] text-ink-500">
                <th className="px-5 py-2.5 font-medium">Quotation</th>
                <th className="px-5 py-2.5 font-medium">Client</th>
                <th className="px-5 py-2.5 font-medium">Tiers</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q, i) => (
                <tr
                  key={q.id}
                  className="group rise border-b border-ink-800/60 transition-colors last:border-0 hover:bg-ink-850"
                  style={{ animationDelay: `${Math.min(i, 12) * 18}ms` }}
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/quotes/${q.id}`}
                      className="font-medium text-ink-100 transition-colors group-hover:text-signal-300"
                    >
                      {q.title || 'Untitled'}
                    </Link>
                    <div className="tabular mt-0.5 text-[11px] text-ink-500">
                      {q.quoteNumber}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-300">{q.lead?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {q.options.length === 0 ? (
                        <span className="text-[12px] text-ink-600">No tiers</span>
                      ) : (
                        q.options.map((o) => {
                          const h = marginHealth(o.marginPercent);
                          return (
                            <span
                              key={o.id}
                              className="inline-flex items-center gap-1.5 rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5"
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  'size-1.5 rounded-full',
                                  h === 'healthy'
                                    ? 'bg-healthy-500'
                                    : h === 'warn'
                                      ? 'bg-warn-500'
                                      : 'bg-loss-500',
                                )}
                              />
                              <span className="text-[11px] text-ink-300">
                                {o.name}
                              </span>
                              <span className="tabular text-[11px] text-ink-500">
                                {money(o.totalSell)}
                              </span>
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Stage value={q.status} />
                  </td>
                  <td className="tabular px-5 py-3 text-right text-[12px] text-ink-500">
                    {relativeDate(q.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
GLITZEOF
mkdir -p "src/app/(app)/quotes/new"
cat > 'src/app/(app)/quotes/new/page.tsx' << 'GLITZEOF'
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError, type LeadDetail, type QuoteDetail } from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[560px] px-8 py-10">
          <div className="h-4 w-40 animate-pulse rounded bg-ink-800" />
        </div>
      }
    >
      <NewQuoteForm />
    </Suspense>
  );
}

function NewQuoteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const leadId = params.get('leadId') ?? '';

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) return;
    api
      .get<LeadDetail>(`/leads/${leadId}`)
      .then((l) => {
        setLead(l);
        setTitle(
          l.destination
            ? `${l.destination}${l.nights ? ` ${l.nights}N` : ''} — ${l.name}`
            : `Package for ${l.name}`,
        );
      })
      .catch(() => setError('That lead could not be found.'));
  }, [leadId]);

  // default validity: two weeks out, the usual shelf life of a hotel hold
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setValidUntil(d.toISOString().slice(0, 10));
  }, []);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const quote = await api.post<QuoteDetail>('/quotes', {
        leadId,
        title: title.trim() || undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      });
      router.replace(`/quotes/${quote.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create the quotation.');
      setBusy(false);
    }
  }

  if (!leadId) {
    return (
      <div className="mx-auto max-w-[560px] px-8 py-10">
        <Panel>
          <PanelBody className="py-10 text-center">
            <p className="text-[13px] text-ink-300">Start from a lead</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Quotations belong to an enquiry. Open the lead and choose “Build
              quotation”.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => router.push('/leads')}
            >
              Go to leads
            </Button>
          </PanelBody>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] px-8 py-10">
      <h1 className="text-xl font-semibold tracking-tight text-ink-50">
        New quotation
      </h1>
      <p className="mt-0.5 text-[13px] text-ink-400">
        {lead ? `for ${lead.name}` : 'Loading the enquiry…'}
      </p>

      <Panel className="mt-6">
        <PanelHeader>
          <PanelTitle>Details</PanelTitle>
        </PanelHeader>
        <PanelBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kashmir 5N/6D — Sharma family"
            />
            <p className="text-[11px] text-ink-600">
              The client sees this. Name the trip, not the file.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="valid">Hold prices until</Label>
            <Input
              id="valid"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="tabular"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-400"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={create} disabled={busy}>
              {busy ? 'Creating…' : 'Create and add tiers'}
            </Button>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
GLITZEOF
mkdir -p "src/app/(app)/quotes/[id]"
cat > 'src/app/(app)/quotes/[id]/page.tsx' << 'GLITZEOF'
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Plus,
  Send,
  Trash2,
  TriangleAlert,
  Star,
} from 'lucide-react';
import {
  api,
  ApiError,
  type PricingSettings,
  type QuoteDetail,
  type QuoteLineRow,
  type QuoteOptionRow,
  type VendorRateRow,
} from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Chip } from '@/components/ui/badge';
import { MarginRibbon } from '@/components/margin-ribbon';
import { RatePicker } from '@/components/rate-picker';
import {
  MARKUP_HINT,
  MARKUP_MODES,
  QUOTE_STATUSES,
  SERVICE_TYPES,
  humanise,
} from '@/lib/constants';
import { marginHealth, money, percent } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function QuoteBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (keepActive = true) => {
      try {
        const data = await api.get<QuoteDetail>(`/quotes/${id}`);
        setQuote(data);
        setActiveId((prev) => {
          if (keepActive && prev && data.options.some((o) => o.id === prev)) {
            return prev;
          }
          return data.options[0]?.id ?? null;
        });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load this quotation.');
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load();
    api.get<PricingSettings>('/settings/pricing').then(setSettings).catch(() => {});
  }, [load]);

  async function act<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That did not save.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <div className="h-4 w-48 animate-pulse rounded bg-ink-800" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-[1180px] px-8 py-8">
        <Panel className="border-loss-500/40 bg-loss-500/5">
          <PanelBody>
            <p className="text-[13px] text-ink-100">{error ?? 'Not found.'}</p>
          </PanelBody>
        </Panel>
      </div>
    );
  }

  const active = quote.options.find((o) => o.id === activeId) ?? null;
  const minMargin = settings?.minMarginPercent ?? 15;

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-3"
        onClick={() => router.push('/quotes')}
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Quotations
      </Button>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-ink-50">
              {quote.title || 'Untitled quotation'}
            </h1>
            <Chip>{quote.quoteNumber}</Chip>
          </div>
          <p className="mt-1 text-[13px] text-ink-400">
            for{' '}
            <Link
              href={`/leads/${quote.leadId}`}
              className="text-signal-400 transition-colors hover:text-signal-300"
            >
              {quote.lead.name}
            </Link>
            <span className="tabular text-ink-500"> · {quote.lead.phone}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-[150px]">
            <Select
              value={quote.status}
              disabled={busy}
              aria-label="Quotation status"
              onChange={(e) =>
                act(() => api.patch(`/quotes/${id}`, { status: e.target.value }))
              }
            >
              {QUOTE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanise(s)}
                </option>
              ))}
            </Select>
          </div>
          {quote.status === 'DRAFT' && (
            <Button
              disabled={busy || quote.options.length === 0}
              onClick={() =>
                act(() => api.patch(`/quotes/${id}`, { status: 'SENT' }))
              }
            >
              <Send className="size-4" strokeWidth={1.75} />
              Mark as sent
            </Button>
          )}
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

      {/* Comparison strip — every tier's price and margin at a glance */}
      <div className="mb-4 flex flex-wrap gap-3">
        {quote.options.map((o) => (
          <TierCard
            key={o.id}
            option={o}
            active={o.id === activeId}
            minMargin={minMargin}
            onSelect={() => setActiveId(o.id)}
          />
        ))}
        <AddTier
          busy={busy}
          onAdd={(name) =>
            act(() => api.post(`/quotes/${id}/options`, { name, sortOrder: quote.options.length }))
          }
        />
      </div>

      {!active ? (
        <Panel>
          <PanelBody className="py-12 text-center">
            <p className="text-[13px] text-ink-300">No package tiers yet</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Add one above — “Standard” is a good first tier. You can copy it
              later to build Deluxe.
            </p>
          </PanelBody>
        </Panel>
      ) : (
        <TierEditor
          key={active.id}
          quoteId={quote.id}
          option={active}
          busy={busy}
          minMargin={minMargin}
          act={act}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ tiers */

function TierCard({
  option,
  active,
  minMargin,
  onSelect,
}: {
  option: QuoteOptionRow;
  active: boolean;
  minMargin: number;
  onSelect: () => void;
}) {
  const health = marginHealth(option.marginPercent, minMargin);
  const dot =
    health === 'healthy'
      ? 'bg-healthy-500'
      : health === 'warn'
        ? 'bg-warn-500'
        : 'bg-loss-500';

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group min-w-[190px] rounded-[10px] border px-4 py-3 text-left',
        'transition-[transform,border-color,background-color] duration-200 ease-out',
        'hover:-translate-y-px',
        active
          ? 'border-signal-500/60 bg-ink-850'
          : 'border-ink-700 bg-ink-900 hover:border-ink-600',
      )}
    >
      <div className="flex items-center gap-1.5">
        {option.isRecommended && (
          <Star className="size-3 text-ink-300" strokeWidth={2} fill="currentColor" />
        )}
        <span className="text-[13px] font-medium text-ink-100">{option.name}</span>
        <span className={cn('ml-auto size-1.5 rounded-full', dot)} aria-hidden />
      </div>
      <p className="tabular mt-2 text-lg font-semibold leading-none text-ink-50">
        {money(option.totalSell)}
      </p>
      <p className="tabular mt-1.5 text-[11px] text-ink-500">
        {percent(option.marginPercent)} margin
        {option.perPersonSell > 0 && ` · ${money(option.perPersonSell)} pp`}
      </p>
    </button>
  );
}

function AddTier({
  onAdd,
  busy,
}: {
  onAdd: (name: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="min-w-[150px] rounded-[10px] border border-dashed border-ink-700 px-4 py-3 text-left text-[13px] text-ink-500 transition-colors duration-150 hover:border-ink-600 hover:text-ink-300"
      >
        <Plus className="mb-1 size-4" strokeWidth={1.75} />
        <span className="block">Add a tier</span>
      </button>
    );
  }

  return (
    <div className="flex min-w-[210px] flex-col gap-2 rounded-[10px] border border-ink-700 bg-ink-900 p-3">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            onAdd(name.trim());
            setName('');
            setOpen(false);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Budget / Deluxe"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={busy || !name.trim()}
          onClick={() => {
            onAdd(name.trim());
            setName('');
            setOpen(false);
          }}
        >
          Add
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- editor */

function TierEditor({
  quoteId,
  option,
  busy,
  minMargin,
  act,
}: {
  quoteId: string;
  option: QuoteOptionRow;
  busy: boolean;
  minMargin: number;
  act: <T>(fn: () => Promise<T>) => Promise<void>;
}) {
  const advisory = option.advisory;
  const showWarnings =
    advisory && advisory.warnings.filter((w) => !w.startsWith('Break-even not')).length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <Panel>
          <PanelHeader>
            <PanelTitle>{option.name} — services</PanelTitle>
            <span className="tabular text-[11px] text-ink-500">
              {option.lines.length} line{option.lines.length === 1 ? '' : 's'}
            </span>
          </PanelHeader>

          {option.lines.length === 0 ? (
            <PanelBody className="py-8 text-center">
              <p className="text-[13px] text-ink-300">No services yet</p>
              <p className="mt-1 text-[12px] text-ink-500">
                Pull in a contracted rate below, or add a line by hand.
              </p>
            </PanelBody>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.09em] text-ink-500">
                    <th className="px-4 py-2.5 font-medium">Service</th>
                    <th className="px-2 py-2.5 text-center font-medium">Qty</th>
                    <th className="px-2 py-2.5 text-center font-medium">Units</th>
                    <th className="px-2 py-2.5 text-right font-medium">Net each</th>
                    <th className="px-2 py-2.5 font-medium">Markup</th>
                    <th className="px-2 py-2.5 text-right font-medium">Cost</th>
                    <th className="px-2 py-2.5 text-right font-medium">Sell</th>
                    <th className="px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {option.lines.map((line) => (
                    <LineRow key={line.id} line={line} busy={busy} act={act} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Add from your supplier rates</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <RatePicker
              busy={busy}
              onPick={(rate: VendorRateRow, quantity, units) =>
                act(() =>
                  api.post(`/quotes/options/${option.id}/lines/from-rate`, {
                    rateId: rate.id,
                    quantity,
                    units,
                  }),
                )
              }
            />
          </PanelBody>
        </Panel>

        <ManualLine optionId={option.id} busy={busy} act={act} />
      </div>

      {/* Right rail: the verdict */}
      <div className="space-y-4">
        <Panel className="sticky top-6">
          <PanelHeader>
            <PanelTitle>What this tier makes</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-4">
            <MarginRibbon
              sell={option.totalSell}
              cost={option.totalNet}
              minMargin={minMargin}
            />

            <dl className="space-y-2 border-t border-ink-800 pt-3 text-[13px]">
              <Line label="Cost" value={money(option.totalNet)} />
              <Line label="Sell" value={money(option.totalSell)} strong />
              <Line
                label="Margin"
                value={`${percent(option.marginPercent)}`}
                hint="profit ÷ sell"
              />
              <Line
                label="Markup"
                value={`${percent(option.markupPercentEffective)}`}
                hint="profit ÷ cost"
              />
              {option.perPersonSell > 0 && (
                <Line label="Per person" value={money(option.perPersonSell)} />
              )}
            </dl>

            {showWarnings && advisory && (
              <div className="rounded-md border border-warn-500/40 bg-warn-500/10 p-3">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="size-3.5 text-warn-400" strokeWidth={2} />
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-warn-400">
                    Priced too low
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {advisory.warnings
                    .filter((w) => !w.startsWith('Break-even not'))
                    .map((w) => (
                      <li key={w} className="text-[12px] leading-relaxed text-ink-300">
                        {w}
                      </li>
                    ))}
                </ul>
                {advisory.shortfall > 0 && (
                  <p className="tabular mt-2 border-t border-warn-500/20 pt-2 text-[12px] text-warn-400">
                    Sell at {money(advisory.suggestedMinSell)} — add{' '}
                    {money(advisory.shortfall)}
                  </p>
                )}
              </div>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Tier setup</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <NumField
                label="Adults"
                value={option.adults}
                busy={busy}
                onSave={(v) =>
                  act(() => api.patch(`/quotes/options/${option.id}`, { adults: v }))
                }
              />
              <NumField
                label="Children"
                value={option.children}
                busy={busy}
                onSave={(v) =>
                  act(() => api.patch(`/quotes/options/${option.id}`, { children: v }))
                }
              />
              <NumField
                label="Nights"
                value={option.nights}
                busy={busy}
                onSave={(v) =>
                  act(() => api.patch(`/quotes/options/${option.id}`, { nights: v }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tier markup override</Label>
              <Input
                type="number"
                defaultValue={option.markupPercent ?? ''}
                placeholder="Uses your default"
                disabled={busy}
                onBlur={(e) => {
                  const raw = e.target.value.trim();
                  const next = raw === '' ? null : Number(raw);
                  if (next !== option.markupPercent) {
                    act(() =>
                      api.patch(`/quotes/options/${option.id}`, {
                        markupPercent: next,
                      }),
                    );
                  }
                }}
              />
              <p className="text-[11px] text-ink-600">
                Applies to every line set to “Default markup”.
              </p>
            </div>

            <div className="flex gap-2 border-t border-ink-800 pt-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() =>
                  act(() =>
                    api.post(`/quotes/options/${option.id}/duplicate`, {
                      name: `${option.name} copy`,
                    }),
                  )
                }
              >
                <Copy className="size-4" strokeWidth={1.75} />
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  if (confirm(`Delete the “${option.name}” tier and its lines?`)) {
                    act(() => api.del(`/quotes/options/${option.id}`));
                  }
                }}
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
                Delete
              </Button>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function LineRow({
  line,
  busy,
  act,
}: {
  line: QuoteLineRow;
  busy: boolean;
  act: <T>(fn: () => Promise<T>) => Promise<void>;
}) {
  function save(body: Record<string, unknown>) {
    act(() => api.patch(`/quotes/lines/${line.id}`, body));
  }

  return (
    <tr className="group border-b border-ink-800/60 transition-colors last:border-0 hover:bg-ink-850/60">
      <td className="px-4 py-2.5">
        <p className="text-ink-100">{line.description}</p>
        <Chip className="mt-1">{humanise(line.serviceType)}</Chip>
      </td>
      <td className="px-2 py-2.5 text-center">
        <Cell
          value={line.quantity}
          disabled={busy}
          onSave={(v) => save({ quantity: v })}
        />
      </td>
      <td className="px-2 py-2.5 text-center">
        <Cell value={line.units} disabled={busy} onSave={(v) => save({ units: v })} />
      </td>
      <td className="px-2 py-2.5 text-right">
        <Cell
          value={line.unitNet}
          width="w-20"
          disabled={busy}
          onSave={(v) => save({ unitNet: v })}
        />
      </td>
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1">
          <select
            value={line.markupMode}
            disabled={busy}
            onChange={(e) => save({ markupMode: e.target.value })}
            className="h-8 rounded border border-ink-700 bg-ink-950/60 px-1.5 text-[11px] text-ink-200 focus:border-signal-500 focus:outline-none"
            aria-label="Markup mode"
          >
            {MARKUP_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {line.markupMode !== 'INHERIT' && (
            <Cell
              value={line.markupValue ?? 0}
              width="w-16"
              disabled={busy}
              title={MARKUP_HINT[line.markupMode]}
              onSave={(v) => save({ markupValue: v })}
            />
          )}
        </div>
      </td>
      <td className="tabular px-2 py-2.5 text-right text-ink-400">
        {money(line.lineNet)}
      </td>
      <td className="tabular px-2 py-2.5 text-right font-medium text-ink-100">
        {money(line.lineSell)}
      </td>
      <td className="px-2 py-2.5">
        <button
          disabled={busy}
          onClick={() => act(() => api.del(`/quotes/lines/${line.id}`))}
          className="rounded p-1 text-ink-600 opacity-0 transition-[opacity,color] duration-150 hover:text-loss-400 focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Remove ${line.description}`}
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </button>
      </td>
    </tr>
  );
}

function ManualLine({
  optionId,
  busy,
  act,
}: {
  optionId: string;
  busy: boolean;
  act: <T>(fn: () => Promise<T>) => Promise<void>;
}) {
  const [serviceType, setServiceType] = useState('HOTEL');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [units, setUnits] = useState(1);
  const [unitNet, setUnitNet] = useState(0);

  const valid = description.trim().length > 0 && unitNet >= 0;

  function add() {
    act(() =>
      api.post(`/quotes/options/${optionId}/lines`, {
        serviceType,
        description: description.trim(),
        quantity,
        units,
        unitNet,
      }),
    ).then(() => {
      setDescription('');
      setUnitNet(0);
    });
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Add a line by hand</PanelTitle>
      </PanelHeader>
      <PanelBody>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-[130px] space-y-1.5">
            <Label>Type</Label>
            <Select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanise(t)}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[200px] flex-1 space-y-1.5">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && valid && add()}
              placeholder="Shikara ride, 1 hour"
            />
          </div>
          <div className="w-[70px] space-y-1.5">
            <Label>Qty</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="tabular text-center"
            />
          </div>
          <div className="w-[70px] space-y-1.5">
            <Label>Units</Label>
            <Input
              type="number"
              min={1}
              value={units}
              onChange={(e) => setUnits(Math.max(1, Number(e.target.value)))}
              className="tabular text-center"
            />
          </div>
          <div className="w-[110px] space-y-1.5">
            <Label>Net each</Label>
            <Input
              type="number"
              min={0}
              value={unitNet}
              onChange={(e) => setUnitNet(Math.max(0, Number(e.target.value)))}
              className="tabular text-right"
            />
          </div>
          <Button onClick={add} disabled={busy || !valid}>
            <Plus className="size-4" strokeWidth={1.75} />
            Add
          </Button>
        </div>
      </PanelBody>
    </Panel>
  );
}

/* ------------------------------------------------------------------ atoms */

/**
 * Inline numeric cell. Commits on blur or Enter, reverts on Escape —
 * the server recalculates and the returned totals win.
 */
function Cell({
  value,
  onSave,
  disabled,
  width = 'w-14',
  title,
}: {
  value: number;
  onSave: (v: number) => void;
  disabled?: boolean;
  width?: string;
  title?: string;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      type="number"
      title={title}
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = Number(draft);
        if (!Number.isNaN(n) && n !== value) onSave(n);
        else setDraft(String(value));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setDraft(String(value));
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cn(
        'tabular h-8 rounded border border-transparent bg-transparent px-1.5 text-center text-[12px] text-ink-200',
        'transition-[border-color,background-color] duration-150',
        'hover:border-ink-700 hover:bg-ink-950/60',
        'focus:border-signal-500 focus:bg-ink-950 focus:outline-none',
        width,
      )}
    />
  );
}

function NumField({
  label,
  value,
  onSave,
  busy,
}: {
  label: string;
  value: number;
  onSave: (v: number) => void;
  busy: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        defaultValue={value}
        disabled={busy}
        className="tabular text-center"
        onBlur={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n) && n !== value) onSave(n);
        }}
      />
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  hint,
}: {
  label: string;
  value: string;
  strong?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-500" title={hint}>
        {label}
      </dt>
      <dd
        className={cn(
          'tabular',
          strong ? 'text-[15px] font-semibold text-ink-50' : 'text-ink-200',
        )}
      >
        {value}
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
  git commit -qm "Phase 9: quotation builder with tiers, rate picker and live margin" || warn "commit skipped"
  ok "committed"
else
  warn "no git repo at project root — skipping commit"
fi

say "PHASE 9 COMPLETE"
cat << 'GLITZEOF'

Before this is useful, set your commercial policy once — the advisory is only
as good as these numbers:

  Open http://localhost:3001 and sign in, then from Git Bash:

    LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@glitz.local","password":"YOUR-PASSWORD"}')
    TOKEN=$(echo "$LOGIN" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

    curl -X PATCH http://localhost:3000/api/settings/pricing \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -d '{"defaultMarkupPercent":20,"hotelMarkupPercent":18,
           "transportMarkupPercent":30,"minMarginPercent":15,
           "monthlyOverhead":120000,"filesPerMonth":25,"roundTo":50}'

  monthlyOverhead and filesPerMonth are yours to be honest about — office,
  salaries, ad spend, divided by files you actually close. That is what makes
  "this quote does not cover your break-even" a real warning instead of noise.

Then try the flow:

  1. /leads -> open a lead -> "Build quotation"
  2. Add a tier called "Standard"
  3. Search your supplier rates (city "Srinagar") and add 2 rooms x 3 nights.
     No rates yet? Add a hotel and its rates under Suppliers first, or use
     "Add a line by hand".
  4. Watch the ribbon and margin update as you change quantities
  5. Set one line's markup to "Set sell price" and type a low number — the
     advisory should turn amber and tell you what to charge instead
  6. Duplicate the tier, rename it "Deluxe", swap in a better hotel

A note on what is NOT here yet: the client-facing PDF. That is next, using
@react-pdf/renderer — it renders without a headless browser, so it deploys to
Vercel cleanly where Puppeteer does not.

GLITZEOF
