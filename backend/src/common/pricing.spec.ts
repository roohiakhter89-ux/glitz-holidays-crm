import {
  serviceTypeMarkup,
  roundTo,
  computeLine,
  computeOptionTotals,
  gstBreakdown,
  advise,
} from './pricing';
import { MarkupMode, ServiceType } from '@prisma/client';

describe('pricing', () => {
  const mockSettings = {
    defaultMarkupPercent: 20,
    hotelMarkupPercent: 15,
    minMarginPercent: 10,
    roundTo: 10,
  };

  it('serviceTypeMarkup falls back to default if specific is not set', () => {
    expect(serviceTypeMarkup(ServiceType.HOTEL, mockSettings as any)).toBe(15);
    expect(serviceTypeMarkup(ServiceType.TRANSPORT, mockSettings as any)).toBe(20);
  });

  it('roundTo rounds correctly', () => {
    expect(roundTo(1234, 10)).toBe(1230);
    expect(roundTo(1235, 10)).toBe(1240);
    expect(roundTo(1235, 0)).toBe(1235);
  });

  it('computeLine calculates net and sell correctly with PERCENT', () => {
    const line = {
      serviceType: ServiceType.TRANSPORT,
      quantity: 2,
      units: 3,
      unitNet: 1000,
      markupMode: MarkupMode.PERCENT,
    };
    // net = 2 * 3 * 1000 = 6000
    // default transport markup is 20% -> 6000 * 1.2 = 7200
    const result = computeLine(line, mockSettings as any);
    expect(result.lineNet).toBe(6000);
    expect(result.lineSell).toBe(7200);
    expect(result.resolvedPercent).toBe(20);
  });

  it('computeLine handles FIXED and MANUAL modes', () => {
    const line1 = {
      serviceType: ServiceType.HOTEL,
      quantity: 1,
      units: 1,
      unitNet: 5000,
      markupMode: MarkupMode.FIXED,
      markupValue: 500, // 500 fixed markup
    };
    const res1 = computeLine(line1, mockSettings as any);
    expect(res1.lineNet).toBe(5000);
    expect(res1.lineSell).toBe(5500); // 5000 + 500

    const line2 = {
      serviceType: ServiceType.HOTEL,
      quantity: 1,
      units: 1,
      unitNet: 5000,
      markupMode: MarkupMode.MANUAL,
      markupValue: 6000, // force sell price to 6000
    };
    const res2 = computeLine(line2, mockSettings as any);
    expect(res2.lineSell).toBe(6000);
    expect(res2.resolvedPercent).toBe(20); // (6000-5000)/5000 = 20%
  });

  it('computeOptionTotals aggregates lines correctly', () => {
    const lines = [
      { lineNet: 1000, lineSell: 1500 },
      { lineNet: 2000, lineSell: 2500 },
    ];
    // totals: net 3000, sell 4000. margin: 1000.
    // margin % = 1000 / 4000 = 25%
    // markup % = 1000 / 3000 = 33.33%
    const totals = computeOptionTotals(lines, 2);
    expect(totals.totalNet).toBe(3000);
    expect(totals.totalSell).toBe(4000);
    expect(totals.totalMargin).toBe(1000);
    expect(totals.marginPercent).toBeCloseTo(25);
    expect(totals.markupPercentEffective).toBeCloseTo(33.33);
    expect(totals.perPersonSell).toBe(2000);
  });

  it('gstBreakdown calculates tax correctly', () => {
    const result = gstBreakdown(1050, 5);
    // 1050 is 105% of 1000
    expect(result.baseAmount).toBe(1000);
    expect(result.gstAmount).toBe(50);
  });

  it('advise flags policy shortfall', () => {
    const settings = { minMarginPercent: 20, roundTo: 10 };
    // To get 20% margin on 1000, sell must be 1250 (profit 250 / 1250 = 20%).
    // If we sell at 1100, we fall short.
    const adv = advise(1000, 1100, settings as any);
    expect(adv.ok).toBe(false);
    expect(adv.minSellForPolicy).toBe(1250);
    expect(adv.shortfall).toBe(150);
  });
});
