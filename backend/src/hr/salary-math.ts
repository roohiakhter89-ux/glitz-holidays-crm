/**
 * Pure salary arithmetic. No database. Easy to reason about, easy to test.
 *
 * The convention across the whole app is INTEGER rupees (no paise). Anywhere
 * a fractional value creeps in — LOP proration, pro-rated joining month — we
 * round at the moment of storage so historical slips stay stable.
 */

export interface SalaryComponents {
  basic: number;
  hra: number;
  allowances: number;
  bonus: number;
  arrears: number;
  pf: number;
  esi: number;
  tax: number;
  otherDed: number;
}

export interface SlipTotals {
  grossPay: number;
  totalDed: number;
  netPay: number;
}

export function computeSlip(c: SalaryComponents): SlipTotals {
  const grossPay = c.basic + c.hra + c.allowances + c.bonus + c.arrears;
  const totalDed = c.pf + c.esi + c.tax + c.otherDed;
  return { grossPay, totalDed, netPay: grossPay - totalDed };
}

/**
 * Prorate an amount by days worked in the period.
 * Handles the common case of joining/exiting mid-month cleanly.
 */
export function prorate(
  amount: number,
  daysWorked: number,
  daysInMonth: number,
): number {
  if (daysInMonth <= 0 || daysWorked >= daysInMonth) return amount;
  return Math.round((amount * daysWorked) / daysInMonth);
}

export function daysInMonth(period: Date): number {
  return new Date(
    period.getFullYear(),
    period.getMonth() + 1,
    0,
  ).getDate();
}
