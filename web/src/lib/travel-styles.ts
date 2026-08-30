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
};

export const TRAVEL_STYLES: TravelStyle[] = [
  {
    slug: 'honeymoon',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1000&auto=format&fit=crop',
    name: 'Honeymoon',
    seoTitle: 'Kashmir & Himalayan Honeymoon Packages',
    headline: 'A first holiday that is actually a holiday',
    intro:
      'Private transfers, better rooms, quieter valleys and at least one day with nothing on it. Honeymoon trips fail when they are built like sightseeing tours with rose petals added.',
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
        q: 'When is the best time for a Kashmir honeymoon?',
        a: 'April to June for tulips, gardens and mild days. September and October for autumn chinars and the saffron bloom. December to February if snow is the point — Gulmarg in winter is spectacular but everything moves more slowly.',
      },
      {
        q: 'Do you arrange cake and decoration?',
        a: 'Yes, included on our honeymoon packages. Flowers on arrival, a celebration cake, and a private candlelit dinner on the houseboat verandah.',
      },
      {
        q: 'Can we combine Kashmir with Ladakh for a honeymoon?',
        a: 'Yes, from June to September. Be aware Ladakh means altitude, rest days and long drives — it is an adventure honeymoon, not a restful one. Many couples do Kashmir now and save Ladakh for an anniversary.',
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
