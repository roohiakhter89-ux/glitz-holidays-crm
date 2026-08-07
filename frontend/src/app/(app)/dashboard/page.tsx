'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import Link from 'next/link';
import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import {
  api,
  ApiError,
  type BookingStats,
  type LeadStats,
  type LeadRow,
  type Paged,
} from '@/lib/api';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel';
import { MarginRibbon, ScoreMeter } from '@/components/margin-ribbon';
import { EChart, chartBase, axisStyle } from '@/components/echart';
import { Stage } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { money, moneyShort, percent, relativeDate } from '@/lib/format';

export default function DashboardPage() {
  const [bookings, setBookings] = useState<BookingStats | null>(null);
  const [leads, setLeads] = useState<LeadStats | null>(null);
  const [recent, setRecent] = useState<LeadRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, l, r] = await Promise.all([
          api.get<BookingStats>('/bookings/stats').catch(() => null),
          api.get<LeadStats>('/leads/stats').catch(() => null),
          api.get<Paged<LeadRow>>('/leads?limit=6').catch(
            (): Paged<LeadRow> => ({
              total: 0,
              page: 1,
              limit: 6,
              pages: 0,
              data: [],
            }),
          ),
        ]);
        if (cancelled) return;
        setBookings(b);
        setLeads(l);
        setRecent(r.data ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Could not load the desk.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceOption = useMemo<EChartsOption>(() => {
    const rows = (leads?.bySource ?? []).slice().sort((a, b) => b.count - a.count);
    return {
      ...chartBase,
      grid: { ...chartBase.grid, left: 4 },
      xAxis: { type: 'value' as const, ...axisStyle },
      yAxis: {
        type: 'category' as const,
        ...axisStyle,
        data: rows.map((r) => r.source.replace(/_/g, ' ').toLowerCase()),
        splitLine: { show: false },
      },
      series: [
        {
          type: 'bar' as const,
          data: rows.map((r) => r.count),
          barMaxWidth: 14,
          itemStyle: { color: '#4a5566', borderRadius: [0, 3, 3, 0] },
          emphasis: { itemStyle: { color: '#359296' } },
        },
      ],
    };
  }, [leads]);

  const pipelineOption = useMemo<EChartsOption>(() => {
    const order = [
      'NEW',
      'CONTACTED',
      'INTERESTED',
      'QUOTATION_SENT',
      'NEGOTIATION',
      'CONFIRMED',
    ];
    const map = new Map((leads?.byStatus ?? []).map((r) => [r.status, r.count]));
    return {
      ...chartBase,
      xAxis: {
        type: 'category' as const,
        ...axisStyle,
        data: order.map((s) => s.replace(/_/g, ' ').toLowerCase()),
        axisLabel: { ...axisStyle.axisLabel, interval: 0, rotate: 28 },
      },
      yAxis: { type: 'value' as const, ...axisStyle },
      series: [
        {
          type: 'bar' as const,
          data: order.map((s) => map.get(s) ?? 0),
          barMaxWidth: 26,
          itemStyle: { color: '#333b4a', borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color: '#359296' } },
        },
      ],
    };
  }, [leads]);

  const eroding =
    bookings != null && bookings.profitVariance < 0 ? bookings.profitVariance : 0;

  return (
    <div className="mx-auto max-w-[1180px] px-8 py-8">
      <header className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-50">
            Desk
          </h1>
          <p className="mt-0.5 text-[13px] text-ink-400">
            Where the money is, right now.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/leads">
            Open leads
            <ArrowUpRight className="size-4" strokeWidth={1.75} />
          </Link>
        </Button>
      </header>

      {error && (
        <Panel className="mb-6 border-loss-500/40 bg-loss-500/5">
          <PanelBody className="flex items-start gap-3 py-4">
            <TriangleAlert className="mt-0.5 size-4 text-loss-400" strokeWidth={1.75} />
            <div>
              <p className="text-[13px] text-ink-100">{error}</p>
              <p className="mt-1 text-[12px] text-ink-400">
                Start the backend with <code className="tabular">npm run start:dev</code>,
                then reload.
              </p>
            </div>
          </PanelBody>
        </Panel>
      )}

      {/* Row 1 — the money question */}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr]">
        <Panel interactive className="rise">
          <PanelHeader>
            <PanelTitle>Booked value</PanelTitle>
            {eroding < 0 && (
              <span className="tabular text-[11px] text-warn-400">
                {money(eroding)} vs quoted
              </span>
            )}
          </PanelHeader>
          <PanelBody>
            {loading ? (
              <Skeleton />
            ) : bookings && bookings.totalSell > 0 ? (
              <>
                <p className="tabular text-[2rem] leading-none font-semibold text-ink-50">
                  {money(bookings.totalSell)}
                </p>
                <p className="mt-1.5 text-[12px] text-ink-500">
                  across {bookings.bookings} file
                  {bookings.bookings === 1 ? '' : 's'}
                </p>
                <div className="mt-5">
                  <MarginRibbon
                    sell={bookings.totalSell}
                    cost={bookings.totalSell - bookings.totalActualProfit}
                  />
                </div>
              </>
            ) : (
              <Empty
                title="No bookings yet"
                hint="Confirm a quotation to see value here."
              />
            )}
          </PanelBody>
        </Panel>

        <Panel interactive className="rise" style={{ animationDelay: '60ms' }}>
          <PanelHeader>
            <PanelTitle>Owed to you</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {loading ? (
              <Skeleton />
            ) : (
              <>
                <p className="tabular text-[2rem] leading-none font-semibold text-ink-50">
                  {money(bookings?.totalOutstanding ?? 0)}
                </p>
                <p className="mt-1.5 text-[12px] text-ink-500">
                  {money(bookings?.totalReceived ?? 0)} received so far
                </p>
              </>
            )}
          </PanelBody>
        </Panel>

        <Panel interactive className="rise" style={{ animationDelay: '120ms' }}>
          <PanelHeader>
            <PanelTitle>You owe suppliers</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {loading ? (
              <Skeleton />
            ) : (
              <>
                <p className="tabular text-[2rem] leading-none font-semibold text-ink-50">
                  {money(bookings?.vendorOutstanding ?? 0)}
                </p>
                <p className="mt-1.5 text-[12px] text-ink-500">
                  {bookings && bookings.averageMarginPercent > 0
                    ? `${percent(bookings.averageMarginPercent)} average margin`
                    : 'Record vendor costs to track this'}
                </p>
              </>
            )}
          </PanelBody>
        </Panel>
      </div>

      {/* Row 2 — where work comes from */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel className="rise" style={{ animationDelay: '180ms' }}>
          <PanelHeader>
            <PanelTitle>Pipeline</PanelTitle>
            <span className="tabular text-[11px] text-ink-500">
              {leads?.total ?? 0} leads
            </span>
          </PanelHeader>
          <PanelBody className="pt-2">
            {leads && leads.total > 0 ? (
              <EChart option={pipelineOption} height={240} />
            ) : (
              <Empty
                title="No leads yet"
                hint="Point a landing page at /api/leads/capture."
              />
            )}
          </PanelBody>
        </Panel>

        <Panel className="rise" style={{ animationDelay: '240ms' }}>
          <PanelHeader>
            <PanelTitle>Where leads come from</PanelTitle>
            {leads && leads.unassigned > 0 && (
              <span className="tabular text-[11px] text-warn-400">
                {leads.unassigned} unassigned
              </span>
            )}
          </PanelHeader>
          <PanelBody className="pt-2">
            {leads && leads.bySource.length > 0 ? (
              <EChart option={sourceOption} height={240} />
            ) : (
              <Empty title="Nothing to chart" hint="Sources appear as leads arrive." />
            )}
          </PanelBody>
        </Panel>
      </div>

      {/* Row 3 — the actual work queue */}
      <Panel className="rise mt-4" style={{ animationDelay: '300ms' }}>
        <PanelHeader>
          <PanelTitle>Latest enquiries</PanelTitle>
          <Button asChild variant="link" size="sm">
            <Link href="/leads">View all</Link>
          </Button>
        </PanelHeader>
        {recent.length === 0 ? (
          <PanelBody>
            <Empty
              title="No enquiries yet"
              hint="Leads captured from your landing pages land here first."
            />
          </PanelBody>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-ink-800 text-[10px] uppercase tracking-[0.09em] text-ink-500">
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Destination</th>
                <th className="px-5 py-2.5 font-medium">Stage</th>
                <th className="px-5 py-2.5 font-medium">Score</th>
                <th className="px-5 py-2.5 text-right font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((lead) => (
                <tr
                  key={lead.id}
                  className="group border-b border-ink-800/60 transition-colors duration-150 last:border-0 hover:bg-ink-850"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-ink-100 transition-colors group-hover:text-signal-300"
                    >
                      {lead.name}
                    </Link>
                    <span className="tabular ml-2 text-[11px] text-ink-500">
                      {lead.phone}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-300">
                    {lead.destination ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Stage value={lead.status} />
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
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 w-32 animate-pulse rounded bg-ink-800" />
      <div className="h-3 w-20 animate-pulse rounded bg-ink-850" />
    </div>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-[13px] text-ink-300">{title}</p>
      <p className="mt-1 text-[12px] text-ink-500">{hint}</p>
    </div>
  );
}
