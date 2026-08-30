/**
 * Transport route pages — "{origin} to {destination} by {mode}".
 *
 * WHY THESE EXIST
 * ---------------
 * The all-time search-terms report shows 209 origin×destination×mode
 * combinations carrying three or more distinct real queries, and the cluster
 * converts: `delhi to srinagar train` alone produced 6.5 conversions at 8.75%
 * CTR. Someone pricing a train is already going.
 *
 * THE HONESTY RULE FOR THIS FILE
 * ------------------------------
 * Every hard fact carries `verifiedOn` and a source. Timetables, fares and
 * running days change, and a transport page that is confidently wrong is
 * worse than no page — people miss trains on the strength of them.
 *
 * Anything not verified is simply absent rather than estimated. Re-check the
 * dated facts quarterly; the valley corridor in particular is new and its
 * schedule is still settling.
 */

export type RouteFact = {
  label: string;
  value: string;
};

export type TransportRoute = {
  slug: string;
  origin: string;
  destination: string;
  mode: 'train' | 'flight' | 'road';
  modeLabel: string;
  h1: string;
  seoTitle: string;
  metaDescription: string;
  lede: string;
  /** Evidence from the search-terms report, all-time. */
  demand: { queries: number; impressions: number; conversions: number };
  /** The correction this page exists to make, if the common answer is wrong. */
  headline?: { title: string; body: string };
  body: string[];
  /** Verified hard facts rendered as a spec table. */
  facts: RouteFact[];
  verifiedOn: string;
  sources: { label: string; url: string }[];
  /** Honest comparison against the alternatives. */
  alternatives: { mode: string; verdict: string }[];
  faqs: { q: string; a: string }[];
  /** Origin-city page to link into, when one exists. */
  originCitySlug?: string;
};

export const ROUTES: TransportRoute[] = [
  {
    slug: 'delhi-to-srinagar-train',
    origin: 'Delhi',
    destination: 'Srinagar',
    mode: 'train',
    modeLabel: 'by Train',
    h1: 'Delhi to Srinagar by train',
    seoTitle: 'Delhi to Srinagar by Train — Route, Timings & How the New Line Works',
    metaDescription:
      'How to travel Delhi to Srinagar by train now that the valley rail line is open. The Jammu Tawi–Srinagar Vande Bharat, where you change, and whether the train beats flying.',
    lede:
      'The answer to this question changed in 2026, and most travel pages still have the old one. The railway now runs all the way into Srinagar.',
    demand: { queries: 62, impressions: 1552, conversions: 8.5 },
    headline: {
      title: 'The old answer is out of date',
      body: 'For decades the correct answer was "the train stops in Jammu and you finish by road." That is no longer true. The Udhampur–Srinagar–Baramulla rail link is complete, and Vande Bharat services now run the full corridor into Srinagar. If a page tells you to book a taxi from Jammu Tawi for the final leg, it was written before May 2026.',
    },
    body: [
      'There is still no single train from Delhi to Srinagar. What exists now is a clean two-leg journey: a Delhi service to Jammu Tawi or Katra, then the Vande Bharat through the mountains into Srinagar. The second leg is the new part, and it is the one worth planning around, because it runs six days a week rather than daily.',
      'That valley leg is also the reason to consider the train at all. It crosses the Chenab bridge and the Anji bridge, and it is a genuinely extraordinary piece of railway — the kind of journey people travel for rather than merely endure. Where the old road leg was something to be survived, this is arguably the best part of getting here.',
      'None of which makes it faster than flying. A flight from Delhi puts you in Srinagar in time for lunch on the same day; the rail journey is an overnight plus a morning. Choose the train because you want the journey, or because you are breaking it at Katra for Vaishno Devi, which the corridor now makes unusually easy. Do not choose it to save time, because it will not.',
    ],
    facts: [
      { label: 'Through train Delhi to Srinagar', value: 'None — change at Jammu Tawi or Katra' },
      { label: 'Valley leg', value: 'Jammu Tawi ↔ Srinagar Vande Bharat' },
      { label: 'Train numbers', value: '26401 / 26402 and 26403 / 26404' },
      { label: 'Frequency', value: 'Six days a week' },
      { label: 'Corridor length', value: 'Approximately 266 km' },
      { label: 'Morning service', value: 'Jammu Tawi dep. ~06:20 → Srinagar arr. ~11:10' },
      { label: 'Return service', value: 'Srinagar dep. ~14:00' },
      { label: 'Service extended to Jammu Tawi', value: '2 May 2026' },
    ],
    verifiedOn: '31 August 2026',
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
    alternatives: [
      {
        mode: 'By air',
        verdict:
          'Fastest by a wide margin — Delhi to Srinagar is a short hop and you land in time to use the afternoon. Choose this if the trip is short or the leave is tight.',
      },
      {
        mode: 'By road',
        verdict:
          'Two days with an overnight at Jammu or Katra. Worth it only if the drive is part of the point, or if you want the flexibility of your own vehicle in the valley.',
      },
      {
        mode: 'By rail',
        verdict:
          'Slower than flying, and now genuinely spectacular. Best if you are breaking the journey at Katra, or if the railway itself is something you want to experience.',
      },
    ],
    faqs: [
      {
        q: 'Is there a direct train from Delhi to Srinagar?',
        a: 'No. You change at Jammu Tawi or Katra and take the Vande Bharat into the valley from there. The change is straightforward, but the valley service does not run every day, so check the running days before you book the first leg.',
      },
      {
        q: 'Does the train actually reach Srinagar now?',
        a: 'Yes. The Udhampur–Srinagar–Baramulla line is complete and Vande Bharat services have run into Srinagar since 2025, extended to start from Jammu Tawi on 2 May 2026. Pages telling you to arrange a taxi from Jammu for the last leg are out of date.',
      },
      {
        q: 'How long does the valley leg take?',
        a: 'The morning service leaves Jammu Tawi around 06:20 and reaches Srinagar around 11:10, so a little under five hours for roughly 266 km. The return departs Srinagar around 14:00.',
      },
      {
        q: 'Is the train cheaper than flying?',
        a: 'Usually, though the gap narrows if you catch a low airfare. The bigger difference is time: the train costs you the best part of a day in each direction. On a short trip that is expensive in a way the ticket price does not show.',
      },
      {
        q: 'Can we stop at Vaishno Devi on the way?',
        a: 'Yes, and this is now one of the best reasons to take the train. The corridor runs through Katra, so you can break the journey for the yatra and continue into the valley on the same line. Our 7-night Vaishno Devi and Kashmir itinerary is built around exactly this.',
      },
      {
        q: 'Should we book the train ourselves?',
        a: 'Book it yourself through IRCTC if you are comfortable doing so — we do not mark up rail tickets and there is no advantage to routing it through us. Tell us your arrival time and we will have someone at Srinagar station.',
      },
    ],
    originCitySlug: 'delhi',
  },
];

export function getRoute(slug: string): TransportRoute | undefined {
  return ROUTES.find((r) => r.slug === slug);
}
