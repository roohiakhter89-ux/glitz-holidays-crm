import { CheckResult } from './audit-types';
import {
  AUTHORITY_MAX,
  BASE_MAX,
  BLOCKED_CAP,
  DomainSignals,
  OffPageSignals,
  authorityPoints,
  computeHealthScore,
  computeLocalScore,
} from './seo-scoring';

const check = (over: Partial<CheckResult> = {}): CheckResult => ({
  id: 'x',
  label: 'x',
  category: 'content',
  severity: 'pass',
  weight: 10,
  score: 10,
  basis: 'google',
  scope: 'page',
  ...over,
});

describe('page health score', () => {
  it('puts a page that passes everything at the base maximum', () => {
    expect(computeHealthScore([check(), check({ category: 'indexing' })]).finalScore).toBe(BASE_MAX);
  });

  it('scores warn as half and fail as nothing', () => {
    expect(computeHealthScore([check(), check({ severity: 'fail' })]).finalScore).toBe(45);
    expect(computeHealthScore([check({ severity: 'warn' })]).finalScore).toBe(45);
  });

  it('leaves unmeasured and inapplicable checks out of the score', () => {
    const r = computeHealthScore([
      check(),
      check({ severity: 'na', na: 'not-applicable' }),
      check({ severity: 'na', na: 'not-measured', category: 'experience' }),
    ]);
    expect(r.finalScore).toBe(BASE_MAX);
    // Half the applicable weight had no data.
    expect(r.coverage).toBe(0.5);
    expect(r.categories.experience).toEqual({ earned: 0, possible: 0, notMeasured: 10 });
  });

  it('caps a page that fails an indexing gate', () => {
    const r = computeHealthScore(
      [check({ weight: 90, score: 90 }), check({ id: 'noindex', label: 'Allowed in the index', gate: true, severity: 'fail' })],
      { referringDomains: 500 },
    );
    expect(r.finalScore).toBe(BLOCKED_CAP);
    expect(r.blockedBy).toEqual({ id: 'noindex', label: 'Allowed in the index' });
  });

  it('ignores a gate that passed', () => {
    expect(computeHealthScore([check({ gate: true })]).blockedBy).toBeNull();
  });

  it('never lowers a score when link data is entered', () => {
    const cases: OffPageSignals[] = [
      {},
      { backlinkCount: 1 },
      { referringDomains: 1 },
      { backlinkCount: 3, referringDomains: 2 },
      { backlinkCount: 1e6, referringDomains: 1e6 },
    ];
    for (const severity of ['pass', 'warn', 'fail'] as const) {
      const checks = [check({ severity })];
      const baseline = computeHealthScore(checks).finalScore;
      for (const op of cases) {
        expect(computeHealthScore(checks, op).finalScore).toBeGreaterThanOrEqual(baseline);
        expect(computeHealthScore(checks, op, { referringDomainsTotal: 40 }).finalScore).toBeGreaterThanOrEqual(baseline);
      }
    }
  });

  it('values referring domains over raw backlinks and caps authority', () => {
    expect(authorityPoints({ referringDomains: 10 })).toBeGreaterThan(authorityPoints({ backlinkCount: 10 }));
    expect(authorityPoints({ referringDomains: 1e9, backlinkCount: 1e9 }, { referringDomainsTotal: 1e9 })).toBe(AUTHORITY_MAX);
    expect(authorityPoints({ referringDomains: -5 })).toBe(0);
  });

  it('gives no points for metrics Google does not use', () => {
    const tracked: OffPageSignals = { pageAuthority: 90, socialShares: 5000, prMentions: 20, searchConsoleCtr: 12 };
    const domain: DomainSignals = { toxicDomainCount: 400, gbpReviewCount: 600, gbpAverageRating: 4.8 };
    expect(authorityPoints(tracked, domain)).toBe(0);
  });

  it('stays within 0-100', () => {
    const maxed = computeHealthScore([check()], { referringDomains: 1e9, backlinkCount: 1e9 }, { referringDomainsTotal: 1e9 });
    expect(maxed.finalScore).toBe(100);
    expect(computeHealthScore([check({ severity: 'fail' })]).finalScore).toBe(0);
    expect(computeHealthScore([]).finalScore).toBe(0);
  });

  it('breaks points down by category', () => {
    const r = computeHealthScore([
      check({ category: 'indexing', weight: 8, severity: 'pass' }),
      check({ category: 'links', weight: 4, severity: 'warn' }),
    ]);
    expect(r.categories.indexing).toEqual({ earned: 8, possible: 8, notMeasured: 0 });
    expect(r.categories.links).toEqual({ earned: 2, possible: 4, notMeasured: 0 });
    expect(r.basePercent).toBe(83);
  });
});

describe('local score', () => {
  it('is null until something is recorded', () => {
    expect(computeLocalScore(null)).toEqual({ score: null, coverage: 0, components: [] });
    expect(computeLocalScore({ referringDomainsTotal: 30 }).score).toBeNull();
  });

  it('rewards the profile this operator actually has', () => {
    const r = computeLocalScore({
      gbpReviewCount: 604,
      gbpAverageRating: 4.8,
      gbpCompleteness: 90,
      gbpPostsLast30d: 4,
      citationsTotal: 30,
      citationsNapConsistent: 28,
    });
    expect(r.coverage).toBe(1);
    expect(r.score!).toBeGreaterThan(85);
  });

  it('scores only the components that have data', () => {
    const r = computeLocalScore({ gbpAverageRating: 4.8 });
    expect(r.components.map((c) => c.key)).toEqual(['rating']);
    expect(r.score).toBe(100);
    expect(r.coverage).toBe(0.2);
  });

  it('values citation consistency as a ratio, not a count', () => {
    const consistent = computeLocalScore({ citationsTotal: 20, citationsNapConsistent: 20 }).score!;
    const sloppy = computeLocalScore({ citationsTotal: 100, citationsNapConsistent: 20 }).score!;
    expect(consistent).toBeGreaterThan(sloppy);
  });

  it('weights rating quality alongside volume', () => {
    const good = computeLocalScore({ gbpReviewCount: 300, gbpAverageRating: 4.8 }).score!;
    const poor = computeLocalScore({ gbpReviewCount: 300, gbpAverageRating: 3.1 }).score!;
    expect(good).toBeGreaterThan(poor);
  });
});
