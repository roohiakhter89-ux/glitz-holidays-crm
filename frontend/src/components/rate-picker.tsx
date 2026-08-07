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
