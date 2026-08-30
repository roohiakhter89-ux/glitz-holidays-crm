import { computeSlip, prorate, daysInMonth } from './salary-math';

describe('salary-math', () => {
  it('computes slip totals correctly', () => {
    const slip = computeSlip({
      basic: 10000,
      hra: 5000,
      allowances: 2000,
      bonus: 1000,
      arrears: 0,
      pf: 1200,
      esi: 100,
      tax: 500,
      otherDed: 0,
    });
    expect(slip.grossPay).toBe(18000);
    expect(slip.totalDed).toBe(1800);
    expect(slip.netPay).toBe(16200);
  });

  it('prorates amounts correctly', () => {
    expect(prorate(30000, 15, 30)).toBe(15000);
    expect(prorate(30000, 30, 30)).toBe(30000);
    expect(prorate(30000, 31, 30)).toBe(30000);
    expect(prorate(31000, 10, 31)).toBe(10000);
  });

  it('calculates days in month correctly', () => {
    expect(daysInMonth(new Date('2024-02-15'))).toBe(29); // leap year
    expect(daysInMonth(new Date('2023-02-15'))).toBe(28); // non-leap year
    expect(daysInMonth(new Date('2023-01-01'))).toBe(31);
    expect(daysInMonth(new Date('2023-04-30'))).toBe(30);
  });
});
