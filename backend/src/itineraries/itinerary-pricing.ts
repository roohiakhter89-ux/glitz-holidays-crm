import { MarkupMode, ServiceType } from '@prisma/client';
import { computeLine, computeOptionTotals, SettingsLike } from '../common/pricing';

/**
 * Bridge from ItineraryItem/Pricing → the shared pricing helpers in
 * quotes/pricing.ts. The chain is the same as quote lines:
 *   line markup override → option markup override → service-type default →
 *   global default.
 *
 * ItineraryItem.kind maps to ServiceType so per-service markups still apply
 * (a HOTEL item is priced with hotelMarkupPercent; a TRANSFER with
 * transportMarkupPercent). Kinds that aren't priceable (SIGHTSEEING, NOTE,
 * FREE_TIME) never reach here, so we default those to MISC as a safety.
 */
export function kindToServiceType(kind: string): ServiceType {
  switch (kind) {
    case 'STAY':     return 'HOTEL' as ServiceType;
    case 'TRANSFER': return 'TRANSPORT' as ServiceType;
    case 'ACTIVITY': return 'ACTIVITY' as ServiceType;
    case 'MEAL':     return 'MEAL' as ServiceType;
    default:         return 'MISC' as ServiceType;
  }
}

export function computeItemPricing(
  item: { kind: string; quantity: number; units: number; priceable: boolean },
  pricing: { unitNet: number; markupPercent: number | null } | null,
  option: { markupPercent: number | null },
  settings: SettingsLike,
): { lineNet: number; lineSell: number } {
  if (!item.priceable || !pricing) return { lineNet: 0, lineSell: 0 };
  const line = computeLine(
    {
      serviceType: kindToServiceType(item.kind),
      quantity: item.quantity,
      units: item.units,
      unitNet: pricing.unitNet,
      markupMode:
        pricing.markupPercent !== null && pricing.markupPercent !== undefined
          ? ('PERCENT' as MarkupMode)
          : ('INHERIT' as MarkupMode),
      markupValue: pricing.markupPercent ?? null,
    },
    settings,
    option.markupPercent,
  );
  return { lineNet: line.lineNet, lineSell: line.lineSell };
}

/** Same shape as QuoteOption totals — reused so the frontend can share UI. */
export { computeOptionTotals };
