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
  CalendarCheck,
  FileDown,
} from 'lucide-react';
import {
  api,
  ApiError,
  openBinary,
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
            <h1 className="display text-[26px] font-semibold tracking-tight text-ink-100">
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
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || quote.options.length === 0}
            onClick={() =>
              openBinary(
                `/quotes/${id}/pdf`,
                `Quotation-${quote.quoteNumber}.pdf`,
              ).catch((e) =>
                setError(e instanceof ApiError ? e.message : 'Download failed.'),
              )
            }
          >
            <FileDown className="size-4" strokeWidth={1.75} />
            Download PDF
          </Button>
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

                {/* GST breakdown — the sell price is tax-inclusive. Shows the
                    client what they actually paid in tax so they can claim ITC. */}
                {tier.gst && tier.gst.gstPercent > 0 && (
                  <dl className="space-y-1.5 border-t border-ink-800 pt-3 text-[12px]">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.11em] text-ink-500">
                      Client sees (GST-inclusive)
                    </p>
                    <Fact
                      label="Base"
                      value={money(tier.gst.baseAmount)}
                    />
                    <Fact
                      label={`GST @ ${tier.gst.gstPercent}%`}
                      value={money(tier.gst.gstAmount)}
                    />
                  </dl>
                )}
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

                {/*
                 * "Book this tier" freezes the numbers on the server and
                 * creates a Booking. The lead auto-moves to CONFIRMED and the
                 * quote to ACCEPTED — reversing that means going into the
                 * booking and cancelling it, not editing status here.
                 */}
                <Button
                  disabled={busy || tier.totalSell <= 0}
                  className="w-full border-t border-ink-800 pt-3 mt-3"
                  onClick={() => {
                    if (
                      !confirm(
                        `Confirm booking for "${tier.name}" at ${money(tier.totalSell)}?\n\nThis freezes the price and moves the lead to Confirmed.`,
                      )
                    )
                      return;
                    mutate(async () => {
                      const booking = await api.post<{ id: string }>(
                        '/bookings',
                        { quoteOptionId: tier.id },
                      );
                      router.push(`/bookings/${booking.id}`);
                    });
                  }}
                >
                  <CalendarCheck className="size-4" strokeWidth={1.75} />
                  Book this tier
                </Button>

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
