import { defaultWindow, isoDay } from './search-console-mapping';

/**
 * Search Console diagnostics: pure functions that turn stored performance rows
 * into the report the SEO dashboard shows. No network, no Nest, no Prisma.
 *
 * Two documented properties of the data decide how figures are combined:
 *
 *   Anonymized queries are omitted from any breakdown by query but still
 *   counted in totals, so anything added up from query rows is lower than the
 *   real total. Headline figures therefore come from the site-level pull and
 *   page figures from the page-level pull, never from summing query rows.
 *
 *   Totals are aggregated by property while page rows are aggregated by page,
 *   so page figures are not expected to add up to the site total.
 *
 * Benchmarks come from this site's own data (for example the site's own CTR at
 * positions 1-3) rather than published industry CTR curves, which vary by
 * query type and are not something to hard-code as fact. Every threshold lives
 * in THRESHOLDS so the rules can be tuned in one place.
 */

export type IssueType =
  | 'cannibalisation'
  | 'low_ctr'
  | 'striking_distance'
  | 'declining_page'
  | 'position_drop'
  | 'lost_query'
  | 'off_target'
  | 'no_visibility'
  | 'new_query';

export type Severity = 'high' | 'medium' | 'low' | 'info';

export const ISSUE_TYPES: IssueType[] = [
  'cannibalisation',
  'low_ctr',
  'striking_distance',
  'declining_page',
  'position_drop',
  'lost_query',
  'off_target',
  'no_visibility',
  'new_query',
];

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2, info: 3 };

export const THRESHOLDS = {
  cannibalisation: {
    minTotalImpressions: 50,
    minPageImpressions: 10,
    /** A page must carry at least this share of the query's impressions to count. */
    minShare: 0.1,
    highTotalImpressions: 500,
    highSecondShare: 0.3,
  },
  lowCtr: {
    maxPosition: 10,
    minImpressions: 100,
    /** A position bucket needs this much data before its average is trusted. */
    bucketMinPairs: 20,
    bucketMinImpressions: 1000,
    /** Flag when CTR is below this fraction of the site's own bucket average. */
    ratio: 0.5,
    highImpressions: 1000,
  },
  strikingDistance: { minPosition: 11, maxPosition: 20, minImpressions: 50, mediumImpressions: 500 },
  decliningPage: {
    minPreviousClicks: 20,
    minDropRatio: 0.3,
    minAbsoluteDrop: 10,
    highDropRatio: 0.5,
    highPreviousClicks: 50,
  },
  positionDrop: { minImpressions: 100, minPositionsLost: 3 },
  lostQuery: { minPreviousClicks: 5, maxRemainingImpressionRatio: 0.2 },
  offTarget: { minImpressions: 50, maxOwnShare: 0.2 },
  newQuery: { minImpressions: 50 },
} as const;

export interface DateWindow {
  from: string;
  to: string;
}

export interface Metric {
  clicks: number;
  impressions: number;
  /** PERCENT, 0-100. */
  ctr: number;
  /** Impression-weighted average position. 0 when there were no impressions. */
  position: number;
}

/** One day of a date x dimension pull. `key` is '' for the site-level pull. */
export interface DailyRow {
  date: string;
  key: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface QueryRow {
  date: string;
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface ManifestPage {
  url: string;
  primary?: string | null;
  title?: string | null;
  tier?: number | null;
  /** Google Ads impressions from the demand report. Used only to rank pages. */
  impr?: number | null;
}

export interface Delta {
  abs: number;
  /** Null when the previous value was zero and a percentage is meaningless. */
  pct: number | null;
}

export interface IssuePage {
  url: string;
  path: string;
  clicks: number;
  impressions: number;
  position: number;
  /** PERCENT of the query's impressions that landed on this page. */
  share: number;
}

export interface Issue {
  id: string;
  type: IssueType;
  severity: Severity;
  title: string;
  url: string | null;
  path: string | null;
  query: string | null;
  pages?: IssuePage[];
  metrics: Record<string, number | string | null>;
  action: string;
  /** Rough size of the opportunity in clicks or impressions. Used for ordering. */
  impact: number;
}

export interface EntityRow {
  key: string;
  url?: string;
  path?: string | null;
  label: string;
  current: Metric;
  previous: Metric;
  clicksDelta: Delta;
  positionDelta: number | null;
  brand?: boolean;
}

export interface PageSummary {
  path: string;
  url: string;
  current: Metric;
  previous: Metric;
  clicksDelta: Delta;
  positionDelta: number | null;
  issues: { type: IssueType; severity: Severity; title: string; action: string }[];
}

export interface SeriesPoint {
  date: string;
  clicks: number;
  impressions: number;
  prevClicks: number | null;
  prevImpressions: number | null;
}

export interface SearchReport {
  days: number;
  siteHost: string;
  windows: { current: DateWindow; previous: DateWindow };
  hasData: boolean;
  hasPrevious: boolean;
  lastSyncedAt?: string | null;
  overview: {
    current: Metric;
    previous: Metric;
    delta: { clicks: Delta; impressions: Delta; ctr: number | null; position: number | null };
  };
  series: SeriesPoint[];
  /** The site's own CTR by position bucket, or null where there is too little data. */
  ctrBenchmarks: Record<string, number | null>;
  topPages: EntityRow[];
  topQueries: EntityRow[];
  devices: EntityRow[];
  countries: EntityRow[];
  brand: { terms: string[]; brand: Metric; nonBrand: Metric };
  issues: Issue[];
  issueCounts: Record<IssueType, number>;
  pageSummaries: PageSummary[];
  notes: string[];
}

export interface BuildInput {
  days: number;
  windows: { current: DateWindow; previous: DateWindow };
  siteHost: string;
  site: DailyRow[];
  pages: DailyRow[];
  devices: DailyRow[];
  countries: DailyRow[];
  queries: QueryRow[];
  manifest: ManifestPage[];
  brandTerms: string[];
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

interface Acc {
  clicks: number;
  impressions: number;
  posWeighted: number;
}

const newAcc = (): Acc => ({ clicks: 0, impressions: 0, posWeighted: 0 });

function addTo(acc: Acc, r: { clicks: number; impressions: number; position: number }) {
  acc.clicks += r.clicks;
  acc.impressions += r.impressions;
  acc.posWeighted += r.position * r.impressions;
}

export function toMetric(acc: Acc | undefined): Metric {
  if (!acc) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  return {
    clicks: acc.clicks,
    impressions: acc.impressions,
    ctr: acc.impressions > 0 ? round2((acc.clicks / acc.impressions) * 100) : 0,
    position: acc.impressions > 0 ? round1(acc.posWeighted / acc.impressions) : 0,
  };
}

function accFor<K>(map: Map<K, Acc>, key: K): Acc {
  let a = map.get(key);
  if (!a) {
    a = newAcc();
    map.set(key, a);
  }
  return a;
}

export function inWindow(date: string, w: DateWindow): boolean {
  return date >= w.from && date <= w.to;
}

/**
 * The current window ends where Search Console data is final, and the previous
 * window is the same length immediately before it.
 */
export function comparisonWindows(
  days: number,
  now = new Date(),
): { current: DateWindow; previous: DateWindow } {
  const current = defaultWindow(days, now);
  const prevEnd = new Date(`${current.from}T00:00:00.000Z`);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - Math.max(0, days - 1));
  return { current, previous: { from: isoDay(prevStart), to: isoDay(prevEnd) } };
}

export function delta(current: number, previous: number): Delta {
  return {
    abs: current - previous,
    pct: previous > 0 ? round1(((current - previous) / previous) * 100) : null,
  };
}

/**
 * Reduce a page URL to a site path so Search Console URLs, manifest paths and
 * audit URLs line up. Returns null for another host, so pages from a different
 * domain never get mixed into this site's figures.
 */
export function toSitePath(pageUrl: string, siteHost: string): string | null {
  const raw = (pageUrl ?? '').trim();
  if (!raw) return null;
  const clean = (p: string) => {
    let out = p.split(/[?#]/)[0] || '/';
    if (out.length > 1) out = out.replace(/\/+$/, '');
    return out || '/';
  };
  if (raw.startsWith('/')) return clean(raw);
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');
    const wanted = (siteHost ?? '').replace(/^www\./, '');
    if (wanted && host !== wanted) return null;
    return clean(u.pathname);
  } catch {
    return null;
  }
}

export function isBrandQuery(query: string, terms: string[]): boolean {
  const q = (query ?? '').toLowerCase();
  return terms.some((t) => t && q.includes(t.toLowerCase()));
}

function tokens(s: string): string[] {
  return (s ?? '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2);
}

/** True when every meaningful word of the query already appears in the text. */
export function coversQuery(text: string, query: string): boolean {
  const have = new Set(tokens(text));
  const need = tokens(query);
  return need.length > 0 && need.every((w) => have.has(w));
}

const DEVICE_LABELS: Record<string, string> = {
  DESKTOP: 'Desktop',
  MOBILE: 'Mobile',
  TABLET: 'Tablet',
};

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

interface Pair {
  path: string;
  query: string;
  acc: Acc;
}

export function buildSearchReport(input: BuildInput): SearchReport {
  const { days, windows, siteHost } = input;
  const cw = windows.current;
  const pw = windows.previous;
  const T = THRESHOLDS;
  const urlFor = (path: string) => `https://${siteHost}${path}`;

  // ---- site totals and the daily series --------------------------------
  const siteCur = newAcc();
  const sitePrev = newAcc();
  const siteByDate = new Map<string, DailyRow>();
  for (const r of input.site) {
    siteByDate.set(r.date, r);
    if (inWindow(r.date, cw)) addTo(siteCur, r);
    else if (inWindow(r.date, pw)) addTo(sitePrev, r);
  }

  // ---- page totals (page-level pull: includes anonymized queries) -----------
  const pageCur = new Map<string, Acc>();
  const pagePrev = new Map<string, Acc>();
  for (const r of input.pages) {
    const path = toSitePath(r.key, siteHost);
    if (path === null) continue;
    if (inWindow(r.date, cw)) addTo(accFor(pageCur, path), r);
    else if (inWindow(r.date, pw)) addTo(accFor(pagePrev, path), r);
  }

  // ---- page x query pairs and query totals ----------------------------------
  const pairsCur = new Map<string, Pair>();
  const pairsPrev = new Map<string, Pair>();
  const queryCur = new Map<string, Acc>();
  const queryPrev = new Map<string, Acc>();
  const pairPageCur = new Map<string, Acc>();
  const pairPagePrev = new Map<string, Acc>();

  for (const r of input.queries) {
    const path = toSitePath(r.page, siteHost);
    if (path === null) continue;
    const isCur = inWindow(r.date, cw);
    const isPrev = !isCur && inWindow(r.date, pw);
    if (!isCur && !isPrev) continue;

    const pairs = isCur ? pairsCur : pairsPrev;
    const key = JSON.stringify([path, r.query]);
    let pair = pairs.get(key);
    if (!pair) {
      pair = { path, query: r.query, acc: newAcc() };
      pairs.set(key, pair);
    }
    addTo(pair.acc, r);
    addTo(accFor(isCur ? pairPageCur : pairPagePrev, path), r);
    if (r.query) addTo(accFor(isCur ? queryCur : queryPrev, r.query), r);
  }

  const hasData = siteCur.impressions > 0 || pageCur.size > 0 || pairsCur.size > 0;
  const hasPrevious = sitePrev.impressions > 0 || pagePrev.size > 0 || pairsPrev.size > 0;

  const series: SeriesPoint[] = [];
  const end = new Date(`${cw.to}T00:00:00.000Z`);
  for (let d = new Date(`${cw.from}T00:00:00.000Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = isoDay(d);
    const prevDay = new Date(d);
    prevDay.setUTCDate(prevDay.getUTCDate() - days);
    const cur = siteByDate.get(day);
    const prev = siteByDate.get(isoDay(prevDay));
    series.push({
      date: day,
      clicks: cur?.clicks ?? 0,
      impressions: cur?.impressions ?? 0,
      prevClicks: hasPrevious ? (prev?.clicks ?? 0) : null,
      prevImpressions: hasPrevious ? (prev?.impressions ?? 0) : null,
    });
  }

  const overviewCur = toMetric(siteCur);
  const overviewPrev = toMetric(sitePrev);

  // Page figures prefer the page-level pull; older syncs only have query rows.
  const usePageDim = pageCur.size > 0 || pagePrev.size > 0;
  const pageMetricsCur = usePageDim ? pageCur : pairPageCur;
  const pageMetricsPrev = usePageDim ? pagePrev : pairPagePrev;

  const issues: Issue[] = [];
  const manifestByPath = new Map<string, ManifestPage>();
  for (const mp of input.manifest) {
    const path = toSitePath(mp.url, siteHost);
    if (path !== null) manifestByPath.set(path, mp);
  }

  // ---- 1. cannibalisation -------------------------------------------------
  const pairsByQuery = new Map<string, Pair[]>();
  for (const p of pairsCur.values()) {
    if (!p.query) continue;
    const k = p.query.toLowerCase();
    const list = pairsByQuery.get(k) ?? [];
    list.push(p);
    pairsByQuery.set(k, list);
  }

  const cannibalPaths = new Map<string, Set<string>>();
  for (const [query, list] of pairsByQuery) {
    const total = list.reduce((s, p) => s + p.acc.impressions, 0);
    if (total < T.cannibalisation.minTotalImpressions) continue;
    const qualifying = list.filter(
      (p) =>
        p.acc.impressions >= T.cannibalisation.minPageImpressions &&
        p.acc.impressions / total >= T.cannibalisation.minShare,
    );
    if (qualifying.length < 2) continue;

    const ranked = qualifying
      .map((p) => ({ p, m: toMetric(p.acc) }))
      .sort(
        (a, b) =>
          b.m.clicks - a.m.clicks || a.m.position - b.m.position || b.m.impressions - a.m.impressions,
      );
    const shares = ranked.map((x) => x.m.impressions / total).sort((a, b) => b - a);
    const primary = ranked[0];
    const others = ranked.slice(1);
    const severity: Severity =
      total >= T.cannibalisation.highTotalImpressions ||
      (shares[1] ?? 0) >= T.cannibalisation.highSecondShare
        ? 'high'
        : 'medium';
    const otherPaths = others.map((o) => o.p.path);
    const pronoun = others.length === 1 ? 'it' : 'them';

    cannibalPaths.set(query, new Set(ranked.map((x) => x.p.path)));
    issues.push({
      id: `cannibalisation:${query}`,
      type: 'cannibalisation',
      severity,
      title: `"${query}" is split across ${ranked.length} of your pages`,
      url: urlFor(primary.p.path),
      path: primary.p.path,
      query,
      pages: ranked.map((x) => ({
        url: urlFor(x.p.path),
        path: x.p.path,
        clicks: x.m.clicks,
        impressions: x.m.impressions,
        position: x.m.position,
        share: round1((x.m.impressions / total) * 100),
      })),
      metrics: { totalImpressions: total, pages: ranked.length, primaryPath: primary.p.path },
      action:
        `Choose ${primary.p.path} as the page for "${query}". If ${otherPaths.join(', ')} ` +
        `cover the same intent, 301-redirect ${pronoun} to ${primary.p.path}; otherwise retarget ` +
        `${pronoun} to a different query and link to ${primary.p.path} using "${query}" as the anchor text.`,
      impact: others.reduce((s, o) => s + o.m.impressions, 0),
    });
  }

  // ---- 2. low CTR against the site's own position benchmark --------------
  const bucketOf = (pos: number): string | null =>
    pos <= 0 ? null : pos <= 3 ? '1-3' : pos <= 6 ? '4-6' : pos <= 10 ? '7-10' : null;

  const pairMetrics = [...pairsCur.values()].map((p) => ({ p, m: toMetric(p.acc) }));
  const buckets = new Map<string, { pairs: number; clicks: number; impressions: number }>();
  for (const { m } of pairMetrics) {
    const b = m.impressions > 0 ? bucketOf(m.position) : null;
    if (!b) continue;
    const e = buckets.get(b) ?? { pairs: 0, clicks: 0, impressions: 0 };
    e.pairs++;
    e.clicks += m.clicks;
    e.impressions += m.impressions;
    buckets.set(b, e);
  }
  const ctrBenchmarks: Record<string, number | null> = {};
  for (const b of ['1-3', '4-6', '7-10']) {
    const e = buckets.get(b);
    ctrBenchmarks[b] =
      e && e.pairs >= T.lowCtr.bucketMinPairs && e.impressions >= T.lowCtr.bucketMinImpressions
        ? round2((e.clicks / e.impressions) * 100)
        : null;
  }

  for (const { p, m } of pairMetrics) {
    if (!p.query || m.impressions < T.lowCtr.minImpressions || m.position > T.lowCtr.maxPosition) continue;
    const b = bucketOf(m.position);
    const bench = b ? ctrBenchmarks[b] : null;
    if (!bench || m.ctr >= bench * T.lowCtr.ratio) continue;

    const expected = Math.round((m.impressions * bench) / 100);
    issues.push({
      id: `low_ctr:${p.path}:${p.query}`,
      type: 'low_ctr',
      severity: m.impressions >= T.lowCtr.highImpressions ? 'high' : 'medium',
      title: `Low CTR for "${p.query}" at position ${m.position}`,
      url: urlFor(p.path),
      path: p.path,
      query: p.query,
      metrics: {
        position: m.position,
        impressions: m.impressions,
        clicks: m.clicks,
        ctr: m.ctr,
        benchmarkCtr: bench,
        expectedClicks: expected,
      },
      action:
        `Rewrite the title tag and meta description of ${p.path} so they answer "${p.query}" directly. ` +
        `At positions ${b} your site averages ${bench}% CTR; this page gets ${m.ctr}%.`,
      impact: Math.max(0, expected - m.clicks),
    });
  }

  // ---- 3. striking distance ------------------------------------------------
  for (const { p, m } of pairMetrics) {
    if (
      !p.query ||
      m.impressions < T.strikingDistance.minImpressions ||
      m.position < T.strikingDistance.minPosition ||
      m.position > T.strikingDistance.maxPosition
    ) {
      continue;
    }
    const title = manifestByPath.get(p.path)?.title ?? '';
    const targeted = title ? coversQuery(title, p.query) : false;
    issues.push({
      id: `striking_distance:${p.path}:${p.query}`,
      type: 'striking_distance',
      severity: m.impressions >= T.strikingDistance.mediumImpressions ? 'medium' : 'low',
      title: `"${p.query}" ranks ${m.position} on ${p.path}`,
      url: urlFor(p.path),
      path: p.path,
      query: p.query,
      metrics: { position: m.position, impressions: m.impressions, clicks: m.clicks, ctr: m.ctr },
      action: targeted
        ? `The page already targets "${p.query}". Push it onto page one with two or three internal links from related pages using "${p.query}" as the anchor text, and expand the section that answers it.`
        : `Add "${p.query}" to the title and H1 of ${p.path}, answer it in the opening section, and add internal links to the page using that phrase.`,
      impact: m.impressions,
    });
  }

  // ---- 4. declining pages and 5. position drops --------------------------
  const declined = new Set<string>();
  if (hasPrevious) {
    for (const [path, prevAcc] of pageMetricsPrev) {
      const prev = toMetric(prevAcc);
      const cur = toMetric(pageMetricsCur.get(path));
      const drop = prev.clicks - cur.clicks;
      if (
        prev.clicks < T.decliningPage.minPreviousClicks ||
        drop < T.decliningPage.minAbsoluteDrop ||
        drop / prev.clicks < T.decliningPage.minDropRatio
      ) {
        continue;
      }
      const ratio = drop / prev.clicks;
      declined.add(path);
      issues.push({
        id: `declining_page:${path}`,
        type: 'declining_page',
        severity:
          ratio >= T.decliningPage.highDropRatio && prev.clicks >= T.decliningPage.highPreviousClicks
            ? 'high'
            : 'medium',
        title: `${path} clicks down ${Math.round(ratio * 100)}%`,
        url: urlFor(path),
        path,
        query: null,
        metrics: {
          previousClicks: prev.clicks,
          currentClicks: cur.clicks,
          dropPct: Math.round(ratio * 100),
          previousPosition: prev.position,
          currentPosition: cur.position,
        },
        action:
          `Compare this page's queries across both periods to see which terms lost clicks, check whether ` +
          `another page on your site or a competitor took them, then refresh the content and title.`,
        impact: drop,
      });
    }

    for (const [path, curAcc] of pageMetricsCur) {
      if (declined.has(path)) continue;
      const cur = toMetric(curAcc);
      const prev = toMetric(pageMetricsPrev.get(path));
      if (
        cur.impressions < T.positionDrop.minImpressions ||
        prev.impressions < T.positionDrop.minImpressions ||
        cur.position - prev.position < T.positionDrop.minPositionsLost
      ) {
        continue;
      }
      const leftPageOne = prev.position <= 10 && cur.position > 10;
      issues.push({
        id: `position_drop:${path}`,
        type: 'position_drop',
        severity: leftPageOne ? 'high' : 'medium',
        title: `${path} dropped from position ${prev.position} to ${cur.position}`,
        url: urlFor(path),
        path,
        query: null,
        metrics: {
          previousPosition: prev.position,
          currentPosition: cur.position,
          impressions: cur.impressions,
        },
        action:
          `Check whether the page changed recently, whether it is still indexed, and whether another ` +
          `page now outranks it for its main queries.`,
        impact: cur.impressions,
      });
    }
  }

  // ---- 6. lost queries and 9. new queries ------------------------------------
  if (hasPrevious) {
    const topPrevPath = new Map<string, { path: string; clicks: number }>();
    for (const p of pairsPrev.values()) {
      if (!p.query) continue;
      const best = topPrevPath.get(p.query);
      if (!best || p.acc.clicks > best.clicks) topPrevPath.set(p.query, { path: p.path, clicks: p.acc.clicks });
    }

    for (const [query, prevAcc] of queryPrev) {
      const prev = toMetric(prevAcc);
      const cur = toMetric(queryCur.get(query));
      if (
        prev.clicks < T.lostQuery.minPreviousClicks ||
        cur.clicks > 0 ||
        cur.impressions > prev.impressions * T.lostQuery.maxRemainingImpressionRatio
      ) {
        continue;
      }
      const path = topPrevPath.get(query)?.path ?? null;
      issues.push({
        id: `lost_query:${query}`,
        type: 'lost_query',
        severity: 'medium',
        title: `Lost clicks for "${query}"`,
        url: path ? urlFor(path) : null,
        path,
        query,
        metrics: {
          previousClicks: prev.clicks,
          previousImpressions: prev.impressions,
          currentImpressions: cur.impressions,
        },
        action:
          `This query sent ${prev.clicks} clicks last period and none now. ` +
          (path
            ? `Check that ${path} is still indexed, still targets the query, and has not been outranked by another of your pages.`
            : 'Find which page used to rank for it and check that it is still indexed.'),
        impact: prev.clicks,
      });
    }

    for (const [query, curAcc] of queryCur) {
      const cur = toMetric(curAcc);
      if (cur.impressions < T.newQuery.minImpressions || (queryPrev.get(query)?.impressions ?? 0) > 0) continue;
      let best: Pair | null = null;
      for (const p of pairsByQuery.get(query.toLowerCase()) ?? []) {
        if (!best || p.acc.impressions > best.acc.impressions) best = p;
      }
      issues.push({
        id: `new_query:${query}`,
        type: 'new_query',
        severity: 'info',
        title: `New query: "${query}"`,
        url: best ? urlFor(best.path) : null,
        path: best?.path ?? null,
        query,
        metrics: { impressions: cur.impressions, clicks: cur.clicks, position: cur.position },
        action: best
          ? `This query started showing your site this period. If it fits ${best.path}, mention it explicitly on that page; if it doesn't, consider a dedicated section.`
          : 'This query started showing your site this period.',
        impact: cur.impressions,
      });
    }
  }

  // ---- 7. planned pages with no visibility ---------------------------------
  // Needs the page-level pull: judged from query rows alone, a page that only
  // appears for anonymized queries would be wrongly reported as invisible.
  if (pageCur.size > 0) {
    for (const [path, mp] of manifestByPath) {
      if ((pageCur.get(path)?.impressions ?? 0) > 0) continue;
      const tier = mp.tier ?? 99;
      issues.push({
        id: `no_visibility:${path}`,
        type: 'no_visibility',
        severity: tier <= 1 ? 'medium' : 'low',
        title: `${path} has no search impressions`,
        url: urlFor(path),
        path,
        query: mp.primary ?? null,
        metrics: { tier: mp.tier ?? null, adsDemandImpressions: mp.impr ?? null },
        action:
          'Confirm the page is indexed with URL Inspection in Search Console and listed in the sitemap, ' +
          'then add internal links to it from pages that already get search traffic.',
        impact: mp.impr ?? 0,
      });
    }
  }

  // ---- 8. off-target pages ---------------------------------------------------
  for (const [path, mp] of manifestByPath) {
    const primary = (mp.primary ?? '').trim().toLowerCase();
    if (!primary) continue;
    const list = pairsByQuery.get(primary);
    if (!list) continue;
    const total = list.reduce((s, p) => s + p.acc.impressions, 0);
    if (total < T.offTarget.minImpressions) continue;
    const own = list.find((p) => p.path === path);
    const ownShare = (own?.acc.impressions ?? 0) / total;
    if (ownShare >= T.offTarget.maxOwnShare) continue;
    if (cannibalPaths.get(primary)?.has(path)) continue;
    const top = list
      .filter((p) => p.path !== path)
      .sort((a, b) => b.acc.impressions - a.acc.impressions)[0];
    if (!top) continue;
    issues.push({
      id: `off_target:${path}`,
      type: 'off_target',
      severity: 'medium',
      title: `${path} isn't the page Google shows for "${primary}"`,
      url: urlFor(path),
      path,
      query: primary,
      metrics: {
        totalImpressions: total,
        ownSharePct: round1(ownShare * 100),
        shownPath: top.path,
        shownImpressions: top.acc.impressions,
      },
      action:
        `Google shows ${top.path} for "${primary}", the query ${path} was built for. Either strengthen ` +
        `${path} for it (title, H1, internal links pointing at it) or accept ${top.path} as the target and retarget ${path}.`,
      impact: total,
    });
  }

  issues.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.impact - a.impact);

  const issueCounts = Object.fromEntries(ISSUE_TYPES.map((t) => [t, 0])) as Record<IssueType, number>;
  for (const i of issues) issueCounts[i.type]++;

  // ---- entity tables ---------------------------------------------------------
  const entityRows = (
    cur: Map<string, Acc>,
    prev: Map<string, Acc>,
    describe: (key: string) => Partial<EntityRow> & { label: string },
  ): EntityRow[] => {
    const keys = new Set<string>([...cur.keys(), ...prev.keys()]);
    return [...keys]
      .map((key) => {
        const c = toMetric(cur.get(key));
        const p = toMetric(prev.get(key));
        return {
          key,
          ...describe(key),
          current: c,
          previous: p,
          clicksDelta: delta(c.clicks, p.clicks),
          positionDelta: c.impressions > 0 && p.impressions > 0 ? round1(c.position - p.position) : null,
        };
      })
      .sort((a, b) => b.current.clicks - a.current.clicks || b.current.impressions - a.current.impressions);
  };

  const groupDaily = (rows: DailyRow[], w: DateWindow) => {
    const m = new Map<string, Acc>();
    for (const r of rows) if (inWindow(r.date, w)) addTo(accFor(m, r.key), r);
    return m;
  };

  const topPages = entityRows(pageMetricsCur, pageMetricsPrev, (path) => ({
    label: path,
    path,
    url: urlFor(path),
  })).slice(0, 100);

  const topQueries = entityRows(queryCur, queryPrev, (q) => ({
    label: q,
    brand: isBrandQuery(q, input.brandTerms),
  })).slice(0, 100);

  const devices = entityRows(groupDaily(input.devices, cw), groupDaily(input.devices, pw), (k) => ({
    label: DEVICE_LABELS[k.toUpperCase()] ?? k,
  }));

  const countries = entityRows(groupDaily(input.countries, cw), groupDaily(input.countries, pw), (k) => ({
    label: k.toUpperCase(),
  })).slice(0, 25);

  const brandAcc = newAcc();
  const nonBrandAcc = newAcc();
  for (const [query, acc] of queryCur) {
    const target = isBrandQuery(query, input.brandTerms) ? brandAcc : nonBrandAcc;
    target.clicks += acc.clicks;
    target.impressions += acc.impressions;
    target.posWeighted += acc.posWeighted;
  }

  // ---- page summaries for the rankings table ---------------------------------
  const issuesByPath = new Map<string, PageSummary['issues']>();
  const attach = (path: string, item: PageSummary['issues'][number]) => {
    const list = issuesByPath.get(path) ?? [];
    list.push(item);
    issuesByPath.set(path, list);
  };
  for (const i of issues) {
    if (i.severity === 'info') continue;
    if (i.type === 'cannibalisation' && i.pages) {
      for (const pg of i.pages) {
        attach(pg.path, {
          type: i.type,
          severity: i.severity,
          title: pg.path === i.path ? i.title : `Competes with ${i.path} for "${i.query}"`,
          action: i.action,
        });
      }
    } else if (i.path) {
      attach(i.path, { type: i.type, severity: i.severity, title: i.title, action: i.action });
    }
  }

  const summaryPaths = new Set<string>([
    ...pageMetricsCur.keys(),
    ...pageMetricsPrev.keys(),
    ...issuesByPath.keys(),
  ]);
  const pageSummaries: PageSummary[] = [...summaryPaths].map((path) => {
    const c = toMetric(pageMetricsCur.get(path));
    const p = toMetric(pageMetricsPrev.get(path));
    return {
      path,
      url: urlFor(path),
      current: c,
      previous: p,
      clicksDelta: delta(c.clicks, p.clicks),
      positionDelta: c.impressions > 0 && p.impressions > 0 ? round1(c.position - p.position) : null,
      issues: issuesByPath.get(path) ?? [],
    };
  });

  return {
    days,
    siteHost,
    windows,
    hasData,
    hasPrevious,
    overview: {
      current: overviewCur,
      previous: overviewPrev,
      delta: {
        clicks: delta(overviewCur.clicks, overviewPrev.clicks),
        impressions: delta(overviewCur.impressions, overviewPrev.impressions),
        ctr: hasPrevious && overviewPrev.impressions > 0 ? round2(overviewCur.ctr - overviewPrev.ctr) : null,
        position:
          hasPrevious && overviewPrev.impressions > 0 && overviewCur.impressions > 0
            ? round1(overviewCur.position - overviewPrev.position)
            : null,
      },
    },
    series,
    ctrBenchmarks,
    topPages,
    topQueries,
    devices,
    countries,
    brand: { terms: input.brandTerms, brand: toMetric(brandAcc), nonBrand: toMetric(nonBrandAcc) },
    issues,
    issueCounts,
    pageSummaries,
    notes: [
      'Query tables leave out anonymized queries, so they add up to less than the totals.',
      'Totals are counted per property and page rows per page, so page rows are not expected to add up to the totals.',
      'Backlinks, domain authority, competitor keywords and search volume are not available from Search Console.',
    ],
  };
}

/**
 * Add Search Console figures and issues to the rankings response.
 *
 * Issues are appended as tasks only. They never feed the page score, so scores
 * stay stable while Google's figures move from day to day.
 */
/** Search Console figures attached to one row of the rankings response. */
export interface PageSearchFigures {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  clicksDelta: Delta;
  positionDelta: number | null;
  issueCount: number;
}

export function attachSearchData<T extends { rankings: Array<Record<string, any>> }>(
  response: T,
  report: SearchReport,
): Omit<T, 'rankings'> & {
  rankings: Array<T['rankings'][number] & { search: PageSearchFigures | null }>;
} {
  const byPath = new Map(report.pageSummaries.map((s) => [s.path, s]));
  const rankings = response.rankings.map((row) => {
    const path =
      toSitePath(String(row.url ?? ''), report.siteHost) ??
      (typeof row.path === 'string' ? toSitePath(row.path, report.siteHost) : null);
    const summary = path ? byPath.get(path) : undefined;
    if (!summary) return { ...row, search: null };

    const searchTasks = summary.issues.map((i, n) => ({
      id: `gsc:${i.type}:${n}`,
      severity: i.severity === 'high' ? 'fail' : 'warn',
      label: i.title,
      task: i.action,
      category: 'search-console',
    }));

    return {
      ...row,
      search: {
        clicks: summary.current.clicks,
        impressions: summary.current.impressions,
        ctr: summary.current.ctr,
        position: summary.current.position,
        clicksDelta: summary.clicksDelta,
        positionDelta: summary.positionDelta,
        issueCount: summary.issues.length,
      },
      tasks: [...(Array.isArray(row.tasks) ? row.tasks : []), ...searchTasks],
    };
  });
  // The rows gain `search`; the declared return type says so, the spread cannot.
  return { ...response, rankings } as unknown as Omit<T, 'rankings'> & {
    rankings: Array<T['rankings'][number] & { search: PageSearchFigures | null }>;
  };
}
