import {
  DOMAIN_SIGNAL_MAX,
  DomainSignals,
  OFF_PAGE_MAX,
  ON_PAGE_BASE_MAX,
  OffPageSignals,
  PAGE_SIGNAL_MAX,
  calculateCompositeScore,
  calculateDomainSignalPoints,
  calculatePageSignalPoints,
  CheckResult,
} from './seo-checks';

/** A checks array that yields a given on-page percentage. */
function checksFor(pct: number): CheckResult[] {
  return [
    { id: 'x', label: 'x', category: 'on-page', severity: 'pass', weight: 100, score: pct },
  ];
}

const score = (
  pct: number,
  offPage?: OffPageSignals | null,
  domain?: DomainSignals | null,
) => calculateCompositeScore(checksFor(pct), offPage, undefined, domain).finalScore;

describe('SEO composite scoring', () => {
  /**
   * The defect this scoring model exists to fix: the previous version rebased
   * on-page to 70% as soon as any off-page row existed, so recording three
   * honest backlinks dropped an 88 to 70 and you needed 27 of 30 off-page
   * points merely to break even. Nobody entered data, and the table held zero
   * rows. A measurement people are punished for entering does not get entered.
   */
  describe('monotonicity: entering off-page data can never lower a score', () => {
    it('does not drop the score when modest real data is added', () => {
      const before = score(88);
      const after = score(88, {
        backlinkCount: 3,
        referringDomains: 2,
        pageAuthority: 15,
        socialShares: 5,
        searchConsoleCtr: 1.2,
      });
      expect(after).toBeGreaterThanOrEqual(before);
    });

    it('holds across the full on-page range and a spread of off-page data', () => {
      const offPageCases: (OffPageSignals | null)[] = [
        null,
        {},
        { backlinkCount: 1 },
        { backlinkCount: 3, referringDomains: 2, pageAuthority: 15 },
        { backlinkCount: 25, referringDomains: 12, pageAuthority: 45, prMentions: 2 },
        {
          backlinkCount: 500,
          referringDomains: 200,
          pageAuthority: 100,
          prMentions: 20,
          socialShares: 5000,
          searchConsoleCtr: 20,
        },
      ];

      for (let pct = 0; pct <= 100; pct += 5) {
        const baseline = score(pct);
        for (const op of offPageCases) {
          expect(score(pct, op)).toBeGreaterThanOrEqual(baseline);
        }
      }
    });

    it('holds when domain signals are added, including a toxic profile', () => {
      const domainCases: (DomainSignals | null)[] = [
        null,
        {},
        { gbpReviewCount: 604, gbpAverageRating: 4.8 },
        { referringDomainsTotal: 5, toxicDomainCount: 5 },
        { referringDomainsTotal: 10, toxicDomainCount: 100 },
      ];
      for (let pct = 0; pct <= 100; pct += 10) {
        const baseline = score(pct);
        for (const d of domainCases) {
          expect(score(pct, null, d)).toBeGreaterThanOrEqual(baseline);
        }
      }
    });

    it('is monotonic in each individual page signal', () => {
      const grow = (k: keyof OffPageSignals, values: number[]) => {
        let prev = -Infinity;
        for (const v of values) {
          const s = calculatePageSignalPoints({ [k]: v } as OffPageSignals);
          expect(s).toBeGreaterThanOrEqual(prev);
          prev = s;
        }
      };
      grow('backlinkCount', [0, 1, 5, 6, 19, 20, 100]);
      grow('referringDomains', [0, 1, 3, 4, 9, 10, 500]);
      grow('pageAuthority', [0, 10, 50, 99, 100]);
      grow('prMentions', [0, 1, 2, 3, 10]);
      grow('socialShares', [0, 1, 9, 10, 49, 50, 1000]);
      grow('searchConsoleCtr', [0, 1, 2, 4, 5, 30]);
    });
  });

  describe('bounds', () => {
    it('never leaves 0-100', () => {
      const maxed: OffPageSignals = {
        backlinkCount: 1e6,
        referringDomains: 1e6,
        pageAuthority: 100,
        prMentions: 1e6,
        socialShares: 1e6,
        searchConsoleCtr: 100,
      };
      const maxedDomain: DomainSignals = {
        gbpCompleteness: 100,
        gbpReviewCount: 1e6,
        gbpAverageRating: 5,
        gbpPostsLast30d: 1000,
        citationsTotal: 1000,
        citationsNapConsistent: 1000,
        referringDomainsTotal: 1e6,
      };
      expect(score(100, maxed, maxedDomain)).toBe(100);
      expect(score(0, null, null)).toBe(0);
      expect(score(0, maxed, maxedDomain)).toBeLessThanOrEqual(100);
    });

    it('clamps out-of-range inputs rather than inflating the score', () => {
      // Negative values must not subtract from the page signal pool.
      expect(calculatePageSignalPoints({ pageAuthority: -50 })).toBeGreaterThanOrEqual(0);
      expect(calculatePageSignalPoints({ prMentions: -10 })).toBeGreaterThanOrEqual(0);
      expect(calculateDomainSignalPoints({ gbpCompleteness: 500 })).toBeLessThanOrEqual(
        DOMAIN_SIGNAL_MAX,
      );
    });

    it('respects the declared sub-score ceilings', () => {
      expect(PAGE_SIGNAL_MAX + DOMAIN_SIGNAL_MAX).toBe(OFF_PAGE_MAX);
      expect(ON_PAGE_BASE_MAX + OFF_PAGE_MAX).toBe(100);
      expect(
        calculatePageSignalPoints({
          backlinkCount: 1e6,
          referringDomains: 1e6,
          pageAuthority: 100,
          prMentions: 1e6,
          socialShares: 1e6,
          searchConsoleCtr: 100,
        }),
      ).toBeLessThanOrEqual(PAGE_SIGNAL_MAX);
    });
  });

  describe('domain signals', () => {
    it('rewards the assets this operator actually has', () => {
      // Verified GBP: 4.8 stars from 604 reviews, Srinagar address since 2013.
      const real: DomainSignals = {
        gbpCompleteness: 90,
        gbpReviewCount: 604,
        gbpAverageRating: 4.8,
        gbpPostsLast30d: 4,
        citationsTotal: 30,
        citationsNapConsistent: 28,
        referringDomainsTotal: 25,
      };
      const pts = calculateDomainSignalPoints(real);
      expect(pts).toBeGreaterThan(3);
      expect(pts).toBeLessThanOrEqual(DOMAIN_SIGNAL_MAX);
    });

    it('values citation consistency as a ratio, not a raw count', () => {
      const consistent = calculateDomainSignalPoints({
        citationsTotal: 20,
        citationsNapConsistent: 20,
      });
      const sloppy = calculateDomainSignalPoints({
        citationsTotal: 100,
        citationsNapConsistent: 20,
      });
      // 20 listings that agree beat 100 that contradict each other.
      expect(consistent).toBeGreaterThan(sloppy);
    });

    it('weights review quality alongside volume', () => {
      const good = calculateDomainSignalPoints({ gbpReviewCount: 300, gbpAverageRating: 4.8 });
      const poor = calculateDomainSignalPoints({ gbpReviewCount: 300, gbpAverageRating: 3.1 });
      expect(good).toBeGreaterThan(poor);
    });

    it('costs the bonus for a spammy profile without going negative', () => {
      const clean = calculateDomainSignalPoints({ referringDomainsTotal: 50 });
      const toxic = calculateDomainSignalPoints({
        referringDomainsTotal: 50,
        toxicDomainCount: 45,
      });
      expect(toxic).toBeLessThan(clean);
      expect(toxic).toBeGreaterThanOrEqual(0);
    });

    it('applies equally to every page, so it lifts the whole site', () => {
      const d: DomainSignals = { gbpReviewCount: 604, gbpAverageRating: 4.8 };
      const liftA = score(88, null, d) - score(88);
      const liftB = score(62, null, d) - score(62);
      expect(liftA).toBe(liftB);
    });
  });

  describe('reported breakdown', () => {
    it('separates page and domain contributions', () => {
      const r = calculateCompositeScore(
        checksFor(88),
        { backlinkCount: 25, referringDomains: 12, pageAuthority: 45 },
        undefined,
        { gbpReviewCount: 604, gbpAverageRating: 4.8, gbpCompleteness: 90 },
      );
      expect(r.pageSignalScore).toBeGreaterThan(0);
      expect(r.domainSignalScore).toBeGreaterThan(0);
      expect(r.hasOffPageData).toBe(true);
      expect(r.hasDomainData).toBe(true);
      expect(r.onPageScore).toBe(88);
    });

    it('reports no off-page data when none is supplied', () => {
      const r = calculateCompositeScore(checksFor(88));
      expect(r.hasOffPageData).toBe(false);
      expect(r.hasDomainData).toBe(false);
      expect(r.offPageScore).toBe(0);
      // 88% of the 85-point base.
      expect(r.finalScore).toBe(Math.round(0.88 * ON_PAGE_BASE_MAX));
    });
  });
});
