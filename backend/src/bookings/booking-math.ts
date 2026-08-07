/**
 * Pure booking arithmetic. No database, no Nest.
 *
 * The distinction that matters:
 *   QUOTED margin  = sell - estimated cost (what you thought you'd make)
 *   ACTUAL margin  = sell - real vendor costs (what you actually made)
 * A file quoted at 22% that lands at 14% is telling you your estimates are
 * optimistic. That gap is the most useful number in the system.
 */

export interface BookingFinancials {
  totalSell: number;
  totalNet: number;
  totalReceived: number;
  totalCostPaid: number;
  totalCostDue: number;

  /** client still owes you */
  balanceDue: number;
  /** you still owe vendors */
  vendorOutstanding: number;

  quotedProfit: number;
  quotedMarginPercent: number;

  /** based on costs actually recorded so far */
  actualProfit: number;
  actualMarginPercent: number;

  /** actual minus quoted — negative means the file is eroding */
  marginVariance: number;

  /** cash actually in hand on this file right now */
  netCashPosition: number;

  fullyPaid: boolean;
  overpaid: boolean;
}

export function computeBookingFinancials(input: {
  totalSell: number;
  totalNet: number;
  payments: { amount: number }[];
  costs: { amountDue: number; amountPaid: number }[];
}): BookingFinancials {
  const totalReceived = input.payments.reduce((a, p) => a + p.amount, 0);
  const totalCostDue = input.costs.reduce((a, c) => a + c.amountDue, 0);
  const totalCostPaid = input.costs.reduce((a, c) => a + c.amountPaid, 0);

  // Once real costs exist, trust them over the quote estimate.
  const effectiveCost = totalCostDue > 0 ? totalCostDue : input.totalNet;

  const quotedProfit = input.totalSell - input.totalNet;
  const actualProfit = input.totalSell - effectiveCost;

  const pct = (profit: number) =>
    input.totalSell > 0 ? (profit / input.totalSell) * 100 : 0;

  return {
    totalSell: input.totalSell,
    totalNet: input.totalNet,
    totalReceived,
    totalCostPaid,
    totalCostDue,

    balanceDue: Math.max(0, input.totalSell - totalReceived),
    vendorOutstanding: Math.max(0, totalCostDue - totalCostPaid),

    quotedProfit,
    quotedMarginPercent: pct(quotedProfit),

    actualProfit,
    actualMarginPercent: pct(actualProfit),

    marginVariance: actualProfit - quotedProfit,

    netCashPosition: totalReceived - totalCostPaid,

    fullyPaid: totalReceived >= input.totalSell && input.totalSell > 0,
    overpaid: totalReceived > input.totalSell,
  };
}

/** Payment progress drives status, but never overrides a manual end state. */
export function deriveStatus(
  current: string,
  totalSell: number,
  totalReceived: number,
): string {
  const terminal = ['CANCELLED', 'COMPLETED', 'IN_PROGRESS'];
  if (terminal.includes(current)) return current;
  if (totalSell > 0 && totalReceived >= totalSell) return 'PAID';
  if (totalReceived > 0) return 'PARTIALLY_PAID';
  return current === 'PENDING' ? 'PENDING' : 'CONFIRMED';
}
