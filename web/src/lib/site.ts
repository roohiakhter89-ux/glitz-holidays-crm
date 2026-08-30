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
  founded: '2019',

  phone: {
    display: '+91 70068 41384',
    tel: '+917006841384',
    wa: '917006841384',
  },
  email: 'glitzholidaysofficial@gmail.com',

  address: {
    street: 'Rajbagh',
    city: 'Srinagar',
    region: 'Jammu & Kashmir',
    postalCode: '190008',
    country: 'IN',
  },

  /** Approximate office coords — used for LocalBusiness JSON-LD. */
  geo: { lat: 34.0656, lng: 74.8181 },

  hours: 'Mon–Sun, 10:00–21:00 IST',

  social: {
    instagram: 'https://instagram.com/glitzholidays',
    facebook: 'https://facebook.com/glitzholidays',
  },

  stats: {
    guests: '4,000+',
    rating: '4.9',
    reviewCount: 212,
    years: '6',
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
