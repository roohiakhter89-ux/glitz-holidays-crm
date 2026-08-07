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
