/**
 * Destination hubs — the "pillar" pages in our hub-and-spoke SEO model.
 * Each hub links down to its packages (the spokes) and up from the home grid.
 *
 * Photos: `tone` picks a placeholder gradient until real photography lands in
 * /public/images/destinations/<slug>.jpg.
 */

export type Tone = 'kashmir' | 'ladakh' | 'himachal' | 'vaishno';

export type Destination = {
  slug: string;
  name: string;
  /** Used in <title> and H1 — carries the head keyword. */
  seoTitle: string;
  headline: string;
  intro: string;
  /** 2–3 paragraph long-form block. Real substance = ranking substance. */
  body: string[];
  bestTime: string;
  bestMonths: string;
  idealDuration: string;
  startingFrom: number;
  airport: string;
  altitude: string;
  regions: { name: string; note: string }[];
  highlights: string[];
  knowBefore: { label: string; value: string }[];
  faqs: { q: string; a: string }[];
  tone: Tone;
};

export const DESTINATIONS: Destination[] = [
  {
    slug: 'kashmir',
    name: 'Kashmir',
    seoTitle: 'Kashmir Tour Packages',
    headline: 'Where the Himalayas learned to write poetry',
    intro:
      "Dal Lake at first light. Gulmarg's gondola climbing into cloud. Sonmarg's glacier meadows, Pahalgam's pine valleys. Kashmir is India's most complete mountain destination — and we've lived here our whole lives.",
    body: [
      "Most Kashmir itineraries you'll find online were written by someone who has never spent a winter here. They send you to Gulmarg on the one day the gondola is shut, book you into a houseboat on the wrong side of the lake, and route Pahalgam and Sonmarg back-to-back so you spend two full days in a car.",
      "We build it differently because we live here. Our office is in Rajbagh, a fifteen-minute drive from Dal Gate. Our drivers are Kashmiri. When we tell you late April is better than early April, it's because we drove that road last week.",
      "A Kashmir trip works best across five to seven nights: three in Srinagar as your base, one or two in Gulmarg or Pahalgam, and a full unhurried day for Sonmarg. Anything shorter and the valley becomes a checklist. Anything longer and you'll want to start adding Doodhpathri and Yusmarg — which, honestly, you should.",
    ],
    bestTime: 'March to October, plus December to February for snow',
    bestMonths: 'Apr–Jun · Sep–Oct · Dec–Feb (snow)',
    idealDuration: '5 to 7 nights',
    startingFrom: 18500,
    airport: 'Srinagar (SXR) — 30 min from Dal Lake',
    altitude: '1,585 m (Srinagar) to 2,650 m (Gulmarg)',
    regions: [
      { name: 'Srinagar', note: 'Dal Lake, houseboats, Mughal gardens, Old City' },
      { name: 'Gulmarg', note: "Asia's highest gondola, ski slopes, the meadow of flowers" },
      { name: 'Sonmarg', note: 'Thajiwas glacier, alpine meadows, the Zoji-La gateway' },
      { name: 'Pahalgam', note: 'Aru, Betaab and Chandanwari valleys along the Lidder' },
      { name: 'Doodhpathri', note: 'Off-radar meadows — a quiet day trip from Srinagar' },
      { name: 'Yusmarg', note: 'Nomad shepherd country. The Kashmir tour buses miss.' },
    ],
    highlights: [
      'A night on a deluxe Dal Lake houseboat, carved walnut and all',
      'Gondola Phase 1 and Phase 2 to Apharwat Peak, Gulmarg',
      'Thajiwas glacier by pony, Sonmarg',
      'Sunset shikara ride through the floating vegetable market',
      'A full Wazwan — the 36-course Kashmiri wedding feast',
      'Saffron fields at Pampore (October bloom)',
    ],
    knowBefore: [
      { label: 'Permits', value: 'None needed for Indian nationals. Foreign nationals need passport + standard Indian visa.' },
      { label: 'Connectivity', value: 'Postpaid SIMs only. Prepaid from other states will not work in J&K.' },
      { label: 'ATMs', value: 'Widely available in Srinagar. Carry cash for Gulmarg, Sonmarg and Pahalgam.' },
      { label: 'Clothing', value: 'Layers year-round. Nights drop sharply even in June. Snow gear rentable in Gulmarg.' },
    ],
    faqs: [
      {
        q: 'Is Kashmir safe for tourists right now?',
        a: 'Yes. Tourism runs year-round and 2024–25 were record seasons for visitor numbers. Our staff live in Srinagar and track conditions daily — if anything regional changes, we tell you before your trip, not after you land.',
      },
      {
        q: 'When is the best time to visit Kashmir?',
        a: 'April to June for tulips, gardens and comfortable days. September to October for chinar autumn colour and saffron bloom. December to February if you specifically want snow in Gulmarg. July–August is warm and busy; it is the cheapest window.',
      },
      {
        q: 'How many days do I need for Kashmir?',
        a: 'Five nights covers Srinagar, Gulmarg and Pahalgam without rushing. Six or seven adds Sonmarg properly and gives you a free day on the lake. Four nights works but you will be moving every day.',
      },
      {
        q: 'Are houseboats worth it?',
        a: 'One night, yes — it is genuinely unlike anywhere else. Two or more and most guests wish they had moved to a hotel. We usually book one houseboat night and the rest on land.',
      },
      {
        q: 'Do we need to book the Gulmarg gondola in advance?',
        a: 'Phase 1 tickets are usually available on arrival. Phase 2 sells out in peak season and during snow months. We pre-book both where the operator allows it.',
      },
    ],
    tone: 'kashmir',
  },

  {
    slug: 'ladakh',
    name: 'Ladakh',
    seoTitle: 'Ladakh Tour Packages',
    headline: 'The land where the sky begins',
    intro:
      'Cold desert at 3,500 metres. Monasteries older than most countries. Passes that steal your breath in both senses. Ladakh is a bucket-list trip — and altitude is the thing that ruins most of them.',
    body: [
      "Ladakh punishes bad planning more than any destination in India. Guests fly into Leh at 3,500 m, get driven straight to Khardung La at 5,600 m the next morning, and spend the rest of the trip in a hotel room with a headache and an oxygen cylinder.",
      "We schedule the first full day in Leh as a rest day. No exceptions, no negotiation. Monastery visits within the valley, an easy afternoon, early night. High passes start day three. It costs you one day of itinerary and saves the entire trip.",
      "Beyond acclimatisation, Ladakh rewards slowness. Pangong deserves an overnight, not a photo stop. Nubra is worth two nights if you can spare them. And Turtuk — India's last village before Pakistan, Balti-speaking, apricot-growing — is the part guests talk about years later.",
    ],
    bestTime: 'May to September, when the passes and roads are open',
    bestMonths: 'May–Sep (Jun–Aug peak)',
    idealDuration: '6 to 9 nights',
    startingFrom: 32500,
    airport: 'Leh (IXL) — direct flights from Delhi',
    altitude: '3,500 m (Leh) to 5,600 m (Khardung La)',
    regions: [
      { name: 'Leh', note: 'Acclimatisation base, old town, monasteries, night market' },
      { name: 'Nubra Valley', note: 'Khardung La, cold-desert dunes, double-humped camels' },
      { name: 'Pangong Tso', note: 'The lake from 3 Idiots. Overnight camps on the shore.' },
      { name: 'Tso Moriri', note: 'Higher, quieter and more spiritual than Pangong' },
      { name: 'Turtuk', note: "India's last village before Pakistan — Balti culture, apricots" },
      { name: 'Zanskar', note: 'Sham valley, Lamayuru moonland, the Indus–Zanskar sangam' },
    ],
    highlights: [
      'A lakeside night at Pangong Tso under a full Milky Way',
      'Khardung La at 18,380 ft — one of the highest motorable passes on earth',
      'Diskit Monastery and a Bactrian camel ride across Hunder dunes',
      'Dinner with a Ladakhi family in a traditional home-stay',
      'Magnetic Hill, Gurudwara Pathar Sahib and the Sangam confluence',
      'Thiksey Monastery morning prayers at sunrise',
    ],
    knowBefore: [
      { label: 'Acclimatisation', value: 'Day 1 in Leh is a mandatory rest day. Non-negotiable on every itinerary we sell.' },
      { label: 'Permits', value: 'Inner Line Permits needed for Nubra, Pangong, Tso Moriri and Turtuk. We file them; you just sign.' },
      { label: 'Oxygen', value: 'Every vehicle carries a cylinder. Guests get pulse-oximeter readings twice daily.' },
      { label: 'Season', value: 'Roads to Nubra and Pangong close roughly Oct–Apr. Flying in is the only reliable option off-season.' },
    ],
    faqs: [
      {
        q: 'How do I handle the altitude in Ladakh?',
        a: 'Fly into Leh and rest completely for the first 24 hours — no sightseeing, no exertion, lots of water. Our itineraries schedule high passes from day three onward. Every vehicle carries oxygen and we take oximeter readings morning and evening.',
      },
      {
        q: 'Should I fly to Leh or drive via Manali or Srinagar?',
        a: 'Fly if this is your first Himalayan trip — the road journeys gain altitude fast and significantly raise AMS risk. The Manali–Leh and Srinagar–Leh highways are spectacular but add two days each way and are best for guests who have been at altitude before.',
      },
      {
        q: 'Are Inner Line Permits included in the package?',
        a: 'Yes. We handle permits for Nubra, Pangong, Tso Moriri and Turtuk as part of every Ladakh package. You provide ID copies; we do the filing.',
      },
      {
        q: 'Can families with children visit Ladakh?',
        a: 'Yes, with care. We generally advise against Ladakh for children under five and for anyone with cardiac or severe respiratory conditions. For older children we build a gentler profile with extra rest days.',
      },
      {
        q: 'What is the best month for Ladakh?',
        a: 'June to early September has the most reliable road access and the mildest weather. May is beautiful and quieter but some high passes may still be clearing. Mid-September brings golden light and thinner crowds.',
      },
    ],
    tone: 'ladakh',
  },

  {
    slug: 'himachal',
    name: 'Himachal',
    seoTitle: 'Himachal Tour Packages',
    headline: 'From cedar hush to Spiti silence',
    intro:
      'Shimla for colonial calm, Manali for adventure, Dharamshala for Tibet-in-India, and Spiti for the trip that quietly rearranges you. Himachal is four holidays wearing one name.',
    body: [
      'Himachal is the most-visited hill state in India, which is exactly its problem. Mall Road in May is a traffic jam with a view. Solang Valley in June is a queue. The difference between a wonderful Himachal trip and a frustrating one is almost entirely about timing and routing.',
      'We route around the crowds — early starts, the quieter side of each valley, and shoulder-season dates wherever your calendar allows. Shimla in late September is a different town from Shimla in mid-June.',
      'And if you have eight days and a sense of adventure, skip the classic circuit entirely and do Spiti. Kaza, Key Monastery, Chandratal. High-altitude cold desert, Buddhist villages at 4,000 m, and roads that will be the best and worst part of your trip.',
    ],
    bestTime: 'March to June and September to November; December to February for snow',
    bestMonths: 'Mar–Jun · Sep–Nov · Dec–Feb (snow)',
    idealDuration: '5 to 8 nights',
    startingFrom: 15500,
    airport: 'Chandigarh (IXC) or Bhuntar (KUU) for Manali',
    altitude: '2,050 m (Shimla) to 4,590 m (Kunzum La, Spiti)',
    regions: [
      { name: 'Manali', note: 'Solang, Atal Tunnel, Old Manali cafés, Hadimba temple' },
      { name: 'Shimla', note: 'The Ridge, Kufri, Mall Road, the Kalka toy train' },
      { name: 'Dharamshala & McLeodganj', note: 'Dalai Lama residence, Triund trek, Bhagsu falls' },
      { name: 'Spiti Valley', note: 'Kaza, Key Monastery, Chandratal — high cold desert' },
      { name: 'Kasol & Tosh', note: 'Parvati valley, riverside cafés, the backpacker circuit' },
      { name: 'Dalhousie & Khajjiar', note: "Quiet colonial hill station and India's mini-Switzerland" },
    ],
    highlights: [
      'The Kalka–Shimla toy train, a UNESCO World Heritage line',
      'Atal Tunnel to Sissu and the Lahaul valley',
      'Paragliding at Solang or Bir-Billing, one of the world\'s best sites',
      'Morning prayers at Namgyal Monastery, McLeodganj',
      'Key Monastery at sunrise over the Spiti river',
      'Camping beside Chandratal, the moon lake',
    ],
    knowBefore: [
      { label: 'Rohtang Pass', value: 'Opens roughly mid-May to mid-October and needs a separate permit. The Atal Tunnel now bypasses it year-round.' },
      { label: 'Road time', value: 'Distances are short but hill roads are slow. Delhi–Manali is 12–14 hours by road; Chandigarh–Shimla is 3–4.' },
      { label: 'Spiti season', value: 'The Manali–Kaza route opens roughly June–October. Shimla–Kaza stays open longer but is a longer drive.' },
      { label: 'Peak crowds', value: 'Mid-May to end-June and Christmas–New Year are the busiest and priciest windows.' },
    ],
    faqs: [
      {
        q: 'Can I combine Shimla and Manali in one trip?',
        a: 'Yes — the six-night Shimla–Manali circuit is our most-booked Himachal package. The drive between them is roughly seven hours, so we break it with a stop rather than doing it in one push.',
      },
      {
        q: 'When does Rohtang Pass open?',
        a: 'Typically mid-May to mid-October, weather permitting, and it requires a permit with a daily vehicle cap. The Atal Tunnel is open year-round and reaches Sissu and Lahaul without the pass, so we route through it when Rohtang is shut.',
      },
      {
        q: 'Is Spiti suitable for a first Himalayan trip?',
        a: 'Only if you are comfortable with high altitude and long, rough drives. Spiti crosses 4,000 m and medical facilities are sparse. If it is your first mountain trip, do the Shimla–Manali circuit and save Spiti for the next one.',
      },
      {
        q: 'Where will I actually see snow?',
        a: 'From late December to February, Solang and Kufri are reliable. Outside those months you need to go higher — Rohtang when open, or the Atal Tunnel exit at Sissu, where snow lingers into May.',
      },
    ],
    tone: 'himachal',
  },

  {
    slug: 'vaishno-devi',
    name: 'Vaishno Devi',
    seoTitle: 'Vaishno Devi Tour Packages',
    headline: "Mata's darshan, and the mountains beyond",
    intro:
      "The Vaishno Devi yatra is a once-in-a-lifetime pilgrimage. We pair it with Kashmir or Amritsar so you don't fly all the way to Jammu for a single temple — one trip, two lifetimes of memory.",
    body: [
      'The yatra itself is straightforward: 12 kilometres uphill from Katra to the Bhawan, then 2.5 km further to Bhairon Temple, which tradition holds you must visit for the darshan to be complete. Most pilgrims walk it in four to six hours. Ponies, palkis and a helicopter to Sanjhichhat are all available.',
      "What trips people up is the logistics around it — the Yatra Parchi registration, cloakroom rules on what you can carry up, when to start the climb to avoid both the heat and the crush, and where to stay in Katra so you're not adding an hour to your morning.",
      'And the geography argument: Jammu is a short drive or a twenty-minute flight from Srinagar. If you are travelling from South or West India, doing Vaishno Devi without adding Kashmir is leaving the best part of the region on the table.',
    ],
    bestTime: 'October to April — avoid monsoon, when the track gets slippery',
    bestMonths: 'Oct–Apr (Mar–Apr and Navratri busiest)',
    idealDuration: '2 nights standalone · 6 to 8 nights as a combo',
    startingFrom: 9500,
    airport: 'Jammu (IXJ) — 50 km to Katra, or Katra railway station',
    altitude: '875 m (Katra) to 1,584 m (Bhawan)',
    regions: [
      { name: 'Katra', note: 'Base town for the yatra — hotels, registration, cloakrooms' },
      { name: 'Bhawan', note: "Mata's cave shrine — 12 km trek or helicopter to Sanjhichhat" },
      { name: 'Bhairon Temple', note: '2.5 km beyond Bhawan. Traditionally completes the darshan.' },
      { name: 'Patnitop', note: 'Cedar-forest hill stop on the Jammu–Srinagar highway' },
      { name: 'Combo · Kashmir', note: 'Jammu → Srinagar by road or air. Six to eight nights total.' },
      { name: 'Combo · Amritsar', note: 'Golden Temple and the Wagah border ceremony added on' },
    ],
    highlights: [
      'Helicopter transfer Katra ↔ Sanjhichhat, ideal for elders',
      'Battery-car service between Bhawan and Bhairon',
      'VIP darshan arrangement, subject to Shrine Board availability',
      'AC transfers from Jammu airport or Katra railway station',
      'Combo circuits into Kashmir or Amritsar',
      'Cloakroom, medical support and cash desk assistance at base',
    ],
    knowBefore: [
      { label: 'Yatra Parchi', value: 'Free registration slip is mandatory before starting the climb. We arrange it on arrival.' },
      { label: 'Not permitted', value: 'Leather items, cameras and phones are restricted beyond a point. Cloakrooms are provided.' },
      { label: 'Helicopter', value: 'Books out weeks ahead in peak season and is weather-dependent. Book as early as you can.' },
      { label: 'Fitness', value: 'The climb is paved and gradual but long. Ponies and palkis are available the whole way.' },
    ],
    faqs: [
      {
        q: 'How long does the Vaishno Devi yatra take?',
        a: 'Four to six hours one way on foot for most pilgrims, plus darshan queue time. The helicopter to Sanjhichhat cuts the round trip to under two hours of travel, leaving a short walk at the top.',
      },
      {
        q: 'Can we arrange VIP darshan?',
        a: 'Yes, with advance notice and subject to Shrine Board availability. It is not guaranteed on peak dates such as Navratri, so we always plan for the standard queue and treat VIP as a bonus.',
      },
      {
        q: 'Is the Kashmir combo practical after the yatra?',
        a: 'Very. Jammu to Srinagar is a seven to eight hour scenic drive over the Banihal pass, or a twenty-minute flight. Our seven-night combo does the yatra first, then moves to the valley.',
      },
      {
        q: 'What is the best time for the yatra?',
        a: 'October to April has the most comfortable walking weather. Avoid July and August — the track is slippery and landslides can close it. Navratri in March/April is spiritually special but extremely crowded.',
      },
    ],
    tone: 'vaishno',
  },
];

export function getDestination(slug: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.slug === slug);
}

/**
 * Gradient placeholders per destination. Replace the whole map once real
 * photography drops into /public/images/destinations/.
 */
export const TONE_BG: Record<Tone, string> = {
  kashmir:
    'radial-gradient(120% 100% at 25% 15%, #2d5f6e 0%, #17384a 48%, #08161f 100%)',
  ladakh:
    'radial-gradient(120% 100% at 70% 18%, #c99a5e 0%, #7a5433 46%, #241708 100%)',
  himachal:
    'radial-gradient(120% 100% at 45% 12%, #3f6b48 0%, #1f3d2b 50%, #0a1710 100%)',
  vaishno:
    'radial-gradient(120% 100% at 38% 22%, #c2701c 0%, #7a3d0d 48%, #240f04 100%)',
};

/** Slightly darker variant for hero sections, where text sits on top. */
export const TONE_HERO: Record<Tone, string> = {
  kashmir:
    'linear-gradient(180deg, rgba(6,12,16,0.42), rgba(6,12,16,0.82)), radial-gradient(130% 110% at 25% 10%, #2d5f6e 0%, #14303f 50%, #060e14 100%)',
  ladakh:
    'linear-gradient(180deg, rgba(16,10,4,0.40), rgba(16,10,4,0.84)), radial-gradient(130% 110% at 70% 14%, #c99a5e 0%, #6d4a2c 48%, #180f05 100%)',
  himachal:
    'linear-gradient(180deg, rgba(6,14,9,0.40), rgba(6,14,9,0.84)), radial-gradient(130% 110% at 45% 10%, #3f6b48 0%, #1a3524 52%, #06110b 100%)',
  vaishno:
    'linear-gradient(180deg, rgba(14,7,2,0.42), rgba(14,7,2,0.84)), radial-gradient(130% 110% at 38% 18%, #c2701c 0%, #6d360b 48%, #180a03 100%)',
};
