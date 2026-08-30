import type { Tone } from './destinations';

/**
 * Tour packages — the "spoke" pages in our hub-and-spoke SEO model, and the
 * highest-intent surface on the site. Every one carries a day-by-day
 * itinerary, honest inclusions/exclusions and FAQs, because thin price-list
 * pages do not rank and do not convert.
 *
 * Prices are per-person on twin-sharing, the convention every Indian traveller
 * already expects. They are starting points, not quotes.
 */

export type Pkg = {
  slug: string;
  name: string;
  /** Destination slug this package belongs to. */
  destination: string;
  destinationName: string;
  nights: number;
  days: number;
  priceFrom: number;
  /** Travel-style slugs this package suits. Drives /travel-styles pages. */
  styles: string[];
  summary: string;
  /** Cities in order — rendered as the route ribbon. */
  route: string[];
  bestMonths: string;
  idealFor: string;
  itinerary: {
    day: number;
    title: string;
    body: string;
    stay?: string;
    meals?: string;
  }[];
  inclusions: string[];
  exclusions: string[];
  faqs: { q: string; a: string }[];
  tone: Tone;
  /** Surfaces on the home page and the packages index as a featured card. */
  featured?: boolean;
};

const STD_INCLUSIONS_KASHMIR = [
  'All accommodation on twin-sharing in hand-picked 3★/4★ hotels',
  'Daily breakfast and dinner (MAP plan)',
  'Private air-conditioned vehicle for all transfers and sightseeing',
  'All toll, parking, driver allowance and fuel',
  'Airport pickup and drop at Srinagar (SXR)',
  'Dedicated trip coordinator on WhatsApp for the full journey',
  'All applicable taxes and GST',
];

const STD_EXCLUSIONS = [
  'Airfare or train fare to and from the destination',
  'Lunch and any meals not specified in the inclusions',
  'Entry tickets to monuments, gardens and parks',
  'Pony rides, gondola tickets, sledging and adventure activities',
  'Union taxi charges inside Gulmarg, Sonmarg, Pahalgam (state-regulated)',
  'Personal expenses — laundry, tips, telephone, room service',
  'Anything not explicitly listed under inclusions',
];

export const PACKAGES: Pkg[] = [
  // ─────────────────────────────────────────────── KASHMIR
  {
    slug: 'classic-kashmir-4-nights',
    name: 'Classic Kashmir',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    nights: 4,
    days: 5,
    priceFrom: 18500,
    styles: ['family', 'first-timers'],
    summary:
      'The valley in its essential form — Srinagar, Gulmarg and Pahalgam, one houseboat night, and no day that starts before you want it to.',
    route: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Srinagar'],
    bestMonths: 'Apr–Jun · Sep–Oct',
    idealFor: 'First-time visitors and families who want the highlights without a punishing pace',
    itinerary: [
      {
        day: 1,
        title: 'Arrive Srinagar · Dal Lake and the Mughal gardens',
        body: 'Met at Srinagar airport and driven to your hotel on the Boulevard. Afternoon at the Mughal gardens — Nishat and Shalimar, laid out by Shah Jahan\'s court along the lake. Sunset shikara ride through the floating vegetable market, which is a real working market, not a performance for tourists.',
        stay: 'Hotel in Srinagar',
        meals: 'Dinner',
      },
      {
        day: 2,
        title: 'Gulmarg · gondola to Apharwat',
        body: 'Drive to Gulmarg (about two hours) through rice terraces and willow groves. The gondola climbs to Kongdoori on Phase 1 and to the Apharwat ridge at 3,979 m on Phase 2 — snow at the top even in June. Afternoon back to Srinagar.',
        stay: 'Hotel in Srinagar',
        meals: 'Breakfast, dinner',
      },
      {
        day: 3,
        title: 'Pahalgam · Betaab and Aru valleys',
        body: 'Two and a half hours south along the Lidder to Pahalgam, stopping at the saffron fields of Pampore and a cricket-bat workshop on the way. Local taxis run up to Betaab Valley, Aru and Chandanwari — the drive itself is the attraction.',
        stay: 'Hotel in Pahalgam',
        meals: 'Breakfast, dinner',
      },
      {
        day: 4,
        title: 'Return to Srinagar · a night on the water',
        body: 'Unhurried morning in Pahalgam, then back to Srinagar by afternoon. Tonight is on a deluxe houseboat — carved walnut interiors, a verandah on the water, and the lake going quiet after dark. Optional Wazwan dinner arranged on request.',
        stay: 'Deluxe houseboat, Dal Lake',
        meals: 'Breakfast, dinner',
      },
      {
        day: 5,
        title: 'Old City walk · departure',
        body: 'If your flight allows, a short walk through the Old City — Jamia Masjid, the shawl and papier-mâché workshops around Zaina Kadal. Airport drop with time to spare.',
        meals: 'Breakfast',
      },
    ],
    inclusions: STD_INCLUSIONS_KASHMIR,
    exclusions: STD_EXCLUSIONS,
    faqs: [
      {
        q: 'Is four nights enough for Kashmir?',
        a: 'It covers Srinagar, Gulmarg and Pahalgam comfortably. It does not include Sonmarg — for that you want six nights. If Sonmarg matters to you, look at our Complete Kashmir itinerary instead.',
      },
      {
        q: 'Why is the gondola not included in the price?',
        a: 'Gondola tickets are sold by the state cable-car corporation at a fixed rate that changes seasonally, and Phase 2 availability varies daily. We pre-book where possible and you pay the actual fare, so nobody is paying a padded markup.',
      },
      {
        q: 'Can we swap the houseboat night for a hotel?',
        a: 'Yes, at no extra cost. Some guests prefer all four nights on land. Tell us at booking and we adjust.',
      },
    ],
    tone: 'kashmir',
    featured: true,
  },

  {
    slug: 'complete-kashmir-6-nights',
    name: 'Complete Kashmir',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    nights: 6,
    days: 7,
    priceFrom: 27900,
    styles: ['family', 'group', 'first-timers'],
    summary:
      'The valley without compromise — all four regions, a night in Gulmarg and a night in Pahalgam, and a free day to do nothing at all.',
    route: ['Srinagar', 'Sonmarg', 'Gulmarg', 'Pahalgam', 'Srinagar'],
    bestMonths: 'Apr–Jun · Sep–Oct',
    idealFor: 'Travellers who would rather see one place properly than four places briefly',
    itinerary: [
      {
        day: 1,
        title: 'Arrive Srinagar · the lake at dusk',
        body: 'Airport pickup and check-in. Easy first evening — the Boulevard, a shikara at sunset, dinner at the hotel. Nothing scheduled, because you have just flown.',
        stay: 'Hotel in Srinagar',
        meals: 'Dinner',
      },
      {
        day: 2,
        title: 'Srinagar · gardens, Old City, Shankaracharya',
        body: 'A full Srinagar day. Nishat and Shalimar in the morning, then the Old City — Jamia Masjid with its 378 deodar pillars, the shrine of Shah-e-Hamdan. Sunset from Shankaracharya Hill, which sits 1,000 feet above the city.',
        stay: 'Hotel in Srinagar',
        meals: 'Breakfast, dinner',
      },
      {
        day: 3,
        title: 'Sonmarg · Thajiwas glacier',
        body: 'Three hours north-east along the Sindh river to Sonmarg, the meadow of gold. Ponies run up to the Thajiwas glacier — a genuinely alpine landscape at 3,000 m. Return to Srinagar by evening.',
        stay: 'Hotel in Srinagar',
        meals: 'Breakfast, dinner',
      },
      {
        day: 4,
        title: 'Gulmarg · overnight in the meadow',
        body: 'Drive up to Gulmarg and stay the night, which most itineraries skip and which changes the place entirely. Gondola Phase 1 and 2 in the afternoon. Come evening, the day-trippers leave and the meadow belongs to you.',
        stay: 'Hotel in Gulmarg',
        meals: 'Breakfast, dinner',
      },
      {
        day: 5,
        title: 'Pahalgam via Pampore',
        body: 'Cross-valley drive to Pahalgam, stopping at the Pampore saffron fields — in October you can watch the harvest. Afternoon in the Lidder valley, evening walk along the river.',
        stay: 'Hotel in Pahalgam',
        meals: 'Breakfast, dinner',
      },
      {
        day: 6,
        title: 'Aru and Betaab · back to a houseboat',
        body: 'Morning run up to Aru and Betaab valleys before the crowds, then return to Srinagar. Final night on a deluxe houseboat with a Wazwan dinner if you want it.',
        stay: 'Deluxe houseboat, Dal Lake',
        meals: 'Breakfast, dinner',
      },
      {
        day: 7,
        title: 'Departure',
        body: 'Breakfast on the water, last-minute shopping for pashmina or saffron if time allows, and an airport drop.',
        meals: 'Breakfast',
      },
    ],
    inclusions: STD_INCLUSIONS_KASHMIR,
    exclusions: STD_EXCLUSIONS,
    faqs: [
      {
        q: 'What does staying overnight in Gulmarg add?',
        a: 'Gulmarg empties out after 5pm when the day-trip buses leave. You get the meadow at dusk and dawn, a much better shot at Phase 2 gondola tickets the next morning, and you skip two hours of driving.',
      },
      {
        q: 'Is Sonmarg worth a full day?',
        a: 'Yes. It is the most genuinely alpine part of the valley and the drive along the Sindh is beautiful in itself. Squeezing it into a half-day is why so many visitors come back unimpressed.',
      },
      {
        q: 'Can we add Doodhpathri or Yusmarg?',
        a: 'Absolutely — both are day trips from Srinagar and neither sees many tourists. Add a night and we will build one in.',
      },
    ],
    tone: 'kashmir',
    featured: true,
  },

  {
    slug: 'kashmir-honeymoon-5-nights',
    name: 'Kashmir Honeymoon',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    nights: 5,
    days: 6,
    priceFrom: 32500,
    styles: ['honeymoon'],
    summary:
      'Quieter valleys, better rooms, a candlelit dinner on the water — the same Kashmir, arranged for two.',
    route: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Srinagar'],
    bestMonths: 'Apr–Jun · Sep–Oct',
    idealFor: 'Couples who want privacy, good rooms and nothing that feels like a group tour',
    itinerary: [
      {
        day: 1,
        title: 'Arrive Srinagar · private shikara at golden hour',
        body: 'Airport pickup, flowers and a room upgrade where the hotel allows. Late-afternoon private shikara — just the two of you and the boatman — through the lotus channels behind Nehru Park.',
        stay: 'Premium hotel, Srinagar',
        meals: 'Dinner',
      },
      {
        day: 2,
        title: 'Gulmarg · gondola and the meadow',
        body: 'Up to Gulmarg for the night. Gondola to Apharwat, then a walk out to the far side of the meadow where the day crowds do not reach. Dinner at the hotel.',
        stay: 'Premium hotel, Gulmarg',
        meals: 'Breakfast, dinner',
      },
      {
        day: 3,
        title: 'Pahalgam · the Lidder valley',
        body: 'Scenic drive to Pahalgam with a saffron-field stop. Afternoon in Betaab and Aru, then an evening walk along the river. Pahalgam after dark is very quiet, which is the point.',
        stay: 'Premium hotel, Pahalgam',
        meals: 'Breakfast, dinner',
      },
      {
        day: 4,
        title: 'A slow day in Pahalgam',
        body: 'Deliberately unscheduled. Ride up to Chandanwari, walk the pine trails, or stay in with the mountains through the window. Optional in-room spa treatment on request.',
        stay: 'Premium hotel, Pahalgam',
        meals: 'Breakfast, dinner',
      },
      {
        day: 5,
        title: 'Houseboat night · candlelit dinner on the water',
        body: 'Back to Srinagar and onto a premium houseboat. Private candlelit dinner served on the verandah, cake arranged, lake going still around you.',
        stay: 'Premium houseboat, Dal Lake',
        meals: 'Breakfast, dinner',
      },
      {
        day: 6,
        title: 'Departure',
        body: 'Unhurried breakfast, time for pashmina shopping with a trusted dealer if you want it, and an airport drop.',
        meals: 'Breakfast',
      },
    ],
    inclusions: [
      ...STD_INCLUSIONS_KASHMIR.slice(0, 5),
      'Flower decoration on arrival and a celebration cake',
      'One private candlelit dinner on the houseboat verandah',
      'Private shikara ride (not shared)',
      'Dedicated trip coordinator on WhatsApp for the full journey',
      'All applicable taxes and GST',
    ],
    exclusions: STD_EXCLUSIONS,
    faqs: [
      {
        q: 'How is this different from the Classic Kashmir package?',
        a: 'Better room categories throughout, overnight stays in Gulmarg and Pahalgam instead of day trips, a private rather than shared shikara, a slow day built into Pahalgam, and the candlelit dinner. The route is similar; the pace and the rooms are not.',
      },
      {
        q: 'Do you need our wedding date or proof?',
        a: 'No proof needed. Just tell us it is a honeymoon at booking and we will pass the note to the hotels — most will do something on their own initiative.',
      },
      {
        q: 'Can we extend with Sonmarg or a Ladakh leg?',
        a: 'Yes to both. Sonmarg adds a night from Srinagar. Ladakh needs at least four more nights and is best from June to September.',
      },
    ],
    tone: 'kashmir',
  },

  {
    slug: 'kashmir-snow-winter-5-nights',
    name: 'Kashmir in Snow',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    nights: 5,
    days: 6,
    priceFrom: 26500,
    styles: ['family', 'adventure'],
    summary:
      'December to February, when the valley goes white and Gulmarg turns into one of Asia\'s great ski mountains.',
    route: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Srinagar'],
    bestMonths: 'Dec–Feb',
    idealFor: 'Guests who came for snow and will not settle for a patch of it on a hilltop',
    itinerary: [
      {
        day: 1,
        title: 'Arrive Srinagar · the lake in winter',
        body: 'Airport pickup. Winter Srinagar is a different city — mist on the water, chinar branches bare, kangris under every pheran. Shikara ride if the weather is kind, hotel and a heated room if it is not.',
        stay: 'Hotel in Srinagar',
        meals: 'Dinner',
      },
      {
        day: 2,
        title: 'To Gulmarg · into the snow',
        body: 'Drive up to Gulmarg, which from late December is under a metre or more of snow. Snow gear rental arranged on arrival. Afternoon sledging and a walk into the meadow.',
        stay: 'Hotel in Gulmarg',
        meals: 'Breakfast, dinner',
      },
      {
        day: 3,
        title: 'Gulmarg · gondola and ski slopes',
        body: 'Gondola Phase 1 to Kongdoori and Phase 2 to Apharwat at 3,979 m, weather permitting. Beginner ski lessons can be arranged with certified local instructors — Gulmarg has some of the best powder in Asia.',
        stay: 'Hotel in Gulmarg',
        meals: 'Breakfast, dinner',
      },
      {
        day: 4,
        title: 'Pahalgam · a quieter white',
        body: 'Down from Gulmarg and across the valley to Pahalgam. Less snow than Gulmarg but far fewer people, and the Lidder still runs clear between white banks.',
        stay: 'Hotel in Pahalgam',
        meals: 'Breakfast, dinner',
      },
      {
        day: 5,
        title: 'Back to Srinagar · Old City and crafts',
        body: 'Return to Srinagar. Old City in winter, a shawl workshop where you can watch kani weaving, and hot noon-chai somewhere warm.',
        stay: 'Hotel in Srinagar',
        meals: 'Breakfast, dinner',
      },
      {
        day: 6,
        title: 'Departure',
        body: 'Breakfast and airport drop, with a buffer built in — winter flights out of Srinagar can shift with the weather.',
        meals: 'Breakfast',
      },
    ],
    inclusions: [
      ...STD_INCLUSIONS_KASHMIR,
      'Heated rooms at every property',
      'Snow-chain-equipped vehicles with experienced winter drivers',
    ],
    exclusions: [
      ...STD_EXCLUSIONS,
      'Ski equipment rental and instructor fees',
      'Snow-boot and jacket rental in Gulmarg',
    ],
    faqs: [
      {
        q: 'Is snow guaranteed?',
        a: 'Nothing weather-related is ever guaranteed, but Gulmarg has reliable snow cover from late December through February in a normal year. If you book for early December or March you are gambling — we will tell you so rather than take the booking quietly.',
      },
      {
        q: 'What happens if the Srinagar–Gulmarg road closes?',
        a: 'It occasionally shuts for a few hours during heavy snowfall while it is cleared. Our drivers know the conditions and we build buffer into the itinerary. If a full day is lost we rework the plan rather than cancelling on you.',
      },
      {
        q: 'Can beginners ski at Gulmarg?',
        a: 'Yes. The Kongdoori bowl above Phase 1 has gentle beginner terrain and certified instructors. Phase 2 and the Apharwat descents are for experienced skiers only.',
      },
      {
        q: 'How cold does it get?',
        a: 'Srinagar sits around -2°C to 8°C in January. Gulmarg runs -8°C to 4°C. Every hotel we use has heating; layers and a proper jacket are essential.',
      },
    ],
    tone: 'kashmir',
  },

  // ─────────────────────────────────────────────── LADAKH
  {
    slug: 'ladakh-leh-nubra-pangong-6-nights',
    name: 'Leh, Nubra & Pangong',
    destination: 'ladakh',
    destinationName: 'Ladakh',
    nights: 6,
    days: 7,
    priceFrom: 38500,
    styles: ['adventure', 'group', 'first-timers'],
    summary:
      'The essential Ladakh circuit, paced so the altitude does not decide how your trip goes. Rest day first. Passes later.',
    route: ['Leh', 'Nubra', 'Pangong', 'Leh'],
    bestMonths: 'May–Sep',
    idealFor: 'First-time Ladakh travellers who want the classic route done safely',
    itinerary: [
      {
        day: 1,
        title: 'Fly into Leh · complete rest',
        body: 'Met at Leh airport and driven straight to the hotel. Today is a full rest day and we mean it — no sightseeing, no walking uphill, plenty of water, an early night. This one decision is the difference between a good Ladakh trip and a miserable one.',
        stay: 'Hotel in Leh',
        meals: 'Dinner',
      },
      {
        day: 2,
        title: 'Leh valley · gentle acclimatisation',
        body: 'Low-altitude sightseeing inside the valley. Shey Palace, Thiksey Monastery on its hill, Hemis, and the Sindhu Ghat. Back by mid-afternoon. Oximeter check before dinner.',
        stay: 'Hotel in Leh',
        meals: 'Breakfast, dinner',
      },
      {
        day: 3,
        title: 'Khardung La · into Nubra',
        body: 'Over Khardung La at 18,380 ft — brief stop only, altitude is not a place to linger — and down into the Nubra valley. Diskit Monastery and its 32-metre Maitreya Buddha, then Bactrian camels on the Hunder dunes at sunset.',
        stay: 'Camp or hotel in Nubra',
        meals: 'Breakfast, dinner',
      },
      {
        day: 4,
        title: 'Nubra to Pangong via Shyok',
        body: 'The Shyok river road east to Pangong Tso — rough, remote and one of the great drives in India. First sight of the lake in the afternoon, when the water runs through every blue there is.',
        stay: 'Lakeside camp, Pangong',
        meals: 'Breakfast, dinner',
      },
      {
        day: 5,
        title: 'Pangong sunrise · return to Leh',
        body: 'Up early for sunrise over the lake, which is worth the cold. Then back to Leh over Chang La at 17,590 ft, with a stop at Thiksey if you want a second look.',
        stay: 'Hotel in Leh',
        meals: 'Breakfast, dinner',
      },
      {
        day: 6,
        title: 'Sham valley · Magnetic Hill and Sangam',
        body: 'West from Leh — Hall of Fame, Gurudwara Pathar Sahib, Magnetic Hill, and the Sangam where the Indus and Zanskar meet in two visibly different colours. Free evening in Leh market.',
        stay: 'Hotel in Leh',
        meals: 'Breakfast, dinner',
      },
      {
        day: 7,
        title: 'Departure',
        body: 'Early airport drop — Leh flights leave in the morning before the wind picks up.',
        meals: 'Breakfast',
      },
    ],
    inclusions: [
      'All accommodation on twin-sharing — hotels in Leh, camps in Nubra and Pangong',
      'Daily breakfast and dinner',
      'Private vehicle with an experienced high-altitude driver',
      'All Inner Line Permits and wildlife fees',
      'Oxygen cylinder in every vehicle, plus twice-daily oximeter checks',
      'Airport transfers at Leh',
      'Dedicated trip coordinator on WhatsApp for the full journey',
      'All applicable taxes and GST',
    ],
    exclusions: [
      'Airfare to and from Leh',
      'Lunch throughout the trip',
      'Monastery entry fees',
      'Any adventure activity — rafting, biking, quad rides',
      'Personal expenses, tips and medical costs',
      'Anything not explicitly listed under inclusions',
    ],
    faqs: [
      {
        q: 'Why is the first day a rest day? It feels like a wasted day.',
        a: 'Leh sits at 3,500 m and you arrive by air, which means no gradual ascent. Altitude sickness typically hits 12 to 24 hours after arrival. Guests who sightsee on day one are the ones who lose days three and four to a hotel room. One quiet day protects the other six.',
      },
      {
        q: 'Is the Pangong camp comfortable?',
        a: 'Comfortable by high-altitude standards — proper beds, attached washrooms, thick bedding and hot water in buckets. It is not a hotel. There is no heating overnight because there is no reliable power at 4,350 m, and it gets genuinely cold.',
      },
      {
        q: 'What if someone gets altitude sickness?',
        a: 'Every vehicle carries oxygen and our drivers are trained to recognise AMS. Leh has a well-equipped hospital and the SNM medical facilities. If symptoms escalate, the treatment is descent, and we descend — no itinerary is worth pushing through it.',
      },
      {
        q: 'Can this be done in fewer days?',
        a: 'It can be compressed to five nights but we do not recommend it — the compression always comes out of the acclimatisation days. If you only have five nights, do Leh and Nubra and save Pangong for a return trip.',
      },
    ],
    tone: 'ladakh',
    featured: true,
  },

  {
    slug: 'ladakh-complete-8-nights',
    name: 'Complete Ladakh',
    destination: 'ladakh',
    destinationName: 'Ladakh',
    nights: 8,
    days: 9,
    priceFrom: 54900,
    styles: ['adventure', 'group'],
    summary:
      'Everything the classic circuit leaves out — Turtuk on the Pakistan border, Tso Moriri, and Lamayuru\'s moonland. The trip people talk about years later.',
    route: ['Leh', 'Nubra', 'Turtuk', 'Pangong', 'Tso Moriri', 'Leh'],
    bestMonths: 'Jun–Sep',
    idealFor: 'Return visitors, photographers, and anyone who found the standard circuit too short',
    itinerary: [
      { day: 1, title: 'Arrive Leh · complete rest', body: 'Airport pickup and a full rest day. No exceptions.', stay: 'Hotel in Leh', meals: 'Dinner' },
      { day: 2, title: 'Leh valley acclimatisation', body: 'Shey, Thiksey, Hemis and the Sindhu Ghat. Gentle day inside the valley, back by mid-afternoon.', stay: 'Hotel in Leh', meals: 'Breakfast, dinner' },
      { day: 3, title: 'Khardung La to Nubra', body: 'Over the pass and down to Diskit. Maitreya Buddha, Hunder dunes and Bactrian camels at sunset.', stay: 'Camp in Nubra', meals: 'Breakfast, dinner' },
      { day: 4, title: 'Turtuk · India\'s last village', body: 'North-west along the Shyok to Turtuk, Balti-speaking and apricot-growing, which was part of Pakistan until 1971. Village walk with a local guide.', stay: 'Guest house in Turtuk', meals: 'Breakfast, dinner' },
      { day: 5, title: 'Turtuk to Pangong', body: 'Long driving day back down the Shyok and east to Pangong Tso. Arrive by late afternoon for the light on the water.', stay: 'Lakeside camp, Pangong', meals: 'Breakfast, dinner' },
      { day: 6, title: 'Pangong to Tso Moriri', body: 'Across the Changthang plateau via Chushul and Tsaga La. Kiang herds, nomad camps, and almost no other vehicles. Tso Moriri by evening.', stay: 'Camp at Korzok', meals: 'Breakfast, dinner' },
      { day: 7, title: 'Tso Moriri to Leh via Tso Kar', body: 'Morning at Korzok Monastery, then back to Leh via the Tso Kar basin and the Taglang La pass at 17,480 ft.', stay: 'Hotel in Leh', meals: 'Breakfast, dinner' },
      { day: 8, title: 'Lamayuru and the Sham valley', body: 'West to Lamayuru — the moonland formations and the oldest monastery in Ladakh. Magnetic Hill, Pathar Sahib and Sangam on the way back.', stay: 'Hotel in Leh', meals: 'Breakfast, dinner' },
      { day: 9, title: 'Departure', body: 'Early morning airport drop.', meals: 'Breakfast' },
    ],
    inclusions: [
      'All accommodation on twin-sharing — hotels, camps and a Turtuk guest house',
      'Daily breakfast and dinner',
      'Private vehicle with an experienced high-altitude driver throughout',
      'All Inner Line Permits including Turtuk and Tso Moriri',
      'Oxygen cylinder in every vehicle, plus twice-daily oximeter checks',
      'Local village guide at Turtuk',
      'Airport transfers at Leh',
      'Dedicated trip coordinator on WhatsApp for the full journey',
      'All applicable taxes and GST',
    ],
    exclusions: [
      'Airfare to and from Leh',
      'Lunch throughout the trip',
      'Monastery entry fees and camera charges',
      'Any adventure activity',
      'Personal expenses, tips and medical costs',
      'Anything not explicitly listed under inclusions',
    ],
    faqs: [
      {
        q: 'Is nine days too long for Ladakh?',
        a: 'For most first-timers the seven-day circuit is enough. This one is for people who have either been before, or who travel specifically for landscape and want Changthang and Turtuk rather than only the headline stops.',
      },
      {
        q: 'How rough is the Pangong to Tso Moriri road?',
        a: 'Genuinely rough — unpaved for long stretches, high, remote, and eight to ten hours of driving. It is one of the most beautiful drives in India and it is not comfortable. Both things are true.',
      },
      {
        q: 'Is Turtuk worth the detour?',
        a: 'It is the part of this itinerary guests mention most in their reviews. Balti culture, a completely different food and language from the rest of Ladakh, and a village that only opened to tourists in 2010.',
      },
    ],
    tone: 'ladakh',
  },

  // ─────────────────────────────────────────────── HIMACHAL
  {
    slug: 'shimla-manali-6-nights',
    name: 'Shimla & Manali',
    destination: 'himachal',
    destinationName: 'Himachal',
    nights: 6,
    days: 7,
    priceFrom: 21500,
    styles: ['family', 'honeymoon', 'first-timers'],
    summary:
      'The classic Himachal circuit, routed and timed to dodge the worst of the crowds. Toy train included.',
    route: ['Shimla', 'Manali', 'Solang', 'Chandigarh'],
    bestMonths: 'Mar–Jun · Sep–Nov',
    idealFor: 'Families and couples wanting hill-station comfort rather than high-altitude adventure',
    itinerary: [
      { day: 1, title: 'Chandigarh to Shimla', body: 'Met at Chandigarh airport or station and driven up to Shimla, roughly four hours through pine forest. Evening on the Ridge and Mall Road.', stay: 'Hotel in Shimla', meals: 'Dinner' },
      { day: 2, title: 'Shimla · Kufri and the colonial town', body: 'Kufri in the morning for the views, then the Viceregal Lodge, Christ Church and the Jakhoo temple. Afternoon free on the Mall.', stay: 'Hotel in Shimla', meals: 'Breakfast, dinner' },
      { day: 3, title: 'Shimla to Manali via Kullu', body: 'Long scenic drive north along the Beas. Stops at Sundernagar lake, the Pandoh dam and a Kullu shawl workshop. Manali by evening.', stay: 'Hotel in Manali', meals: 'Breakfast, dinner' },
      { day: 4, title: 'Solang Valley and the Atal Tunnel', body: 'Up to Solang for paragliding, zorbing and ropeway, then through the Atal Tunnel to Sissu in the Lahaul valley — a completely different landscape ten kilometres apart.', stay: 'Hotel in Manali', meals: 'Breakfast, dinner' },
      { day: 5, title: 'Manali local · Old Manali and Vashisht', body: 'Hadimba Devi temple among the deodars, the Vashisht hot springs, Manu temple and the Tibetan monastery. Afternoon free in Old Manali.', stay: 'Hotel in Manali', meals: 'Breakfast, dinner' },
      { day: 6, title: 'Manali to Chandigarh', body: 'Drive back down with a stop at Kullu for river rafting on the Beas if you want it. Overnight in Chandigarh so nobody is racing a morning flight.', stay: 'Hotel in Chandigarh', meals: 'Breakfast' },
      { day: 7, title: 'Departure', body: 'Airport or station drop at Chandigarh.', meals: 'Breakfast' },
    ],
    inclusions: [
      'All accommodation on twin-sharing in 3★/4★ hotels',
      'Daily breakfast and dinner (MAP plan)',
      'Private air-conditioned vehicle throughout',
      'All toll, parking, driver allowance and fuel',
      'Pickup and drop at Chandigarh airport or railway station',
      'Dedicated trip coordinator on WhatsApp for the full journey',
      'All applicable taxes and GST',
    ],
    exclusions: [
      'Airfare or train fare to and from Chandigarh',
      'Lunch throughout the trip',
      'Rohtang Pass permit and vehicle charges (when open)',
      'Solang Valley activities — paragliding, ropeway, zorbing',
      'River rafting and other adventure activities',
      'Entry tickets to monuments and temples',
      'Personal expenses, tips and laundry',
      'Anything not explicitly listed under inclusions',
    ],
    faqs: [
      {
        q: 'Is Rohtang Pass included?',
        a: 'No — it needs a separate permit with a daily vehicle quota and it is only open roughly mid-May to mid-October. We arrange it as an add-on when it is open. The Atal Tunnel, which is included, reaches the Lahaul valley year-round and many guests prefer it.',
      },
      {
        q: 'Can we do the Kalka–Shimla toy train?',
        a: 'Yes, and it is worth it. It is a UNESCO heritage line and takes about five hours. We add it as a day-one alternative to the road drive — tell us at booking so we can get seats, which sell out early.',
      },
      {
        q: 'When will we see snow?',
        a: 'Late December to February for reliable snow at Kufri and Solang. Outside that window you need the Atal Tunnel exit at Sissu, where snow lasts into May.',
      },
    ],
    tone: 'himachal',
  },

  // ─────────────────────────────────────────────── VAISHNO DEVI
  {
    slug: 'vaishno-devi-2-nights',
    name: 'Vaishno Devi Yatra',
    destination: 'vaishno-devi',
    destinationName: 'Vaishno Devi',
    nights: 2,
    days: 3,
    priceFrom: 9500,
    styles: ['pilgrimage', 'family'],
    summary:
      'The yatra done properly — registration handled, a hotel close to the base, and the Bhairon leg planned in rather than forgotten.',
    route: ['Katra', 'Bhawan', 'Bhairon', 'Katra'],
    bestMonths: 'Oct–Apr',
    idealFor: 'Pilgrims who want the logistics taken care of so the climb is the only thing to think about',
    itinerary: [
      {
        day: 1,
        title: 'Arrive Katra · Yatra Parchi and rest',
        body: 'Met at Jammu airport or Katra station and taken to a hotel near the base camp. We complete your Yatra Parchi registration and brief you on the cloakroom rules — what can and cannot go up. Early dinner and an early night.',
        stay: 'Hotel in Katra',
        meals: 'Dinner',
      },
      {
        day: 2,
        title: 'The yatra · Bhawan and Bhairon',
        body: 'Start the 12 km climb early, before the day heats up and the queues build. Darshan at the Bhawan, then the 2.5 km leg to Bhairon Temple which tradition holds completes the pilgrimage. Battery car or helicopter available for either leg. Back to Katra by evening.',
        stay: 'Hotel in Katra',
        meals: 'Breakfast, dinner',
      },
      {
        day: 3,
        title: 'Departure',
        body: 'Unhurried breakfast, and a drop to Jammu airport or Katra station. Optional stop at Shiv Khori shrine if your schedule allows.',
        meals: 'Breakfast',
      },
    ],
    inclusions: [
      'Accommodation on twin-sharing in a hotel near the Katra base camp',
      'Daily breakfast and dinner',
      'Private air-conditioned vehicle for all transfers',
      'Pickup and drop at Jammu airport or Katra railway station',
      'Yatra Parchi registration assistance',
      'Cloakroom and base-camp guidance',
      'Dedicated trip coordinator on WhatsApp for the full journey',
      'All applicable taxes and GST',
    ],
    exclusions: [
      'Airfare or train fare to and from Jammu or Katra',
      'Helicopter tickets (Katra ↔ Sanjhichhat)',
      'Pony, palki and porter charges',
      'Battery car between Bhawan and Bhairon',
      'Lunch and any meals during the climb',
      'VIP darshan charges where applicable',
      'Personal expenses and offerings',
      'Anything not explicitly listed under inclusions',
    ],
    faqs: [
      {
        q: 'Can you book the helicopter for us?',
        a: 'We assist with booking but cannot guarantee it — the Shrine Board releases limited seats, they sell out weeks ahead in peak season, and flights are weather-dependent. Book as early as you can and always have the walking plan as a backup.',
      },
      {
        q: 'Is the climb difficult for elderly parents?',
        a: 'The track is fully paved and gradual rather than steep, but 12 km is 12 km. Ponies, palkis and porters are available the entire way, and the helicopter cuts most of the climb. We regularly arrange this trip for guests in their seventies.',
      },
      {
        q: 'Do we have to visit Bhairon Temple?',
        a: 'Tradition holds the yatra is incomplete without it. It is 2.5 km beyond the Bhawan, uphill, and there is a battery-car and ropeway service. We build the time for it into the day rather than leaving you to discover it at 4pm.',
      },
    ],
    tone: 'vaishno',
  },

  {
    slug: 'vaishno-devi-kashmir-7-nights',
    name: 'Vaishno Devi & Kashmir',
    destination: 'vaishno-devi',
    destinationName: 'Vaishno Devi',
    nights: 7,
    days: 8,
    priceFrom: 31500,
    styles: ['pilgrimage', 'family', 'group'],
    summary:
      "Darshan first, then the valley. One flight, two very different journeys — and the combo most of our pilgrimage guests wish they'd known about earlier.",
    route: ['Katra', 'Bhawan', 'Patnitop', 'Srinagar', 'Gulmarg', 'Pahalgam'],
    bestMonths: 'Mar–Jun · Sep–Nov',
    idealFor: 'Families combining a pilgrimage with a proper holiday in one trip',
    itinerary: [
      { day: 1, title: 'Arrive Katra · registration and rest', body: 'Pickup at Jammu, hotel near the base camp, Yatra Parchi completed and a briefing on what to carry up.', stay: 'Hotel in Katra', meals: 'Dinner' },
      { day: 2, title: 'The yatra · Bhawan and Bhairon', body: 'Early start for the 12 km climb, darshan at the Bhawan, then Bhairon Temple. Back to Katra by evening.', stay: 'Hotel in Katra', meals: 'Breakfast, dinner' },
      { day: 3, title: 'Katra to Srinagar via Patnitop', body: 'The Jammu–Srinagar highway over the Banihal pass, with a cedar-forest stop at Patnitop and lunch on the way. Srinagar by evening.', stay: 'Hotel in Srinagar', meals: 'Breakfast, dinner' },
      { day: 4, title: 'Srinagar · gardens and the lake', body: 'Nishat and Shalimar gardens, Shankaracharya Hill at sunset, and a shikara ride through the floating market.', stay: 'Hotel in Srinagar', meals: 'Breakfast, dinner' },
      { day: 5, title: 'Gulmarg · gondola day', body: 'Up to Gulmarg through rice terraces. Gondola Phase 1 and 2, meadow walk, back to Srinagar by evening.', stay: 'Hotel in Srinagar', meals: 'Breakfast, dinner' },
      { day: 6, title: 'Pahalgam · the Lidder valley', body: 'South to Pahalgam via the Pampore saffron fields. Betaab, Aru and Chandanwari in the afternoon.', stay: 'Hotel in Pahalgam', meals: 'Breakfast, dinner' },
      { day: 7, title: 'Back to Srinagar · houseboat night', body: 'Return to Srinagar, Old City walk, and a final night on a deluxe houseboat on Dal Lake.', stay: 'Deluxe houseboat, Dal Lake', meals: 'Breakfast, dinner' },
      { day: 8, title: 'Departure', body: 'Breakfast on the water and an airport drop at Srinagar.', meals: 'Breakfast' },
    ],
    inclusions: [
      'All accommodation on twin-sharing — Katra hotel, Kashmir hotels and one houseboat night',
      'Daily breakfast and dinner (MAP plan)',
      'Private air-conditioned vehicle for the full circuit including the Jammu–Srinagar highway',
      'Pickup at Jammu and drop at Srinagar airport',
      'Yatra Parchi registration assistance',
      'Shikara ride on Dal Lake',
      'Dedicated trip coordinator on WhatsApp for the full journey',
      'All applicable taxes and GST',
    ],
    exclusions: [
      'Airfare in to Jammu and out of Srinagar',
      'Helicopter, pony, palki and porter charges at Vaishno Devi',
      'Lunch throughout the trip',
      'Gondola tickets at Gulmarg',
      'Union taxi charges inside Gulmarg and Pahalgam',
      'Entry tickets to gardens and monuments',
      'Personal expenses, tips and offerings',
      'Anything not explicitly listed under inclusions',
    ],
    faqs: [
      {
        q: 'Should we fly out of Srinagar or return to Jammu?',
        a: 'Fly out of Srinagar. Doubling back to Jammu costs you a full day on the highway for no reason. Book your inbound to Jammu (IXJ) and your outbound from Srinagar (SXR) — we handle everything in between.',
      },
      {
        q: 'How long is the Katra to Srinagar drive?',
        a: 'Seven to eight hours including stops, over the Banihal pass and through the Jawahar tunnel. It is a beautiful drive. If you would rather not do it, there is a twenty-minute Jammu–Srinagar flight and we can restructure the day.',
      },
      {
        q: 'Is this too much for elderly travellers?',
        a: 'The yatra is the demanding part; the Kashmir leg is gentle. Many of our pilgrimage guests take the helicopter or a palki up to the Bhawan, then find the valley days genuinely restful afterward.',
      },
    ],
    tone: 'vaishno',
    featured: true,
  },
];

export function getPackage(slug: string): Pkg | undefined {
  return PACKAGES.find((p) => p.slug === slug);
}

export function packagesFor(destinationSlug: string): Pkg[] {
  return PACKAGES.filter((p) => p.destination === destinationSlug);
}

export function packagesForStyle(styleSlug: string): Pkg[] {
  return PACKAGES.filter((p) => p.styles.includes(styleSlug));
}

/**
 * Home-page feature row. Capped at four so it fills the 4-column grid exactly
 * — a fifth card orphans onto its own row and reads as a layout bug.
 */
export const FEATURED = PACKAGES.filter((p) => p.featured).slice(0, 4);
