import type { Tone } from './destinations';

/**
 * Package collections — curated listings that answer a specific commercial
 * query, sitting on flat `/packages/<slug>` URLs alongside the individual
 * package pages.
 *
 * WHY THESE EXIST
 * ---------------
 * Each one targets a query from the all-time Google Ads search-terms report
 * that has ALREADY produced conversions while we paid for every click, and
 * that has no organic page. `demand` carries the evidence so the reason a
 * page exists travels with the page.
 *
 * These are listings, not new products. Every price shown resolves from the
 * real PACKAGES data — nothing here invents a number.
 */

export type Collection = {
  slug: string;
  /** Rendered H1. Matches how people actually phrase the query. */
  h1: string;
  seoTitle: string;
  metaDescription: string;
  kicker: string;
  lede: string;
  crumbLabel: string;
  /** Evidence from the search-terms report, all-time. */
  demand: { queries: number; impressions: number; conversions: number };
  body: string[];
  /** Package slugs, in the order they should be shown. */
  packages: string[];
  /** Optional comparison rows rendered above the cards. */
  compare?: { heading: string; note: string };
  faqs: { q: string; a: string }[];
  tone: Tone;
  basePath?: string;
};

export const COLLECTIONS: Collection[] = [
  // ───────────────────────────────────── with flight
  {
    slug: 'kashmir-tour-package-with-flight',
    h1: 'Kashmir tour packages with flights included',
    seoTitle: 'Kashmir Tour Package with Flight — All-Inclusive Prices & Itineraries',
    metaDescription:
      'Kashmir packages with return flights included, quoted as two honest lines rather than one blended number. Day-by-day itineraries, GST-inclusive land prices from ₹18,500 per person.',
    kicker: 'Flights + land, quoted properly',
    lede:
      'We will absolutely book your flights. We just will not hide them inside a single headline price, because that is how travellers end up overpaying without knowing which half moved.',
    crumbLabel: 'With flights',
    demand: { queries: 87, impressions: 1010, conversions: 9.0 },
    body: [
      'Almost every operator advertising an all-inclusive Kashmir price is quoting one number with the airfare buried inside it. It looks simpler and it is worse for you, because airfare is the most volatile part of the trip and the land package is the most stable. Blend them and you cannot see which one is responsible when the total looks high — so you cannot do anything about it.',
      'We quote the two separately. The land package is fixed and published: ₹18,500 per person for four nights, ₹27,900 for six, twin-sharing with GST included. The flights are quoted live on your dates at the time you ask. If the total comes in above what you had in mind, you can immediately see whether to move the dates, which usually fixes it, or drop a night, which usually does not.',
      'For families this matters more, not less. A family of four buys four airfares and one land package, so the flight is the dominant variable in the total — and it is the one most sensitive to booking three days either side. We will show you that comparison before you commit rather than after.',
    ],
    packages: [
      'classic-kashmir-4-nights',
      'complete-kashmir-6-nights',
      'kashmir-honeymoon-5-nights',
      'kashmir-snow-winter-5-nights',
    ],
    compare: {
      heading: 'What "with flights" actually includes',
      note: 'Return economy airfare from your city, all airport transfers at the Srinagar end, and the full land package below. Seat selection, extra baggage and meals on board are airline charges and are not included — we will tell you what they cost rather than absorbing them silently into the headline.',
    },
    faqs: [
      {
        q: 'Why not just give me one all-inclusive price?',
        a: 'Because it would be a worse deal for you. Airfare on this route can differ by a factor of three across the year while the land cost barely moves. One blended number hides that entirely. Two lines let you see exactly where the money is and what to change.',
      },
      {
        q: 'Is it cheaper to book flights through you or myself?',
        a: 'Often it is the same, and sometimes yours is cheaper if you are holding a fare alert or using card points. We genuinely do not mind. What we do ask is that you send us the timings before ticketing, because an arrival after mid-afternoon changes what Day 1 can contain.',
      },
      {
        q: 'What happens if my flight is delayed or cancelled?',
        a: 'Tell us as soon as you know. We rebuild the affected day and reposition the vehicle and hotel where we can. If you booked the flights through us we deal with the airline; if you booked them yourself, that part is yours, but the ground arrangements are still ours to fix.',
      },
      {
        q: 'Do you include flights for the Ladakh packages too?',
        a: 'Yes, on the same basis. Ladakh has the added consideration that you should not fly in and immediately go high, so the first day is a fixed acclimatisation day regardless of how you arrive. That is not padding, it is altitude safety.',
      },
    ],
    tone: 'kashmir',
  },

  // ───────────────────────────────────── cheapest
  {
    slug: 'cheap-kashmir-tour-packages',
    h1: 'Cheap Kashmir tour packages — what the low price actually buys',
    seoTitle: 'Cheap Kashmir Tour Packages from ₹18,500 — Honest Budget Itineraries',
    metaDescription:
      'Budget Kashmir packages from ₹18,500 per person, GST included, with the trade-offs stated plainly. What a cheaper Kashmir trip gives up, and when it is genuinely the right choice.',
    kicker: 'Budget, without the bait',
    lede:
      'A cheap Kashmir package is a real and reasonable thing to want. What it is not is a free lunch — so here is exactly what changes when the price comes down.',
    crumbLabel: 'Budget packages',
    demand: { queries: 42, impressions: 480, conversions: 7.0 },
    body: [
      'The lowest genuine price we run is ₹18,500 per person for four nights, twin-sharing, GST included. Anything advertised far below that in this market is usually doing one of four things: quoting without GST, quoting a hotel category well below what the photos suggest, quoting shared transport as though it were private, or quoting a price that quietly excludes the Gulmarg and Sonmarg union taxi charges you will be asked for on the day.',
      'We would rather lose the booking than win it that way, so our exclusions are published on every package page instead of buried. The union taxi charges inside Gulmarg, Sonmarg and Pahalgam are state-regulated and genuinely outside our control — we exclude them and say what they are, rather than pretending they do not exist until you are standing there.',
      'If budget is the constraint, the two levers that actually work are season and duration, in that order. Travelling in the shoulder weeks rather than peak December or peak May can move the total more than dropping a night will, and it does not cost you any of the trip. Tell us your ceiling and we will tell you honestly which month it fits.',
    ],
    packages: [
      'classic-kashmir-4-nights',
      'kashmir-snow-winter-5-nights',
      'vaishno-devi-2-nights',
      'complete-kashmir-6-nights',
    ],
    compare: {
      heading: 'Where a cheaper package saves money — and where it should not',
      note: 'Fair savings: a 3★ rather than 4★ hotel, a shoulder-season date, a shared airport transfer, fewer nights. Not fair: cutting the private vehicle on sightseeing days, excluding GST from the headline, or leaving out union taxi charges you will certainly be asked to pay.',
    },
    faqs: [
      {
        q: 'What is the genuinely cheapest Kashmir trip you run?',
        a: 'Four nights at ₹18,500 per person on twin-sharing, GST included. That is a real, complete price for the land arrangements — not a teaser that grows when you enquire.',
      },
      {
        q: 'Why do I see Kashmir packages advertised for much less?',
        a: 'Usually because the number excludes GST, or downgrades the hotel category, or converts the private vehicle into a shared one, or omits the state-regulated union taxi charges at Gulmarg and Sonmarg. Ask any operator to confirm all four in writing and the numbers tend to converge.',
      },
      {
        q: 'How can I actually reduce the cost?',
        a: 'Move your dates before you cut nights. Shoulder-season weeks are materially cheaper than peak and cost you nothing in experience. After that, hotel category is the next honest lever — the 3★ properties we use are ones we would stay in ourselves.',
      },
      {
        q: 'Is the budget package a worse trip?',
        a: 'It is a shorter one with simpler hotels. The vehicle is still private, the driver is still ours, and the itinerary still covers the things you came for. What you give up is nights and room quality, not the substance of the trip.',
      },
    ],
    tone: 'kashmir',
  },

  // ───────────────────────────────────── jammu
  {
    slug: 'jammu-tour-packages',
    h1: 'Jammu tour packages — Vaishno Devi, Patnitop and the road north',
    seoTitle: 'Jammu Tour Packages — Vaishno Devi & Patnitop Itineraries from ₹9,500',
    metaDescription:
      'Jammu region tour packages from ₹9,500 per person including Vaishno Devi yatra and the combined Jammu–Kashmir itinerary. Real itineraries from a Srinagar-based operator.',
    kicker: 'The Jammu division',
    lede:
      'Most Kashmir operators treat Jammu as somewhere you pass through. It is a destination with its own pilgrimage, its own hill stations and its own season — and it is busiest when the valley is quiet.',
    crumbLabel: 'Jammu packages',
    demand: { queries: 3903, impressions: 44970, conversions: 46.7 },
    body: [
      'Jammu carries the second-largest share of search demand we see, after Srinagar itself, and it is overwhelmingly pilgrimage-shaped: Vaishno Devi, Shiv Khori, and the temples in the city. This is a fundamentally different audience from Kashmir leisure travel — it runs year-round, it repeats, and it travels in larger family groups.',
      'It is also the natural first half of a longer journey. The overland route into the valley passes directly through Katra, so combining Vaishno Devi with Kashmir in a single trip is substantially more efficient than treating them as two separate holidays. The 7-night combined itinerary exists because enough families worked that out and asked us for it.',
      'For the yatra itself, the two-night package is deliberately unhurried. The climb is fourteen kilometres and people routinely underestimate it, particularly with older parents or young children in the group. Building in a proper rest day is not padding the itinerary; it is the difference between a pilgrimage and an ordeal.',
    ],
    packages: ['vaishno-devi-2-nights', 'vaishno-devi-kashmir-7-nights'],
    compare: {
      heading: 'Two nights or seven?',
      note: 'Two nights covers the yatra properly and gets you home. Seven nights uses the fact that you are already halfway to the valley — the marginal cost of adding Kashmir to a Vaishno Devi trip is far lower than doing the two journeys separately.',
    },
    faqs: [
      {
        q: 'How long does the Vaishno Devi yatra take?',
        a: 'The climb is around fourteen kilometres each way from Katra. Fit walkers manage it in five to six hours up; most families take longer and should. Ponies, palkis and a helicopter service are all available, and we will arrange whichever suits your group.',
      },
      {
        q: 'Can we do Vaishno Devi and Kashmir in one trip?',
        a: 'Yes, and it is usually the better plan. The road to the valley runs through Katra anyway, so the combined 7-night itinerary at ₹31,500 per person costs far less than mounting two separate trips.',
      },
      {
        q: 'What is the best time for the Jammu region?',
        a: 'The yatra runs year-round. Summer is busiest and hottest in Jammu city; the Navratri period is extremely crowded and needs booking well ahead. Patnitop is at its best from March to June and again after the monsoon, and gets snow in winter.',
      },
      {
        q: 'Do you handle the yatra registration?',
        a: 'Yes. Registration and the yatra slip are part of what we arrange, along with the Katra hotel and transport. Carry original photo ID for every member of the group — it is checked and there is no way around it.',
      },
    ],
    tone: 'vaishno',
  },

  // ───────────────────────────────────── srinagar by nights
  {
    slug: 'srinagar-packages',
    h1: 'Srinagar packages by length — 4, 5 and 6 nights compared',
    seoTitle: 'Srinagar Packages — 4, 5 & 6 Night Itineraries Compared, from ₹18,500',
    metaDescription:
      'Srinagar and Kashmir packages compared by length: what genuinely fits in 4, 5 or 6 nights, with day-by-day itineraries and GST-inclusive prices from ₹18,500 per person.',
    kicker: 'How many nights do you actually need?',
    lede:
      'The most common question we get is not where to go, it is how long to take. Here is what each length genuinely fits — and what it does not.',
    crumbLabel: 'By length',
    demand: { queries: 106, impressions: 521, conversions: 7.0 },
    body: [
      'People search for a specific number of nights because they have already fixed their leave, and they want to know what that buys. The honest answer is that the jump from four nights to six is the single biggest quality difference in Kashmir travel, and it is much larger than the price difference suggests.',
      'Four nights covers Srinagar and two day trips. It works, and for a first visit constrained by leave it is a real trip rather than a compromise. What it cannot absorb is a weather day — and in a Himalayan valley, weather days happen. If Gulmarg is shut on the one day you allocated to it, a four-night itinerary has nowhere to put it.',
      'Six nights covers the same ground with slack in it, adds Pahalgam properly rather than as a rush, and gives you a day that is not spoken for. That last part is what travellers consistently tell us mattered most. Five nights sits between the two and is the sweet spot for couples, which is why the honeymoon itinerary is built at that length.',
    ],
    packages: [
      'classic-kashmir-4-nights',
      'kashmir-honeymoon-5-nights',
      'kashmir-snow-winter-5-nights',
      'complete-kashmir-6-nights',
    ],
    compare: {
      heading: 'The short version',
      note: '4 nights — Srinagar plus two day trips, no margin for weather. 5 nights — the couple length; slower pace, one spare half-day. 6 nights — Srinagar, Gulmarg, Pahalgam and Sonmarg with a genuine buffer day. If you can only add one night to a four-night plan, add it.',
    },
    faqs: [
      {
        q: 'Is 4 nights enough for Kashmir?',
        a: 'It is enough for Srinagar and two day trips, and plenty of people have an excellent time on it. Its weakness is that it has no slack — one bad-weather day and something has to be dropped entirely.',
      },
      {
        q: 'What does the sixth night actually add?',
        a: 'Pahalgam done properly instead of rushed, and a day that is not allocated to anything. Travellers tell us the unallocated day is the one they remember, whether it became a second shikara afternoon or simply a slow morning.',
      },
      {
        q: 'Why is the honeymoon package 5 nights?',
        a: 'Because the pace is deliberately slower and there is less ground to cover. Couples generally want fewer things done better, so the fifth night buys quality rather than distance.',
      },
      {
        q: 'Can I customise the number of nights?',
        a: 'Yes — these are templates, not fixed products. Add a night, drop one, or start from a different city. Tell us what changes and we rebuild the itinerary and the quote around it.',
      },
    ],
    tone: 'kashmir',
  },

  // ───────────────────────────────────── couples
  {
    slug: 'kashmir-packages-for-couples',
    h1: 'Kashmir packages for couples',
    seoTitle: 'Kashmir Packages for Couples — Romantic Itineraries from ₹32,500',
    metaDescription:
      'Kashmir couple packages with private transfers, houseboat nights and a deliberately slower pace. Honeymoon and anniversary itineraries from ₹32,500 per person, GST included.',
    kicker: 'Two people, slower pace',
    lede:
      'A couples trip is not a standard itinerary with flowers added at the end. The difference is structural — fewer stops, better rooms, and transport that is genuinely private.',
    crumbLabel: 'For couples',
    demand: { queries: 71, impressions: 690, conversions: 5.0 },
    body: [
      'The thing that separates a good couples itinerary from a repackaged group one is what it leaves out. Standard Kashmir sightseeing is built to cover ground efficiently, which means early starts and a full schedule. That is the opposite of what most couples want, so the honeymoon itinerary drops stops rather than adding extras, and uses the time it recovers on the parts worth lingering over.',
      'Private transport matters more here than anywhere else in our range. Shared sightseeing vehicles are the norm at the budget end of this market, and they are perfectly fine for a family trip; on a honeymoon they are the single most common complaint we hear about other operators. Every couples package we run uses a private vehicle throughout, and that is not an upgrade line, it is in the base price.',
      'One night on a Dal Lake houseboat is worth planning deliberately rather than assuming. The good ones are genuinely special and the poor ones are memorably not, so we place a specific property rather than a category. If you would rather have all your nights in a hotel, say so — there is no penalty for it and we will not push.',
    ],
    packages: [
      'kashmir-honeymoon-5-nights',
      'complete-kashmir-6-nights',
      'kashmir-snow-winter-5-nights',
    ],
    compare: {
      heading: 'What is actually different',
      note: 'Private vehicle throughout, not shared. Upgraded room category with a view where the property has one. A named houseboat rather than a category. A slower schedule with later starts. Candlelit dinner and in-room decor arranged on request — told to you as a list, not implied by a photograph.',
    },
    faqs: [
      {
        q: 'What makes a couples package different from a normal one?',
        a: 'Fewer stops, later starts, a private vehicle throughout, an upgraded room category, and a specific houseboat rather than a generic one. The changes are structural rather than decorative.',
      },
      {
        q: 'Is a houseboat night a good idea for a honeymoon?',
        a: 'On the right boat, yes — it is often the night people remember. On the wrong one it is cold and noisy. We name the property in your quote so you can look it up yourself rather than trusting a category.',
      },
      {
        q: 'Can you arrange decoration and a special dinner?',
        a: 'Yes. Room decor, a cake and a candlelit dinner can all be arranged. Tell us at booking rather than on the day, because the good options need notice.',
      },
      {
        q: 'What is the best month for a Kashmir honeymoon?',
        a: 'December to February for snow, a narrow window in April for the tulip garden, and May to early July for green valleys and comfortable weather. All three are genuinely good; they are just very different trips.',
      },
    ],
    tone: 'kashmir',
  },

  // ───────────────────────────────────── honeymoon from delhi
  {
    slug: 'kashmir-honeymoon-packages-from-delhi',
    h1: 'Kashmir honeymoon packages from Delhi',
    seoTitle: 'Kashmir Honeymoon Packages from Delhi — All-Inclusive Couple Trips',
    metaDescription:
      'Kashmir honeymoon packages from Delhi with flights, private transfers and houseboat nights. Couple itineraries from ₹32,500 per person, GST included.',
    kicker: 'Delhi departures · couples',
    lede:
      'Delhi is the best-connected city for a Kashmir honeymoon, which means the trip can start properly on the first afternoon instead of on the second morning.',
    crumbLabel: 'Honeymoon from Delhi',
    demand: { queries: 34, impressions: 866, conversions: 7.0 },
    body: [
      'The practical advantage of starting from Delhi is that a morning departure usually puts you in Srinagar before lunch. On a honeymoon that half-day is worth more than it sounds: it converts a travel day into a first afternoon on the Dal, which is the single best introduction to the valley there is.',
      'We build the Delhi honeymoon itinerary around that. Day 1 is a shikara at the hour the light is best, not a hotel check-in followed by an evening indoors. If your flight lands later than mid-afternoon we restructure rather than pretend — tell us the timings before you ticket and we will say plainly what fits.',
      'Delhi is also where the widest fare spread sits, and honeymoons are usually planned far enough ahead to exploit that. Couples who can shift their dates by three or four days routinely save more than they would by dropping a night, and keep the whole trip intact. Ask us before you book the flights, not after.',
    ],
    packages: ['kashmir-honeymoon-5-nights', 'complete-kashmir-6-nights', 'kashmir-snow-winter-5-nights'],
    compare: {
      heading: 'Land package and airfare, quoted separately',
      note: 'The honeymoon land package is ₹32,500 per person on twin-sharing with GST included, and does not change with your departure city. Delhi–Srinagar airfare is quoted live on your dates. Two lines, so you can see which one to move.',
    },
    faqs: [
      {
        q: 'How much does a Kashmir honeymoon from Delhi cost?',
        a: 'The land package is ₹32,500 per person for five nights, twin-sharing and GST inclusive. Flights are on top and depend entirely on your dates — we quote them live rather than printing a number that will be wrong next week.',
      },
      {
        q: 'What is the best month for a honeymoon from Delhi?',
        a: 'December and January for snow, April for the tulip garden, and May to early July for green valleys. Delhi has good connectivity in all of them, so the choice is genuinely about which trip you want rather than what is practical.',
      },
      {
        q: 'Should we do a houseboat or a hotel on the first night?',
        a: 'If you land before mid-afternoon, houseboat first is lovely — you get the lake at its best hour on day one. If you land late, take the hotel first and move to the boat when you can actually enjoy it.',
      },
      {
        q: 'Can you add Gulmarg to a honeymoon itinerary?',
        a: 'Yes, and in winter it is often the highlight. The gondola is worth building a full day around rather than squeezing in, so we would usually add a night rather than compress an existing day.',
      },
    ],
    tone: 'kashmir',
  },

  // ───────────────────────────────────── honeymoon from hyderabad
  {
    slug: 'kashmir-honeymoon-packages-from-hyderabad',
    h1: 'Kashmir honeymoon packages from Hyderabad',
    seoTitle: 'Kashmir Honeymoon Packages from Hyderabad — Couple Itineraries & Prices',
    metaDescription:
      'Kashmir honeymoon packages from Hyderabad with private transfers, houseboat nights and upgraded rooms. Couple itineraries from ₹32,500 per person, GST included.',
    kicker: 'Hyderabad departures · couples',
    lede:
      'Hyderabad sends us a high proportion of honeymoon couples relative to its size — and the longer journey changes what the right itinerary looks like.',
    crumbLabel: 'Honeymoon from Hyderabad',
    demand: { queries: 18, impressions: 508, conversions: 3.0 },
    body: [
      'Hyderabad is a small market for us by volume and a strong one by intent, and honeymoons are a large share of it. The couples who contact us from here have generally decided on Kashmir already and are pricing it, which is why this page leads with the number rather than the scenery.',
      'The journey is long enough that the itinerary should absorb it rather than ignore it. We would not recommend a four-night trip from Hyderabad; five is the minimum that feels like a holiday, and the five-night honeymoon itinerary is deliberately paced so the first day asks nothing of you beyond arriving.',
      'Connection timing is the practical risk. Where the routing involves a change, a tight layover that works on paper can fail in weather season and cost you a night of a trip you have planned for months. We build Day 1 with slack, and we will tell you if the timings you are considering are too optimistic.',
    ],
    packages: ['kashmir-honeymoon-5-nights', 'complete-kashmir-6-nights'],
    compare: {
      heading: 'Land package and airfare, quoted separately',
      note: 'The honeymoon land package is ₹32,500 per person on twin-sharing with GST included, identical from every city. Hyderabad–Srinagar airfare is quoted live on your dates, and from the South it is the larger and more volatile half of the total.',
    },
    faqs: [
      {
        q: 'How much is a Kashmir honeymoon from Hyderabad?',
        a: 'The land package is ₹32,500 per person for five nights, twin-sharing, GST included. Flights are quoted separately on your dates — from Hyderabad they are usually the larger variable, so it is worth asking us early.',
      },
      {
        q: 'How many nights should we take from Hyderabad?',
        a: 'Five at minimum, six if the leave allows. With a long journey at each end, a four-night trip leaves roughly three usable days and does not feel like a honeymoon.',
      },
      {
        q: 'Are there direct flights from Hyderabad to Srinagar?',
        a: 'This changes with the season and the airline schedule, so we check live rather than publishing something that may be wrong by the time you read it. Send us your dates and we will lay out the real options.',
      },
      {
        q: 'When should we book?',
        a: 'For peak season, six to eight weeks ahead — hotel inventory in Gulmarg and Pahalgam tightens well before flights do, and the good honeymoon rooms are the first to go.',
      },
    ],
    tone: 'kashmir',
  },

  // ───────────────────────────────────── gulmarg honeymoon
  {
    slug: 'gulmarg-honeymoon-packages',
    h1: 'Gulmarg honeymoon packages',
    seoTitle: 'Gulmarg Honeymoon Package — Snow, Gondola & Romantic Stays',
    metaDescription:
      'Gulmarg honeymoon packages with gondola, snow and upgraded mountain stays. Couple itineraries from ₹26,500 per person, GST included, from a Srinagar-based operator.',
    kicker: 'Snow, gondola, altitude',
    lede:
      'Gulmarg is the most photographed honeymoon in India and the one most often planned badly. It rewards a full day and punishes a rushed one.',
    crumbLabel: 'Gulmarg honeymoon',
    demand: { queries: 39, impressions: 302, conversions: 7.0 },
    body: [
      'The mistake almost every Gulmarg itinerary makes is treating it as a day trip from Srinagar. It is a two-hour drive each way, the gondola queue is unpredictable, and the weather turns without much warning at that altitude. Squeeze it into one day and you spend most of it travelling and queuing, which is precisely the opposite of a honeymoon.',
      'Staying a night in Gulmarg fixes this. You get the mountain early before the day-trip crowd arrives, you have a second chance if phase two is shut for weather, and the evening at altitude with snow outside is a genuinely different experience from returning to a Srinagar hotel. The winter package is built this way for exactly that reason.',
      'On the gondola itself: it runs in two phases and they close independently, most often phase two, and most often in the weather people specifically travelled to see. We build the itinerary so a closure is a disappointment rather than a ruined day, and we will always tell you the current status before you set out rather than letting you find out at the station.',
    ],
    packages: ['kashmir-snow-winter-5-nights', 'kashmir-honeymoon-5-nights', 'complete-kashmir-6-nights'],
    compare: {
      heading: 'Stay the night, or go back to Srinagar?',
      note: 'Stay if snow is the reason for the trip — early access, a weather buffer, and an evening at altitude. Return to Srinagar if Gulmarg is one stop among several and you would rather keep your base fixed. Both are defensible; only one of them is usually offered.',
    },
    faqs: [
      {
        q: 'Should we stay overnight in Gulmarg?',
        a: 'If snow is the point of your honeymoon, yes. You get the gondola before the crowds and a second chance if it is closed for weather — which happens often enough to plan for.',
      },
      {
        q: 'Is the gondola always running?',
        a: 'No. It runs in two phases and either can close for weather or maintenance, phase two most commonly. We check status before you travel and build the day so a closure is not a write-off.',
      },
      {
        q: 'When is there guaranteed snow in Gulmarg?',
        a: 'Nobody can guarantee snow, and be wary of anyone who does. January and February are the most reliable months by a wide margin; December varies year to year and March is a gamble.',
      },
      {
        q: 'What should we pack for Gulmarg?',
        a: 'Genuinely warm layers, waterproof outer shell, gloves and proper footwear with grip. Snow boots and heavy jackets can be hired locally at the resort, which is often more sensible than flying with them.',
      },
    ],
    tone: 'kashmir',
  },
];

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
