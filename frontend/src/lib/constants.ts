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
