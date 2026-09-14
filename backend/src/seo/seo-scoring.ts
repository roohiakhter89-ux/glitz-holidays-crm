import { CheckCategory, CheckResult, pointsFor } from './audit-types';

/**
 * Page health score.
 *
 * This is not a model of Google's ranking and the name says so. Google
 * publishes no weights. What it does publish is what blocks indexing, what
 * its spam policies target, and which page experience measures it uses, and
 * the checks follow that. The score summarises how many of those a page gets
 * right, weighted by how much the underlying guidance stresses them.
 *
 *   final = measured check points as a share of 90  +  authority (0-10)
 *
 * - Checks that could not be measured (no PageSpeed data, say) are left out
 *   of the denominator rather than counted as failures, and `coverage`
 *   reports how much of the check weight was actually measured.
 * - Authority is headroom added on top and never negative, so entering
 *   backlink data can only raise a score. A measurement people are punished
 *   for entering does not get entered.
 * - A failed indexing gate (noindex, blocked by robots.txt, not a 200) caps
 *   the score at BLOCKED_CAP: nothing else matters if Google cannot index it.
 */

export const BASE_MAX = 90;
export const AUTHORITY_MAX = 10;
export const BLOCKED_CAP = 20;

export const CATEGORIES: CheckCategory[] = ['indexing', 'content', 'appearance', 'experience', 'links'];

/** Per-URL link data, entered by hand or from a backlink tool. */
export interface OffPageSignals {
  backlinkCount?: number | null;
  referringDomains?: number | null;
  /** Tracked only. Page Authority is a third-party metric Google does not use. */
  pageAuthority?: number | null;
  /** Tracked only. */
  prMentions?: number | null;
  /** Tracked only. Google has said social shares are not a ranking signal. */
  socialShares?: number | null;
  /** Tracked only. Written by the Search Console sync for reporting. */
  searchConsoleCtr?: number | null;
  notes?: string | null;
}

/**
 * Site-wide signals. Referring domains feed page authority. Business Profile,
 * reviews and citations feed the separate local score: Google uses them for
 * local results (Maps and the local pack), not for ranking web pages.
 */
export interface DomainSignals {
  gbpCompleteness?: number | null;
  gbpReviewCount?: number | null;
  gbpAverageRating?: number | null;
  gbpPostsLast30d?: number | null;
  citationsTotal?: number | null;
  citationsNapConsistent?: number | null;
  brandMentionsLinked?: number | null;
  brandMentionsUnlinked?: number | null;
  referringDomainsTotal?: number | null;
  /** Tracked only. Google ignores spammy links rather than penalising for them. */
  toxicDomainCount?: number | null;
  verifiedOn?: Date | string | null;
  notes?: string | null;
}

export interface CategoryScore {
  earned: number;
  possible: number;
  /** Weight of checks in this category that applied but had no data. */
  notMeasured: number;
}

export interface HealthScore {
  finalScore: number;
  /** Share (0-100) of measured check points earned, before authority. */
  basePercent: number;
  authorityPoints: number;
  categories: Record<CheckCategory, CategoryScore>;
  /** Share (0-1) of applicable check weight that was measured. */
  coverage: number;
  blockedBy: { id: string; label: string } | null;
}

function logPoints(value: number | null | undefined, fullAt: number, max: number): number {
  const v = Math.max(0, Number(value) || 0);
  if (v <= 0) return 0;
  return Math.min(max, (Math.log10(1 + v) / Math.log10(1 + fullAt)) * max);
}

/**
 * Links are one of the few off-page inputs Google documents (link analysis and
 * PageRank in its ranking systems guide). Referring domains count far more
 * than raw backlinks, and both are log-scaled: the fifth domain matters more
 * than the fiftieth.
 */
export function authorityPoints(offPage?: OffPageSignals | null, domain?: DomainSignals | null): number {
  const pts =
    logPoints(offPage?.referringDomains, 50, 6) +
    logPoints(offPage?.backlinkCount, 100, 2) +
    logPoints(domain?.referringDomainsTotal, 200, 2);
  return Math.min(AUTHORITY_MAX, pts);
}

export function computeHealthScore(
  checks: CheckResult[],
  offPage?: OffPageSignals | null,
  domain?: DomainSignals | null,
): HealthScore {
  const categories = Object.fromEntries(
    CATEGORIES.map((c) => [c, { earned: 0, possible: 0, notMeasured: 0 }]),
  ) as Record<CheckCategory, CategoryScore>;

  let blockedBy: HealthScore['blockedBy'] = null;
  for (const c of checks) {
    const cat = categories[c.category];
    if (!cat) continue;
    if (c.severity === 'na') {
      if (c.na === 'not-measured') cat.notMeasured += c.weight;
      continue;
    }
    cat.possible += c.weight;
    cat.earned += pointsFor(c.severity, c.weight);
    if (c.gate && c.severity === 'fail' && !blockedBy) blockedBy = { id: c.id, label: c.label };
  }

  const totals = Object.values(categories).reduce(
    (acc, c) => ({
      earned: acc.earned + c.earned,
      possible: acc.possible + c.possible,
      notMeasured: acc.notMeasured + c.notMeasured,
    }),
    { earned: 0, possible: 0, notMeasured: 0 },
  );

  const basePercent = totals.possible > 0 ? (totals.earned / totals.possible) * 100 : 0;
  const authority = authorityPoints(offPage, domain);
  let finalScore = Math.round((basePercent / 100) * BASE_MAX + authority);
  finalScore = Math.min(100, Math.max(0, finalScore));
  if (blockedBy) finalScore = Math.min(finalScore, BLOCKED_CAP);

  for (const c of Object.values(categories)) {
    c.earned = Math.round(c.earned * 10) / 10;
  }

  const applicable = totals.possible + totals.notMeasured;
  return {
    finalScore,
    basePercent: Math.round(basePercent),
    authorityPoints: Math.round(authority * 10) / 10,
    categories,
    coverage: applicable > 0 ? Math.round((totals.possible / applicable) * 100) / 100 : 0,
    blockedBy,
  };
}

// ============================================================================
// Local score
// ============================================================================

export interface LocalComponent {
  key: string;
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface LocalScore {
  /** 0-100 over the components that have data, or null when none do. */
  score: number | null;
  /** Share (0-1) of the 100 possible points that had data behind them. */
  coverage: number;
  components: LocalComponent[];
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * Google ranks local results by relevance, distance and prominence, and says
 * "more reviews and positive ratings can help your business's local ranking"
 * (https://support.google.com/business/answer/7091). Distance is outside our
 * control and relevance comes from the profile, so this scores prominence and
 * completeness: the parts an operator can work on.
 */
export function computeLocalScore(d?: DomainSignals | null): LocalScore {
  const components: LocalComponent[] = [];
  if (d?.gbpReviewCount !== null && d?.gbpReviewCount !== undefined) {
    components.push({
      key: 'reviews',
      label: 'Google reviews',
      points: logPoints(d.gbpReviewCount, 500, 30),
      max: 30,
      detail: `${d.gbpReviewCount} reviews`,
    });
  }
  if (d?.gbpAverageRating !== null && d?.gbpAverageRating !== undefined) {
    const r = d.gbpAverageRating;
    const points = r >= 4.5 ? 20 : r >= 4.0 ? 14 : r >= 3.5 ? 8 : r >= 3.0 ? 3 : 0;
    components.push({ key: 'rating', label: 'Average rating', points, max: 20, detail: `${r} stars` });
  }
  if (d?.gbpCompleteness !== null && d?.gbpCompleteness !== undefined) {
    components.push({
      key: 'completeness',
      label: 'Profile completeness',
      points: clamp01(d.gbpCompleteness / 100) * 20,
      max: 20,
      detail: `${d.gbpCompleteness}% complete`,
    });
  }
  if (d?.gbpPostsLast30d !== null && d?.gbpPostsLast30d !== undefined) {
    const p = d.gbpPostsLast30d;
    components.push({
      key: 'posts',
      label: 'Profile activity',
      points: p >= 4 ? 10 : p >= 1 ? 5 : 0,
      max: 10,
      detail: `${p} posts in 30 days`,
    });
  }
  if (d?.citationsTotal !== null && d?.citationsTotal !== undefined) {
    const total = d.citationsTotal;
    const consistent = d.citationsNapConsistent ?? 0;
    const ratio = total > 0 ? clamp01(consistent / total) : 0;
    const volume = total >= 30 ? 1 : total >= 10 ? 0.8 : 0.6;
    components.push({
      key: 'citations',
      label: 'Citation consistency',
      points: ratio * volume * 20,
      max: 20,
      detail: total > 0 ? `${consistent} of ${total} listings match` : 'No listings recorded',
    });
  }

  for (const c of components) c.points = Math.round(c.points * 10) / 10;
  const max = components.reduce((a, c) => a + c.max, 0);
  const points = components.reduce((a, c) => a + c.points, 0);
  return {
    score: max > 0 ? Math.round((points / max) * 100) : null,
    coverage: max / 100,
    components,
  };
}
