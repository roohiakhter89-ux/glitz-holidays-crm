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
