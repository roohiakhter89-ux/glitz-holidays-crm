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
