/**
 * Month hubs — one page per place, carrying all twelve months as sections.
 *
 * WHY ONE PAGE, NOT TWELVE
 * ------------------------
 * The first manifest split these by month: 108 pages across just 10 places,
 * i.e. twelve near-identical documents per place differing by a month name and
 * a temperature. That is the textbook deduplication case, and the site
 * diversity system would have capped us at roughly two of them per query
 * anyway.
 *
 * Passage ranking makes the consolidation safe — a self-contained January
 * section can win "kashmir in january" on its own — while the single page
 * accumulates twelve times the links, engagement and authority.
 *
 * THE BUILD REQUIREMENT
 * ---------------------
 * Every month section must stand alone. It states its own temperature range,
 * its own verdict, its own packing note. A section that reads as "same as
 * February but colder" cannot be lifted out and ranked, which defeats the
 * entire point of consolidating.
 *
 * Verdicts are used honestly. If a month is poor, it says so — the negative
 * is the part competitors will not write, and therefore the part worth having.
 */

export type MonthVerdict = 'best' | 'good' | 'mixed' | 'avoid';

export type MonthEntry = {
  month: string;
  /** Lowercased slug fragment, used for the section anchor. */
  key: string;
  verdict: MonthVerdict;
  /** Daytime range in °C, written as a range not a point. */
  tempDay: string;
  tempNight: string;
  /** Plain-language snow expectation. Never promise snow. */
  snow: string;
  /** Relative cost index against the year's peak. */
  price: string;
  crowd: string;
  /** Two or three sentences. Must make sense read alone. */
  body: string;
  /** What is shut, restricted or unreliable this month. */
  access?: string;
  packing: string;
};

export type MonthHub = {
  slug: string;
  place: string;
  h1: string;
  seoTitle: string;
  metaDescription: string;
  lede: string;
  /** Evidence from the all-time search-terms report. */
  demand: { queries: number; impressions: number; conversions: number };
  /** Direct answer, above everything. Names the best and worst months. */
  answer: { verdict: string; body: string };
  months: MonthEntry[];
  /** Package slugs to surface per season. */
  packages: string[];
  author: { name: string; role: string };
  updatedAt: string;
  faqs: { q: string; a: string }[];
};

export const MONTH_HUBS: MonthHub[] = [
  {
    slug: 'kashmir-by-month',
    place: 'Kashmir',
    h1: 'Kashmir month by month',
    seoTitle: 'Best Time to Visit Kashmir — Month by Month, Honestly',
    metaDescription:
      'Kashmir month by month: temperatures, snow odds, crowds and costs for all twelve. Which months are worth it, and the one we tell people to skip.',
    lede:
      'Every month gets a verdict, including the ones that do not deserve a good one. Written from the valley, where we watch all twelve of them happen.',
    demand: { queries: 1522, impressions: 20584, conversions: 11.0 },

    answer: {
      verdict: 'April–May and September–October are the best. March is the one to skip.',
      body: 'If you want gardens, tulips and mild days, come in April or May. If you want clear skies, autumn colour and the best value of the year, come in September or October — October is our own favourite month. If snow is the point, January and February are far more reliable than December. The month we actively steer people away from is March: the snow has gone, the blossom has not arrived, and it is often simply grey. It is cheap for a reason.',
    },

    months: [
      {
        month: 'January', key: 'january', verdict: 'good',
        tempDay: '2 to 8°C', tempNight: '−4 to 2°C',
        snow: 'The most reliable snow month of the year, along with February.',
        price: 'Mid — below the Christmas peak', crowd: 'Quiet after the first week',
        body: 'January is the deepest of the Kashmir winter and the most dependable month if snow is what you came for. Gulmarg is at its best, the Dal freezes at the edges, and the valley is genuinely quiet once the New Year crowd has gone home. Everything moves more slowly, which is part of the appeal and occasionally part of the problem.',
        access: 'Higher roads including the Sonmarg approach are usually shut. Gondola phase two closes on high wind more often than in any other month.',
        packing: 'Serious thermals, a waterproof outer layer, gloves and boots with grip. Snow boots can be hired at Gulmarg, which is usually more sensible than flying with them.',
      },
      {
        month: 'February', key: 'february', verdict: 'good',
        tempDay: '4 to 11°C', tempNight: '−3 to 3°C',
        snow: 'Still reliably snowy, with slightly longer days than January.',
        price: 'Mid — the best value of the snow season', crowd: 'The quietest of the winter months',
        body: 'February is the month we recommend most often to people whose priority is snow without crowds. Conditions are close to January but the days are longer and the light is better, and hotel rates have come off the New Year peak. Toward the end of the month the first hints of the thaw arrive.',
        access: 'Sonmarg road typically still closed. Gulmarg fully operational in most years.',
        packing: 'Much the same as January. Sunglasses matter more than people expect — the glare off fresh snow at Gulmarg is severe.',
      },
      {
        month: 'March', key: 'march', verdict: 'mixed',
        tempDay: '10 to 17°C', tempNight: '2 to 7°C',
        snow: 'Receding fast and unreliable. Do not plan a trip around it.',
        price: 'Low — the cheapest month of the year', crowd: 'Very quiet',
        body: 'March is the awkward month and the only one we routinely advise against. The snow has largely gone from the valley floor, the almond blossom is brief and easy to miss, and the tulips have not opened yet. It can be grey and wet, and the landscape is between two states rather than in either. It is the cheapest month of the year, and that is not a coincidence.',
        access: 'Higher passes still closed. Gulmarg may have snow at altitude but the bowl is often patchy.',
        packing: 'Layers and a proper waterproof. The weather is genuinely changeable this month.',
      },
      {
        month: 'April', key: 'april', verdict: 'best',
        tempDay: '15 to 22°C', tempNight: '6 to 11°C',
        snow: 'Gone from the valley. Still lying at Gulmarg and on the peaks.',
        price: 'High — tulip season commands a premium', crowd: 'Busy, and the tulip garden very busy',
        body: 'April is when the valley turns. The Indira Gandhi Tulip Garden opens for a window of roughly three to four weeks, the Mughal gardens come into their own, and the days are mild enough to walk all afternoon. The tulip window is short and its exact timing shifts with the season, so book with some flexibility and treat the exact dates as a bonus rather than a guarantee.',
        packing: 'Layers, a light jacket for the evenings, and comfortable walking shoes. Warmer gear if you are going up to Gulmarg.',
      },
      {
        month: 'May', key: 'may', verdict: 'best',
        tempDay: '19 to 26°C', tempNight: '9 to 14°C',
        snow: 'Only at altitude, mostly at Gulmarg and above.',
        price: 'High — school holidays begin', crowd: 'Busy',
        body: 'May is the most forgiving month for a first visit and the one we book most. Everything is open, the valleys are green, the weather is dependable, and you can comfortably do a full day of sightseeing without either freezing or wilting. The trade-off is company — this is peak family-holiday season and the popular spots feel it.',
        packing: 'Ordinary spring clothing plus one warm layer for Gulmarg and Sonmarg, which are considerably cooler than Srinagar.',
      },
      {
        month: 'June', key: 'june', verdict: 'best',
        tempDay: '22 to 30°C', tempNight: '12 to 17°C',
        snow: 'Patches at Thajiwas glacier and around Gulmarg.',
        price: 'Peak — the most expensive month', crowd: 'The busiest month of the year',
        body: 'June is peak season in every sense: the best weather, the fullest access, the highest prices and the largest crowds. It is also the only reliable window for adding Ladakh, since the high passes are open. If your dates are fixed by school holidays this is a fine month; if they are flexible, September delivers a similar experience with fewer people.',
        packing: 'Summer clothing, sun protection, and a light fleece for the higher valleys.',
      },
      {
        month: 'July', key: 'july', verdict: 'mixed',
        tempDay: '24 to 31°C', tempNight: '15 to 20°C',
        snow: 'None accessible.',
        price: 'Mid — softening after the June peak', crowd: 'Moderate',
        body: 'July is when the plains become unbearable and Kashmir becomes an escape, which is exactly why people come. The valley itself gets far less monsoon than the rest of North India, but the approach roads can be affected and mountain weather is less predictable than in the spring months. Fine for Srinagar and the gardens; less dependable for the high valleys.',
        access: 'Landslide risk on the road approaches after heavy rain elsewhere. Flying removes most of this.',
        packing: 'Light clothing plus a genuine rain layer, not just an umbrella.',
      },
      {
        month: 'August', key: 'august', verdict: 'mixed',
        tempDay: '23 to 30°C', tempNight: '14 to 19°C',
        snow: 'None accessible.',
        price: 'Mid', crowd: 'Moderate',
        body: 'August behaves much like July — warm, green, occasionally wet, and a considerable relief from the plains. The saffron fields near Pampore are not yet in bloom and the autumn colour has not started, so this is a month for the lakes and gardens rather than for the landscape at its most dramatic. It suits travellers escaping heat more than travellers chasing scenery.',
        access: 'Same road caveats as July.',
        packing: 'As July. A dry bag for camera gear is worth having on the shikara.',
      },
      {
        month: 'September', key: 'september', verdict: 'best',
        tempDay: '20 to 27°C', tempNight: '10 to 15°C',
        snow: 'None until the very end of the month, and rarely then.',
        price: 'Mid — quietly the best value of the year', crowd: 'Thinning noticeably after the first week',
        body: 'September is the month we recommend when someone asks for the best combination of weather, price and quiet. The monsoon influence has gone, the skies are clear, the crowds have returned to school, and the first autumn tones start appearing in the chinars toward the end. It does everything May does, for less money and with more room.',
        packing: 'Layers. Warm days and genuinely cool evenings, particularly on a houseboat.',
      },
      {
        month: 'October', key: 'october', verdict: 'best',
        tempDay: '14 to 22°C', tempNight: '4 to 9°C',
        snow: 'Possible on the peaks late in the month. Not on the valley floor.',
        price: 'Mid to high', crowd: 'Moderate',
        body: 'October is our own favourite month, and the most photogenic. The chinars turn through yellow and deep red, the saffron blooms near Pampore in the last week or so, and the air is cold and exceptionally clear. Mornings are crisp enough to want a jacket, which is part of why the light is so good. If you are choosing purely on how the valley looks, choose October.',
        packing: 'Proper layers including a warm jacket for mornings and evenings. Gulmarg will already be cold.',
      },
      {
        month: 'November', key: 'november', verdict: 'good',
        tempDay: '8 to 15°C', tempNight: '−1 to 4°C',
        snow: 'Early snow is possible but not dependable. Do not plan around it.',
        price: 'Low — one of the cheapest months', crowd: 'Very quiet',
        body: 'November is cold, clear and almost empty, and for some travellers that combination is ideal. The autumn colour is finishing in the first half of the month and the valley settles into pre-winter stillness after that. It is excellent value. What it is not is a reliable snow month, and people who book it expecting snow are frequently disappointed.',
        access: 'Sonmarg road usually closes at some point this month, timing varying year to year.',
        packing: 'Winter clothing. It is colder than the numbers suggest once the sun drops.',
      },
      {
        month: 'December', key: 'december', verdict: 'good',
        tempDay: '4 to 11°C', tempNight: '−2 to 3°C',
        snow: 'Arrives during the month, but timing varies year to year.',
        price: 'Peak over Christmas and New Year', crowd: 'Very busy in the final two weeks',
        body: 'December is the month people search for most and the one where expectation most often outruns reality. Snow usually arrives, but whether it has arrived by the week you booked is genuinely unpredictable — early December can look much like November. The last fortnight is beautiful, extremely busy and the most expensive stretch of the winter. If snow is non-negotiable, January or February is the safer bet.',
        access: 'Sonmarg road normally closed. Gulmarg gondola subject to wind closures.',
        packing: 'Full winter kit, waterproof boots, gloves. Hotels use bukhari stoves and electric blankets, but corridors and vehicles are cold.',
      },
    ],

    packages: [
      'kashmir-snow-winter-5-nights',
      'classic-kashmir-4-nights',
      'complete-kashmir-6-nights',
      'kashmir-honeymoon-5-nights',
    ],

    author: { name: 'Tariq Ahmad', role: 'Head of Operations, Srinagar' },
    updatedAt: '2026-08-31',

    faqs: [
      {
        q: 'What is the best month to visit Kashmir?',
        a: 'April and May for tulips and gardens, September and October for clear skies and autumn colour. October is the most photogenic and September the best value. For snow, January and February beat December on reliability.',
      },
      {
        q: 'Which month should we avoid?',
        a: 'March. The snow has gone, the tulips have not arrived, and it is frequently grey. It is the cheapest month of the year and that is not a coincidence. We would rather move your dates than take the booking.',
      },
      {
        q: 'Is there guaranteed snow in December?',
        a: 'No, and be careful of anyone who promises it. Snow usually arrives during December but the timing shifts year to year, so early December can look much like November. January and February are considerably more reliable.',
      },
      {
        q: 'When is the tulip garden open?',
        a: 'A window of roughly three to four weeks in April, with exact dates shifting each year according to the season. Book with some flexibility and treat catching it as a bonus rather than the basis of the trip.',
      },
      {
        q: 'When is Kashmir cheapest?',
        a: 'March and November are the two cheapest months. November is genuinely good value for a cold, clear, quiet trip. March is cheap because it is the weakest month of the year.',
      },
      {
        q: 'When can we visit Sonmarg?',
        a: 'Roughly May to October. The road usually closes some time in November and reopens in spring, with exact timing varying year to year. If Sonmarg is essential to your trip, avoid the winter months.',
      },
    ],
  },
];

export function getMonthHub(slug: string): MonthHub | undefined {
  return MONTH_HUBS.find((m) => m.slug === slug);
}
