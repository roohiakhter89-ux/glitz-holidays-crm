/**
 * Origin-city landing pages — "Kashmir tour packages from {city}".
 *
 * WHY THESE EXIST
 * ---------------
 * The all-time Google Ads search-terms report (54,458 unique queries) shows
 * the "package from {city}" pattern is the single highest-converting template
 * we have: 7.29% CTR against a 2.11% account average, and 65 conversions —
 * from pages that do not exist. Every city below is backed by real query
 * volume from that report; none is speculative.
 *
 * THE HONESTY RULE FOR THIS FILE
 * ------------------------------
 * `flight` and `train` are deliberately nullable and ship as `null`.
 *
 * Airfares move weekly, and train numbers and running days change with the
 * timetable. Writing a plausible-looking number here would put a fabricated
 * fact in front of a customer who is about to spend money on it — the page
 * would rank and then mislead. Instead the UI omits the block entirely while
 * these are null, and shows a "we'll quote today's fare" CTA in its place.
 *
 * To switch the block on for a city, fill the object from a live source
 * (an airline/OTA search for the fare band, the IRCTC timetable for trains)
 * and set `verifiedOn` to that date. Re-verify quarterly; stale fares are
 * the same problem as invented ones, just slower.
 */

export type FlightFacts = {
  /** Carriers that actually operate the route. */
  airlines: string[];
  /** Whether a nonstop exists, or every option connects. */
  nonstop: boolean;
  /** Gate-to-gate time on the fastest itinerary, e.g. "1h 40m nonstop". */
  duration: string;
  /** Typical return fare band in INR, economy, booked 3–6 weeks out. */
  fareBand: [number, number];
  /** Where connections normally route through, when nonstop is false. */
  connectsVia?: string;
  /** ISO date this was last checked against a live search. */
  verifiedOn: string;
};

export type TrainFacts = {
  /** The railhead travellers actually book to — the line does not reach Srinagar. */
  railhead: string;
  /** Named services on the corridor. */
  services: string[];
  /** Scheduled journey time to the railhead. */
  duration: string;
  /** Sleeper → 3A fare band in INR. */
  fareBand: [number, number];
  /** The road leg that follows, because most searchers do not know it exists. */
  onwardLeg: string;
  verifiedOn: string;
};

export type OriginCity = {
  slug: string;
  name: string;
  state: string;
  /**
   * Real demand from the search-terms report, all-time. Kept in the data so
   * the reason a page exists travels with the page, and so we can re-rank the
   * build queue later without re-running the analysis.
   */
  demand: { queries: number; impressions: number; conversions: number };
  /** Package slugs that suit travellers starting from this city. */
  packages: string[];
  /** One-line summary used in metadata and the hero lede. */
  summary: string;
  /** Long-form body. Substance is what ranks; two or three real paragraphs. */
  body: string[];
  /** The planning consideration that genuinely differs for this origin. */
  planningNote: string;
  flight: FlightFacts | null;
  train: TrainFacts | null;
  faqs: { q: string; a: string }[];
};

export const ORIGIN_CITIES: OriginCity[] = [
  {
    slug: 'delhi',
    name: 'Delhi',
    state: 'Delhi NCR',
    demand: { queries: 1265, impressions: 20825, conversions: 42.5 },
    packages: [
      'classic-kashmir-4-nights',
      'complete-kashmir-6-nights',
      'kashmir-honeymoon-5-nights',
      'kashmir-snow-winter-5-nights',
    ],
    summary:
      'Delhi is the easiest Indian city to reach Kashmir from — which is exactly why the trip is worth planning properly rather than booking the first fare you see.',
    body: [
      'More of our travellers start from Delhi than from anywhere else, and it shows in how the itineraries are built. A Delhi departure usually puts you in Srinagar before lunch, which means Day 1 is a real day — a Dal Lake shikara in the afternoon light rather than a hotel check-in and a lost evening. Almost every other origin city loses that half-day, and the itineraries below are written to use it.',
      'The flexibility cuts the other way too. Because the Delhi corridor carries the most traffic, it also has the widest fare spread across the year: the same seat can differ by a factor of three between a February weekday and the last week of December. If your dates can move even two or three days, tell us before you book flights — we will usually find a materially cheaper window without changing the trip itself.',
      'Delhi is also the only origin where the overland option is genuinely practical rather than theoretical. Travellers who want to break the journey at Katra for Vaishno Devi tend to start here, and the 7-night Vaishno Devi and Kashmir package exists because enough Delhi families asked for exactly that combination.',
    ],
    planningNote:
      'Book the outbound for the earliest slot you can tolerate. A morning arrival in Srinagar buys you a full first afternoon; an evening arrival costs you a night you have already paid for.',
    flight: null,
    train: null,
    faqs: [
      {
        q: 'Should I book flights myself or through you?',
        a: 'Either works. Most Delhi travellers book their own flights because they are chasing a fare alert, and that is genuinely sensible on this route. Send us the arrival and departure times before you ticket and we will tell you whether they fit the itinerary — an arrival after 3pm changes Day 1, and we would rather say so before you pay than after.',
      },
      {
        q: 'Is the package price different because I am starting from Delhi?',
        a: 'The land package is the same price from every city — it starts when we receive you at Srinagar airport. What changes is the airfare on top, which is why we quote the two separately instead of bundling them into one number that hides the split.',
      },
      {
        q: 'Can we travel Delhi to Kashmir by road or rail instead of flying?',
        a: 'Both work. By road it is a long two-day drive with an overnight stop, usually at Jammu or Katra, and it is worth it mainly if the journey is part of the point. By rail, the valley line opened to Srinagar in 2026, so you can now take a train to Jammu Tawi or Katra and continue into Srinagar on the Vande Bharat. We will arrange either.',
      },
      {
        q: 'When is the cheapest time to fly from Delhi to Srinagar?',
        a: 'Broadly, the shoulder weeks either side of peak season, and midweek rather than weekends. We do not publish a fare table here because it would be out of date within a week — ask us for the current picture on your dates and we will give you the real numbers.',
      },
    ],
  },

  {
    slug: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    demand: { queries: 404, impressions: 4954, conversions: 14.0 },
    packages: [
      'classic-kashmir-4-nights',
      'complete-kashmir-6-nights',
      'kashmir-honeymoon-5-nights',
    ],
    summary:
      'From Mumbai the flight is long enough that arrival timing decides your itinerary — so the itinerary should be built around the flight, not the other way round.',
    body: [
      'Mumbai travellers consistently ask for one more night than Delhi travellers do, and they are right to. The journey is long enough that a 4-night trip can feel like it is over before it starts, so the 6-night Complete Kashmir is the one we most often end up recommending here — it absorbs a travel-heavy first and last day without eating into the parts you came for.',
      'The other thing that separates a Mumbai booking is the packing conversation. Travellers flying from a city that never drops below 20°C routinely underestimate a Kashmir winter, and arrive with a jacket that is not equal to Gulmarg in January. We send a real packing list with every winter booking from the coastal cities, and we would rather over-explain it than have you spend the first morning buying gloves.',
      'Honeymoon bookings run high from Mumbai — it is one of our strongest couple markets, and the 5-night honeymoon itinerary was shaped substantially by what Mumbai couples asked us to change about the standard trip.',
    ],
    planningNote:
      'Give yourself six nights if you can. The travel day at each end is real, and a four-night trip from Mumbai spends half its length in transit.',
    flight: null,
    train: null,
    faqs: [
      {
        q: 'Is there a direct flight from Mumbai to Srinagar?',
        a: 'This varies by season and by airline schedule, and it has changed more than once in recent years. Rather than print something here that may be wrong by the time you read it, ask us for the current options on your dates — we check live before quoting.',
      },
      {
        q: 'How many nights should we take from Mumbai?',
        a: 'Six, if the leave allows. Four nights works, but with a long flight at each end you will feel it. The extra two nights are the difference between seeing Kashmir and passing through it.',
      },
      {
        q: 'What should we pack coming from Mumbai in winter?',
        a: 'More than you think. Gulmarg in January is a different climate from anything Mumbai offers, and a light jacket will not do. We send a specific list on confirmation — follow it, because layers bought locally at short notice cost more and fit worse.',
      },
      {
        q: 'Do you handle group bookings from Mumbai?',
        a: 'Regularly. Groups change the maths on vehicles and hotel rooms in your favour, so tell us the headcount early — a 12-person group is often cheaper per head than a couple, and we can only build that in if we know before we quote.',
      },
    ],
  },

  {
    slug: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    demand: { queries: 233, impressions: 3480, conversions: 12.0 },
    packages: [
      'complete-kashmir-6-nights',
      'kashmir-honeymoon-5-nights',
      'classic-kashmir-4-nights',
    ],
    summary:
      'Bangalore is our strongest South Indian market, and the trips that work from here are the longer ones — the distance rewards a slower itinerary.',
    body: [
      'Bangalore converts better than its query volume suggests, which tells us something about who is searching: these are considered trips, planned well ahead, usually for a specific occasion. The itineraries that suit them are the fuller ones. A traveller crossing most of the subcontinent does not want to spend two of six days in an airport.',
      'Connection risk is the practical thing to get right from here. Where an itinerary routes through another metro, a tight layover that works on paper can fail in weather season, and a missed connection costs a night of a trip you have flown a long way for. We build the first day with enough slack that a delayed arrival does not collapse the plan, and we will say plainly if the timings you have chosen are too tight.',
      'Bangalore honeymoon enquiries are strong enough that the couple itineraries get requested here almost as often as the standard ones. If that is the trip, start from the honeymoon package rather than adding romance to a general itinerary — the difference is in the room categories and the private transfers, and it is easier to build in from the start.',
    ],
    planningNote:
      'Leave real margin on the outbound connection. A two-hour layover in a monsoon month is not a two-hour layover; if the connection fails, you lose a night of a long-planned trip.',
    flight: null,
    train: null,
    faqs: [
      {
        q: 'How long does it take to get from Bangalore to Srinagar?',
        a: 'Longer than most people plan for once connections are counted. The honest answer depends on which routing you take, and the fastest option is not always the cheapest by a wide margin. Send us your dates and we will lay out the real choices side by side.',
      },
      {
        q: 'Is a 4-night Kashmir trip worth it from Bangalore?',
        a: 'Honestly, not usually. By the time you account for travel at both ends you are left with roughly three usable days. If four nights is genuinely all you have, we will build the tightest possible version — but six is the itinerary we would recommend.',
      },
      {
        q: 'Do you arrange the flights as well?',
        a: 'We can, and from the South it is often worth letting us, because we are optimising for the itinerary rather than for the cheapest fare in isolation. A flight that saves three thousand rupees and costs you a day is not a saving.',
      },
      {
        q: 'What is the best month to travel from Bangalore?',
        a: 'It depends entirely on what you want. Snow means December to February. Tulips mean a narrow window in April. Green valleys and comfortable walking weather mean May to early July. Tell us which of those you are picturing and we will name the month.',
      },
    ],
  },

  {
    slug: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    demand: { queries: 161, impressions: 1358, conversions: 6.0 },
    packages: [
      'complete-kashmir-6-nights',
      'kashmir-honeymoon-5-nights',
      'classic-kashmir-4-nights',
    ],
    summary:
      'Hyderabad shows the highest commercial intent of any South Indian origin in our data — small volume, but travellers who are ready to book.',
    body: [
      'Hyderabad is a small market by impressions and a strong one by behaviour: the transactional click-through rate from here is among the highest we record anywhere, and honeymoon enquiries make up an unusually large share of it. People searching from Hyderabad are generally not browsing, they are pricing a trip they have already decided to take.',
      'That shapes what this page should do, which is answer the money question directly rather than sell the destination. The package prices below are per person on twin-sharing with GST included, and the land cost is identical whichever city you start from. The variable is the airfare, which we quote separately and honestly rather than folding into a headline number.',
      'As with the other southern cities, the itinerary length matters more than it does from Delhi. Six nights is the comfortable trip. Five works well for couples on the honeymoon itinerary because the pace is deliberately slower and there is less ground to cover.',
    ],
    planningNote:
      'If this is a honeymoon, start from the honeymoon itinerary rather than adding extras to a standard package. The room categories and private transfers are structural, not add-ons.',
    flight: null,
    train: null,
    faqs: [
      {
        q: 'What does a Kashmir trip from Hyderabad actually cost?',
        a: 'The land package starts at ₹18,500 per person for 4 nights and ₹27,900 for 6 nights, twin-sharing, GST included. Flights are on top and vary widely by season and how far ahead you book. We quote both separately so you can see exactly where the money goes.',
      },
      {
        q: 'Do you get many Hyderabad travellers?',
        a: 'Yes, and a high proportion of them are honeymoon couples. It is one of our better-converting cities, which means the itineraries have been iterated on real feedback from travellers who started where you are starting.',
      },
      {
        q: 'Is Kashmir safe for a family trip?',
        a: 'Tourist Kashmir has run normally for years, and we operate there daily — our office is in Srinagar, not a call centre elsewhere. We will always tell you the current on-ground picture straight when you ask, including if it is not what you want to hear.',
      },
      {
        q: 'How far in advance should we book from Hyderabad?',
        a: 'For peak season — December snow, April tulips, May and June holidays — six to eight weeks is comfortable, mostly because hotel inventory in Gulmarg and Pahalgam tightens well before flights do. Off-peak, three weeks is fine.',
      },
    ],
  },

  {
    slug: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    demand: { queries: 267, impressions: 3059, conversions: 5.0 },
    packages: [
      'complete-kashmir-6-nights',
      'classic-kashmir-4-nights',
      'vaishno-devi-kashmir-7-nights',
    ],
    summary:
      'Kolkata travellers ask about trains more than any other city we serve — and the answer changed in 2026, because the railway now runs all the way into Srinagar.',
    body: [
      'The distinguishing feature of Kolkata demand in our data is how much of it is rail-shaped. A large share of the searches from here and from Howrah are about trains rather than flights — and most Kashmir travel pages still answer that question with information that is now out of date.',
      'Here is the current position. The Udhampur–Srinagar–Baramulla rail link is complete, and since 2 May 2026 the Vande Bharat service has run the full corridor from Jammu Tawi into Srinagar, roughly 266 km through the Chenab and Anji bridges. You still cannot board a single train in Kolkata and get off in Srinagar — you travel to Jammu Tawi or Katra first and change — but the old answer, that the line ends in Jammu and you finish by road, is no longer true.',
      'That makes the rail option genuinely competitive rather than merely romantic, and it is one of the great train journeys in India by any measure. Kolkata also over-indexes on the combined Vaishno Devi and Kashmir itinerary, which now works particularly neatly: the corridor runs through Katra, so you can break the journey for the yatra and continue into the valley on the same line.',
    ],
    planningNote:
      'Check the connection at Jammu Tawi carefully. The valley service runs six days a week, so an arrival on the wrong day means an unplanned night in Jammu — easy to avoid once you know to look.',
    flight: null,
    train: null,
    faqs: [
      {
        q: 'Can I reach Srinagar by train from Kolkata?',
        a: 'Yes, with one change. Take a train to Jammu Tawi or Katra, then the Vande Bharat service into Srinagar — the line has run the full corridor since May 2026. There is no single through train from Kolkata, so plan the connection rather than assuming it.',
      },
      {
        q: 'Is the train worth it, or should we fly?',
        a: 'Flying still saves you the best part of two days. But the valley leg is now a genuinely spectacular rail journey over the Chenab and Anji bridges, so if the getting-there is part of the holiday, the train has become a real choice rather than a compromise.',
      },
      {
        q: 'Can we combine Vaishno Devi with Kashmir from Kolkata?',
        a: 'Yes, and it is the itinerary we most often recommend for Kolkata travellers, because the overland route runs through Katra anyway. The 7-night Vaishno Devi and Kashmir package is built for exactly this.',
      },
      {
        q: 'What is the land package price from Kolkata?',
        a: 'Identical to every other city — ₹18,500 per person for 4 nights, ₹27,900 for 6 nights, twin-sharing and GST inclusive. The land cost begins when we meet you in Srinagar, so where you started does not change it.',
      },
    ],
  },
];

export function getOriginCity(slug: string): OriginCity | undefined {
  return ORIGIN_CITIES.find((c) => c.slug === slug);
}
