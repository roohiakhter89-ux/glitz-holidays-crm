import { LeadSource } from '@prisma/client';

/**
 * Transparent, rule-based lead scoring (0-100).
 *
 * Deliberately NOT a black box: every lead stores a `scoreNotes` breakdown so
 * you can see exactly why it scored what it did. Tune the weights here once
 * you have real conversion data — this is the only file you need to touch.
 */
export interface ScoreInput {
  source?: LeadSource;
  email?: string | null;
  message?: string | null;
  destination?: string | null;
  travelDate?: Date | null;
  budget?: number | null;
  adults?: number | null;
  gclid?: string | null;
  fbclid?: string | null;
  enquiryCount?: number;
}

const SOURCE_WEIGHT: Record<LeadSource, number> = {
  REFERRAL: 30,
  B2B_AGENT: 30,
  WALK_IN: 25,
  GOOGLE_ADS: 25,
  TRADE_FAIR: 22,
  META_ADS: 20,
  ORGANIC: 20,
  PHONE: 18,
  INSTAGRAM: 15,
  FACEBOOK: 15,
  WHATSAPP: 15,
  LANDING_PAGE: 15,
  WEBSITE: 12,
  EMAIL: 10,
  OTHER: 8,
};

export function scoreLead(input: ScoreInput): {
  score: number;
  notes: string;
} {
  const parts: string[] = [];
  let score = 10;
  parts.push('base 10');

  const src = input.source ?? LeadSource.OTHER;
  const srcPts = SOURCE_WEIGHT[src] ?? 8;
  score += srcPts;
  parts.push(`source:${src} +${srcPts}`);

  // A real paid click (has a click id) = measurable intent, not a bot.
  if (input.gclid || input.fbclid) {
    score += 10;
    parts.push('paid click id +10');
  }

  if (input.email) {
    score += 10;
    parts.push('email +10');
  }
  if (input.travelDate) {
    score += 15;
    parts.push('travel date +15');
  }
  if (input.budget && input.budget > 0) {
    score += 15;
    parts.push('budget +15');
  }
  if (input.destination) {
    score += 8;
    parts.push('destination +8');
  }
  if (input.message && input.message.trim().length > 20) {
    score += 10;
    parts.push('detailed message +10');
  }
  if (input.adults && input.adults > 0) {
    score += 5;
    parts.push('pax +5');
  }

  // Repeat enquiry = warm. Capped so it can't run away.
  const repeats = Math.max(0, (input.enquiryCount ?? 1) - 1);
  if (repeats > 0) {
    const pts = Math.min(15, repeats * 8);
    score += pts;
    parts.push(`re-enquiry x${repeats} +${pts}`);
  }

  score = Math.max(0, Math.min(100, score));
  return { score, notes: parts.join(', ') };
}
