import { AdChannel } from '@prisma/client';

/**
 * Pure mapping between a Google Ads API response and our AdSpend rows.
 * No network, no Nest, no Prisma — so every unit conversion below is testable
 * without credentials, which matters because the two systems disagree about
 * money in three separate ways.
 *
 * MONEY. Google reports cost in MICROS: millionths of the account's currency
 * unit. AdSpend.amount is WHOLE RUPEES (schema.prisma:787). So the conversion
 * is cost_micros / 1_000_000, and 12_500_000_000 micros = ₹12,500.
 *
 * INT64 AS STRING. proto3 JSON serialises 64-bit integers as STRINGS, so
 * cost_micros arrives as "12500000000", not 12500000000. Reading it as a
 * number without coercing gives NaN, which would silently write 0 spend and
 * make every cost-per-lead look free. Everything numeric goes through num().
 *
 * CURRENCY. The account's currency is whatever the Ads account was opened in.
 * We record it rather than assume INR — a non-INR account whose cost is stored
 * as if it were rupees would quietly corrupt ROAS.
 */

/** Google reports money in millionths of a currency unit. */
export const MICROS_PER_UNIT = 1_000_000;

/**
 * Coerce a proto3 JSON number. int64 fields arrive as strings, int32 and
 * double as numbers, and absent fields as undefined.
 */
export function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Micros to whole currency units, rounded.
 *
 * Rounded rather than truncated because a day's spend of ₹12,499.60 is ₹12,500
 * to the business, and truncating every row biases the monthly total low.
 */
export function microsToUnits(micros: unknown): number {
  return Math.round(num(micros) / MICROS_PER_UNIT);
}

/** Customer IDs are quoted with hyphens in the UI but sent as bare digits. */
export function normaliseCustomerId(id: string): string {
  return (id ?? '').replace(/\D/g, '');
}

/**
 * A searchStream response is a JSON ARRAY of chunks, each shaped like a
 * Search response — unlike every other endpoint, which returns one object.
 * Flatten to the rows the caller actually wants, tolerating both shapes so a
 * plain `search` response can be passed through the same path.
 */
export function flattenSearchStream(payload: unknown): Record<string, any>[] {
  const chunks = Array.isArray(payload) ? payload : [payload];
  const out: Record<string, any>[] = [];
  for (const chunk of chunks) {
    const results = (chunk as any)?.results;
    if (Array.isArray(results)) out.push(...results);
  }
  return out;
}

/** One campaign's metrics for one day, in our units. */
export interface CampaignDaySpend {
  /** YYYY-MM-DD, exactly as Google segmented it. */
  date: string;
  campaignId: string;
  campaignName: string;
  /** Whole currency units (rupees for an INR account). */
  amount: number;
  impressions: number;
  clicks: number;
  /** Google's own attributed conversions — kept for comparison against ours. */
  conversions: number;
  /** Stable key for idempotent re-sync. */
  externalId: string;
}

/**
 * Map one searchStream row to a CampaignDaySpend.
 *
 * REST responses are camelCase even though GAQL is snake_case, so
 * `metrics.cost_micros` comes back as `metrics.costMicros`. Both spellings are
 * accepted here because that mismatch is easy to get wrong and produces a
 * silent zero rather than an error.
 *
 * Returns null for a row missing the fields that make it addressable, so a
 * partial response degrades to fewer rows instead of rows of zeroes.
 */
export function mapCampaignRow(
  row: Record<string, any>,
  customerId: string,
): CampaignDaySpend | null {
  const campaign = row?.campaign ?? {};
  const metrics = row?.metrics ?? {};
  const segments = row?.segments ?? {};

  const date: string | undefined = segments.date;
  const campaignId =
    campaign.id === undefined || campaign.id === null ? '' : String(campaign.id);

  if (!date || !campaignId) return null;

  return {
    date,
    campaignId,
    campaignName: campaign.name ?? `Campaign ${campaignId}`,
    amount: microsToUnits(metrics.costMicros ?? metrics.cost_micros),
    impressions: num(metrics.impressions),
    clicks: num(metrics.clicks),
    conversions: num(metrics.conversions),
    externalId: buildExternalId(customerId, campaignId, date),
  };
}

/**
 * Natural key for a synced row: one Google Ads campaign, one day, one account.
 *
 * AdSpend's existing unique key includes nullable columns, and Postgres treats
 * NULLs as distinct — so upserting on it would insert a duplicate on every
 * sync rather than updating. This key has no nullable part, which is what
 * makes re-syncing safe. Google restates the last few days of cost data, so
 * re-syncing is not optional.
 */
export function buildExternalId(
  customerId: string,
  campaignId: string,
  date: string,
): string {
  return `${normaliseCustomerId(customerId)}:${campaignId}:${date}`;
}

/** Marks rows this integration owns, so manual entries are never touched. */
export const GOOGLE_ADS_SOURCE = 'google_ads';

/** Every synced row lands on the Google Ads channel. */
export const GOOGLE_ADS_CHANNEL: AdChannel = AdChannel.GOOGLE_ADS;

/**
 * GAQL for campaign performance segmented by day.
 *
 * Dates are inclusive on both ends and must be YYYY-MM-DD. Rows with no
 * impressions are excluded: Google returns a row per campaign per day
 * regardless of activity, and storing thousands of zero rows would bloat the
 * table and drag the dashboard's groupBy without adding information.
 */
export function campaignSpendQuery(from: string, to: string): string {
  return [
    'SELECT',
    '  campaign.id,',
    '  campaign.name,',
    '  segments.date,',
    '  metrics.cost_micros,',
    '  metrics.impressions,',
    '  metrics.clicks,',
    '  metrics.conversions',
    'FROM campaign',
    `WHERE segments.date BETWEEN '${assertIsoDate(from)}' AND '${assertIsoDate(to)}'`,
    '  AND metrics.impressions > 0',
    'ORDER BY segments.date DESC',
  ].join('\n');
}

/**
 * GAQL is a string query, so a caller-supplied date is a string-injection
 * surface. Only YYYY-MM-DD is ever valid here, so reject anything else rather
 * than interpolating it.
 */
export function assertIsoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
    throw new Error(`Expected a YYYY-MM-DD date, got: ${JSON.stringify(value)}`);
  }
  return value;
}

/** YYYY-MM-DD in UTC, matching how Prisma stores the day key. */
export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Inclusive date window ending today, used by the scheduled sync. */
export function lookbackWindow(days: number, now = new Date()): { from: string; to: string } {
  const to = new Date(now);
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - Math.max(0, days - 1));
  return { from: isoDay(from), to: isoDay(to) };
}
