# Content standard

Every page in `page-manifest.json` gets built against this. It exists so that
472 pages come out consistent, and so nobody has to re-derive "what makes a
good page" on page 300.

Read the two sections at the top before writing anything. The rest is checklist.

---

## 0. What is actually true about ranking, and what is folklore

A lot of SEO advice is repeated confidently and is wrong. Building 472 pages on
a wrong premise is expensive, so this section separates what Google has stated
from what the industry assumes.

**True, stated by Google:**

- **E-E-A-T is not a ranking factor.** It is a concept in the Search Quality
  Rater Guidelines. Raters do not touch rankings — they evaluate whether an
  algorithm change made results better. Google then builds signals that
  *approximate* what raters reward. So E-E-A-T is worth engineering toward, but
  there is no E-E-A-T score to optimise, and anyone selling you one is guessing.
- **The helpful content system was folded into core ranking in March 2024.** It
  is no longer a separate classifier that gets "lifted". It is continuous.
- **Page experience is not one system.** Core Web Vitals are real but weak, and
  Google describes them as closer to a tiebreaker than a lever. Do not trade
  content quality for a Lighthouse score.
- **Structured data does not raise rankings.** It qualifies you for SERP
  features, which raises clicks. That is worth having, but it is a CTR play,
  not a ranking play.
- **There is no domain authority metric at Google.** DA and DR are third-party
  inventions from Moz and Ahrefs. Useful as rough proxies, meaningless as targets.

**Load-bearing but often misunderstood:**

- **Intent match beats everything.** The most common reason a well-written page
  fails is that it answers a different question than the one being asked. Check
  the live SERP before writing. If the top ten are all comparison tables, an
  essay will not win however good it is.
- **Information gain is the real differentiator.** Google holds a patent on
  scoring how much a document adds beyond what the user has already seen. On
  commodity travel queries, every competitor says the same eight things. The
  page that ranks is the one carrying something the other nine do not have.
- **Freshness is query-dependent.** "Kashmir in December" needs a current year
  and recent dates. "How to reach Pahalgam" does not. Do not churn pages that
  do not need it.

**What we are actually competing against.** For most of these queries the top
ten is aggregators — MakeMyTrip, Thrillophilia, TourMyIndia, Holidify — running
templated pages assembled by people who have not been to Sonmarg. They win on
domain strength. They lose on specificity, and that is the entire opening.

---

## 1. The moat: what only Glitz can say

Before writing any page, answer: **what goes on this page that a Delhi-based
reseller physically cannot write?** If the answer is nothing, the page will not
rank and should not be built.

Glitz has four assets no aggregator has. Every page must use at least two.

1. **Operating since 2013 from Srinagar.** Not a marketing office. This licenses
   first-person statements — "the union stand moved last year", "the road shuts
   about a week earlier than people expect" — that a reseller cannot make.
2. **5,000+ travellers and 604 Google reviews at 4.8.** Real operational
   volume. Patterns from that volume are proprietary data: what people complain
   about, what they get wrong, which month disappoints.
3. **Real prices and real exclusions.** Aggregators publish ranges and hide
   exclusions. Publishing the actual floor price and the actual union charges is
   a trust signal competitors will not copy, because copying it costs them money.
4. **Direct answers to things the industry avoids.** Whether the gondola is
   worth it in March. Whether four nights is enough. When the answer is "no",
   say no. This is the single most under-used ranking asset in travel.

**Experience is the E most travel sites cannot fake, and it is the one Google
added most recently.** Lean on it everywhere.

---

## 2. Intent match

Before writing, classify the primary query and build the format that matches.

| Intent | Signals in query | Format that wins |
|---|---|---|
| Transactional | package, price, cost, booking, from {city} | Price up front, comparison cards, CTA above fold, FAQ |
| Commercial investigation | best, vs, which, cheapest, review | Comparison table, explicit recommendation, trade-offs |
| Informational | how, what, when, places to visit, best time | Direct answer in first 100 words, then structure |
| Navigational | brand names | Do not build |

**The first 100 words must answer the query.** Not context, not a welcome, not
a paragraph about the beauty of the valley. The answer. Then earn the rest.

Check the live SERP for the primary query before writing. Note: which formats
rank, whether there is a featured snippet and what shape it is (paragraph, list,
table), what People Also Ask contains, and whether it is dominated by one
content type. Write the FAQ block to target PAA questions verbatim.

---

## 3. Information gain: the required test

Every page must carry at least **three** items from this list that the current
top ten do not have. Record which three in the build log.

- A specific price where competitors show a range
- A named property, vehicle, or operator where competitors say "3★ or similar"
- A dated fact with a source (see the rail correction on
  `/routes/delhi-to-srinagar-train` for the model)
- A number derived from our own operations that nobody else holds
- An explicit negative recommendation — who should *not* do this, which month to
  avoid, when the answer is "book something else"
- A cost or constraint the industry omits (union charges, gondola closures,
  altitude limits, road closure windows)
- Original photography of the actual place
- A first-hand observation only a local operator would know

**If you cannot list three, the page is not ready to write.**

---

## 4. Trust (the T is the most important letter)

Non-negotiable on every page:

- Named author with a real role and real credentials. Not "Admin", not the brand.
- `dateModified` accurate, and actually re-verified when bumped. Bumping a date
  without changing anything is the kind of thing classifiers are built to catch.
- Prices carry what they include: per person, twin-sharing, GST status.
- Exclusions published on the page, not in a PDF sent after payment.
- NAP identical to the Google Business Profile, character for character.
- Any hard fact — timetable, fare, altitude, distance — carries `verifiedOn`
  and a source link where one exists.
- **Never invent a fact to fill a slot.** An absent section beats a fabricated
  one. This has already caught us once: the first draft of the rail copy
  confidently repeated a fact that had been true for decades and stopped being
  true in May 2026.

---

## 5. Structure and on-page

- One `<h1>`, containing the primary query's head term, phrased like a human.
- `<h2>`/`<h3>` mapped to sub-intents from People Also Ask and related searches.
- Title tag: primary keyword first, differentiator second, brand last. Under
  60 characters where possible; do not truncate the keyword to fit the brand.
- Meta description: written for the click, not the crawler. State the specific
  thing this page has that the others do not.
- Canonical set explicitly on every page.
- **Word count is not a target.** Match the depth the intent needs. A route page
  answering one question in 800 words beats the same page padded to 2,000.
- Tables for anything comparative. They win featured snippets and they are how
  people actually read this information.
- Internal links: every page links up to its hub, sideways to 2–3 genuine
  siblings, and down to the commercial page it feeds. Descriptive anchors, never
  "click here".
- Alt text describes the image for someone who cannot see it. It is not a
  keyword slot.

---

## 6. Structured data

Ships on every page. Wins SERP features; does not raise rankings.

| Page type | Schema |
|---|---|
| Package | `TouristTrip` + `Offer` + `FAQPage` + `BreadcrumbList` |
| Collection / origin city | `CollectionPage` + `ItemList` + `FAQPage` + `BreadcrumbList` |
| Guide / route | `Article` + `FAQPage` + `BreadcrumbList` |
| Destination hub | `TouristDestination` + `FAQPage` + `BreadcrumbList` |
| Sitewide | `TravelAgency`/`LocalBusiness` + `WebSite` |

`AggregateRating` only where the rating genuinely applies to that entity, and
only matching the live GBP figures. Marking up a rating for something that has
not been rated is a structured-data violation and risks a manual action.

---

## 7. The helpful-content self-assessment

Google publishes these questions. Answer them honestly per page; if any answer
is uncomfortable, fix the page rather than the answer.

- Does this present original information, reporting, or analysis?
- Would someone feel they learned enough to achieve their goal?
- Would they be comfortable trusting this for a transaction?
- Does it read as written by an expert who has actually done the thing?
- Is this a summary of what others said, without adding value?
- Was it made primarily to rank, rather than to help?
- Does it leave the reader needing to search again to get a complete answer?

The last one is the most useful. **A page that sends the reader back to Google
has failed regardless of where it ranks.**

---

## 8. Per-page checklist

Copy into the build log for every page.

```
[ ] SERP checked; format matches what ranks
[ ] Primary query answered in first 100 words
[ ] 3+ information-gain items listed
[ ] 2+ of the four Glitz moat assets used
[ ] At least one explicit negative recommendation
[ ] Named author + role
[ ] All hard facts carry verifiedOn (+ source where one exists)
[ ] No invented facts; absent beats fabricated
[ ] Prices state per-person / twin-sharing / GST
[ ] Exclusions visible on page
[ ] Title < 60 chars, keyword first
[ ] Meta description written for the click
[ ] Canonical set
[ ] Structured data per section 6, validates
[ ] Internal links: up to hub, 2-3 siblings, down to commercial
[ ] FAQ targets real PAA questions
[ ] Renders 200, H1 correct, no CLS on hero
[ ] Added to sitemap
[ ] Logged in BUILD-LOG.md
```

---

## 9. What we cannot fake, and must therefore source

These are real gaps. The pages are built to hold them and are weaker until
filled. Listed so they do not get forgotten.

- **Original photography.** Currently Unsplash stock. Every competitor uses the
  same library. Own photos of Gulmarg, Pahalgam, the houseboats and the vehicles
  are the single highest-leverage asset available, and the cheapest to produce.
- **Real testimonials.** Fabricated reviews under `Review` schema are a
  liability, not an asset. Real text from the 604 Google reviews, attributed.
- **Named hotels per package tier.** "3★ or similar" is exactly the vagueness
  we criticise aggregators for.
- **Author bios with genuine credentials.** Tariq Ahmad appears as author; the
  page needs a real bio, photo and ideally an `sameAs` profile link.
- **Live fares and timetables.** See the null-by-design pattern in
  `origin-cities.ts`.
