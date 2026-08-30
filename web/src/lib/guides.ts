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
  image: string;
  relatedPackages: string[];
};

export const GUIDES: GuideArticle[] = [
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
    slug: 'best-time-to-visit-kashmir-month-by-month',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?q=80&w=1200&auto=format&fit=crop',
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
    relatedPackages: ['complete-kashmir-6-nights', 'kashmir-honeymoon-5-nights'],
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
