import { LeadStatus } from '@prisma/client';

/**
 * Industry-standard inside-sales cadence for a DMC.
 *
 * When a stage changes OR a contact activity is logged, we recompute the
 * next follow-up unless the exec has explicitly picked a date (see
 * Lead.followUpManual). The rule per stage:
 *
 *  NEW                     ->  fire in 5 minutes (first-contact SLA)
 *  CONTACTED               ->  +2 days
 *  INTERESTED              ->  +3 days
 *  QUOTATION_SENT          ->  +2 days
 *  NEGOTIATION             ->  +2 days
 *  FUTURE_FOLLOWUP         ->  never auto-schedule (user picked)
 *  CONFIRMED / LOST / CANCELLED  ->  clear (no follow-up)
 *
 * All times relative to the last meaningful event on the lead: the more
 * recent of createdAt, lastContact, or the moment status flipped. Callers
 * should just pass `anchor` = "now" when re-scheduling after a status
 * change or an activity log.
 */

export function computeNextFollowUp(
  status: LeadStatus,
  anchor: Date = new Date(),
): Date | null {
  const d = new Date(anchor);
  switch (status) {
    case LeadStatus.NEW:
      d.setMinutes(d.getMinutes() + 5);
      return d;
    case LeadStatus.CONTACTED:
      d.setDate(d.getDate() + 2);
      return d;
    case LeadStatus.INTERESTED:
      d.setDate(d.getDate() + 3);
      return d;
    case LeadStatus.QUOTATION_SENT:
      d.setDate(d.getDate() + 2);
      return d;
    case LeadStatus.NEGOTIATION:
      d.setDate(d.getDate() + 2);
      return d;
    // No auto for park / terminal states.
    case LeadStatus.FUTURE_FOLLOWUP:
    case LeadStatus.CONFIRMED:
    case LeadStatus.LOST:
    case LeadStatus.CANCELLED:
      return null;
  }
}

/**
 * True when a lead is past its next-follow-up date AND still in an active
 * stage. Terminal stages never breach even if nextFollowUp is stale.
 */
export function isBreached(
  status: LeadStatus,
  nextFollowUp: Date | null,
  now: Date = new Date(),
): boolean {
  if (!nextFollowUp) return false;
  if (
    status === LeadStatus.CONFIRMED ||
    status === LeadStatus.LOST ||
    status === LeadStatus.CANCELLED ||
    status === LeadStatus.FUTURE_FOLLOWUP
  ) {
    return false;
  }
  return nextFollowUp.getTime() < now.getTime();
}
