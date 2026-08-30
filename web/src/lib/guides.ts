/**
 * Curated high-value informational travel guides for Kashmir, Ladakh, and the Himalayas.
 */

export type GuideArticle = {
  slug: string;
  title: string;
  seoTitle?: string;
  subtitle: string;
  summary: string;
  destination: string;
  destinationName: string;
  readingTime: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  updatedAt: string;
  verifiedOnISO?: string;
  tags: string[];
  faqs: { q: string; a: string }[];
  toc: { id: string; title: string }[];
  content: string;
  image: string;
  relatedPackages: string[];
  directAnswer?: {
    heading: string;
    body: string;
    highlights: string[];
  };
  placesTable?: {
    caption?: string;
    headers: string[];
    rows: {
      place: string;
      distance: string;
      drivingTime: string;
      highlights: string;
      cost: string;
      bestSeason: string;
      stay: string;
    }[];
  };
  negativeAdvice?: {
    title: string;
    body: string;
    items: string[];
  };
  localInsights?: {
    title: string;
    body: string;
  };
};

export const GUIDES: GuideArticle[] = [
  {
    slug: 'places-to-visit-in-kashmir',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=1200&auto=format&fit=crop',
    title: 'Places to Visit in Kashmir: The Realistic 2026 Valley Guide',
    seoTitle: 'Places to Visit in Kashmir: 2026 Guide',
    subtitle:
      'Driving times, entry costs, union cab rules, and the day-trip clusters that actually work — from a Srinagar team operating since 2013.',
    summary:
      'Kashmir places to visit ranked by a Srinagar DMC: driving times, union cab rules, entry fees, half vs full day plans & what to skip. Updated 2026.',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    readingTime: '9 min read',
    author: 'Tariq Ahmad',
    authorRole: 'Head of Operations, Srinagar',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    verifiedOnISO: '2026-08-31',
    tags: [
      'Kashmir Sightseeing',
      'Places To Visit',
      'Srinagar',
      'Gulmarg',
      'Pahalgam',
      'Sonmarg',
      'Doodhpathri',
      'Travel Planning',
    ],
    relatedPackages: [
      'complete-kashmir-6-nights',
      'classic-kashmir-4-nights',
      'kashmir-honeymoon-5-nights',
      'kashmir-snow-winter-5-nights',
    ],
    directAnswer: {
      heading: 'The Short Answer: How to Prioritise Kashmir’s Places',
      body:
        'Kashmir has seven primary destinations, but you cannot visit them in a continuous circular road trip. Srinagar sits at the centre; Gulmarg (51 km west), Pahalgam (90 km south-east), Sonmarg (80 km north-east), and Doodhpathri (42 km south-west) are separate spokes radiating from the capital. For a 5-to-6-night trip, prioritise the Big Four: Srinagar (2 days for Dal Lake, houseboats, and Mughal Gardens), Gulmarg (1 day / 1 night for Gondola and snow slopes), Pahalgam (2 nights for Betaab, Aru, and Lidder river), and Sonmarg (1 day for Thajiwas Glacier). If you have 7+ nights, add Doodhpathri or Gurez Valley.',
      highlights: [
        'Base hub: Srinagar (all valleys radiate from here; no direct mountain passes connect Gulmarg to Pahalgam)',
        'Minimum time needed: 5 nights / 6 days for the core 4 destinations without exhausting daily driving',
        'Offbeat additions: Doodhpathri (untouched river meadows) and Gurez Valley (remote borderland via Razdan Pass)',
      ],
    },
    placesTable: {
      caption: 'Kashmir Top Destinations: Verified Distances, Driving Times & 2026 Official Costs',
      headers: [
        'Destination',
        'Distance from Srinagar',
        'Real Drive Time',
        'Key Highlights',
        'Official Costs / Union Rules',
        'Best Season',
        'Recommended Stay',
      ],
      rows: [
        {
          place: 'Srinagar (The Base & Heritage City)',
          distance: '0 km (Base hub)',
          drivingTime: '30–45 min from airport',
          highlights: 'Dal Lake Shikara, Nigeen Lake Houseboats, Shalimar & Nishat Gardens, Pari Mahal, Jamia Masjid Old City',
          cost: 'Mughal Gardens ₹24/person; Shikara ₹800–₹1,200/hr (Govt fixed rate)',
          bestSeason: 'All year (Tulips: Apr; Chinars: Oct–Nov)',
          stay: '2 Nights (1N Houseboat + 1N Hotel)',
        },
        {
          place: 'Gulmarg (Meadow of Flowers & Ski Resort)',
          distance: '51 km West',
          drivingTime: '1 hr 45 min (via Tangmarg)',
          highlights: 'Gondola Phase 1 & Phase 2 (13,780 ft), Apharwat Peak, Drung Waterfall (winter frozen), Golf Course',
          cost: 'Gondola Phase 1: ₹810; Phase 2: ₹1,010 (Online only via jktpc.in)',
          bestSeason: 'Dec–Feb (Snow/Ski), May–Jun (Meadows)',
          stay: '1 Night (guarantees 9 AM Gondola slot)',
        },
        {
          place: 'Pahalgam (Valley of Shepherds)',
          distance: '90 km South-East',
          drivingTime: '2 hr 30 min (via NH-44)',
          highlights: 'Betaab Valley (Hajan), Aru Valley, Chandanwari (Amarnath base), Baisaran Valley, Lidder River',
          cost: 'Betaab entry ₹100; Local Union Taxi circuit ~₹2,200–₹2,600 (mandatory)',
          bestSeason: 'Apr–Jun (Lush green), Sep–Oct (Crisp)',
          stay: '2 Nights (explore without rushing)',
        },
        {
          place: 'Sonmarg (Meadow of Gold & Glaciers)',
          distance: '80 km North-East',
          drivingTime: '2 hr 15 min (via Sindh Valley)',
          highlights: 'Thajiwas Glacier, Zero Point / Zoji La Pass gateway, Sindh River trout streams, Baltal valley',
          cost: 'Local Union Taxi / Pony to Thajiwas Glacier (~₹1,500–₹2,500 negotiable)',
          bestSeason: 'May–Oct (Road shuts in deep winter past Gagangeer)',
          stay: '1 Full Day Trip from Srinagar',
        },
        {
          place: 'Doodhpathri (Valley of Milk)',
          distance: '42 km South-West',
          drivingTime: '1 hr 30 min (via Budgam)',
          highlights: 'Shaliganga riverbed, rolling shepherd meadows, uncrowded pine forest trails',
          cost: 'Free entry (parking ~₹50); Outside taxis allowed throughout',
          bestSeason: 'May–Oct (Lush green carpet, serene)',
          stay: 'Day trip (5–6 hours from Srinagar)',
        },
        {
          place: 'Yusmarg (Meadow of Jesus)',
          distance: '47 km South-West',
          drivingTime: '1 hr 45 min (via Charar-i-Sharief)',
          highlights: 'Doodh Ganga stream, Nilnag alpine lake, quiet hiking trails, Charar-i-Sharief shrine',
          cost: 'Free entry; Outside taxis permitted',
          bestSeason: 'May–Oct (Untouched picnic grounds)',
          stay: 'Day trip from Srinagar',
        },
        {
          place: 'Gurez Valley (Dawar & Borderland)',
          distance: '123 km North',
          drivingTime: '5 to 6 hr (via Razdan Pass 11,672 ft)',
          highlights: 'Habba Khatoon pyramid peak, Dawar border town, turquoise Kishanganga River, log huts',
          cost: 'Free entry (Indian nationals carry valid Aadhaar for checkposts)',
          bestSeason: 'Jun–Sep (Razdan Pass snowbound Nov–May)',
          stay: '2 Nights in Dawar',
        },
      ],
    },
    negativeAdvice: {
      title: 'What to Skip & Common Itinerary Mistakes',
      body:
        'Most disappointing Kashmir holidays happen when itineraries try to copy aggregator templates that pack five destinations into four days. Here is what we actively advise our private guests to avoid:',
      items: [
        'Never attempt Gulmarg to Pahalgam as a single-day commute. There is no direct highway across the Pir Panjal mountains; you must drive down to Srinagar bypass and back up through South Kashmir (4.5 to 5 hours driving alone). Stay in Srinagar or split them into dedicated overnight legs.',
        'Skip the overhyped Baisaran pony touts during monsoon or early spring thaw. In wet weather, the trail becomes a steep mud ditch where horse handlers charge ₹2,000–₹3,000 for an uncomfortable ride. If you go, hire certified gumboots and check conditions first.',
        'Do not book Sonmarg between December and mid-March expecting green meadows or easy glacier access. The highway past Gagangeer regularly closes due to heavy snow and avalanche hazards on the Zoji La corridor.',
        'Avoid purchasing "bargain saffron" from roadside souvenir stalls near Pampore highway stops without verifying purity. Genuine Kashmiri Mongra saffron has a GI tag and costs ₹250–₹350 per gram; anything sold at ₹50/gram is adulterated safflower.',
      ],
    },
    localInsights: {
      title: 'Operating from Srinagar Since 2013: Our Ground Routing Philosophy',
      body:
        'Over 5,000+ hosted journeys, the single biggest difference between a frantic holiday and a memorable one is night allocation. Spending 2 consecutive nights in Pahalgam lets you explore Aru Valley in the morning dew without competing against day-trip tempo travellers arriving from Srinagar. Similarly, booking an overnight stay in Gulmarg guarantees you can board the Gondola Phase 1 at 09:30 AM before the tour buses arriving from Srinagar clog the base terminal line.',
    },
    toc: [
      { id: 'hub-and-spoke-map', title: 'The Hub-and-Spoke Reality: How Kashmir Is Actually Laid Out' },
      { id: 'the-big-four', title: 'The Big Four: Srinagar, Gulmarg, Pahalgam & Sonmarg' },
      { id: 'offbeat-meadows', title: 'Offbeat Gems: Doodhpathri, Yusmarg & Gurez Valley' },
      { id: 'itinerary-clustering', title: 'How to Cluster Places into Real Day Trips' },
      { id: 'local-taxi-unions', title: 'The Local Union Taxi Rule: What Competitors Omit' },
      { id: 'what-to-skip', title: 'What to Skip: Honest Negative Advice from Local Operators' },
      { id: 'practical-costs', title: '2026 Verified Entry Fees, Passes & Permits' },
    ],
    faqs: [
      {
        q: 'Which are the must-visit places in Kashmir for a first-time trip?',
        a: 'For a first visit, focus on the core four: Srinagar (Dal Lake, Shankaracharya Temple, and Mughal Gardens), Gulmarg (for the world-famous Gondola and Apharwat Peak), Pahalgam (Betaab Valley, Aru Valley, and the Lidder River), and Sonmarg (Thajiwas Glacier). This combination balances lakes, alpine meadows, pine valleys, and snow glaciers in a 5 to 6-night itinerary.',
      },
      {
        q: 'How many days are needed to see all the main places in Kashmir?',
        a: 'A minimum of 5 nights / 6 days is required to cover Srinagar, Gulmarg, and Pahalgam comfortably. If you want to include Sonmarg or Doodhpathri without rushing, 6 nights / 7 days is ideal. Remote destinations like Gurez Valley require an extra 2 dedicated nights due to the 6-hour drive over Razdan Pass.',
      },
      {
        q: 'Can we travel directly from Gulmarg to Pahalgam without passing Srinagar?',
        a: 'No. The Pir Panjal mountain range separates Gulmarg in the west from Pahalgam in the south-east with no direct road. All vehicular routes run through the Srinagar outskirts or Narbal/Bijbehara bypass. The total drive is approximately 140 km and takes 4 to 4.5 hours.',
      },
      {
        q: 'What is the difference between Doodhpathri and Gulmarg?',
        a: 'Gulmarg is a world-class resort town focused on high-altitude cable cars (reaching 13,780 ft at Apharwat Peak), luxury ski hotels, and winter snow sports. Doodhpathri is an untouched, peaceful river meadow with vast grasslands, pine forests, and roaming sheep, featuring zero commercial cable cars and far fewer tourists. Gulmarg is about high peaks; Doodhpathri is about tranquil picnic meadows.',
      },
      {
        q: 'Why do we need to hire separate local union taxis in Pahalgam and Sonmarg?',
        a: 'Local transport unions in Pahalgam and Sonmarg restrict outside Srinagar cabs from driving internal sightseeing routes (such as Aru Valley and Betaab Valley in Pahalgam, or Thajiwas Glacier in Sonmarg). Your primary vehicle brings you to the destination, where you hire a union cab with regulated fares (~₹2,200 for Pahalgam circuit). At Glitz Holidays, we declare these union rules clearly up front.',
      },
      {
        q: 'What is the best month to visit the places in Kashmir?',
        a: 'It depends on your goal: April to June offers blooming gardens and lush green meadows (15°C to 28°C); July and August are perfect for high-altitude trekking; September to November brings crisp weather and golden Chinar leaves; and December to February is the peak winter snow season for skiing in Gulmarg.',
      },
    ],
    content: `
### The Hub-and-Spoke Reality: How Kashmir Is Actually Laid Out
Most online travel portals present Kashmir as a linear route where you can hop between valleys in an afternoon. That geography is completely inaccurate.

Srinagar is situated in the central valley floor. Every major destination radiates outward like spokes on a wheel:
- **Gulmarg (51 km West):** Takes 1 hr 45 min via Narbal and Tangmarg.
- **Pahalgam (90 km South-East):** Takes 2 hr 30 min via the South Kashmir highway through Awantipora and Anantnag.
- **Sonmarg (80 km North-East):** Takes 2 hr 15 min along the Sindh River valley toward Ladakh.
- **Doodhpathri (42 km South-West):** Takes 1 hr 30 min through Budgam district.
- **Gurez Valley (123 km North):** Takes 5 to 6 hours crossing the Razdan Pass (11,672 ft).

Because high mountain ridges separate these radial valleys, **there are no direct roads connecting Gulmarg to Pahalgam or Pahalgam to Sonmarg**. You must always descend back toward the Srinagar valley basin before ascending into the next valley. Understanding this simple geographic fact will save you from booking an exhausting itinerary.

### The Big Four: Srinagar, Gulmarg, Pahalgam & Sonmarg
These four destinations form the backbone of 90% of all Kashmir holidays. Each offers a completely distinct landscape and character:

#### 1. Srinagar: Heritage, Houseboats & Mughal Terraces
Srinagar is not merely a transit airport; it is a historic Himalayan capital with over 2,000 years of culture.
- **Dal Lake & Nigeen Lake:** Take a dawn shikara ride at 06:00 AM to see the floating vegetable market. Staying one night on a traditional carved cedarwood houseboat on Nigeen Lake gives you peaceful glassy water reflections without the motorboat noise of Dal Gate.
- **Mughal Gardens:** Built during the 16th and 17th centuries by Emperors Jahangir and Shah Jahan. *Nishat Bagh* (Garden of Bliss) features 12 terraces cascading toward the lake, while *Shalimar Bagh* is famous for its chinar groves and Mughal water fountains. Entry is ₹24 per adult.
- **Pari Mahal & Shankaracharya Temple:** Pari Mahal (Palace of Fairies) sits atop the Zabarwan ridge and offers the finest sunset vantage point over Dal Lake. Shankaracharya Temple (dedicated to Lord Shiva) requires climbing 240 stone steps for a 360-degree panorama of the entire city.
- **Old City (Downtown Srinagar):** Walk through the 14th-century wooden Jamia Masjid with its 378 monumental Deodar pillars and explore the copper-engraving bazaars around Zaina Kadal.

#### 2. Gulmarg: Cable Cars & Snow Peaks
Located at an altitude of 8,694 ft, Gulmarg is Asia’s premier winter ski destination and a cool summer meadow.
- **The Gulmarg Gondola:** The world’s second-highest operating cable car. *Phase 1 (Kongdoori Valley, 10,050 ft)* offers gentle pine slopes, sledging, and beginner skiing. *Phase 2 (Mount Apharwat shoulder, 13,780 ft)* takes you directly into alpine glacial territory with snow patches lasting well into July. Round-trip combo tickets cost ₹1,820 (Phase 1: ₹810, Phase 2: ₹1,010) and must be booked online weeks in advance at [jktpc.in](https://jktpc.in).
- **Drung Frozen Waterfall:** Located 16 km before Gulmarg near Tangmarg, this cascading waterfall completely freezes into giant icicles between December and mid-February.

#### 3. Pahalgam: The Pine Valley Along the Lidder River
Nestled at 7,200 ft where the Sheshnag and Lidder rivers converge, Pahalgam is the greenest, most relaxing valley in Kashmir.
- **Betaab Valley (Hajan):** Named after the Bollywood movie *Betaab*, this broad valley features manicured lawns surrounded by towering pine cliffs and crystalline glacial riverbeds. Entry fee is ₹100.
- **Aru Valley:** Situated 12 km further upstream from Pahalgam at 7,900 ft, Aru is a peaceful eco-village that serves as the base camp for the Kolahoi Glacier and Tarsar Marsar alpine lake treks.
- **Chandanwari:** 16 km from Pahalgam, this is the official roadhead and starting point for the annual Amarnath Yatra pilgrimage.
- **Baisaran Valley:** Known locally as "Mini Switzerland", this high meadow is reached via a 4 km uphill pony track or hike through dense pine forest.

#### 4. Sonmarg: Alpine Glaciers on the Gateway to Ladakh
Sitting at 8,960 ft on the banks of the roaring Sindh River, Sonmarg is dramatic, rugged, and glacial.
- **Thajiwas Glacier:** A massive hanging glacier located 3 km from the main Sonmarg market. You can hike or hire a local pony/union vehicle to the snow line.
- **Zero Point & Zoji La Pass:** Located 25 km beyond Sonmarg at 11,575 ft, Zero Point offers year-round snow play even in peak June and July. *Note: The pass is subject to weather conditions and traffic timing.*

### Offbeat Gems: Doodhpathri, Yusmarg & Gurez Valley
If you have more than 6 nights or want to escape tour bus crowds, these three destinations deliver raw Himalayan beauty:

#### 1. Doodhpathri (The Valley of Milk)
Located just 42 km (1.5 hours) south-west of Srinagar in Budgam district, Doodhpathri is an expansive bowl of lush rolling meadows dissected by the frothing *Shaliganga River*. Unlike Gulmarg, there are no commercial hotels or touts here — just open grasslands, pine forests, and nomadic Gujjar log huts. Outside private taxis are allowed everywhere, making it the most stress-free day trip from Srinagar.

#### 2. Yusmarg (The Meadow of Jesus)
Sitting at 7,860 ft in the Pir Panjal range, Yusmarg is 47 km from Srinagar. It features quiet walking trails leading to the *Doodh Ganga* roaring river gorge and *Nilnag Lake* (a turquoise lake hidden in deep forest). It is ideal for couples and families seeking quiet nature picnics.

#### 3. Gurez Valley (Dawar & The Kishanganga)
Located 123 km north of Srinagar along the Line of Control, Gurez is one of Kashmir’s most pristine border valleys. The journey crosses the dramatic *Razdan Pass (11,672 ft)* with sweeping views of Mount Harmukh. In Dawar, the iconic pyramid-shaped *Habba Khatoon peak* towers over the turquoise Kishanganga River. Gurez requires a dedicated 2-night stay and is accessible only between late May and October.

### How to Cluster Places into Real Day Trips
To avoid spending your holiday trapped inside a car, cluster your sightseeing by geographic corridor:

- **Cluster 1: Central Srinagar (2 Days)**
  - Day 1: Morning 06:00 AM Shikara on Dal Lake $\\rightarrow$ Nishat & Shalimar Mughal Gardens $\\rightarrow$ Pari Mahal sunset $\\rightarrow$ Dinner at a traditional Wazwan restaurant.
  - Day 2: Shankaracharya Temple $\\rightarrow$ Jamia Masjid & Old City heritage walk $\\rightarrow$ Check into Nigeen Lake Houseboat $\\rightarrow$ Evening relaxing on the cedar deck.
- **Cluster 2: Gulmarg Corridor (1 Full Day or 1 Overnight)**
  - Day trip from Srinagar (Leave by 08:00 AM to board 09:30 AM Gondola Phase 1) or stay overnight at a resort in Gulmarg to enjoy empty evening meadows.
- **Cluster 3: South Kashmir / Pahalgam (2 Days & 2 Nights)**
  - Day 1: Drive Srinagar $\\rightarrow$ Pampore saffron fields $\\rightarrow$ Awantipora 9th-century ruins $\\rightarrow$ Pahalgam hotel check-in $\\rightarrow$ Evening walk by the Lidder River.
  - Day 2: Hire local Union Cab for Aru Valley, Betaab Valley, and Chandanwari $\\rightarrow$ Afternoon hike or relaxation.
- **Cluster 4: North-East / Sonmarg (1 Full Day)**
  - Early morning drive along Sindh River $\\rightarrow$ Thajiwas Glacier excursion $\\rightarrow$ Trout lunch by the riverbanks $\\rightarrow$ Return to Srinagar hotel by 06:00 PM.
- **Cluster 5: The South-West Meadows (1 Full Day)**
  - Day trip to Doodhpathri or Yusmarg $\\rightarrow$ Leisurely meadow walk and river picnic $\\rightarrow$ Return to Srinagar.

### The Local Union Taxi Rule: What Competitors Omit
One of the most frequent tourist complaints in Kashmir is arriving in Pahalgam, Sonmarg, or Gulmarg and being told by local drivers that your Srinagar taxi cannot take you for internal sightseeing.

**Here is the exact rule:**
- **Your Primary Tour Vehicle (from Srinagar):** Can take you from Srinagar to your hotel in Gulmarg, Pahalgam, or Sonmarg, and bring you back.
- **Local Internal Sightseeing:** Inside Pahalgam (Aru, Betaab, Chandanwari), inside Sonmarg (Zero Point, Thajiwas), and inside Gulmarg (Tangmarg snow chain transfers in winter), internal routes are reserved exclusively for local taxi union drivers with government-regulated fixed rates.

For example, a dedicated union taxi in Pahalgam covering Aru Valley, Betaab Valley, and Chandanwari costs approximately **₹2,200 to ₹2,600 per vehicle** (regulated rate). At Glitz Holidays, our tour managers explain this in advance so you can budget accurately without surprise cash expenses on the ground.

### What to Skip: Honest Negative Advice from Local Operators
Unlike national travel portals that describe every spot as unmissable, here is our honest guidance on what to skip:

1. **Skip the 4-Night "All-Kashmir" Itinerary:** Trying to do Srinagar + Gulmarg + Pahalgam + Sonmarg in 4 nights means spending 22 out of 48 waking hours on mountain highways. You will remember the asphalt more than the valley. Drop Sonmarg and do Srinagar + Gulmarg + Pahalgam properly.
2. **Skip Roadside Highway Saffron Touts:** Do not purchase saffron from vendors waving plastic boxes on the highway outside Pampore. Much of it is dyed corn silk or low-grade imported saffron. Buy only from the government-authorized *India International Kashmir Saffron Trading Centre (IIKSTC)* in Pampore or certified Srinagar emporiums with GI-tag authentication.
3. **Skip Pony Rides at Baisaran if You Enjoy Walking:** The 4 km trail from Pahalgam to Baisaran is a pleasant 45-minute uphill walk through pine forests. Pony operators frequently claim the hike is "impossible on foot" to charge ₹2,000 per horse. If you are reasonably fit, walking is cleaner and far more enjoyable.
4. **Skip March for Snow Sports or Flower Blooms:** March is Kashmir’s transitional thaw month. The snow at low elevations turns to slush and mud, while the famous Tulip Garden does not open until early April. If you want pristine powder snow, come in January or February; if you want spring flowers, come in April or May.

### 2026 Verified Entry Fees, Passes & Permits
To help you budget your sightseeing costs with exact figures, here are the official 2026 rates verified by our operations desk:

- **Gulmarg Gondola Phase 1 (Gulmarg to Kongdoori):** ₹810 per person (Round-trip)
- **Gulmarg Gondola Phase 2 (Kongdoori to Apharwat Peak):** ₹1,010 per person (Round-trip)
- **Betaab Valley Entry (Pahalgam):** ₹100 per adult, ₹50 per child (J&K Tourism Development Authority)
- **Mughal Gardens Entry (Nishat, Shalimar, Chashme Shahi, Pari Mahal):** ₹24 per adult, ₹12 per child per garden (J&K Floriculture Dept)
- **Indira Gandhi Memorial Tulip Garden (Open April only):** ₹60 per adult, ₹25 per child
- **Dal Lake Shikara Ride (Govt Fixed Rate):** ₹800 (1 hour standard) to ₹1,200 (2 hours including floating market)
- **Pahalgam Union Sightseeing Cab (Aru + Betaab + Chandanwari):** ₹2,200 to ₹2,600 (Per vehicle, Maruti Omni / Tavera / Sumo)
- **Permits for Indian Nationals:** None required for Srinagar, Gulmarg, Pahalgam, Sonmarg, or Doodhpathri. For Gurez Valley, keep original government photo ID (Aadhaar/Passport) handy for army transit checkpoints at Razdan Pass.
    `,
  },
  {
    slug: 'gulmarg-gondola-booking-guide-2026',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop',
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
    relatedPackages: ['kashmir-snow-winter-5-nights', 'classic-kashmir-4-nights', 'kashmir-honeymoon-5-nights'],
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
    slug: 'ladakh-altitude-acclimatization-guide',
    image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=1200&auto=format&fit=crop',
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
    relatedPackages: ['ladakh-leh-nubra-pangong-6-nights', 'ladakh-complete-8-nights'],
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
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=1200&auto=format&fit=crop',
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
    relatedPackages: ['kashmir-honeymoon-5-nights', 'classic-kashmir-4-nights'],
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

  // ───────────────────────────────────────────────────────────────────
  // The two guides below target query clusters that have already produced
  // conversions in the Google Ads search-terms report but had no organic
  // page. Taxi/transfer intent carries the highest CTR of any cluster we
  // measure (9.15%); "travel agency in Srinagar" runs 11–25% CTR on small
  // volume. Both are bottom-of-funnel despite reading as informational.
  // ───────────────────────────────────────────────────────────────────
  {
    slug: 'kashmir-taxi-and-cab-fares-guide',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1200&auto=format&fit=crop',
    title: 'Kashmir Taxi & Cab Hire: What Every Route Actually Costs',
    subtitle:
      'Union rates, private cabs and tempo travellers explained — including the charges most packages exclude and nobody warns you about.',
    summary:
      'A plain guide to hiring transport in Kashmir: how the local taxi unions work, what the Srinagar–Gulmarg and Srinagar–Pahalgam runs cost, when a tempo traveller makes sense, and why your package almost certainly excludes union charges.',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    readingTime: '7 min read',
    author: 'Tariq Ahmad',
    authorRole: 'Head of Operations, Srinagar',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    tags: ['Transport', 'Taxi', 'Tempo Traveller', 'Costs'],
    relatedPackages: [
      'classic-kashmir-4-nights',
      'complete-kashmir-6-nights',
      'kashmir-snow-winter-5-nights',
    ],
    toc: [
      { id: 'union-system', title: 'The union system, and why it catches people out' },
      { id: 'vehicle-types', title: 'Which vehicle you actually need' },
      { id: 'what-packages-exclude', title: 'What your package excludes' },
      { id: 'hiring-well', title: 'Hiring well: five rules' },
    ],
    faqs: [
      {
        q: 'Why does my package exclude taxi charges inside Gulmarg and Sonmarg?',
        a: 'Because those runs are controlled by local taxi unions with state-regulated fixed rates, and outside operators are not permitted to drive them. Your package vehicle takes you to the union stand and waits; the final leg is a union taxi you pay for there. Every honest operator excludes this. Anyone who does not is either absorbing it into an inflated headline price or has not told you yet.',
      },
      {
        q: 'How much should a Srinagar to Gulmarg day trip cost?',
        a: 'For the main run, a private sedan is the usual choice and an SUV makes sense in snow or with luggage. The union leg beyond Gulmarg to Kongdoori is charged separately at fixed rates. Rates move with fuel and are set locally rather than nationally, so ask us for the current figure on your dates rather than trusting a number published a year ago.',
      },
      {
        q: 'Is a tempo traveller worth it for a family group?',
        a: 'Above about seven people, almost always. Below that a single SUV is usually cheaper and more comfortable, and it handles mountain roads better. The tipping point is headcount plus luggage, not headcount alone — six adults with large winter cases often need the bigger vehicle.',
      },
      {
        q: 'Can I hire a self-drive car in Kashmir?',
        a: 'You can, but we rarely recommend it. Mountain road conditions, winter surfaces, and the union system on the tourist runs all reduce the benefit, and any time saved tends to be lost at checkpoints. A car with a local driver costs little more and removes all of it.',
      },
      {
        q: 'Do I need to tip the driver?',
        a: 'It is not obligatory and it is not built into the fare. If a driver has done a genuinely good job across several days — and on a longer itinerary the driver becomes a big part of the trip — most travellers give something at the end. Anything you offer is appreciated rather than expected.',
      },
    ],
    content: `
### The union system, and why it catches people out
Transport in tourist Kashmir works differently from the rest of India, and the difference is the single most common source of unexpected cost on a trip here.

On the main runs — Srinagar to Gulmarg, Srinagar to Pahalgam, Srinagar to Sonmarg — your own vehicle takes you there and back. But the **final stretch at each destination is reserved for the local taxi union**, at fixed, state-regulated rates. Your driver cannot take you up to Kongdoori, into Aru and Betaab valleys, or out to Thajiwas glacier, however much you or he would like him to.

This is not an operator scam. It is a long-standing local arrangement that distributes tourist income among resident drivers, and it is enforced. What *is* a scam is failing to tell you about it until you are standing at the union stand with your wallet out.

### Which vehicle you actually need
- **Sedan (Dzire, Etios):** Two to three passengers with modest luggage. Perfectly good in summer on all the main runs.
- **SUV (Innova, Xylo, Scorpio):** Four to six passengers, and the sensible default in winter. Higher clearance and better traction matter on snow, and the difference in comfort over a week of mountain roads is significant.
- **Tempo traveller (12–17 seat):** Groups of seven or more, or smaller groups with heavy luggage. Genuinely cheaper per head, though slower on the narrow sections.

A useful rule: count your bags, not just your people. Six travellers with winter cases are an SUV-and-a-half, and squeezing them into one vehicle makes a long day considerably longer.

### What your package excludes
Read this on any operator's page, ours included. Our packages exclude:

- Union taxi charges inside Gulmarg, Sonmarg and Pahalgam
- Gondola tickets, pony rides, sledging and ATV hire
- Entry tickets to gardens and monuments

Those exclusions are published rather than buried, because they are the four things travellers most often discover on the day. Budget roughly for them in advance and there is no unpleasant surprise; ignore them and a well-priced trip develops an annoying tail of cash payments.

### Hiring well: five rules
1. **Agree the vehicle class in writing, not just the price.** "A car" is not a specification. "Innova Crysta, four passengers, five days" is.
2. **Confirm whether the rate is per day or per route.** Both exist locally and they are not interchangeable.
3. **Ask what happens on a weather day.** If Sonmarg road is shut, is the driver paid anyway? Usually yes, and that is fair — but know it beforehand.
4. **Do not book transport from the airport arrivals hall.** Prices there are the worst you will see all trip.
5. **Keep the same driver for the whole trip if you can.** After two days he knows what you want, and on a six-night itinerary that matters more than the vehicle badge.
    `,
  },

  {
    slug: 'choosing-a-travel-agency-in-srinagar',
    image: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=1200&auto=format&fit=crop',
    title: 'How to Choose a Travel Agency in Srinagar (Without Getting Burned)',
    subtitle:
      'What actually separates a real Kashmir operator from a reseller — and the questions that expose the difference in under two minutes.',
    summary:
      'A candid guide to picking a Kashmir tour operator: DMC versus reseller, the licence and registration to check, the six questions worth asking, and the warning signs that reliably predict a bad trip.',
    destination: 'kashmir',
    destinationName: 'Kashmir',
    readingTime: '8 min read',
    author: 'Tariq Ahmad',
    authorRole: 'Head of Operations, Srinagar',
    publishedAt: '2026-08-31',
    updatedAt: '2026-08-31',
    tags: ['Planning', 'Booking', 'Operators', 'Trust'],
    relatedPackages: [
      'complete-kashmir-6-nights',
      'kashmir-honeymoon-5-nights',
      'classic-kashmir-4-nights',
    ],
    toc: [
      { id: 'dmc-vs-reseller', title: 'DMC or reseller: the distinction that matters' },
      { id: 'six-questions', title: 'Six questions that expose the difference' },
      { id: 'red-flags', title: 'Warning signs worth walking away from' },
      { id: 'fair-comparison', title: 'Comparing quotes fairly' },
    ],
    faqs: [
      {
        q: 'What is the difference between a DMC and a travel agency?',
        a: 'A destination management company operates in the destination itself — its own staff, vehicles and hotel relationships on the ground. A reselling agency sells you the trip and then buys it from a DMC. Neither is dishonest, but when something goes wrong at 9pm in Pahalgam, only one of them can actually fix it.',
      },
      {
        q: 'How do I check a Kashmir operator is legitimate?',
        a: 'Ask for the registered business name and address and confirm it is in J&K, not a marketing office elsewhere. Check the Google Business Profile has a real history of reviews rather than a burst of recent ones. Ask for a GST-compliant invoice. Any operator unwilling to provide all three is telling you something.',
      },
      {
        q: 'Should I pay a full advance?',
        a: 'No. A deposit to hold hotels and vehicles is entirely normal and necessary in peak season. A demand for the full amount upfront, particularly to a personal account rather than a business one, is a serious warning sign.',
      },
      {
        q: 'Are cheaper quotes always worse?',
        a: 'Not always, but you must compare like with like. Most large gaps between quotes come down to hotel category, private versus shared vehicle, whether GST is included, and whether the union charges are declared. Normalise those four and the quotes usually converge.',
      },
      {
        q: 'What does Glitz Holidays do differently?',
        a: 'We are based in Srinagar and have operated here since 2013. Your quote comes from the person who will run your trip, not a call centre, and our exclusions are published on every package page rather than buried in a PDF you receive after paying.',
      },
    ],
    content: `
### DMC or reseller: the distinction that matters
Most Kashmir trips are sold by companies that do not operate in Kashmir. They take your booking, mark it up, and pass it to a local operator who does the actual work. That chain is legal and common, and for a simple trip it often works fine.

It stops working the moment something goes wrong. A hotel that has given your room away, a road closed by snow, a family member unwell at altitude — these are problems that need someone with local authority and a phone that gets answered at 9pm. A reseller in another city can only relay your problem down the chain and relay the answer back.

The question to ask is not "are you a DMC?", because everyone will say yes. It is **"where is your office and who will meet me at the airport?"** The answers are specific, checkable, and instantly revealing.

### Six questions that expose the difference
1. **Which hotel exactly, by name?** A quote listing "4★ hotel or similar" is a quote that has not been costed. Named properties can be looked up; categories cannot.
2. **Is the sightseeing vehicle private or shared?** This is the most common silent downgrade in the market and the one travellers notice most.
3. **Is GST included in this figure?** A quote excluding it will look roughly five percent cheaper for no real reason.
4. **What are the union charges and are they excluded?** Anyone who does not know what you are asking about does not operate here.
5. **Who is my point of contact during the trip, and are they in Kashmir?** Ask for a name.
6. **What is your cancellation policy in writing?** Not a verbal assurance. In writing, before you pay.

### Warning signs worth walking away from
- Pressure to pay the full amount immediately, particularly to a personal bank account
- A price dramatically below every other quote, with no explanation of what differs
- Stock photography and no images of their own guests or vehicles
- A Google Business Profile with a sudden cluster of reviews and no history behind it
- Reluctance to name hotels until after the deposit
- No physical address in Jammu & Kashmir

None of these individually proves bad faith. Two or more together reliably predicts a disappointing trip.

### Comparing quotes fairly
Put competing quotes side by side and normalise them before comparing totals. Set them all to the same hotel category, the same vehicle arrangement, GST included, and union charges declared. Do that and the spread between serious operators is usually narrow — at which point you are choosing on responsiveness and judgement rather than on price, which is the right basis anyway.

Then ask one final question: **who answers the phone at nine at night?** On a good trip you will never need to know. On a difficult one it is the only thing that matters.
    `,
  },
];

export function getGuide(slug: string): GuideArticle | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
