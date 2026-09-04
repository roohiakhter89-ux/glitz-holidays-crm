import {
  MICROS_PER_UNIT,
  assertIsoDate,
  buildExternalId,
  campaignSpendQuery,
  flattenSearchStream,
  isoDay,
  lookbackWindow,
  mapCampaignRow,
  microsToUnits,
  normaliseCustomerId,
  num,
} from './google-ads-mapping';

/**
 * The unit conversions are the whole risk surface of this integration: a
 * factor-of-a-million error in either direction would silently make every
 * cost-per-lead and ROAS figure wrong without anything failing.
 */
describe('google ads mapping', () => {
  describe('num', () => {
    it('reads int64 fields that arrive as strings', () => {
      // proto3 JSON serialises 64-bit ints as strings.
      expect(num('12500000000')).toBe(12500000000);
    });

    it('reads plain numbers and doubles', () => {
      expect(num(42)).toBe(42);
      expect(num(3.5)).toBe(3.5);
    });

    it('treats absent and unparseable values as zero, never NaN', () => {
      expect(num(undefined)).toBe(0);
      expect(num(null)).toBe(0);
      expect(num('')).toBe(0);
      expect(num('not a number')).toBe(0);
      expect(Number.isNaN(num('abc'))).toBe(false);
    });
  });

  describe('microsToUnits', () => {
    it('converts micros to whole currency units', () => {
      expect(MICROS_PER_UNIT).toBe(1_000_000);
      // 12,500,000,000 micros = 12,500 rupees
      expect(microsToUnits(12_500_000_000)).toBe(12_500);
      expect(microsToUnits('12500000000')).toBe(12_500);
    });

    it('rounds rather than truncates so monthly totals do not drift low', () => {
      expect(microsToUnits(12_499_600_000)).toBe(12_500);
      expect(microsToUnits(1_400_000)).toBe(1);
      expect(microsToUnits(1_600_000)).toBe(2);
    });

    it('maps a missing cost to zero', () => {
      expect(microsToUnits(undefined)).toBe(0);
    });
  });

  describe('normaliseCustomerId', () => {
    it('strips the hyphens Google shows in its UI', () => {
      expect(normaliseCustomerId('123-456-7890')).toBe('1234567890');
      expect(normaliseCustomerId('1234567890')).toBe('1234567890');
      expect(normaliseCustomerId('')).toBe('');
    });
  });

  describe('flattenSearchStream', () => {
    it('flattens the array-of-chunks shape searchStream returns', () => {
      const payload = [
        { results: [{ a: 1 }, { a: 2 }] },
        { results: [{ a: 3 }] },
      ];
      expect(flattenSearchStream(payload)).toHaveLength(3);
    });

    it('also accepts the single-object shape plain search returns', () => {
      expect(flattenSearchStream({ results: [{ a: 1 }] })).toHaveLength(1);
    });

    it('is empty for a chunk carrying no results', () => {
      expect(flattenSearchStream([{}])).toEqual([]);
      expect(flattenSearchStream(null)).toEqual([]);
    });
  });

  describe('mapCampaignRow', () => {
    // REST responses are camelCase even though GAQL is snake_case.
    const row = {
      campaign: { id: '987654', name: 'Kashmir Honeymoon — Search' },
      metrics: {
        costMicros: '12500000000',
        impressions: '4210',
        clicks: '318',
        conversions: 7.5,
      },
      segments: { date: '2026-08-14' },
    };

    it('maps a full row into whole rupees', () => {
      const out = mapCampaignRow(row, '123-456-7890')!;
      expect(out.amount).toBe(12_500);
      expect(out.impressions).toBe(4210);
      expect(out.clicks).toBe(318);
      expect(out.conversions).toBe(7.5);
      expect(out.campaignName).toBe('Kashmir Honeymoon — Search');
      expect(out.date).toBe('2026-08-14');
    });

    it('accepts the snake_case spelling of cost as well', () => {
      const snake = { ...row, metrics: { cost_micros: '2000000' } };
      expect(mapCampaignRow(snake, '1234567890')!.amount).toBe(2);
    });

    it('builds an external id that is stable across runs', () => {
      const a = mapCampaignRow(row, '123-456-7890')!;
      const b = mapCampaignRow(row, '1234567890')!;
      expect(a.externalId).toBe(b.externalId);
      expect(a.externalId).toBe('1234567890:987654:2026-08-14');
    });

    it('returns null when the row cannot be addressed', () => {
      expect(mapCampaignRow({ campaign: { id: '1' } }, '123')).toBeNull();
      expect(mapCampaignRow({ segments: { date: '2026-08-14' } }, '123')).toBeNull();
      expect(mapCampaignRow({}, '123')).toBeNull();
    });

    it('falls back to a readable name when the campaign has none', () => {
      const nameless = { ...row, campaign: { id: '987654' } };
      expect(mapCampaignRow(nameless, '123')!.campaignName).toBe('Campaign 987654');
    });
  });

  describe('buildExternalId', () => {
    it('is unique per account, campaign and day', () => {
      const base = buildExternalId('111', 'c1', '2026-08-01');
      expect(base).not.toBe(buildExternalId('222', 'c1', '2026-08-01'));
      expect(base).not.toBe(buildExternalId('111', 'c2', '2026-08-01'));
      expect(base).not.toBe(buildExternalId('111', 'c1', '2026-08-02'));
    });
  });

  describe('assertIsoDate', () => {
    it('accepts YYYY-MM-DD', () => {
      expect(assertIsoDate('2026-08-14')).toBe('2026-08-14');
    });

    it('rejects anything else, since the value is interpolated into GAQL', () => {
      expect(() => assertIsoDate('14/08/2026')).toThrow();
      expect(() => assertIsoDate('2026-8-1')).toThrow();
      expect(() => assertIsoDate("2026-08-14' OR '1'='1")).toThrow();
      expect(() => assertIsoDate('')).toThrow();
      expect(() => assertIsoDate(undefined as any)).toThrow();
    });
  });

  describe('campaignSpendQuery', () => {
    it('embeds both bounds and filters out zero-impression rows', () => {
      const q = campaignSpendQuery('2026-08-01', '2026-08-07');
      expect(q).toContain("segments.date BETWEEN '2026-08-01' AND '2026-08-07'");
      expect(q).toContain('metrics.cost_micros');
      expect(q).toContain('metrics.impressions > 0');
      expect(q).toContain('FROM campaign');
    });

    it('refuses to build a query from an unsafe date', () => {
      expect(() => campaignSpendQuery("' OR 1=1 --", '2026-08-07')).toThrow();
    });
  });

  describe('lookbackWindow', () => {
    it('is inclusive of both ends', () => {
      const { from, to } = lookbackWindow(7, new Date('2026-08-14T09:30:00Z'));
      expect(to).toBe('2026-08-14');
      expect(from).toBe('2026-08-08'); // 8th..14th inclusive is 7 days
    });

    it('collapses to a single day for a window of one', () => {
      const { from, to } = lookbackWindow(1, new Date('2026-08-14T00:00:00Z'));
      expect(from).toBe('2026-08-14');
      expect(to).toBe('2026-08-14');
    });

    it('crosses a month boundary correctly', () => {
      const { from } = lookbackWindow(7, new Date('2026-09-02T00:00:00Z'));
      expect(from).toBe('2026-08-27');
    });
  });

  describe('isoDay', () => {
    it('formats in UTC, not local time', () => {
      expect(isoDay(new Date('2026-08-14T23:59:59Z'))).toBe('2026-08-14');
    });
  });
});
