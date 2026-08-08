export const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'INTERESTED',
  'QUOTATION_SENT',
  'NEGOTIATION',
  'CONFIRMED',
  'FUTURE_FOLLOWUP',
  'CANCELLED',
  'LOST',
] as const;

export const LEAD_SOURCES = [
  'GOOGLE_ADS',
  'META_ADS',
  'INSTAGRAM',
  'FACEBOOK',
  'LANDING_PAGE',
  'WEBSITE',
  'ORGANIC',
  'REFERRAL',
  'WALK_IN',
  'PHONE',
  'WHATSAPP',
  'TRADE_FAIR',
  'EMAIL',
  'B2B_AGENT',
  'OTHER',
] as const;

export const ACTIVITY_TYPES = [
  'NOTE',
  'CALL',
  'WHATSAPP',
  'EMAIL',
  'MEETING',
] as const;

/** Turn NEGOTIATION into "Negotiation", QUOTATION_SENT into "Quotation sent". */
export function humanise(value: string): string {
  const s = value.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Digits only, with country code, for a wa.me link. */
export function whatsappHref(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCode = digits.length === 10 ? `91${digits}` : digits;
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${withCode}${q}`;
}

export const SERVICE_TYPES = [
  'HOTEL',
  'TRANSPORT',
  'ACTIVITY',
  'FLIGHT',
  'GUIDE',
  'MEAL',
  'PERMIT',
  'MISC',
] as const;

export const MARKUP_MODES = [
  { value: 'INHERIT', label: 'Default markup' },
  { value: 'PERCENT', label: 'Percent' },
  { value: 'FIXED', label: 'Flat amount' },
  { value: 'MANUAL', label: 'Set sell price' },
] as const;

export const SEASONS = ['PEAK', 'SHOULDER', 'OFF', 'FESTIVE'] as const;

export const VENDOR_TYPES = [
  'HOTEL',
  'HOUSEBOAT',
  'TRANSPORT',
  'GUIDE',
  'ACTIVITY',
  'RESTAURANT',
  'PHOTOGRAPHER',
  'EVENT',
  'OTHER',
] as const;

export const MEAL_PLANS = ['EP', 'CP', 'MAP', 'AP'] as const;

export const ITINERARY_ITEM_KINDS = [
  'STAY',
  'TRANSFER',
  'SIGHTSEEING',
  'MEAL',
  'ACTIVITY',
  'FREE_TIME',
  'NOTE',
] as const;

/**
 * Colour + short label per itinerary item kind. Kept centralised so the
 * chips in the editor and the marks in the PDF stay visually aligned.
 */
export const KIND_META: Record<
  (typeof ITINERARY_ITEM_KINDS)[number],
  { label: string; short: string; tone: string }
> = {
  STAY:        { label: 'Stay',        short: 'STAY',     tone: 'bg-signal-600'     },
  TRANSFER:    { label: 'Transfer',    short: 'TRANSFER', tone: 'bg-signal-500'     },
  SIGHTSEEING: { label: 'Sightseeing', short: 'SEE',      tone: 'bg-brand-600'      },
  MEAL:        { label: 'Meal',        short: 'MEAL',     tone: 'bg-warn-500'       },
  ACTIVITY:    { label: 'Activity',    short: 'ACTIVITY', tone: 'bg-healthy-500'    },
  FREE_TIME:   { label: 'Free time',   short: 'FREE',     tone: 'bg-ink-500'        },
  NOTE:        { label: 'Note',        short: 'NOTE',     tone: 'bg-ink-400'        },
};

export const RATE_BASES = [
  'PER_ROOM_NIGHT',
  'PER_PERSON',
  'PER_PERSON_NIGHT',
  'PER_VEHICLE_DAY',
  'PER_TRANSFER',
  'PER_UNIT',
] as const;

export const QUOTE_STATUSES = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'REVISED',
] as const;

export const BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PARTIALLY_PAID',
  'PAID',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export const PAYMENT_MODES = [
  'CASH',
  'BANK_TRANSFER',
  'UPI',
  'CARD',
  'CHEQUE',
  'RAZORPAY',
  'OTHER',
] as const;

/** What the markupValue field means for each mode. */
export const MARKUP_HINT: Record<string, string> = {
  INHERIT: 'Uses your settings for this service type',
  PERCENT: '% on this line',
  FIXED: '₹ added on top',
  MANUAL: '₹ total sell for this line',
};
