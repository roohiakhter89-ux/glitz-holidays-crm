/**
 * Travel-style landing pages. These capture intent-stage searches
 * ("kashmir honeymoon package", "family tour kashmir") that destination
 * hubs and individual packages both miss.
 */

export type TravelStyle = {
  slug: string;
  name: string;
  seoTitle: string;
  headline: string;
  intro: string;
  body: string[];
  promises: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  /** Tailwind-free inline gradient for the hero. */
  hero: string;
  image: string;

  // ─────────────────────────────────────────────────────────────────
  // Optional depth. Added for pillar pages that carry real search
  // demand; the six lighter style pages leave these undefined and
  // render exactly as before. See seo/CONTENT-STANDARD.md.
  // ─────────────────────────────────────────────────────────────────

  /** Overrides the truncated-intro meta description. Written for the click. */
  metaDescription?: string;
  /**
   * The direct answer to the primary query, rendered above everything else.
   * The standard requires the query be answered in the first 100 words.
   */
  answer?: { heading: string; body: string; figure: string; figureNote: string };
  /**
   * Decodes a confusing price landscape. On honeymoon queries the visible
   * range across page one runs from four figures to six, and no competitor
   * explains why — that gap is the page's main information gain.
   */
  priceDecoder?: {
    heading: string;
    intro: string;
    rows: { claim: string; reality: string }[];
    conclusion: string;
  };
  /**
   * Separates the inclusions every operator advertises identically from the
   * things that actually differ between quotes.
   */
  commodity?: {
    heading: string;
    intro: string;
    same: string[];
    different: { label: string; body: string }[];
  };
  /** Month-by-month verdict. `avoid` is used honestly, not decoratively. */
  months?: {
    month: string;
    verdict: 'best' | 'good' | 'mixed' | 'avoid';
    note: string;
  }[];
  /** The explicit negative recommendation the standard requires. */
  negative?: { heading: string; body: string };
  /** Named author. Trust is the load-bearing letter in E-E-A-T. */
  author?: { name: string; role: string };
  /** Only bump when the page has genuinely been re-verified. */
  updatedAt?: string;
};

export const TRAVEL_STYLES: TravelStyle[] = [
  {
    slug: 'honeymoon',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1000&auto=format&fit=crop',
    name: 'Honeymoon',
    seoTitle: 'Kashmir Honeymoon Packages — Prices Decoded',
    metaDescription:
      'Why Kashmir honeymoon quotes range from ₹12,000 to ₹97,000, and what the trip really costs. Real prices from ₹32,500 per person, plus the month to avoid.',
    /** Carries the head term — the page targets "kashmir honeymoon packages". */
    headline: 'Kashmir honeymoon packages, priced honestly',
    intro:
      'A first holiday that is actually a holiday: private transfers, better rooms, quieter valleys and at least one day with nothing on it. Honeymoon trips fail when they are built like sightseeing tours with rose petals added.',

    author: { name: 'Tariq Ahmad', role: 'Head of Operations, Srinagar' },
    updatedAt: '2026-08-31',

    answer: {
      heading: 'What a Kashmir honeymoon actually costs',
      body: 'A five-night Kashmir honeymoon with private transfers, an upgraded room category and a houseboat night costs ₹32,500 per person — twin-sharing, GST included, land only. That is the real, complete figure, not a starting point that grows when you enquire. Flights are separate and depend entirely on your city and dates. If you have seen prices from ₹12,000 to ₹97,000 while searching, both are real numbers describing very different things, and the section below explains exactly what.',
      figure: '₹32,500',
      figureNote: 'per person · 5 nights · twin-sharing · GST included · land only',
    },

    priceDecoder: {
      heading: 'Why honeymoon quotes range from ₹12,000 to ₹97,000',
      intro:
        'Search this and page one will show you a four-figure price next to a six-figure one, both described as a Kashmir honeymoon package. Neither is necessarily dishonest. They are measuring different things, and no one explains which — because the confusion favours whoever quotes lowest. Here is how a headline number gets built.',
      rows: [
        {
          claim: 'A very low four-figure price',
          reality:
            'Almost always per person per night rather than per trip, and usually the lowest season, lowest hotel tier and a shared vehicle. Multiply by nights and travellers before comparing it to anything.',
        },
        {
          claim: 'A price "starting from"',
          reality:
            'The floor of a range, priced on the cheapest month of the year for the smallest room in the cheapest property. Legitimate, but you will almost never travel on that number.',
        },
        {
          claim: 'A price excluding GST',
          reality:
            'Makes a quote look roughly five percent cheaper for no real reason. Always ask whether the figure is inclusive; ours are.',
        },
        {
          claim: 'A price excluding union taxi charges',
          reality:
            'The runs inside Gulmarg, Sonmarg and Pahalgam are controlled by local taxi unions at state-regulated rates, and no outside operator may drive them. This is charged on the day, in cash, and is left out of most headline prices.',
        },
        {
          claim: 'A six-figure price',
          reality:
            'Usually seven or eight nights, luxury properties, and return flights folded into a single number. Often genuinely good value — but it is not comparable to a five-night land-only quote.',
        },
        {
          claim: '"Upto 50% off"',
          reality:
            'Discounted against a list price that nobody has ever paid. Ignore the percentage and compare the final figure on identical terms.',
        },
      ],
      conclusion:
        'Normalise every quote to the same four things before comparing: number of nights, per person or per couple, GST in or out, and whether union charges are declared. Do that and the spread between serious operators collapses to a narrow band. Anything still far below it is excluding something you will pay for later.',
    },

    commodity: {
      heading: 'Everyone offers the same inclusions. Here is what actually differs.',
      intro:
        'Read five Kashmir honeymoon pages and you will find the same list on every one. Those items are real, and we provide them too — but because everybody does, they tell you nothing about which operator to choose. The things that genuinely vary are rarely advertised, because they cost money.',
      same: [
        'Celebration cake',
        'Candlelit dinner',
        'Flower-bed room decoration',
        'Shikara ride on Dal Lake',
        'A houseboat night',
        'Airport pickup and drop',
      ],
      different: [
        {
          label: 'Private vehicle, or shared',
          body: 'The single most common silent downgrade in this market, and the one couples complain about most. Shared sightseeing means a fixed departure time and four strangers in the car on your honeymoon. Ours is private throughout, in the base price, not as an upgrade.',
        },
        {
          label: 'A named houseboat, or a category',
          body: 'A good Dal Lake houseboat is often the night people remember; a poor one is cold, noisy and memorably bad. "Deluxe houseboat" is not a specification. We name the property in your quote so you can look it up before you commit.',
        },
        {
          label: 'How many times you change hotel',
          body: 'A five-night itinerary that moves you every single night is cheaper to operate and worse to experience — you spend the honeymoon packing. We build two-night stays wherever the route allows.',
        },
        {
          label: 'Room category and view',
          body: 'The difference between the cheapest room and a lake-facing one is a small part of the total and a large part of the trip. It should be stated in the quote, not discovered at check-in.',
        },
        {
          label: 'When the shikara is scheduled',
          body: 'Mid-afternoon is when the light is flat and the lake is busiest. We schedule the hour before sunset. It costs nothing and it is the difference between the photograph you imagined and the one you get.',
        },
        {
          label: 'Whether there is an empty day',
          body: 'Most itineraries fill every slot because a full schedule looks like better value on paper. We deliberately leave one day unscheduled, and couples consistently tell us afterwards it was the one they remember.',
        },
      ],
    },

    months: [
      { month: 'January', verdict: 'good', note: 'Deep snow and the most reliable Gulmarg conditions. Cold, slow, and genuinely beautiful. Some higher roads shut.' },
      { month: 'February', verdict: 'good', note: 'Still reliably snowy and quieter than January. The best month for snow without peak-season crowds.' },
      { month: 'March', verdict: 'mixed', note: 'The awkward month. Snow is receding, tulips have not arrived, and it can be grey. Cheap for a reason.' },
      { month: 'April', verdict: 'best', note: 'Tulip garden in bloom for a narrow window, gardens at their best, comfortable days. Book early — the window is short and everyone knows about it.' },
      { month: 'May', verdict: 'best', note: 'Warm days, everything open, valleys green. The most forgiving month for a first visit and our most requested.' },
      { month: 'June', verdict: 'best', note: 'Peak season. Excellent weather and the only reliable window if you want to add Ladakh. Busiest and priciest.' },
      { month: 'July', verdict: 'mixed', note: 'Escape from the plains and pleasantly cool, but this is monsoon elsewhere and mountain roads can be affected.' },
      { month: 'August', verdict: 'mixed', note: 'Similar to July. Fine for Srinagar and the gardens, less reliable for the higher valleys.' },
      { month: 'September', verdict: 'best', note: 'Clear skies, thinning crowds, and the start of autumn colour. Quietly the best value month of the year.' },
      { month: 'October', verdict: 'best', note: 'Chinars turning, saffron in bloom near Pampore, crisp air. The most photogenic month and our own favourite.' },
      { month: 'November', verdict: 'good', note: 'Cold and clear, very quiet, prices soften. Early snow is possible but not dependable.' },
      { month: 'December', verdict: 'good', note: 'Snow arrives and Christmas and New Year are the busiest, priciest weeks of winter. Beautiful, but book far ahead.' },
    ],

    negative: {
      heading: 'When Kashmir is the wrong honeymoon',
      body: 'It is worth saying plainly, because nobody selling this trip will. Kashmir is a poor choice if you want guaranteed beach weather and a resort you never leave — the valley involves driving, and the drives are part of it. March is genuinely disappointing and we would rather move your dates than take the booking. If either of you is unwell at altitude, Gulmarg phase two and any Ladakh extension are not the honeymoon to attempt. And if what you actually want is complete privacy and zero logistics, the Maldives does that better than we can. We would rather tell you now than have you find out in the second week of your marriage.',
    },
    body: [
      'The most common honeymoon mistake in Kashmir is booking a five-night itinerary that moves hotels every single night. You spend the trip packing. We build honeymoon trips with two-night stays wherever possible, so you unpack once and actually settle in.',
      'The second mistake is the shared shikara. A shared boat with four strangers is not the ride from the photographs. Ours are private, and we schedule them for the hour before sunset rather than mid-afternoon when the light is flat and the lake is busy.',
      'We also build in a genuinely empty day. No pickup time, no driver waiting downstairs. Guests are surprised by how much that one unscheduled day ends up mattering.',
    ],
    promises: [
      { title: 'Two-night stays', body: 'Unpack once. We route so you are not changing hotels every evening.' },
      { title: 'Private, never shared', body: 'Shikara, vehicle, guide. You will not be sharing a boat with strangers.' },
      { title: 'Rooms that earn it', body: 'Upgraded categories, lake or valley views where the property has them.' },
      { title: 'One empty day', body: 'Deliberately unscheduled, because a honeymoon is not a sightseeing sprint.' },
    ],
    faqs: [
      {
        q: 'How much does a Kashmir honeymoon package cost?',
        a: '₹32,500 per person for five nights on twin-sharing, GST included, land only. That covers private transfers throughout, an upgraded room category, a houseboat night, and the honeymoon inclusions. Flights are quoted separately because they vary far more than the land cost does.',
      },
      {
        q: 'Why are some Kashmir honeymoon packages so much cheaper?',
        a: 'Usually one of five reasons: the price is per night rather than per trip, it excludes GST, it excludes the union taxi charges at Gulmarg and Sonmarg, it uses a shared sightseeing vehicle instead of a private one, or it is the lowest-season floor of a range. Normalise those and the gap between serious operators mostly disappears.',
      },
      {
        q: 'When is the best time for a Kashmir honeymoon?',
        a: 'April and May for tulips, gardens and mild days. September and October for clear skies, autumn chinars and the saffron bloom — October is our own favourite and September is the best value. December to February if snow is the point. March is the one month we would steer you away from.',
      },
      {
        q: 'How many nights do we need for a Kashmir honeymoon?',
        a: 'Five is the right length and the one we build for. Four works but leaves no margin if weather closes a road, and a honeymoon is a bad trip to have no slack in. Six adds Pahalgam properly. Beyond seven you are into Ladakh territory, which is a different kind of holiday.',
      },
      {
        q: 'Is a houseboat night worth it on a honeymoon?',
        a: 'On the right boat, it is often the night couples remember. On the wrong one it is cold and noisy. The variable is the specific property, not the category, so we name it in your quote. If you would rather have every night in a hotel, that is fine and there is no penalty for saying so.',
      },
      {
        q: 'Is Kashmir safe for a honeymoon?',
        a: 'Tourist Kashmir has run normally for years and we operate here every day — our office is in Srinagar, not elsewhere. We will always give you the current on-ground picture straight when you ask, including when it is not what you were hoping to hear.',
      },
      {
        q: 'Do you arrange cake, decoration and a candlelit dinner?',
        a: 'Yes, and so does everyone else — these are table stakes rather than a differentiator. Tell us at booking rather than on the day, because the good options need notice. What we would rather you judge us on is the private vehicle, the named houseboat and the unscheduled day.',
      },
      {
        q: 'Can we combine Kashmir with Ladakh for a honeymoon?',
        a: 'Yes, from June to September. Be aware Ladakh means altitude, mandatory rest days and long drives — it is an adventure honeymoon, not a restful one. Many couples do Kashmir now and save Ladakh for an anniversary, and we think that is usually the better call.',
      },
    ],
    hero: 'linear-gradient(180deg, rgba(10,8,14,0.42), rgba(10,8,14,0.82)), radial-gradient(130% 110% at 30% 12%, #8d5a72 0%, #4a2c42 50%, #14090f 100%)',
  },

  {
    slug: 'family',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=1000&auto=format&fit=crop',
    name: 'Family',
    seoTitle: 'Family Tour Packages — Kashmir, Himachal & Vaishno Devi',
    headline: 'Built around the slowest person in the group',
    intro:
      'Shorter driving days, hotels with real rooms rather than converted attics, and an itinerary that survives contact with a seven-year-old and a seventy-year-old on the same trip.',
    body: [
      'Family trips break on the drives. A six-hour transfer that is fine for two adults becomes the worst day of the holiday with a toddler or a grandparent in the car. We cap driving days and break long transfers with proper stops — not petrol pumps, actual places.',
      'Hotel choice matters more than families expect. We only use properties where we know triple rooms are genuinely triple rooms and not a camp bed wedged beside a double, and where the kitchen will make plain food on request without a fuss.',
      'And we build the day around when people actually have energy. Sightseeing in the morning, back by late afternoon, evenings free. Nobody enjoys a garden at 6pm with three tired children.',
    ],
    promises: [
      { title: 'Capped driving days', body: 'Long transfers broken with real stops. No six-hour pushes.' },
      { title: 'Rooms that fit', body: 'Verified triples and connecting rooms — no camp beds passed off as extra occupancy.' },
      { title: 'Food without drama', body: 'Jain, plain and no-onion-garlic arranged in advance at every property.' },
      { title: 'Morning-heavy days', body: 'Sightseeing early, back by late afternoon, evenings free.' },
    ],
    faqs: [
      {
        q: 'What age is too young for Kashmir?',
        a: 'Kashmir works at any age — Srinagar is at 1,585 m, which is not meaningful altitude. Gulmarg tops out at 2,650 m and the gondola goes higher, so we keep Phase 2 optional for families with very young children.',
      },
      {
        q: 'Is Ladakh suitable for children?',
        a: 'We generally advise against Ladakh for children under five. Leh is at 3,500 m and the passes go far higher. For older children we build a gentler profile with extra acclimatisation days.',
      },
      {
        q: 'Can you arrange child seats or extra beds?',
        a: 'Extra beds yes, at every property, arranged in advance. Child car seats are not standard in Indian tourist vehicles — if you need one, bring your own and tell us so we can allocate a vehicle that fits it.',
      },
    ],
    hero: 'linear-gradient(180deg, rgba(6,14,9,0.42), rgba(6,14,9,0.82)), radial-gradient(130% 110% at 40% 12%, #4f7d55 0%, #24422e 52%, #0a150e 100%)',
  },

  {
    slug: 'adventure',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000&auto=format&fit=crop',
    name: 'Adventure',
    seoTitle: 'Himalayan Adventure Tour Packages',
    headline: 'High passes, real snow, and roads that count as an activity',
    intro:
      'Gulmarg powder, Khardung La, Chandratal, the Shyok river road. Trips for people whose idea of a holiday involves altitude and some discomfort.',
    body: [
      'Adventure in the Himalayas is mostly a logistics problem disguised as a fitness problem. The mountain does not care how fit you are if the pass is shut, the permit is not filed, or you gained 2,000 metres in a day.',
      'We handle the boring parts — Inner Line Permits, oxygen in every vehicle, drivers who have done these roads for a decade, and an acclimatisation profile that is not negotiable. What is left is the part you came for.',
      'Skiing at Gulmarg is worth a specific mention. It has some of the best lift-accessed powder in Asia and almost no queues, and we work with certified local instructors rather than whoever is standing at the base with skis.',
    ],
    promises: [
      { title: 'Permits, filed', body: 'Inner Line Permits for Nubra, Pangong, Tso Moriri, Turtuk. You sign, we file.' },
      { title: 'Oxygen as standard', body: 'A cylinder in every high-altitude vehicle and twice-daily oximeter checks.' },
      { title: 'Drivers who know the road', body: 'Not a booking-app driver from the plains. Ours have run these passes for years.' },
      { title: 'Certified instructors', body: 'Ski and trek guides with actual certification, not a rented board and good luck.' },
    ],
    faqs: [
      {
        q: 'How fit do I need to be for Ladakh?',
        a: 'Ordinary fitness is enough for the standard circuits — they are drives, not treks. What matters far more is acclimatisation discipline and no cardiac or severe respiratory history. If you have either, see a doctor before booking.',
      },
      {
        q: 'Can beginners ski at Gulmarg?',
        a: 'Yes. The Kongdoori bowl above gondola Phase 1 has gentle beginner terrain and certified instructors. The Apharwat descents from Phase 2 are expert-only, genuinely.',
      },
      {
        q: 'Do you run treks?',
        a: 'We arrange guided treks in Kashmir — Tarsar Marsar, the Great Lakes — and shorter routes in Ladakh with certified guides and full support. Tell us your dates and experience level and we will build it.',
      },
    ],
    hero: 'linear-gradient(180deg, rgba(16,10,4,0.40), rgba(16,10,4,0.84)), radial-gradient(130% 110% at 66% 14%, #c99a5e 0%, #6d4a2c 48%, #180f05 100%)',
  },

  {
    slug: 'pilgrimage',
    image: 'https://images.unsplash.com/photo-1626714485848-d3e91d575fa9?q=80&w=1000&auto=format&fit=crop',
    name: 'Pilgrimage',
    seoTitle: 'Vaishno Devi & Amarnath Pilgrimage Packages',
    headline: 'The logistics handled, so the journey is the only thing left',
    intro:
      'Yatra Parchi registration, cloakroom rules, helicopter assistance, and hotels close enough to the base that the morning does not start with a drive.',
    body: [
      'Most pilgrimage stress is administrative. The Yatra Parchi that must be collected before you start. The cloakroom rules on leather and phones that nobody tells you until you are at the gate. The Bhairon Temple leg that people discover exists only after they have come back down.',
      'We handle every one of those before you arrive, and brief you on the rest the evening you land, so the climb itself is uncomplicated.',
      'We also strongly suggest pairing Vaishno Devi with Kashmir. Jammu to Srinagar is a scenic seven-hour drive or a twenty-minute flight. If you have flown from South or West India for the darshan, adding the valley costs a few days and doubles the trip.',
    ],
    promises: [
      { title: 'Registration done', body: 'Yatra Parchi completed on arrival. You do not queue for paperwork.' },
      { title: 'Briefed properly', body: 'What can go up, what must stay in the cloakroom, when to start climbing.' },
      { title: 'Helicopter assistance', body: 'We book where seats exist and always plan a walking backup, since flights are weather-dependent.' },
      { title: 'Bhairon planned in', body: 'The 2.5 km beyond the Bhawan is in the day plan, not a surprise at 4pm.' },
    ],
    faqs: [
      {
        q: 'How long does the Vaishno Devi climb take?',
        a: 'Four to six hours one way on foot for most pilgrims, plus queue time for darshan. The helicopter to Sanjhichhat reduces the round trip to under two hours of travel with a short walk at the top.',
      },
      {
        q: 'Can elderly parents do the yatra?',
        a: 'Yes, and many do. The track is paved and gradual rather than steep. Ponies, palkis and porters run the whole route, and the helicopter removes most of the climb. We arrange this for guests in their seventies regularly.',
      },
      {
        q: 'Do you arrange Amarnath Yatra?',
        a: 'Yes, during the official yatra window (usually July–August) and subject to Shrine Board registration, which requires a medical certificate and opens months ahead. Contact us in the spring to plan it.',
      },
    ],
    hero: 'linear-gradient(180deg, rgba(14,7,2,0.42), rgba(14,7,2,0.84)), radial-gradient(130% 110% at 38% 18%, #c2701c 0%, #6d360b 48%, #180a03 100%)',
  },

  {
    slug: 'group',
    image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=1000&auto=format&fit=crop',
    name: 'Groups & Corporate',
    seoTitle: 'Group & Corporate Tour Packages — Kashmir & Ladakh',
    headline: 'Fifteen people, one plan, nobody left at a petrol pump',
    intro:
      'Tempo Travellers and coach fleets, block-booked hotels, a single point of contact, and one consolidated invoice with GST at the end.',
    body: [
      'Group travel fails on the small things. Two vehicles arrive at different times. Half the rooms are on the fourth floor with no lift. The invoice arrives in eleven pieces and finance sends it back.',
      'We run groups from a single coordinator who is on WhatsApp for the whole trip, block-book rooms on the same floors, and issue one consolidated GST invoice at the end that your accounts team will accept without a follow-up.',
      'For corporate offsites we also handle conference rooms, projector and AV, themed dinners and team activities — everything from a Wazwan night to a treasure hunt across the Mughal gardens.',
    ],
    promises: [
      { title: 'One coordinator', body: 'A single named contact on WhatsApp for the entire trip. Not a call centre.' },
      { title: 'Blocked together', body: 'Rooms on the same floors, vehicles convoyed, nobody separated from the group.' },
      { title: 'One GST invoice', body: 'Consolidated, compliant, issued at the end. Your finance team will accept it first time.' },
      { title: 'Offsite-ready', body: 'Conference rooms, AV, themed dinners and team activities arranged on request.' },
    ],
    faqs: [
      {
        q: 'What is your minimum group size?',
        a: 'Group pricing starts at ten travelling together. Below that our standard per-person rates are usually better anyway.',
      },
      {
        q: 'Do you handle corporate offsites?',
        a: 'Yes — conference rooms, projector and AV, themed dinners, team-building activities and full event coordination alongside the travel itself.',
      },
      {
        q: 'How does payment work for a group?',
        a: 'A booking advance to confirm hotels and vehicles, then the balance before arrival. One consolidated GST invoice at the end. For corporate bookings we can work to your PO and payment-terms process.',
      },
    ],
    hero: 'linear-gradient(180deg, rgba(6,12,16,0.42), rgba(6,12,16,0.82)), radial-gradient(130% 110% at 28% 12%, #3d6d82 0%, #1c3a49 52%, #08141b 100%)',
  },
];

export function getTravelStyle(slug: string): TravelStyle | undefined {
  return TRAVEL_STYLES.find((s) => s.slug === slug);
}
