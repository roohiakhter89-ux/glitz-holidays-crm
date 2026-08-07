import { MarkupMode, ServiceType } from '@prisma/client';

/**
 * Pure pricing functions — no database, no Nest. Easy to reason about and
 * easy to change when your commercial policy changes.
 *
 * IMPORTANT VOCABULARY (these are different numbers):
 *   markup% = profit / COST   -> ₹10,000 cost + 20% markup = ₹12,000 sell
 *   margin% = profit / SELL   -> that same deal is a 16.7% margin
 * Treating them as interchangeable is how tour operators quietly underprice.
 *
 * GST CONVENTION:
 *   Quoted / booked totals are TAX-INCLUSIVE. What the client sees on the
 *   quotation is what they pay. On the invoice we split it into the base
 *   amount and the GST portion so they can claim ITC if applicable.
 *   Indian tour packages carry 5% GST without ITC by default; if that policy
 *   ever changes for a specific product, do the split at quote time — never
 *   layer GST on top at invoice time.
 */

export interface SettingsLike {
  defaultMarkupPercent: number;
  hotelMarkupPercent?: number | null;
  transportMarkupPercent?: number | null;
  activityMarkupPercent?: number | null;
  flightMarkupPercent?: number | null;
  guideMarkupPercent?: number | null;
  mealMarkupPercent?: number | null;
  permitMarkupPercent?: number | null;
  miscMarkupPercent?: number | null;
  minMarginPercent: number;
  monthlyOverhead?: number | null;
  filesPerMonth?: number | null;
  roundTo: number;
  /** Inclusive GST rate applied to the client-facing invoice split. */
  gstPercent?: number;
}

export interface LineLike {
  serviceType: ServiceType;
  quantity: number;
  units: number;
  unitNet: number;
  markupMode: MarkupMode;
  markupValue?: number | null;
}

/** Per-service-type default, falling back to the global default. */
export function serviceTypeMarkup(
  type: ServiceType,
  s: SettingsLike,
): number {
  const map: Record<ServiceType, number | null | undefined> = {
    HOTEL: s.hotelMarkupPercent,
    TRANSPORT: s.transportMarkupPercent,
    ACTIVITY: s.activityMarkupPercent,
    FLIGHT: s.flightMarkupPercent,
    GUIDE: s.guideMarkupPercent,
    MEAL: s.mealMarkupPercent,
    PERMIT: s.permitMarkupPercent,
    MISC: s.miscMarkupPercent,
  };
  const v = map[type];
  return v === null || v === undefined ? s.defaultMarkupPercent : v;
}

export function roundTo(value: number, nearest: number): number {
  if (!nearest || nearest <= 1) return Math.round(value);
  return Math.round(value / nearest) * nearest;
}

/**
 * Resolution chain, most specific wins:
 *   line override -> option override -> service-type default -> global default
 */
export function computeLine(
  line: LineLike,
  settings: SettingsLike,
  optionMarkupPercent?: number | null,
): { lineNet: number; lineSell: number; resolvedPercent: number } {
  const lineNet = Math.round(line.unitNet * line.quantity * line.units);

  if (line.markupMode === MarkupMode.MANUAL) {
    const lineSell = roundTo(line.markupValue ?? lineNet, settings.roundTo);
    return {
      lineNet,
      lineSell,
      resolvedPercent: lineNet > 0 ? ((lineSell - lineNet) / lineNet) * 100 : 0,
    };
  }

  if (line.markupMode === MarkupMode.FIXED) {
    const lineSell = roundTo(lineNet + (line.markupValue ?? 0), settings.roundTo);
    return {
      lineNet,
      lineSell,
      resolvedPercent: lineNet > 0 ? ((lineSell - lineNet) / lineNet) * 100 : 0,
    };
  }

  const pct =
    line.markupMode === MarkupMode.PERCENT && line.markupValue !== null && line.markupValue !== undefined
      ? line.markupValue
      : optionMarkupPercent !== null && optionMarkupPercent !== undefined
        ? optionMarkupPercent
        : serviceTypeMarkup(line.serviceType, settings);

  const lineSell = roundTo(lineNet * (1 + pct / 100), settings.roundTo);
  return { lineNet, lineSell, resolvedPercent: pct };
}

export interface OptionTotals {
  totalNet: number;
  totalSell: number;
  totalMargin: number;
  /** profit / sell */
  marginPercent: number;
  /** profit / cost */
  markupPercentEffective: number;
  perPersonSell: number;
}

export function computeOptionTotals(
  lines: { lineNet: number; lineSell: number }[],
  pax: number,
): OptionTotals {
  const totalNet = lines.reduce((a, l) => a + l.lineNet, 0);
  const totalSell = lines.reduce((a, l) => a + l.lineSell, 0);
  const totalMargin = totalSell - totalNet;

  return {
    totalNet,
    totalSell,
    totalMargin,
    marginPercent: totalSell > 0 ? (totalMargin / totalSell) * 100 : 0,
    markupPercentEffective: totalNet > 0 ? (totalMargin / totalNet) * 100 : 0,
    perPersonSell: pax > 0 ? Math.round(totalSell / pax) : totalSell,
  };
}

/**
 * Split a GST-inclusive total into base + tax portions.
 * Rounded to whole rupees; any half-rupee difference lands on the base so
 * the two components always add back to the input.
 */
export interface GstBreakdown {
  /** GST-inclusive total the client pays (identity return). */
  total: number;
  /** Portion attributable to GST at the given rate. */
  gstAmount: number;
  /** Pre-tax base amount. base + gstAmount === total. */
  baseAmount: number;
  gstPercent: number;
}

export function gstBreakdown(total: number, gstPercent: number): GstBreakdown {
  if (gstPercent <= 0 || total <= 0) {
    return { total, gstAmount: 0, baseAmount: total, gstPercent };
  }
  // base * (1 + gst/100) = total  =>  base = total / (1 + gst/100)
  const base = Math.round(total / (1 + gstPercent / 100));
  return {
    total,
    baseAmount: base,
    gstAmount: total - base,
    gstPercent,
  };
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

/**
 * "What is the least I can sell this at?"
 *
 * Two independent floors:
 *   1. Policy floor  — your minimum margin %.
 *   2. Break-even    — monthlyOverhead / filesPerMonth must be covered by
 *                      this file's gross profit, or the file loses money once
 *                      overheads are counted.
 * The suggestion is the higher of the two. Break-even is only computed if you
 * have entered real overhead numbers in settings — otherwise it is skipped
 * rather than invented.
 */
export function advise(
  totalNet: number,
  totalSell: number,
  s: SettingsLike,
): Advisory {
  const warnings: string[] = [];

  // sell such that (sell - net)/sell = minMargin  =>  sell = net / (1 - m)
  const m = Math.min(0.95, Math.max(0, s.minMarginPercent / 100));
  const minSellForPolicy = m > 0 ? roundTo(totalNet / (1 - m), s.roundTo) : totalNet;

  let breakEvenPerFile: number | null = null;
  let minSellForBreakEven: number | null = null;
  if (s.monthlyOverhead && s.filesPerMonth && s.filesPerMonth > 0) {
    breakEvenPerFile = Math.round(s.monthlyOverhead / s.filesPerMonth);
    minSellForBreakEven = roundTo(totalNet + breakEvenPerFile, s.roundTo);
  } else {
    warnings.push(
      'Break-even not calculated — set monthlyOverhead and filesPerMonth in pricing settings.',
    );
  }

  const suggestedMinSell = Math.max(
    minSellForPolicy,
    minSellForBreakEven ?? 0,
  );

  const marginPct = totalSell > 0 ? ((totalSell - totalNet) / totalSell) * 100 : 0;
  if (marginPct < s.minMarginPercent) {
    warnings.push(
      `Margin ${marginPct.toFixed(1)}% is below your minimum of ${s.minMarginPercent}%.`,
    );
  }
  if (breakEvenPerFile !== null && totalSell - totalNet < breakEvenPerFile) {
    warnings.push(
      `Gross profit does not cover your break-even of ${breakEvenPerFile} per file.`,
    );
  }

  const shortfall = Math.max(0, suggestedMinSell - totalSell);

  return {
    breakEvenPerFile,
    minSellForPolicy,
    minSellForBreakEven,
    suggestedMinSell,
    shortfall,
    ok: warnings.filter((w) => !w.startsWith('Break-even not')).length === 0,
    warnings,
  };
}
