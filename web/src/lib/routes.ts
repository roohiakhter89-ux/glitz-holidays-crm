/**
 * Transport route pages — one page per origin/destination pair, carrying a
 * self-contained section for each mode that has real search demand.
 *
 * WHY ONE PAGE PER PAIR, NOT PER MODE
 * -----------------------------------
 * The first cut of the manifest split these by mode: 157 pages across 88
 * pairs, where 53 pairs ran two or three near-identical documents competing
 * for the same "delhi to srinagar" query family. Three of Google's systems
 * punish that shape — deduplication filters near-duplicates, the site
 * diversity system caps a domain at roughly two results per query, and the
 * site-level helpful-content signal weighs thin pages against the whole
 * domain.
 *
 * Passage ranking is what makes consolidation safe: since 2021 Google can
 * rank an individual section of a page, so a well-structured "By rail" block
 * can still win "delhi to srinagar train" while the page as a whole
 * accumulates every link, every share and all the authority that would
 * otherwise be split three ways.
 *
 * The build requirement that follows: **every mode section must stand alone.**
 * A section that only makes sense after reading the one above it cannot be
 * lifted out and ranked.
 *
 * THE HONESTY RULE
 * ----------------
 * Every hard fact carries a source and a `verifiedOn` date. Timetables, fares
 * and road conditions change, and a transport page that is confidently wrong
 * is worse than no page — people miss trains on the strength of them.
 * Anything unverified is absent rather than estimated.
 */

export type RouteFact = {
  label: string;
  value: string;
};

export type RouteSource = {
  label: string;
  url: string;
};

export type RouteMode = {
  key: 'flight' | 'train' | 'road';
  /** Section heading. Written as the thing someone searches. */
  label: string;
  /** Comparison-table cells. */
  time: string;
  cost: string;
  /** One line: who this mode is right for. */
  verdict: string;
  /** Correction callout, where the commonly published answer is wrong. */
  headline?: { title: string; body: string };
  body: string[];
  facts: RouteFact[];
  sources?: RouteSource[];
};

export type TransportRoute = {
  slug: string;
  origin: string;
  destination: string;
  h1: string;
  seoTitle: string;
  metaDescription: string;
  lede: string;
  /** Evidence from the all-time search-terms report. */
  demand: { queries: number; impressions: number; conversions: number };
  /**
   * The direct answer, rendered above everything else. The content standard
   * requires the primary query be answered inside the first 100 words.
   */
  answer: { verdict: string; body: string };
  modes: RouteMode[];
  /** Human-readable, shown on the page. */
  verifiedOn: string;
  /**
   * Same date in ISO, for `dateModified`. Kept explicit rather than derived:
   * parsing "31 August 2026" and calling toISOString() shifts the date across
   * the timezone boundary and publishes the wrong day in structured data.
   */
  verifiedOnISO: string;
  faqs: { q: string; a: string }[];
  /** Origin-city package page to pass link equity to. */
  originCitySlug?: string;
};

export const ROUTES: TransportRoute[] = [
  {
    slug: 'delhi-to-srinagar',
    origin: 'Delhi',
    destination: 'Srinagar',
    h1: 'Delhi to Srinagar',
    seoTitle: 'Delhi to Srinagar — Train, Flight & Road Compared',
    metaDescription:
      'Delhi to Srinagar by flight, train or road: real times, distances, and what changed when the valley rail line opened in 2026.',
    lede:
      'Three ways to get here, and one of the three answers changed in 2026. Times, distances and the trade-offs, compared without a booking incentive.',
    demand: { queries: 137, impressions: 2542, conversions: 9.5 },

    answer: {
      verdict: 'Fly, unless the journey is the point.',
      body: 'A direct flight from Delhi takes roughly 1 hour 20 minutes to 2 hours and puts you in Srinagar in time to use the afternoon. Driving is 818–869 km and 15–17 hours at the wheel. The train is now a genuine option rather than a partial one — the valley line opened through to Srinagar in 2026 — but it is still an overnight leg plus a change at Jammu Tawi or Katra. Fly if the holiday is in the valley. Take the train if the railway is something you want to experience, or if you are breaking the journey at Katra for Vaishno Devi.',
    },

    modes: [
      {
        key: 'flight',
        label: 'By air',
        time: '1h 20m – 2h direct',
        cost: 'Varies 3× by season',
        verdict:
          'The right default. Costs you no holiday time and lands you with the afternoon still ahead of you.',
        body: [
          'Delhi is the best-connected Indian city for Srinagar, and direct flights run daily into Sheikh ul-Alam International (SXR). The aerial distance is around 650 km, so the flight itself is short; what varies enormously is the fare, which on this route can differ by a factor of three between a February weekday and the last week of December.',
          'The timing decision matters more than most people expect. A morning departure gets you to the hotel before lunch, which turns Day 1 into a real day — a Dal Lake shikara in good afternoon light rather than a check-in and a lost evening. An arrival after mid-afternoon effectively costs you a night you have already paid for, so we would rather rebuild the itinerary around a late arrival than pretend it fits.',
          'We do not publish a fare table here, because any number written today would be wrong within a week. Send us your dates and we will quote the flights and the land package as two separate lines, so you can see which half to move if the total is more than you had in mind.',
        ],
        facts: [
          { label: 'Airport', value: 'Sheikh ul-Alam International (SXR)' },
          { label: 'Direct flights from Delhi', value: 'Yes, daily' },
          { label: 'Flight time', value: 'Approximately 1h 20m – 2h' },
          { label: 'Aerial distance', value: 'Approximately 650 km' },
          { label: 'Best arrival slot', value: 'Before 13:00, to keep Day 1 usable' },
        ],
      },

      {
        key: 'train',
        label: 'By rail',
        time: 'Overnight + ~5h, one change',
        cost: 'Below airfare in most seasons',
        verdict:
          'Now a real choice rather than a compromise — and the best option if you are stopping at Katra.',
        headline: {
          title: 'The commonly published answer is out of date',
          body: 'For decades the correct answer was "the train stops in Jammu and you finish by road." That is no longer true. The Udhampur–Srinagar–Baramulla rail link is complete and Vande Bharat services now run into Srinagar itself. If a page tells you to arrange a taxi from Jammu Tawi for the final leg, it was written before this changed.',
        },
        body: [
          'There is still no single train from Delhi to Srinagar. The journey is two legs: a Delhi service to Jammu Tawi or Katra, then the Vande Bharat through the mountains into Srinagar. The second leg is the new part and the one to plan around, because it runs six days a week rather than daily — an arrival on the wrong day means an unplanned night in Jammu.',
          'That valley leg is also the reason to consider rail at all. It crosses the Chenab and Anji bridges and is one of the more remarkable pieces of railway engineering anywhere in India. Where the old road leg was something to be endured, this is arguably the best part of getting here.',
          'None of which makes it faster. Flying costs you a couple of hours; the train costs the better part of a day in each direction. Choose it because you want the journey, or because you are breaking it at Katra — the corridor runs straight through, which makes combining Vaishno Devi with Kashmir unusually efficient.',
        ],
        facts: [
          { label: 'Through train Delhi to Srinagar', value: 'None — change at Jammu Tawi or Katra' },
          { label: 'Valley leg', value: 'Jammu Tawi ↔ Srinagar Vande Bharat' },
          { label: 'Train numbers', value: '26401 / 26402 and 26403 / 26404' },
          { label: 'Frequency', value: 'Six days a week' },
          { label: 'Corridor length', value: 'Approximately 266 km' },
          { label: 'Morning service', value: 'Jammu Tawi dep. ~06:20 → Srinagar arr. ~11:10' },
          { label: 'Return service', value: 'Srinagar dep. ~14:00' },
          { label: 'Extended to Jammu Tawi', value: '2 May 2026' },
        ],
        sources: [
          {
            label: 'PIB — Railway Minister flags off extended Srinagar–Jammu Vande Bharat',
            url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2256632&reg=3&lang=1',
          },
          {
            label: 'News on AIR — commercial operations begin, Katra–Srinagar',
            url: 'https://www.newsonair.gov.in/northern-railway-begins-commercial-operations-of-vande-bharat-trains-between-katra-srinagar',
          },
        ],
      },

      {
        key: 'road',
        label: 'By road',
        time: '15–17h driving, 2 days',
        cost: 'Cheapest per head in a full car',
        verdict:
          'Only if you want your own vehicle in the valley, or the drive itself is part of the trip.',
        body: [
          'The road distance is quoted between roughly 818 and 869 km depending on the route taken, and the driving time works out at 15 to 17 hours before stops. Nobody sensible does that in one day. The normal pattern is an overnight at Jammu or Katra, which is also why this route suits travellers who want to add Vaishno Devi.',
          'The final approach into the valley is the part to plan for. It runs through the Banihal area and the tunnels beneath the Pir Panjal, and it is genuinely spectacular in good conditions. In winter it can be slow, and closures after heavy snow are a real possibility rather than a theoretical one — which is the main argument against committing to road travel on a tight schedule.',
          'Where road travel earns its place is flexibility once you arrive. If you want your own vehicle for a fortnight, or you are travelling as a large group where a tempo traveller is cheaper per head than six air tickets, driving up makes sense. If you simply want to get here, it does not.',
        ],
        facts: [
          { label: 'Road distance', value: '818–869 km depending on route' },
          { label: 'Driving time', value: '15–17 hours before stops' },
          { label: 'Realistic schedule', value: 'Two days with an overnight at Jammu or Katra' },
          { label: 'Final approach', value: 'Banihal and the Pir Panjal tunnels' },
          { label: 'Winter risk', value: 'Closures after heavy snow are genuinely possible' },
        ],
        sources: [
          {
            label: 'Yatra — Delhi to Srinagar distance and driving time',
            url: 'https://www.yatra.com/distance-between/distance-from-delhi-to-srinagar.html',
          },
        ],
      },
    ],

    verifiedOn: '31 August 2026',
    verifiedOnISO: '2026-08-31',

    faqs: [
      {
        q: 'Is there a direct train from Delhi to Srinagar?',
        a: 'No. You change at Jammu Tawi or Katra and take the Vande Bharat into the valley from there. The change is straightforward, but the valley service does not run every day, so check the running days before booking the first leg.',
      },
      {
        q: 'Does the train actually reach Srinagar now?',
        a: 'Yes. The Udhampur–Srinagar–Baramulla line is complete and Vande Bharat services have run into Srinagar since 2025, extended to start from Jammu Tawi on 2 May 2026. Pages telling you to arrange a taxi from Jammu for the final leg are out of date.',
      },
      {
        q: 'How long does it take to drive from Delhi to Srinagar?',
        a: '15 to 17 hours of actual driving across 818–869 km, which realistically means two days with an overnight at Jammu or Katra. Attempting it in one is a bad idea, particularly on the mountain section.',
      },
      {
        q: 'What is the cheapest way to get from Delhi to Srinagar?',
        a: 'Usually the train, though the gap narrows if you catch a low airfare — and it closes entirely once you count a night of accommodation and a day of your holiday. For a full car of four or more, driving competes on cost but not on time.',
      },
      {
        q: 'Which is best if we want to visit Vaishno Devi too?',
        a: 'Rail, comfortably. The corridor runs through Katra, so you can break the journey for the yatra and continue into the valley on the same line. Our 7-night Vaishno Devi and Kashmir itinerary is built around exactly this.',
      },
      {
        q: 'Should we book flights and trains through you?',
        a: 'Only if you want to. We do not mark up rail tickets, so book those through IRCTC yourself. Flights we are happy to quote, but plenty of travellers find their own fare and that is genuinely fine. Send us the arrival time either way, because it determines what Day 1 can contain.',
      },
    ],

    originCitySlug: 'delhi',
  },
];

export function getRoute(slug: string): TransportRoute | undefined {
  return ROUTES.find((r) => r.slug === slug);
}
