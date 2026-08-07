#!/usr/bin/env bash
# ==============================================================================
# Glitz Holidays — FRONTEND  |  PHASE 9: Quotation builder
# ------------------------------------------------------------------------------
#   /quotes          every quotation, with the best margin of its tiers
#   /quotes/new      create against a lead (seeds a first tier so the
#                    builder is never an empty room)
#   /quotes/[id]     THE BUILDER
#
# How it works:
#   * Tiers as tabs, not columns. A comparison strip shows every tier's price
#     and margin at a glance; you edit inside one tier at a time. Three columns
#     of line items becomes unreadable past ~8 services.
#   * Numbers commit on BLUR, not per keystroke — typing "6200" would
#     otherwise fire four saves and four server recalculations.
#   * After any change the whole quote refetches. The server owns the pricing
#     chain (line -> tier -> totals); trusting local arithmetic to mirror it is
#     how a displayed margin drifts from the real one.
#   * "From supplier rates" pulls a stored net cost straight in, asking for
#     rooms x nights at insert time.
#   * The right rail shows margin AND markup separately, plus the price check:
#     the least you should charge, and by how much you are short.
#
# Needs one new package: @radix-ui/react-dialog
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
  die "Can't find the frontend. Run from your project root (the folder containing frontend/)."
fi
[ -f src/components/timeline.tsx ] || die "Phase 8 files missing — run phase-8.sh first."
ok "frontend found ($(pwd))"

say "Installing @radix-ui/react-dialog"
if [ -d node_modules/@radix-ui/react-dialog ]; then
  ok "already installed"
else
  npm install @radix-ui/react-dialog || die "npm install failed"
  ok "installed"
fi

say "Writing quotation builder"
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

export interface QuoteLine {
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

export interface QuoteOption {
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
  lines: QuoteLine[];
  advisory?: Advisory;
}

export interface QuoteRow {
  id: string;
  quoteNumber: string;
  title: string | null;
  status: string;
  validUntil: string | null;
  createdAt: string;
  lead?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  } | null;
  options: QuoteOption[];
}

export interface QuoteDetail extends QuoteRow {
  notes: string | null;
  terms: string | null;
}

export interface PricingSettings {
  defaultMarkupPercent: number;
  minMarginPercent: number;
  monthlyOverhead: number | null;
  filesPerMonth: number | null;
  gstPercent: number;
  roundTo: number;
  currency: string;
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
mkdir -p "src/app"
cat > 'src/app/globals.css' << 'GLITZEOF'
@import "tailwindcss";

/*
  GLITZ — instrument panel.
  The interface is graphite. Saturated colour is reserved for financial
  meaning only: margin health, cash position, overdue balance. If you see
  colour on a screen, it is telling you something about money.
*/
@theme {
  --color-ink-950: #0d1015;
  --color-ink-900: #12151b;
  --color-ink-850: #171b22;
  --color-ink-800: #1c212a;
  --color-ink-700: #262c38;
  --color-ink-600: #333b4a;
  --color-ink-500: #4a5566;
  --color-ink-400: #6b7688;
  --color-ink-300: #8b94a6;
  --color-ink-200: #b4bcc9;
  --color-ink-100: #dfe3ea;
  --color-ink-50:  #f2f4f8;

  --color-signal-600: #2c7a7d;
  --color-signal-500: #359296;
  --color-signal-400: #4bb0b3;
  --color-signal-300: #7ccbcd;

  --color-healthy-500: #3f9d6d;
  --color-healthy-400: #52b981;
  --color-warn-500:    #c08a2e;
  --color-warn-400:    #dda63f;
  --color-loss-500:    #b4483f;
  --color-loss-400:    #d0594e;

  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  --radius-panel: 10px;
}

:root { color-scheme: dark; }
html, body { height: 100%; }

body {
  background: var(--color-ink-950);
  color: var(--color-ink-100);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Every number in this product aligns. Money you misread is money you lose. */
.tabular {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

:focus-visible {
  outline: 2px solid var(--color-signal-400);
  outline-offset: 2px;
  border-radius: 3px;
}

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--color-ink-950); }
::-webkit-scrollbar-thumb {
  background: var(--color-ink-700);
  border-radius: 6px;
  border: 2px solid var(--color-ink-950);
}
::-webkit-scrollbar-thumb:hover { background: var(--color-ink-600); }

@keyframes rise {
  from { opacity: 0; transform: translate3d(0, 8px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
.rise { animation: rise 380ms cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes sweep {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
.sweep { animation: sweep 620ms cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: left; }

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes popIn {
  from { opacity: 0; transform: translate3d(-50%, -48%, 0) scale(0.98); }
  to   { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
GLITZEOF
mkdir -p "src/components/ui"
cat > 'src/components/ui/dialog.tsx' << 'GLITZEOF'
'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-[2px]',
          'data-[state=open]:animate-[fadeIn_160ms_ease-out]',
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2',
          'max-h-[85vh] overflow-hidden rounded-[10px] border border-ink-700 bg-ink-900',
          'shadow-[0_24px_64px_-16px_rgba(0,0,0,0.9)]',
          'data-[state=open]:animate-[popIn_180ms_cubic-bezier(0.16,1,0.3,1)]',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between border-b border-ink-800 px-5 py-3.5">
          <div>
            <DialogPrimitive.Title className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-200">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-1 text-[12px] text-ink-500">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close className="rounded p-1 text-ink-500 transition-colors hover:bg-ink-800 hover:text-ink-200">
            <X className="size-4" strokeWidth={1.75} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
GLITZEOF
mkdir -p "src/components"
cat > 'src/components/rate-picker.tsx' << 'GLITZEOF'
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { api, type VendorRateRow } from '@/lib/api';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/badge';
import { money } from '@/lib/format';
import { humanise } from '@/lib/constants';

const SEASONS = ['PEAK', 'SHOULDER', 'OFF', 'FESTIVE'];
const TYPES = ['HOTEL', 'HOUSEBOAT', 'TRANSPORT', 'GUIDE', 'ACTIVITY'];

/**
 * Pulls a stored supplier rate straight into a quote so nobody retypes a net
 * cost from memory. Quantity and units are asked for at insert time because
 * "2 rooms x 3 nights" is the actual unit of thought, not a rate id.
 */
export function RatePicker({
  onPick,
}: {
  onPick: (rateId: string, quantity: number, units: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<VendorRateRow[]>([]);
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [season, setSeason] = useState('PEAK');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [qty, setQty] = useState('1');
  const [units, setUnits] = useState('1');

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (type) params.set('type', type);
    if (season) params.set('season', season);
    try {
      const res = await api.get<VendorRateRow[]>(
        `/vendors/rates/search?${params}`,
      );
      setRows(res);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [city, type, season]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(search, city ? 260 : 0);
    return () => clearTimeout(t);
  }, [open, search, city]);

  async function pick(rate: VendorRateRow) {
    setBusyId(rate.id);
    try {
      await onPick(rate.id, Number(qty) || 1, Number(units) || 1);
      setOpen(false);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Plus className="size-4" strokeWidth={1.75} />
          From supplier rates
        </Button>
      </DialogTrigger>

      <DialogContent
        title="Supplier rates"
        description="Net costs from your rate book. Quantity x units is applied on insert."
      >
        <div className="border-b border-ink-800 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[160px] flex-1">
              <Search
                aria-hidden
                strokeWidth={1.75}
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-500"
              />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="pl-8"
                aria-label="Filter by city"
              />
            </div>
            <div className="w-[136px]">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                aria-label="Supplier type"
              >
                <option value="">All types</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {humanise(t)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-[124px]">
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
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.08em] text-ink-500">
              Insert as
            </span>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="h-8 w-16 text-center"
              aria-label="Quantity, e.g. rooms"
            />
            <span className="text-[12px] text-ink-500">rooms/units ×</span>
            <Input
              type="number"
              min={1}
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="h-8 w-16 text-center"
              aria-label="Units, e.g. nights"
            />
            <span className="text-[12px] text-ink-500">nights/days</span>
          </div>
        </div>

        <div className="max-h-[46vh] overflow-y-auto">
          {loading ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-500">
              Searching…
            </p>
          ) : rows.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-ink-300">No rates found</p>
              <p className="mt-1 text-[12px] text-ink-500">
                Add suppliers and their seasonal rates first, or widen the filters.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-800/60">
              {rows.map((rate) => (
                <li
                  key={rate.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-ink-850"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink-100">
                      {rate.vendor.name}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
                      <span>{rate.variant}</span>
                      {rate.mealPlan && <Chip>{rate.mealPlan}</Chip>}
                      <Chip>{humanise(rate.season)}</Chip>
                      {rate.vendor.city && <span>· {rate.vendor.city}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-[13px] text-ink-100">
                      {money(rate.netRate)}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-ink-600">
                      net
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={busyId === rate.id}
                    onClick={() => pick(rate)}
                  >
                    {busyId === rate.id ? 'Adding…' : 'Add'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
GLITZEOF
mkdir -p "src/app/(app)/quotes"
cat > 'src/app/(app)/quotes/page.tsx' << 'GLITZEOF'
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { api, ApiError, type QuoteRow } from '@/lib/api';
import { Panel } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Stage, Chip } from '@/components/ui/badge';
import { money, percent, relativeDate, marginHealth, healthText } from '@/lib/format';

export default function QuotesPage() {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<QuoteRow[]>('/quotes')
      .then(setRows)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'Could not load quotations.'),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-8">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-50">
            Quotations
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-400">
            {rows.length} quotation{rows.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/leads">Start from a lead</Link>
        </Button>
      </header>

      <Panel className="overflow-hidden">
        {error ? (
          <p className="px-5 py-10 text-center text-[13px] text-loss-400">{error}</p>
        ) : loading ? (
          <div className="divide-y divide-ink-800/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-3.5">
                <div className="h-3 w-40 animate-pulse rounded bg-ink-800" />
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
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.09em] text-ink-500">
                <th className="px-5 py-2.5 font-medium">Quotation</th>
                <th className="px-5 py-2.5 font-medium">Client</th>
                <th className="px-5 py-2.5 font-medium">Tiers</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Best margin</th>
                <th className="px-5 py-2.5 text-right font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q, i) => {
                const best = q.options.reduce<number | null>(
                  (acc, o) =>
                    acc === null || o.marginPercent > acc ? o.marginPercent : acc,
                  null,
                );
                const top = q.options.reduce<number>(
                  (acc, o) => Math.max(acc, o.totalSell),
                  0,
                );
                return (
                  <tr
                    key={q.id}
                    className="group rise border-b border-ink-800/60 transition-colors duration-150 last:border-0 hover:bg-ink-850"
                    style={{ animationDelay: `${Math.min(i, 10) * 18}ms` }}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/quotes/${q.id}`}
                        className="font-medium text-ink-100 transition-colors group-hover:text-signal-300"
                      >
                        {q.title ?? 'Untitled package'}
                      </Link>
                      <div className="tabular mt-0.5 text-[11px] text-ink-500">
                        {q.quoteNumber}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-300">
                      {q.lead?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {q.options.length === 0 ? (
                          <span className="text-ink-600">none</span>
                        ) : (
                          q.options.map((o) => <Chip key={o.id}>{o.name}</Chip>)
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Stage value={q.status} />
                    </td>
                    <td className="tabular px-5 py-3 text-right">
                      {best === null ? (
                        <span className="text-ink-600">—</span>
                      ) : (
                        <>
                          <span className={healthText[marginHealth(best)]}>
                            {percent(best)}
                          </span>
                          <div className="text-[11px] text-ink-600">
                            {money(top)}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="tabular px-5 py-3 text-right text-[12px] text-ink-500">
                      {relativeDate(q.createdAt)}
                    </td>
                  </tr>
                );
              })}
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
import { ArrowLeft } from 'lucide-react';
import { api, ApiError, type LeadDetail, type QuoteDetail } from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

function NewQuoteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const leadId = params.get('leadId');

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
      .catch(() => setError('Could not load that lead.'));
  }, [leadId]);

  // default validity: two weeks out, the usual life of a Kashmir quote
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setValidUntil(d.toISOString().slice(0, 10));
  }, []);

  async function create() {
    if (!leadId) return;
    setBusy(true);
    setError(null);
    try {
      const quote = await api.post<QuoteDetail>('/quotes', {
        leadId,
        title: title.trim() || undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      });
      // seed a first tier so the builder is never an empty room
      await api.post(`/quotes/${quote.id}/options`, {
        name: 'Standard',
        adults: lead?.adults ?? 2,
        children: lead?.children ?? 0,
        nights: lead?.nights ?? 0,
        sortOrder: 0,
      });
      router.replace(`/quotes/${quote.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create the quotation.');
      setBusy(false);
    }
  }

  if (!leadId) {
    return (
      <div className="mx-auto max-w-[560px] px-8 py-8">
        <Panel>
          <PanelBody className="py-10 text-center">
            <p className="text-[13px] text-ink-300">Start from a lead</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Quotations belong to a client, so open the lead first.
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
    <div className="mx-auto max-w-[560px] px-8 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-3"
        onClick={() => router.push(`/leads/${leadId}`)}
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} />
        Back to lead
      </Button>

      <Panel>
        <PanelHeader>
          <PanelTitle>New quotation</PanelTitle>
        </PanelHeader>
        <PanelBody className="space-y-4">
          {lead && (
            <p className="text-[13px] text-ink-400">
              For <span className="text-ink-100">{lead.name}</span>
              <span className="tabular"> · {lead.phone}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="t">Package name</Label>
            <Input
              id="t"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kashmir 5N/6D — family"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="v">Valid until</Label>
            <Input
              id="v"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
            <p className="text-[11px] text-ink-600">
              Rates move. Two weeks is the usual life of a quote.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-loss-500/40 bg-loss-500/10 px-3 py-2 text-[13px] text-loss-400"
            >
              {error}
            </p>
          )}

          <Button onClick={create} disabled={busy} className="w-full" size="lg">
            {busy ? 'Creating…' : 'Create and start building'}
          </Button>
        </PanelBody>
      </Panel>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[560px] px-8 py-8">
          <div className="h-4 w-40 animate-pulse rounded bg-ink-800" />
        </div>
      }
    >
      <NewQuoteForm />
    </Suspense>
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
  Trash2,
  TriangleAlert,
  CheckCircle2,
} from 'lucide-react';
import {
  api,
  ApiError,
  type QuoteDetail,
  type QuoteLine,
  type QuoteOption,
  type PricingSettings,
} from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Chip } from '@/components/ui/badge';
import { MarginRibbon } from '@/components/margin-ribbon';
import { RatePicker } from '@/components/rate-picker';
import { money, percent, marginHealth, healthText } from '@/lib/format';
import { humanise } from '@/lib/constants';
import { cn } from '@/lib/utils';

const SERVICE_TYPES = [
  'HOTEL',
  'TRANSPORT',
  'ACTIVITY',
  'FLIGHT',
  'GUIDE',
  'MEAL',
  'PERMIT',
  'MISC',
];
const MARKUP_MODES = ['INHERIT', 'PERCENT', 'FIXED', 'MANUAL'];
const QUOTE_STATUSES = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'REVISED',
];

export default function QuoteBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The server owns the pricing chain (line -> option -> totals), so every
   * mutation refetches rather than patching local state. Slightly chattier,
   * but the margin you see is always the margin the server computed.
   */
  const load = useCallback(async () => {
    try {
      const data = await api.get<QuoteDetail>(`/quotes/${id}`);
      setQuote(data);
      setActiveTier((cur) =>
        cur && data.options.some((o) => o.id === cur)
          ? cur
          : (data.options[0]?.id ?? null),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load this quotation.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    api.get<PricingSettings>('/settings/pricing').then(setSettings).catch(() => {});
  }, [load]);

  async function mutate(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That change did not save.');
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/quotes')}>
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Quotations
        </Button>
        <Panel className="mt-4 border-loss-500/40 bg-loss-500/5">
          <PanelBody>
            <p className="text-[13px] text-ink-100">{error ?? 'Not found.'}</p>
          </PanelBody>
        </Panel>
      </div>
    );
  }

  const tier = quote.options.find((o) => o.id === activeTier) ?? null;
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
              {quote.title ?? 'Untitled package'}
            </h1>
            <Chip className="tabular">{quote.quoteNumber}</Chip>
          </div>
          {quote.lead && (
            <p className="mt-1 text-[13px] text-ink-400">
              for{' '}
              <Link
                href={`/leads/${quote.lead.id}`}
                className="text-signal-400 transition-colors hover:text-signal-300"
              >
                {quote.lead.name}
              </Link>
              <span className="tabular"> · {quote.lead.phone}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-[150px]">
            <Select
              value={quote.status}
              disabled={busy}
              aria-label="Quotation status"
              onChange={(e) =>
                mutate(() => api.patch(`/quotes/${id}`, { status: e.target.value }))
              }
            >
              {QUOTE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {humanise(s)}
                </option>
              ))}
            </Select>
          </div>
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

      {/* Comparison strip — every tier at a glance before you go editing one */}
      <div className="mb-4 flex flex-wrap gap-3">
        {quote.options.map((o) => (
          <TierCard
            key={o.id}
            option={o}
            active={o.id === activeTier}
            minMargin={minMargin}
            onSelect={() => setActiveTier(o.id)}
          />
        ))}
        <AddTier
          disabled={busy}
          onAdd={(name) =>
            mutate(async () => {
              const created = await api.post<QuoteOption>(
                `/quotes/${id}/options`,
                { name, sortOrder: quote.options.length },
              );
              setActiveTier(created.id);
            })
          }
        />
      </div>

      {!tier ? (
        <Panel>
          <PanelBody className="py-14 text-center">
            <p className="text-[13px] text-ink-300">No package tiers yet</p>
            <p className="mt-1 text-[12px] text-ink-500">
              Add one above — call it Budget, Standard, Deluxe, whatever you
              quote.
            </p>
          </PanelBody>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <Panel>
              <PanelHeader>
                <PanelTitle>{tier.name} — services</PanelTitle>
                <div className="flex gap-2">
                  <RatePicker
                    onPick={(rateId, quantity, units) =>
                      mutate(() =>
                        api.post(`/quotes/options/${tier.id}/lines/from-rate`, {
                          rateId,
                          quantity,
                          units,
                        }),
                      )
                    }
                  />
                </div>
              </PanelHeader>

              {tier.lines.length === 0 ? (
                <PanelBody className="py-10 text-center">
                  <p className="text-[13px] text-ink-300">No services yet</p>
                  <p className="mt-1 text-[12px] text-ink-500">
                    Pull rates from your supplier book, or add a line below.
                  </p>
                </PanelBody>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.09em] text-ink-500">
                        <th className="px-4 py-2.5 font-medium">Service</th>
                        <th className="w-14 px-2 py-2.5 text-center font-medium">
                          Qty
                        </th>
                        <th className="w-14 px-2 py-2.5 text-center font-medium">
                          Units
                        </th>
                        <th className="w-24 px-2 py-2.5 text-right font-medium">
                          Net each
                        </th>
                        <th className="w-24 px-2 py-2.5 text-right font-medium">
                          Cost
                        </th>
                        <th className="w-32 px-2 py-2.5 font-medium">Markup</th>
                        <th className="w-24 px-2 py-2.5 text-right font-medium">
                          Sell
                        </th>
                        <th className="w-8 px-2 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {tier.lines.map((line) => (
                        <LineRow
                          key={line.id}
                          line={line}
                          busy={busy}
                          onPatch={(body) =>
                            mutate(() =>
                              api.patch(`/quotes/lines/${line.id}`, body),
                            )
                          }
                          onDelete={() =>
                            mutate(() => api.del(`/quotes/lines/${line.id}`))
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-ink-800 p-4">
                <AddLine
                  disabled={busy}
                  onAdd={(body) =>
                    mutate(() =>
                      api.post(`/quotes/options/${tier.id}/lines`, body),
                    )
                  }
                />
              </div>
            </Panel>
          </div>

          {/* Right rail: the verdict */}
          <div className="space-y-4">
            <Panel>
              <PanelHeader>
                <PanelTitle>What you make</PanelTitle>
              </PanelHeader>
              <PanelBody className="space-y-4">
                <MarginRibbon
                  sell={tier.totalSell}
                  cost={tier.totalNet}
                  minMargin={minMargin}
                />

                <dl className="space-y-2 border-t border-ink-800 pt-3 text-[13px]">
                  <Fact label="Cost" value={money(tier.totalNet)} />
                  <Fact label="Sell" value={money(tier.totalSell)} />
                  <Fact
                    label="Per person"
                    value={money(tier.perPersonSell)}
                  />
                  <Fact
                    label="Margin"
                    value={percent(tier.marginPercent)}
                    hint="profit ÷ sell"
                  />
                  <Fact
                    label="Markup"
                    value={percent(tier.markupPercentEffective)}
                    hint="profit ÷ cost"
                  />
                </dl>
              </PanelBody>
            </Panel>

            {tier.advisory && (
              <Panel
                className={cn(
                  !tier.advisory.ok && 'border-warn-500/40 bg-warn-500/[0.04]',
                )}
              >
                <PanelHeader>
                  <PanelTitle>Price check</PanelTitle>
                  {tier.advisory.ok ? (
                    <CheckCircle2
                      className="size-4 text-healthy-400"
                      strokeWidth={1.75}
                    />
                  ) : (
                    <TriangleAlert
                      className="size-4 text-warn-400"
                      strokeWidth={1.75}
                    />
                  )}
                </PanelHeader>
                <PanelBody className="space-y-2.5">
                  {tier.advisory.warnings.length === 0 ? (
                    <p className="text-[12px] text-ink-400">
                      This price clears your policy.
                    </p>
                  ) : (
                    tier.advisory.warnings.map((w) => (
                      <p key={w} className="text-[12px] leading-relaxed text-warn-400">
                        {w}
                      </p>
                    ))
                  )}

                  {tier.advisory.shortfall > 0 && (
                    <div className="border-t border-ink-800 pt-2.5">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-ink-500">
                        Least you should charge
                      </p>
                      <p className="tabular mt-0.5 text-[15px] text-ink-100">
                        {money(tier.advisory.suggestedMinSell)}
                      </p>
                      <p className="tabular mt-0.5 text-[11px] text-warn-400">
                        {money(tier.advisory.shortfall)} short
                      </p>
                    </div>
                  )}

                  {tier.advisory.breakEvenPerFile !== null && (
                    <p className="tabular border-t border-ink-800 pt-2.5 text-[11px] text-ink-500">
                      Break-even {money(tier.advisory.breakEvenPerFile)} per file
                    </p>
                  )}
                </PanelBody>
              </Panel>
            )}

            <Panel>
              <PanelHeader>
                <PanelTitle>Tier settings</PanelTitle>
              </PanelHeader>
              <PanelBody className="space-y-3">
                <TierSettings
                  tier={tier}
                  busy={busy}
                  defaultMarkup={settings?.defaultMarkupPercent ?? 20}
                  onSave={(body) =>
                    mutate(() => api.patch(`/quotes/options/${tier.id}`, body))
                  }
                />
                <div className="flex gap-2 border-t border-ink-800 pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    className="flex-1"
                    onClick={() =>
                      mutate(async () => {
                        const copy = await api.post<QuoteOption>(
                          `/quotes/options/${tier.id}/duplicate`,
                          { name: `${tier.name} copy` },
                        );
                        setActiveTier(copy.id);
                      })
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
                      if (!confirm(`Delete the "${tier.name}" tier?`)) return;
                      mutate(async () => {
                        await api.del(`/quotes/options/${tier.id}`);
                        setActiveTier(null);
                      });
                    }}
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                  </Button>
                </div>
              </PanelBody>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TierCard({
  option,
  active,
  minMargin,
  onSelect,
}: {
  option: QuoteOption;
  active: boolean;
  minMargin: number;
  onSelect: () => void;
}) {
  const health = marginHealth(option.marginPercent, minMargin);
  return (
    <button
      onClick={onSelect}
      className={cn(
        'min-w-[180px] flex-1 rounded-[10px] border px-4 py-3 text-left',
        'transition-[transform,border-color,background-color] duration-200 ease-out',
        active
          ? 'border-signal-500/60 bg-ink-850'
          : 'border-ink-700/80 bg-ink-900 hover:-translate-y-px hover:border-ink-600',
      )}
    >
      <span className="text-[13px] font-medium text-ink-100">{option.name}</span>
      <p className="tabular mt-1 text-[17px] font-semibold text-ink-50">
        {money(option.totalSell)}
      </p>
      <p className="tabular mt-0.5 text-[11px]">
        <span className={healthText[health]}>
          {percent(option.marginPercent)}
        </span>
        <span className="text-ink-600"> margin · {option.lines.length} lines</span>
      </p>
    </button>
  );
}

function AddTier({
  onAdd,
  disabled,
}: {
  onAdd: (name: string) => void;
  disabled: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        disabled={disabled}
        className={cn(
          'min-w-[150px] rounded-[10px] border border-dashed border-ink-700 px-4 py-3',
          'text-[13px] text-ink-500 transition-colors duration-150',
          'hover:border-ink-600 hover:text-ink-300 disabled:opacity-50',
        )}
      >
        <Plus className="mr-1.5 inline size-4" strokeWidth={1.75} />
        Add tier
      </button>
    );
  }

  return (
    <div className="flex min-w-[220px] items-center gap-2 rounded-[10px] border border-ink-700 bg-ink-900 px-3 py-2">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Deluxe"
        className="h-8"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) {
            onAdd(name.trim());
            setName('');
            setAdding(false);
          }
          if (e.key === 'Escape') setAdding(false);
        }}
      />
      <Button
        size="sm"
        disabled={!name.trim()}
        onClick={() => {
          onAdd(name.trim());
          setName('');
          setAdding(false);
        }}
      >
        Add
      </Button>
    </div>
  );
}

/** Numbers commit on blur — typing "6200" should not fire four saves. */
function NumCell({
  value,
  disabled,
  onCommit,
  className,
}: {
  value: number;
  disabled: boolean;
  onCommit: (v: number) => void;
  className?: string;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  return (
    <input
      type="number"
      min={0}
      value={local}
      disabled={disabled}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const n = Number(local);
        if (!Number.isNaN(n) && n !== value) onCommit(n);
        else setLocal(String(value));
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={cn(
        'tabular h-7 w-full rounded border border-transparent bg-transparent px-1.5 text-[13px] text-ink-100',
        'transition-[border-color,background-color] duration-150',
        'hover:border-ink-700 hover:bg-ink-950/40',
        'focus:border-signal-500 focus:bg-ink-950 focus:outline-none',
        className,
      )}
    />
  );
}

function LineRow({
  line,
  busy,
  onPatch,
  onDelete,
}: {
  line: QuoteLine;
  busy: boolean;
  onPatch: (body: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [desc, setDesc] = useState(line.description);
  useEffect(() => setDesc(line.description), [line.description]);

  return (
    <tr className="group border-b border-ink-800/60 last:border-0 hover:bg-ink-850/60">
      <td className="px-4 py-2">
        <input
          value={desc}
          disabled={busy}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() =>
            desc !== line.description && onPatch({ description: desc })
          }
          className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-[13px] text-ink-100 transition-colors hover:border-ink-700 focus:border-signal-500 focus:bg-ink-950 focus:outline-none"
        />
        <span className="ml-1.5 text-[10px] uppercase tracking-[0.08em] text-ink-600">
          {humanise(line.serviceType)}
        </span>
      </td>
      <td className="px-2 py-2">
        <NumCell
          value={line.quantity}
          disabled={busy}
          className="text-center"
          onCommit={(v) => onPatch({ quantity: v })}
        />
      </td>
      <td className="px-2 py-2">
        <NumCell
          value={line.units}
          disabled={busy}
          className="text-center"
          onCommit={(v) => onPatch({ units: v })}
        />
      </td>
      <td className="px-2 py-2">
        <NumCell
          value={line.unitNet}
          disabled={busy}
          className="text-right"
          onCommit={(v) => onPatch({ unitNet: v })}
        />
      </td>
      <td className="tabular px-2 py-2 text-right text-ink-400">
        {money(line.lineNet)}
      </td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          <select
            value={line.markupMode}
            disabled={busy}
            onChange={(e) => onPatch({ markupMode: e.target.value })}
            className="h-7 rounded border border-transparent bg-transparent px-1 text-[11px] text-ink-300 transition-colors hover:border-ink-700 focus:border-signal-500 focus:bg-ink-950 focus:outline-none"
          >
            {MARKUP_MODES.map((m) => (
              <option key={m} value={m}>
                {m === 'INHERIT' ? 'Auto' : humanise(m)}
              </option>
            ))}
          </select>
          {line.markupMode !== 'INHERIT' && (
            <NumCell
              value={line.markupValue ?? 0}
              disabled={busy}
              className="w-16 text-right"
              onCommit={(v) => onPatch({ markupValue: v })}
            />
          )}
        </div>
      </td>
      <td className="tabular px-2 py-2 text-right text-ink-100">
        {money(line.lineSell)}
      </td>
      <td className="px-2 py-2">
        <button
          onClick={onDelete}
          disabled={busy}
          aria-label={`Remove ${line.description}`}
          className="rounded p-1 text-ink-600 opacity-0 transition-[opacity,color,background-color] duration-150 group-hover:opacity-100 hover:bg-ink-800 hover:text-loss-400 focus:opacity-100"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </button>
      </td>
    </tr>
  );
}

function AddLine({
  onAdd,
  disabled,
}: {
  onAdd: (body: Record<string, unknown>) => void;
  disabled: boolean;
}) {
  const [serviceType, setServiceType] = useState('HOTEL');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [units, setUnits] = useState('1');
  const [unitNet, setUnitNet] = useState('');

  function submit() {
    if (!description.trim() || !unitNet) return;
    onAdd({
      serviceType,
      description: description.trim(),
      quantity: Number(quantity) || 1,
      units: Number(units) || 1,
      unitNet: Number(unitNet) || 0,
    });
    setDescription('');
    setUnitNet('');
    setQuantity('1');
    setUnits('1');
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="w-[128px] space-y-1">
        <Label htmlFor="svc">Type</Label>
        <Select
          id="svc"
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
      <div className="min-w-[180px] flex-1 space-y-1">
        <Label htmlFor="desc">Description</Label>
        <Input
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Srinagar deluxe room, MAP"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="w-[64px] space-y-1">
        <Label htmlFor="qty">Qty</Label>
        <Input
          id="qty"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="text-center"
        />
      </div>
      <div className="w-[64px] space-y-1">
        <Label htmlFor="unt">Units</Label>
        <Input
          id="unt"
          type="number"
          min={1}
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          className="text-center"
        />
      </div>
      <div className="w-[104px] space-y-1">
        <Label htmlFor="net">Net each</Label>
        <Input
          id="net"
          type="number"
          min={0}
          value={unitNet}
          onChange={(e) => setUnitNet(e.target.value)}
          placeholder="6200"
          className="text-right"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <Button
        onClick={submit}
        disabled={disabled || !description.trim() || !unitNet}
      >
        <Plus className="size-4" strokeWidth={1.75} />
        Add
      </Button>
    </div>
  );
}

function TierSettings({
  tier,
  busy,
  defaultMarkup,
  onSave,
}: {
  tier: QuoteOption;
  busy: boolean;
  defaultMarkup: number;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [adults, setAdults] = useState(String(tier.adults));
  const [children, setChildren] = useState(String(tier.children));
  const [nights, setNights] = useState(String(tier.nights));
  const [markup, setMarkup] = useState(
    tier.markupPercent === null ? '' : String(tier.markupPercent),
  );

  useEffect(() => {
    setAdults(String(tier.adults));
    setChildren(String(tier.children));
    setNights(String(tier.nights));
    setMarkup(tier.markupPercent === null ? '' : String(tier.markupPercent));
  }, [tier]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor="ad">Adults</Label>
          <Input
            id="ad"
            type="number"
            min={1}
            value={adults}
            disabled={busy}
            onChange={(e) => setAdults(e.target.value)}
            onBlur={() =>
              Number(adults) !== tier.adults &&
              onSave({ adults: Number(adults) || 1 })
            }
            className="text-center"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ch">Children</Label>
          <Input
            id="ch"
            type="number"
            min={0}
            value={children}
            disabled={busy}
            onChange={(e) => setChildren(e.target.value)}
            onBlur={() =>
              Number(children) !== tier.children &&
              onSave({ children: Number(children) || 0 })
            }
            className="text-center"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ni">Nights</Label>
          <Input
            id="ni"
            type="number"
            min={0}
            value={nights}
            disabled={busy}
            onChange={(e) => setNights(e.target.value)}
            onBlur={() =>
              Number(nights) !== tier.nights &&
              onSave({ nights: Number(nights) || 0 })
            }
            className="text-center"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="mk">Markup override</Label>
        <Input
          id="mk"
          type="number"
          min={0}
          value={markup}
          disabled={busy}
          placeholder={`Auto (${defaultMarkup}%)`}
          onChange={(e) => setMarkup(e.target.value)}
          onBlur={() => {
            const v = markup === '' ? null : Number(markup);
            if (v !== tier.markupPercent) onSave({ markupPercent: v });
          }}
        />
        <p className="text-[11px] leading-relaxed text-ink-600">
          Leave blank to use your per-service defaults. Set a number to apply it
          to every line in this tier that is on Auto.
        </p>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-500">
        {label}
        {hint && <span className="ml-1 normal-case text-ink-600">({hint})</span>}
      </dt>
      <dd className="tabular text-ink-100">{value}</dd>
    </div>
  );
}
GLITZEOF
ok "wrote 7 files"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  say "Production build (type-checks everything)"
  npm run build || die "Build failed — see errors above."
  ok "build passed"
fi

say "Committing"
cd ..
if git rev-parse --git-dir >/dev/null 2>&1; then
  git add -A
  git commit -qm "Phase 9: quotation builder — tiers, line editing, live margin, price check" || warn "commit skipped"
  ok "committed"
else
  warn "no git repo at project root — skipping commit"
fi

say "PHASE 9 COMPLETE"
cat << 'GLITZEOF'

Run both servers, then walk the whole flow end to end:

  cd backend  && npm run start:dev     # :3000
  cd frontend && npm run dev           # :3001

  1. Set your commercial policy first — the price check is only as good as
     these numbers:  http://localhost:3001  ->  or via curl:

     curl -X PATCH http://localhost:3000/api/settings/pricing \
       -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
       -d '{"defaultMarkupPercent":20,"hotelMarkupPercent":18,
            "transportMarkupPercent":30,"minMarginPercent":15,
            "monthlyOverhead":120000,"filesPerMonth":25,"roundTo":50}'

  2. Open a lead -> "Build quotation" -> create.

  3. In the builder:
     - Add a line: Hotel, "Srinagar deluxe MAP", qty 2, units 3, net 6200
     - Watch the right rail: margin and markup are DIFFERENT numbers
     - Add transport: qty 1, units 6, net 3500 (picks up your 30% default)
     - Change one line's markup to Fixed 900 — only that line changes
     - Duplicate the tier, rename it Deluxe, swap the hotel for a costlier one
     - Compare both tiers in the strip at the top

  4. Now underprice something on purpose: set a line's markup mode to Manual
     and type a sell price barely above cost. The price check turns amber and
     tells you the least you should charge and how far short you are.

If "From supplier rates" finds nothing, you have no vendors yet — add a hotel
and a rate via the API (see phase-4.sh notes) and it will populate.

Still to come: the supplier screens, the booking desk, and the quotation PDF.

GLITZEOF
