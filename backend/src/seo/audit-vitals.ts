/**
 * Core Web Vitals from the PageSpeed Insights API.
 *
 * Google's ranking systems use Core Web Vitals, judged at the 75th percentile
 * of real page loads (https://web.dev/articles/vitals). That is field data from
 * the Chrome UX Report, which PSI returns in `loadingExperience` for the URL,
 * or for the whole origin when the URL has too little traffic of its own.
 *
 * Lighthouse lab numbers are a fallback only. A lab run can estimate LCP and
 * CLS but cannot measure INP, which needs real interactions, so INP is left
 * unmeasured rather than guessed from Total Blocking Time.
 */

export type VitalMetric = 'lcpMs' | 'inpMs' | 'cls';
export type VitalRating = 'good' | 'needs-improvement' | 'poor';
export type VitalSource = 'url-field' | 'origin-field' | 'lab';

/** Good and poor boundaries at the 75th percentile, from web.dev/articles/vitals. */
export const VITAL_THRESHOLDS: Record<VitalMetric, { good: number; poor: number }> = {
  lcpMs: { good: 2500, poor: 4000 },
  inpMs: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
};

export function rateVital(metric: VitalMetric, value: number): VitalRating {
  const t = VITAL_THRESHOLDS[metric];
  if (value <= t.good) return 'good';
  if (value <= t.poor) return 'needs-improvement';
  return 'poor';
}

export interface VitalsSet {
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
}

export interface VitalValue {
  value: number;
  source: VitalSource;
  rating: VitalRating;
}

export interface PageVitals {
  lcpMs: VitalValue | null;
  inpMs: VitalValue | null;
  cls: VitalValue | null;
  /** Lighthouse performance score, 0-100. A lab diagnostic, not a ranking signal. */
  labPerformance: number | null;
  /** ISO timestamp of the PSI call these came from. */
  measuredAt: string;
}

export interface ParsedPsi {
  url: VitalsSet | null;
  origin: VitalsSet | null;
  lab: VitalsSet | null;
  labPerformance: number | null;
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/**
 * PSI reports field CLS multiplied by 100: a 75th percentile of 0.20 arrives
 * as 20. The distribution buckets show the scale (bounds of 10 and 25 rather
 * than 0.1 and 0.25), so read it from them and only fall back to magnitude
 * when the buckets are missing.
 */
function fieldCls(metric: any): number | null {
  const p = num(metric?.percentile);
  if (p === null) return null;
  const bounds = (Array.isArray(metric?.distributions) ? metric.distributions : [])
    .flatMap((d: any) => [num(d?.min), num(d?.max)])
    .filter((b: number | null): b is number => b !== null && b > 0);
  const scaled = bounds.length > 0 ? bounds.some((b: number) => b >= 1) : p > 1;
  return scaled ? p / 100 : p;
}

function fieldSet(experience: any): VitalsSet | null {
  const m = experience?.metrics;
  if (!m || typeof m !== 'object') return null;
  const set: VitalsSet = {
    lcpMs: num(m.LARGEST_CONTENTFUL_PAINT_MS?.percentile),
    inpMs: num(m.INTERACTION_TO_NEXT_PAINT?.percentile),
    cls: m.CUMULATIVE_LAYOUT_SHIFT_SCORE ? fieldCls(m.CUMULATIVE_LAYOUT_SHIFT_SCORE) : null,
  };
  return set.lcpMs === null && set.inpMs === null && set.cls === null ? null : set;
}

export function parsePsi(json: any): ParsedPsi {
  const page = json?.loadingExperience;
  // When the URL lacks data PSI may fill loadingExperience from the origin and
  // flag origin_fallback. That is origin data, not this URL's.
  const pageIsOrigin = page?.origin_fallback === true;
  const url = page && !pageIsOrigin ? fieldSet(page) : null;
  const origin = fieldSet(json?.originLoadingExperience) ?? (pageIsOrigin ? fieldSet(page) : null);

  const audits = json?.lighthouseResult?.audits ?? {};
  const labLcp = num(audits['largest-contentful-paint']?.numericValue);
  const labCls = num(audits['cumulative-layout-shift']?.numericValue);
  const lab = labLcp === null && labCls === null ? null : { lcpMs: labLcp, inpMs: null, cls: labCls };

  const perf = num(json?.lighthouseResult?.categories?.performance?.score);
  return { url, origin, lab, labPerformance: perf === null ? null : Math.round(perf * 100) };
}

/**
 * Take each metric from the best source that has it: this URL's real users,
 * then the origin's, then the lab. Per metric, because a URL often has enough
 * data for LCP but not for INP.
 */
export function pickVitals(
  sources: Array<[VitalSource, VitalsSet | null]>,
  labPerformance: number | null,
  measuredAt: string,
): PageVitals {
  const pick = (metric: VitalMetric): VitalValue | null => {
    for (const [source, set] of sources) {
      const v = set?.[metric];
      if (v === null || v === undefined) continue;
      const value = metric === 'cls' ? Math.round(v * 1000) / 1000 : Math.round(v);
      return { value, source, rating: rateVital(metric, value) };
    }
    return null;
  };
  return { lcpMs: pick('lcpMs'), inpMs: pick('inpMs'), cls: pick('cls'), labPerformance, measuredAt };
}

export function vitalsFromPsi(parsed: ParsedPsi, measuredAt: string): PageVitals {
  return pickVitals(
    [
      ['url-field', parsed.url],
      ['origin-field', parsed.origin],
      ['lab', parsed.lab],
    ],
    parsed.labPerformance,
    measuredAt,
  );
}

/** For pages PSI was not run on this time: the origin's field data only. */
export function vitalsFromOrigin(origin: VitalsSet, measuredAt: string): PageVitals {
  return pickVitals([['origin-field', origin]], null, measuredAt);
}

export function hasAnyVital(v: PageVitals | null | undefined): boolean {
  return !!v && (v.lcpMs !== null || v.inpMs !== null || v.cls !== null);
}
