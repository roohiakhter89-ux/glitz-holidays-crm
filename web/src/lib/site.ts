/**
 * Single source of truth for public-facing brand facts.
 * Change here → propagates through header, footer, WhatsApp CTAs, JSON-LD,
 * sitemap, robots. Never hardcode any of these anywhere else.
 */
export const SITE = {
  name: 'Glitz Holidays',
  legalName: 'Glitz Holidays',
  tagline: 'Srinagar-based DMC · Handcrafted Himalayan journeys',
  domain: 'https://glitz-holidays.in',
  landerDomain: 'https://go.glitz-holidays.in',

  /**
   * NAP (name / address / phone) below is taken from the live Google
   * Business Profile, NOT invented. Local SEO depends on these matching
   * the GBP listing character-for-character across every citation — if
   * the GBP is ever edited, edit here in the same sitting.
   */
  founded: '2013',

  phone: {
    display: '+91 78895 30413',
    tel: '+917889530413',
    wa: '917889530413',
  },
  email: 'contact@glitzholidays.in',

  address: {
    street: 'Firdous Cinema Bus Stop, NH-1D, Hawal',
    city: 'Srinagar',
    region: 'Jammu & Kashmir',
    postalCode: '190002',
    country: 'IN',
  },

  /** Approximate office coords (Hawal, Srinagar) — for LocalBusiness JSON-LD. */
  geo: { lat: 34.1027, lng: 74.8156 },

  hours: 'Mon–Sun, 10:00–21:00 IST',

  social: {
    instagram: 'https://instagram.com/glitzholidays9',
    facebook: 'https://facebook.com/glitzholidays',
  },

  /**
   * Verified against the Google Business Profile knowledge panel on
   * 30 Aug 2026 (4.8 ★ / 604 reviews) and the glitzholidays.in about copy
   * (5,000+ travellers, 120+ partner hotels, est. 2013).
   *
   * The rating and reviewCount feed AggregateRating JSON-LD. Publishing
   * numbers that do not match the GBP is a structured-data violation, so
   * re-check these whenever the GBP count moves materially.
   */
  stats: {
    guests: '5,000+',
    rating: '4.8',
    reviewCount: 604,
    years: '12',
    hotels: '120+',
  },

  gtmId: 'GTM-K2QMV9NM',

  /** Backend endpoint that accepts public lead captures. */
  leadCaptureUrl:
    process.env.NEXT_PUBLIC_LEAD_CAPTURE_URL ??
    'https://glitz-backend-ugy4.onrender.com/api/leads/capture',

  /**
   * Cheap health endpoint used to wake the Render free-tier backend.
   * Every public page fires a 1×1 Image() at this so the API is warm by
   * the time a visitor submits an enquiry (Render sleeps after 15min idle).
   */
  wakePingUrl:
    process.env.NEXT_PUBLIC_WAKE_PING_URL ??
    'https://glitz-backend-ugy4.onrender.com/api/health',
} as const;

/**
 * Build a wa.me link with a prefilled message so every WhatsApp CTA is
 * consistent and the sales team can tell which page the chat came from.
 */
export function whatsAppLink(context: string): string {
  const msg = `Hi Glitz Holidays, I'm enquiring about ${context}.`;
  return `https://wa.me/${SITE.phone.wa}?text=${encodeURIComponent(msg)}`;
}

/** ₹ with Indian digit grouping. 18500 → "₹18,500" */
export function inr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}
