/**
 * Curated high-value informational travel guides for Kashmir, Ladakh, and the Himalayas.
 */

export type GuideArticle = {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  destination: string;
  destinationName: string;
  readingTime: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  faqs: { q: string; a: string }[];
  toc: { id: string; title: string }[];
  content: string;
  relatedPackages: string[];
};

export const GUIDES: GuideArticle[] = [
  {
    slug: 'gulmarg-gondola-booking-guide-2026',
    title: 'Gulmarg Gondola Phase 1 vs Phase 2: Complete 2026 Booking & Travel Guide',
    subtitle: 'Everything you need to know about tickets, slot timings, high-altitude tips, and avoiding tourist traps at Asia’s highest cable car.',
    summary: 'A step-by-step local guide to booking Gulmarg Gondola Phase 1 (Kongdoori) and Phase 2 (Apharwat Peak) tickets online, timing your ride, and what to do if slots are sold out.',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    readingTime: '6 min read',
    author: 'Tariq Ahmad',
    authorRole: 'Head of Operations, Srinagar',
    publishedAt: '2026-08-15',
    updatedAt: '2026-08-30',
    tags: ['Gulmarg', 'Gondola', 'Snow Activities', 'Travel Tips'],
    relatedPackages: ['gulmarg-ski-snow-adventure-4n5d', 'glimpse-of-kashmir-4n5d', 'kashmir-honeymoon-special-5n6d'],
    toc: [
      { id: 'phases-explained', title: 'Phase 1 vs Phase 2: What is the Difference?' },
      { id: 'booking-process', title: 'How to Book Tickets Online in Advance' },
      { id: 'best-timings', title: 'Best Time of Day & Boarding Tips' },
      { id: 'altitude-safety', title: 'Altitude Safety at 13,780 ft (Apharwat)' },
    ],
    faqs: [
      {
        q: 'How far in advance should I book Gulmarg Gondola tickets?',
        a: 'We strongly recommend booking tickets at least 15 to 30 days in advance via the official J&K Cable Car Corporation portal (jktpc.in). Phase 2 tickets frequently sell out weeks ahead during peak winter and summer seasons.',
      },
      {
        q: 'Is Phase 2 safe for elderly travelers and young children?',
        a: 'Phase 2 reaches 13,780 feet (4,200m). Visitors with asthma, severe hypertension, or heart conditions should consult their doctor. Stay hydrated, walk slowly, and do not spend more than 45–60 minutes at the top.',
      },
      {
        q: 'What happens if the Gondola is closed due to bad weather or wind?',
        a: 'If high winds or heavy blizzards halt Gondola operations, the J&K Tourism Corporation issues automatic refunds to the original payment source within 7–10 days. Glitz Holidays operations team will rearrange your day with local sledge or ATV activities in Gulmarg bowl.',
      },
    ],
    content: `
### Phase 1 vs Phase 2: What is the Difference?
The Gulmarg Gondola is the world's second-highest operating cable car, rising from Gulmarg resort (8,694 ft) to Kongdoori Valley (10,050 ft) in Phase 1, and continuing to the shoulder of Mount Apharwat (13,780 ft) in Phase 2.

- **Phase 1 (Gulmarg to Kongdoori):** 9 minutes. Gentle bowl surrounded by pine forests. Ideal for families with toddlers, gentle snow play in winter, and casual pony rides in summer.
- **Phase 2 (Kongdoori to Apharwat Peak):** 12 minutes. High-alpine glacial terrain with year-round snow patches. Offers panoramic views of Nanga Parbat and the Pir Panjal range.

### How to Book Tickets Online in Advance
Tickets are issued exclusively via the official online booking portal of J&K Tourism. **Never buy tickets from unauthorized touts in Tangmarg or Gulmarg parking.**
- Phase 1 round-trip: ₹810 per person.
- Phase 2 round-trip: ₹1,010 per person (Total combo: ₹1,820).
- Children below 3 years travel free (valid birth certificate required at gate).

### Best Time of Day & Boarding Tips
1. **Target the 09:30 AM to 10:30 AM Slot:** Weather is clearest in the morning, and queues at the boarding terminal are shortest.
2. **Dress in Layers:** Temperatures at Phase 2 are typically 10°C to 15°C colder than Gulmarg bowl. Carry windproof jackets, sunglasses, and waterproof gloves.
3. **Boarding Gate Strategy:** Reach the base station 30 minutes before your slot time with digital QR codes ready on your phone.
    `,
  },
  {
    slug: 'best-time-to-visit-kashmir-month-by-month',
    title: 'Best Time to Visit Kashmir: Month-by-Month Weather, Snow & Seasonal Guide',
    subtitle: 'From the spring Tulip blooms in April to summer Dal Lake houseboats, autumn golden Chinars, and winter Gulmarg ski slopes.',
    summary: 'A seasonal planning guide breaking down Kashmir temperatures, tourist crowds, clothing recommendations, and ideal itineraries across all four distinct seasons.',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    readingTime: '7 min read',
    author: 'Roohi Akhter',
    authorRole: 'Chief Travel Curator',
    publishedAt: '2026-08-20',
    updatedAt: '2026-08-30',
    tags: ['Kashmir Seasons', 'Weather Guide', 'Best Time To Visit', 'Planning'],
    relatedPackages: ['classic-kashmir-family-6n7d', 'kashmir-honeymoon-special-5n6d', 'complete-kashmir-circuit-7n8d'],
    toc: [
      { id: 'spring', title: 'Spring (March to April): Blooms & Tulip Festival' },
      { id: 'summer', title: 'Summer (May to August): Lush Valleys & Escapes' },
      { id: 'autumn', title: 'Autumn (September to November): Chinar Foliage' },
      { id: 'winter', title: 'Winter (December to February): Powder Snow Paradise' },
    ],
    faqs: [
      {
        q: 'When can I see snow in Kashmir?',
        a: 'For fresh snowfall in Gulmarg, Pahalgam, and Srinagar, plan between late December and mid-February. For year-round snow glaciers, visit Sonmarg Zero Point (May to October) or Gulmarg Phase 2 Apharwat Peak.',
      },
      {
        q: 'Which month is best for a honeymoon in Kashmir?',
        a: 'April–May offers pleasant blooming gardens and shikara weather, while January–February is ideal for couples wanting a snow-covered wonderland with cozy fireplace stays.',
      },
    ],
    content: `
### Spring (March to April): Blooms & Tulip Festival
Spring is Kashmir awakening from winter slumber. Almond blossoms bloom across Srinagar in late March, followed by the opening of Asia’s largest Tulip Garden at the foothills of Zabarwan range in April.
- **Temperatures:** 8°C to 18°C.
- **What to Pack:** Light woollens, a windbreaker jacket, and comfortable walking shoes.

### Summer (May to August): Lush Valleys & Escapes
When the Indian plains swelter, Kashmir is green and cool. Aru Valley, Betaab Valley, and Doodhpathri meadow streams are in full flow.
- **Temperatures:** 15°C to 28°C.
- **What to Pack:** Cotton daywear with light evening jackets or cardigans.

### Autumn (September to November): Chinar Foliage
Kashmir turns fiery gold and crimson as iconic Chinar leaves change color. The weather is crisp, skies are azure, and crisp saffron harvest begins in Pampore.
- **Temperatures:** 5°C to 20°C.
- **What to Pack:** Medium woollens, shawls, and thermals for late October/November.

### Winter (December to February): Powder Snow Paradise
The famous *Chillai Kalan* brings heavy snowfall to Gulmarg and Pahalgam. Gulmarg becomes a world-class skiing hub, and Dal Lake freezes along its edges.
- **Temperatures:** -6°C to 7°C.
- **What to Pack:** Heavy down jackets, thermal innerwear, snow boots, and woollen beanies.
    `,
  },
  {
    slug: 'ladakh-altitude-acclimatization-guide',
    title: 'How to Acclimatize in Leh Ladakh: Essential High-Altitude Health & Travel Tips',
    subtitle: 'Prevent Acute Mountain Sickness (AMS), understand oxygen saturation levels, and plan your route safely across 17,000+ ft passes.',
    summary: 'Crucial medical and itinerary advice for first-time Ladakh travelers: why 48 hours of rest in Leh is non-negotiable, hydration rules, and emergency oxygen protocols.',
    destination: 'ladakh',
    destinationName: 'Ladakh',
    readingTime: '5 min read',
    author: 'Stanzin Norbu',
    authorRole: 'Senior Ladakh Expedition Lead',
    publishedAt: '2026-08-10',
    updatedAt: '2026-08-30',
    tags: ['Ladakh', 'Acclimatization', 'AMS', 'Health Tips', 'Khardung La'],
    relatedPackages: ['ladakh-explorer-6n7d', 'grand-ladakh-circuit-7n8d', 'zanskar-valley-expedition-8n9d'],
    toc: [
      { id: 'why-acclimatization', title: 'Why Acclimatization Matters at 11,500 ft' },
      { id: '48-hour-rule', title: 'The Golden 48-Hour Rule in Leh' },
      { id: 'medication-hydration', title: 'Hydration, Diet & Diamox Guidelines' },
    ],
    faqs: [
      {
        q: 'Can I travel directly to Nubra Valley on Day 2 of arrival?',
        a: 'No. The medical protocol and local administration guidelines strictly require 48 hours of acclimatization in Leh before crossing Khardung La (17,982 ft). Rushing to Nubra or Pangong on Day 2 frequently causes severe AMS.',
      },
      {
        q: 'Do all Glitz Holidays vehicles in Ladakh carry emergency oxygen?',
        a: 'Yes. Every dedicated private vehicle assigned by Glitz Holidays in Ladakh carries a certified portable oxygen cylinder and pulse oximeter for daily guest health checks.',
      },
    ],
    content: `
### Why Acclimatization Matters at 11,500 ft
Leh sits at 11,500 feet (3,500 meters) above sea level, where atmospheric pressure is 30% lower than at sea level. When flying directly from Delhi or Mumbai into Kushok Bakula Rimpochee Airport, your body needs time to adjust to lower oxygen density.

### The Golden 48-Hour Rule in Leh
- **Day 1:** Complete bed rest at your hotel. Do not exert yourself, avoid climbing stairs rapidly, and refrain from heavy sightseeing.
- **Day 2:** Gentle local sightseeing within Leh town (Shanti Stupa, Leh Palace, Leh Market) to test your lungs before high-pass expeditions.

### Hydration, Diet & Diamox Guidelines
1. **Drink 4 to 5 Litres of Water Daily:** High altitude dehydrates the body twice as fast. Garlic soup and herbal teas are local favorites that assist circulation.
2. **Avoid Alcohol & Smoking:** Alcohol severely hampers blood oxygenation during the first 3 days.
3. **Diamox (Acetazolamide):** If advised by your doctor, take 125mg–250mg twice daily starting 24 hours prior to landing in Leh.
    `,
  },
  {
    slug: 'srinagar-houseboat-vs-hotel-guide',
    title: 'Srinagar Houseboat vs Luxury Hotel: How to Choose for Your Kashmir Itinerary',
    subtitle: 'Nigeen Lake vs Dal Lake, heritage cedarwood suites, dining differences, and how to combine both for the perfect stay.',
    summary: 'A detailed comparison of staying on a traditional Kashmiri houseboat versus a hillside luxury resort, covering heritage charm, privacy, lake ambiance, and heating.',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    readingTime: '5 min read',
    author: 'Roohi Akhter',
    authorRole: 'Chief Travel Curator',
    publishedAt: '2026-08-25',
    updatedAt: '2026-08-30',
    tags: ['Houseboat', 'Dal Lake', 'Nigeen Lake', 'Srinagar Hotels', 'Accommodation'],
    relatedPackages: ['kashmir-honeymoon-special-5n6d', 'glimpse-of-kashmir-4n5d'],
    toc: [
      { id: 'houseboat-experience', title: 'The Traditional Kashmiri Houseboat Experience' },
      { id: 'dal-vs-nigeen', title: 'Dal Lake vs Nigeen Lake Houseboats' },
      { id: 'ideal-combination', title: 'The Ideal Strategy: 1 Night Houseboat + Hotel Stays' },
    ],
    faqs: [
      {
        q: 'Are houseboats in Srinagar heated in winter?',
        a: 'Yes, premium luxury houseboats are equipped with electric blankets, room blowers, and traditional Bukhari wood-burning stoves to keep suites warm and cozy even in sub-zero winter temperatures.',
      },
    ],
    content: `
### The Traditional Kashmiri Houseboat Experience
Crafted from aromatic fragrant Deodar cedarwood with intricate Khatamband ceilings and walnut wood hand-carved furniture, Srinagar houseboats are floating heritage residences anchored along the tranquil waters of Kashmir's lakes.

### Dal Lake vs Nigeen Lake Houseboats
- **Dal Lake:** Vibrant, bustling with shikara vendors selling flowers, saffron, and kahwa tea right to your balcony. Perfect for first-timers and honeymooners wanting the quintessential Kashmir atmosphere.
- **Nigeen Lake:** Quiet, secluded, surrounded by willow trees with glassy reflections of Hari Parbat fort. Ideal for travelers seeking serenity, birdwatching, and book reading.

### The Ideal Strategy: 1 Night Houseboat + Hotel Stays
We recommend spending **1 Night on a luxury houseboat** on your arrival or departure evening in Srinagar, combined with luxury resort stays in Gulmarg and Pahalgam for the remainder of your journey.
    `,
  },
];

export function getGuide(slug: string): GuideArticle | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
