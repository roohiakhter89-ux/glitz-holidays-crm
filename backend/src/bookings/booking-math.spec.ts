import { computeBookingFinancials, deriveStatus } from './booking-math';

describe('booking-math', () => {
  it('computes booking financials correctly', () => {
    const input = {
      totalSell: 10000,
      totalNet: 8000, // quoted profit = 2000
      payments: [{ amount: 4000 }, { amount: 2000 }], // received 6000
      costs: [
        { amountDue: 5000, amountPaid: 3000 },
        { amountDue: 3500, amountPaid: 1000 }
      ]
      // actual cost due = 8500. actual profit = 1500.
      // cost paid = 4000.
    };
    
    const fin = computeBookingFinancials(input);
    expect(fin.totalReceived).toBe(6000);
    expect(fin.totalCostDue).toBe(8500);
    expect(fin.totalCostPaid).toBe(4000);
    expect(fin.balanceDue).toBe(4000);
    expect(fin.vendorOutstanding).toBe(4500);
    expect(fin.quotedProfit).toBe(2000);
    expect(fin.quotedMarginPercent).toBe(20);
    expect(fin.actualProfit).toBe(1500);
    expect(fin.actualMarginPercent).toBe(15);
    expect(fin.marginVariance).toBe(-500);
    expect(fin.netCashPosition).toBe(2000); // 6000 received - 4000 paid
    expect(fin.fullyPaid).toBe(false);
  });

  it('uses totalNet if no costs exist yet', () => {
    const input = {
      totalSell: 10000,
      totalNet: 8000,
      payments: [],
      costs: []
    };
    const fin = computeBookingFinancials(input);
    expect(fin.actualProfit).toBe(2000); // falls back to quoted net
  });

  it('derives status correctly', () => {
    expect(deriveStatus('PENDING', 10000, 0)).toBe('PENDING');
    expect(deriveStatus('PENDING', 10000, 5000)).toBe('PARTIALLY_PAID');
    expect(deriveStatus('CONFIRMED', 10000, 10000)).toBe('PAID');
    expect(deriveStatus('CANCELLED', 10000, 0)).toBe('CANCELLED');
    expect(deriveStatus('COMPLETED', 10000, 10000)).toBe('COMPLETED');
  });
});
