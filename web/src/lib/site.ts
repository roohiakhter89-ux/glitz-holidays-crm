/**
 * Single source of truth for public-facing brand facts.
 * Change here → propagates through header, footer, WhatsApp CTAs, JSON-LD,
 * sitemap, robots, etc. Never hardcode any of these anywhere else.
 */
export const SITE = {
  name: 'Glitz Holidays',
  tagline: 'Kashmir DMC · Handcrafted Himalayan journeys',
  domain: 'https://glitz-holidays.in',
  landerDomain: 'https://go.glitz-holidays.in',

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

  social: {
    instagram: 'https://instagram.com/glitzholidays',
    facebook: 'https://facebook.com/glitzholidays',
  },

  gtmId: 'GTM-K2QMV9NM',

  /** Backend endpoint that accepts public lead captures. */
  leadCaptureUrl:
    process.env.NEXT_PUBLIC_LEAD_CAPTURE_URL ??
    'https://glitz-backend-ugy4.onrender.com/api/leads/capture',
} as const;

/**
 * Build a wa.me link with a prefilled message. Keeps every WhatsApp CTA
 * consistent and lets us track intent per surface via UTM-style tags in
 * the message body.
 */
export function whatsAppLink(context: string): string {
  const msg = `Hi Glitz Holidays, I'm enquiring about ${context}.`;
  return `https://wa.me/${SITE.phone.wa}?text=${encodeURIComponent(msg)}`;
}
