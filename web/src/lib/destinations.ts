/**
 * Destination catalog. Each entry powers:
 *   - the home-page destinations grid
 *   - /destinations/[slug] hub page
 *   - sitemap.ts + JSON-LD TouristDestination
 *
 * Photos are Unsplash placeholders — swap `photoQuery` for real image URLs
 * once you have your own library.
 */
export type Destination = {
  slug: string;
  name: string;
  headline: string;
  intro: string;
  bestTime: string;
  duration: string;
  startingFrom: number;
  regions: { name: string; note: string }[];
  highlights: string[];
  faqs: { q: string; a: string }[];
  photoQuery: string;
};

export const DESTINATIONS: Destination[] = [
  {
    slug: 'kashmir',
    name: 'Kashmir',
    headline: 'Where the Himalayas write poetry',
    intro:
      "Srinagar's Dal Lake, Gulmarg's ski slopes, Sonmarg's alpine meadows and Pahalgam's pine valleys — Kashmir is India's most complete mountain destination. We are locals; every itinerary starts with what your friends never mention.",
    bestTime: 'March–October (all-season, tulips in April, snow Dec–Feb)',
    duration: '5–9 nights',
    startingFrom: 18500,
    regions: [
      { name: 'Srinagar', note: 'Dal Lake, houseboats, Mughal gardens' },
      { name: 'Gulmarg', note: "Asia's highest gondola, ski runs, meadow" },
      { name: 'Sonmarg', note: 'Thajiwas glacier, Zoji-La gateway' },
      { name: 'Pahalgam', note: 'Aru, Betaab, Chandanwari, Lidder valley' },
      { name: 'Doodhpathri', note: 'Off-radar meadows, day trip from Srinagar' },
      { name: 'Yusmarg', note: 'Nomad shepherd country, quiet Kashmir' },
    ],
    highlights: [
      'Deluxe houseboat night on Dal Lake',
      'Gondola Phase 1 & 2 in Gulmarg',
      'Thajiwas glacier pony ride',
      'Sunset shikara through the floating market',
      'Wazwan dinner (traditional Kashmiri feast)',
    ],
    faqs: [
      {
        q: 'Is Kashmir safe for tourists right now?',
        a: 'Yes. Tourism runs year-round. Our staff live in Srinagar and monitor conditions daily; we advise on any regional change before your trip.',
      },
      {
        q: 'Do I need a permit?',
        a: 'No permit for Indian nationals. Foreign nationals need only their passport and standard Indian visa.',
      },
      {
        q: "When's the best time for snow?",
        a: 'Guaranteed snow in Gulmarg from late December to mid-February. Early snowfall can start November.',
      },
    ],
    photoQuery: 'kashmir dal lake shikara',
  },
  {
    slug: 'ladakh',
    name: 'Ladakh',
    headline: 'The land where the sky begins',
    intro:
      "Cold desert at 3,500 metres, monasteries older than most countries, and passes that hurt your lungs and thrill your soul. Ladakh is a bucket-list trip — we build it so you have the energy to actually enjoy it.",
    bestTime: 'May–September (roads open, mild days, cold nights)',
    duration: '6–10 nights',
    startingFrom: 32500,
    regions: [
      { name: 'Leh', note: 'Acclimatisation base, monasteries, night markets' },
      { name: 'Nubra Valley', note: 'Khardung La, sand dunes, double-hump camels' },
      { name: 'Pangong Tso', note: 'The lake from 3 Idiots — Chinese border adjacent' },
      { name: 'Tso Moriri', note: 'Higher, quieter, more spiritual than Pangong' },
      { name: 'Turtuk', note: 'India\'s last village before Pakistan' },
    ],
    highlights: [
      'Overnight at Pangong Tso lakeside camp',
      'Diskit Monastery + Bactrian camel safari',
      'Khardung La (18,380 ft) top-of-the-world photo',
      'Home-stay dinner with a Ladakhi family',
      'Magnetic Hill + Sangam confluence',
    ],
    faqs: [
      {
        q: 'How do I handle altitude?',
        a: 'Fly into Leh a day early to acclimatise (mandatory). We schedule high passes only from day 3. Every guest gets oximeter readings + a doctor on call.',
      },
      {
        q: 'Fly in or drive via Manali/Srinagar?',
        a: 'Flying in is safer for altitude. The road journey is spectacular but adds 2 days each way and higher altitude sickness risk.',
      },
      {
        q: 'Are Pangong permits included?',
        a: 'Yes. We handle Inner Line Permits for Nubra, Pangong, Tso Moriri and Turtuk — you sign, we file.',
      },
    ],
    photoQuery: 'ladakh pangong lake',
  },
  {
    slug: 'himachal',
    name: 'Himachal',
    headline: 'From cedar hush to Spiti silence',
    intro:
      'Shimla for colonial charm, Manali for adventure, Dharamshala for Tibet-in-India, and Spiti for the trip that changes you. We route around the crowds — because Himachal off-peak is a different country.',
    bestTime: 'March–June (spring), September–November (autumn), December–February (snow)',
    duration: '4–8 nights',
    startingFrom: 15500,
    regions: [
      { name: 'Manali', note: 'Solang, Rohtang, Old Manali cafes' },
      { name: 'Shimla', note: 'Ridge, Kufri, Mall Road, toy train' },
      { name: 'Dharamshala–McLeodganj', note: 'Dalai Lama residence, Triund trek' },
      { name: 'Spiti Valley', note: 'Kaza, Chandratal, Key Monastery — high desert' },
      { name: 'Kasol–Tosh', note: 'Parvati valley, Israeli-cafe backpacker circuit' },
    ],
    highlights: [
      'Volvo transfer + private cab hybrid',
      'Solang Valley paragliding & Rohtang Pass',
      'Toy train ride Kalka to Shimla',
      'Monastery breakfast in McLeodganj',
      'Spiti circuit with home-stays',
    ],
    faqs: [
      {
        q: 'Can I combine Manali and Shimla?',
        a: 'Yes — the classic 6-night Shimla-Manali circuit is our most popular Himachal package.',
      },
      {
        q: 'When does Rohtang Pass open?',
        a: 'Typically mid-May to mid-October, weather dependent. We pivot to Solang Valley for snow if Rohtang is closed.',
      },
    ],
    photoQuery: 'manali himachal snow',
  },
  {
    slug: 'vaishno-devi',
    name: 'Vaishno Devi & Combos',
    headline: 'Mata\'s darshan, and the mountains beyond',
    intro:
      "The Vaishno Devi yatra is a lifetime pilgrimage. We combine it with Kashmir or Amritsar so you don't fly all the way to Jammu just for one temple — one trip, two lifetimes of memories.",
    bestTime: 'October–April (avoid monsoon slippery paths)',
    duration: '3–8 nights (standalone or combo)',
    startingFrom: 9500,
    regions: [
      { name: 'Katra', note: 'Base camp for the 12 km yatra' },
      { name: 'Bhawan', note: "Mata's darshan cave — 12 km trek or helicopter" },
      { name: 'Bhairon Temple', note: 'Mandatory darshan after Mata (2.5 km beyond)' },
      { name: 'Combo: Kashmir', note: 'Jammu → Srinagar via Banihal — 6 nights total' },
      { name: 'Combo: Amritsar', note: 'Golden Temple + Wagah border added' },
    ],
    highlights: [
      'Helicopter option (Katra ↔ Sanjhichhat) for elders',
      'VIP darshan pass arrangement',
      'Combo circuits with Kashmir & Amritsar',
      'AC coaster transfer from Jammu station/airport',
      'Cloakroom + medical support at base',
    ],
    faqs: [
      {
        q: 'How long does the yatra take?',
        a: '4–6 hours one way for walkers. Helicopter cuts it to under 2 hours round trip.',
      },
      {
        q: 'Can we book VIP darshan?',
        a: 'Yes — we arrange VIP passes with prior notice (subject to Shrine Board availability).',
      },
      {
        q: 'Is Kashmir combo safe post-yatra?',
        a: 'Yes. Jammu to Srinagar is a 7–8 hour scenic drive or a 20-minute flight. We handle both.',
      },
    ],
    photoQuery: 'vaishno devi katra',
  },
];

export function getDestination(slug: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.slug === slug);
}
