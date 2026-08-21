'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

/**
 * Google-Ads-style date range picker.
 * Pill shows the current label (Today, Last 7 days, 21 Aug 2026, etc.)
 * Prev / next arrows shift by the current preset's stride:
 *   Today -> 1 day     Last 7 days -> 7 days    This month -> 1 month
 * "All time" and custom ranges hide the arrows.
 *
 * Emits { from, to, label, preset } on change. Consumer sends from/to as
 * ISO date strings to the API; label is display-only.
 */

export type PresetId =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last14'
  | 'last30'
  | 'last90'
  | 'thisMonth'
  | 'lastMonth'
  | 'all';

export interface DateRange {
  from: string | null; // ISO date (YYYY-MM-DD) or null
  to: string | null;
  label: string;
  preset: PresetId;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildRange(preset: PresetId): DateRange {
  const t = startOfToday();
  const y = new Date(t); y.setDate(y.getDate() - 1);
  switch (preset) {
    case 'today':      return { from: iso(t), to: iso(t), label: `Today · ${fmtDate(t)}`, preset };
    case 'yesterday':  return { from: iso(y), to: iso(y), label: `Yesterday · ${fmtDate(y)}`, preset };
    case 'last7': {
      const s = new Date(t); s.setDate(s.getDate() - 6);
      return { from: iso(s), to: iso(t), label: 'Last 7 days', preset };
    }
    case 'last14': {
      const s = new Date(t); s.setDate(s.getDate() - 13);
      return { from: iso(s), to: iso(t), label: 'Last 14 days', preset };
    }
    case 'last30': {
      const s = new Date(t); s.setDate(s.getDate() - 29);
      return { from: iso(s), to: iso(t), label: 'Last 30 days', preset };
    }
    case 'last90': {
      const s = new Date(t); s.setDate(s.getDate() - 89);
      return { from: iso(s), to: iso(t), label: 'Last 90 days', preset };
    }
    case 'thisMonth': {
      const s = new Date(t.getFullYear(), t.getMonth(), 1);
      return { from: iso(s), to: iso(t), label: 'This month', preset };
    }
    case 'lastMonth': {
      const s = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      const e = new Date(t.getFullYear(), t.getMonth(), 0);
      return { from: iso(s), to: iso(e), label: 'Last month', preset };
    }
    case 'all':        return { from: null, to: null, label: 'All time', preset };
  }
}

// Shift by stride, respecting the preset semantics.
function shiftRange(r: DateRange, dir: 1 | -1): DateRange {
  if (r.preset === 'all' || !r.from || !r.to) return r;
  const from = new Date(r.from);
  const to = new Date(r.to);
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;

  if (r.preset === 'today' || r.preset === 'yesterday') {
    from.setDate(from.getDate() + dir);
    to.setDate(to.getDate() + dir);
    const label = from.toDateString() === startOfToday().toDateString()
      ? `Today · ${fmtDate(from)}`
      : fmtDate(from);
    return { from: iso(from), to: iso(to), label, preset: 'today' };
  }
  if (r.preset === 'thisMonth' || r.preset === 'lastMonth') {
    const anchor = new Date(from.getFullYear(), from.getMonth() + dir, 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return {
      from: iso(anchor),
      to: iso(end),
      label: anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      preset: r.preset,
    };
  }
  // Rolling windows (7/14/30/90) shift by their length
  from.setDate(from.getDate() + dir * days);
  to.setDate(to.getDate() + dir * days);
  return { ...r, from: iso(from), to: iso(to), label: `${fmtDate(from)} - ${fmtDate(to)}` };
}

const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'today',      label: 'Today' },
  { id: 'yesterday',  label: 'Yesterday' },
  { id: 'last7',      label: 'Last 7 days' },
  { id: 'last14',     label: 'Last 14 days' },
  { id: 'last30',     label: 'Last 30 days' },
  { id: 'last90',     label: 'Last 90 days' },
  { id: 'thisMonth',  label: 'This month' },
  { id: 'lastMonth',  label: 'Last month' },
  { id: 'all',        label: 'All time' },
];

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const canShift = value.preset !== 'all' && value.from && value.to;

  return (
    <div ref={rootRef} className="relative inline-flex items-stretch rounded-md border border-ink-700 bg-ink-950 text-[13px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 text-ink-200 hover:bg-ink-850"
      >
        <Calendar className="size-3.5 text-ink-500" strokeWidth={1.75} />
        <span className="tabular">{value.label}</span>
        <ChevronDown className={`size-3.5 text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        disabled={!canShift}
        aria-label="Previous period"
        onClick={() => onChange(shiftRange(value, -1))}
        className="border-l border-ink-700 px-2 text-ink-500 hover:bg-ink-850 hover:text-ink-200 disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        disabled={!canShift}
        aria-label="Next period"
        onClick={() => onChange(shiftRange(value, 1))}
        className="border-l border-ink-700 px-2 text-ink-500 hover:bg-ink-850 hover:text-ink-200 disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRight className="size-4" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-40 mt-1 min-w-[180px] overflow-hidden rounded-md border border-ink-700 bg-ink-900 shadow-xl">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => { onChange(buildRange(p.id)); setOpen(false); }}
              className={
                (value.preset === p.id
                  ? 'bg-signal-500/10 text-signal-400 '
                  : 'text-ink-300 hover:bg-ink-850 hover:text-ink-100 ') +
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px]'
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Convenience: default range (Today) for pages using this picker. */
export function defaultRange(preset: PresetId = 'today'): DateRange {
  return buildRange(preset);
}
