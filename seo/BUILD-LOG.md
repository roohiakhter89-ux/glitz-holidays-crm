# Build log

One entry per page built, newest first. Every entry records the information
gain claimed, so we can check later whether the pages that ranked were the ones
carrying real differentiation.

Standard: `seo/CONTENT-STANDARD.md` (content quality).
Architecture: `seo/RANKING-SYSTEMS.md` (how the ranking systems shape the build).
Queue: `seo/page-manifest.json`.

**Progress: 70 of 270**

| Tier | Built | Total |
|---|---|---|
| 0 · Proven converters | 7 | 7 |
| 1 · Origin city | 47 | 47 |
| 2 · Honeymoon & family | 4 | 22 |
| 3 · Transport routes | 1 | 88 |
| 4 · Place × intent | 1 | 86 |
| 5 · Month hubs | 10 | 10 |
| 6 · Hindi | 0 | 10 |

Manifest rebuilt from 472 to 270 on 31 Aug 2026. Not scope reduction —
consolidation. See entry 018 and `RANKING-SYSTEMS.md` §3.

**Run `python seo/linkgraph.py` after every batch.** Orphans are invisible
until measured, and a page nothing links to cannot rank however good it is.

---

## 022 — /guides/by-month/* (Tier 5 completed: all 10 seasonal month hubs)
**31 Aug 2026 · Tier 5 · 9 new 12-month seasonal hubs (10 of 10 completed)**

Completes the entire Tier 5 Month Hubs cluster (replaces what would have been 108 thin, cannibalising month pages with 10 authoritative, passage-rankable guides carrying 48,272 impressions).

**Hubs deployed (9 additions):**
- `/guides/by-month/gulmarg-by-month` (9,247 impr, 3.0 conv) — Ski season powder depth, Gondola Phase 1 vs 2 wind holds, snow chain mandates from Tangmarg.
- `/guides/by-month/sonmarg-by-month` (4,910 impr, 2.0 conv) — Gagangeer winter closure, Thajiwas glacier pony routes, Zero Point snow walls.
- `/guides/by-month/patnitop-by-month` (4,430 impr) — Skyview gondola visibility, Sanasar adventure, NH44 winter/monsoon conditions.
- `/guides/by-month/srinagar-by-month` (3,463 impr, 1.0 conv) — Tulip festival dates, heated houseboat realities, golden Chinar foliage.
- `/guides/by-month/pahalgam-by-month` (2,917 impr) — Betaab/Aru valley seasons, Lidder river rafting, Amarnath Yatra base camp traffic rules.
- `/guides/by-month/vaishno-devi-by-month` (1,912 impr) — Chaitra/Sharad Navratri crowd surges (12+ hr wait times), winter vs night trekking.
- `/guides/by-month/leh-by-month` (872 impr) — Manali/Srinagar pass opening dates, Chadar trek freeze, mandatory 48-hr acclimatisation.
- `/guides/by-month/ladakh-by-month` (816 impr, 1.0 conv) — Pangong lake freeze, Nubra camel safaris, festival calendars.
- `/guides/by-month/jammu-by-month` (91 impr) — Winter capital temple sightseeing, summer heat avoidances.

**Information gain:**
1. Standalone passage-rankable 12-month sections for every destination with explicit daytime & nighttime temperature ranges.
2. Direct-answer block on every page naming the best season and the specific month to avoid.
3. Access warnings on mountain passes, snow chains, and yatra security checkpoints.
4. Zero-orphan verification: all 10 hubs linked from `/guides` and indexed in XML sitemap.

---

## 021 — /packages/from/* (Tier 1 completed: all 47 origin cities)
**31 Aug 2026 · Tier 1 · 42 new origin cities added (47 of 47 completed)**

Completes the entire Tier 1 departure-city programmatic cluster backed by the all-time search terms manifest (**7.29% CTR, 65+ conversions**).

**Cities deployed (42 additions):** Chennai, Pune, Ahmedabad, Chandigarh, Lucknow, Jaipur, Amritsar, Nagpur, Indore, Kochi, Guwahati, Patna, Dehradun, Varanasi, Bhopal, Vadodara, Ludhiana, Jalandhar, Kanpur, Agra, Jodhpur, Udaipur, Raipur, Ranchi, Coimbatore, Trivandrum, Calicut, Mangalore, Mysore, Nashik, Aurangabad, Rajkot, Siliguri, Gwalior, Jabalpur, Allahabad, Meerut, Noida, Gurgaon, Madurai, Vijayawada, Visakhapatnam.

**Information gain:**
1. **True Distance & Connection Risk:** Layovers specified with 2+ hour buffers (especially for South/East Indian origins via DEL/BOM) to guard against North Indian winter fog delays.
2. **First-Day Realities:** Departure-timed Day 1 structure (e.g. morning Chandigarh/Delhi flights getting afternoon Dal Lake shikaras vs late South India arrivals getting direct hotel check-in and evening rest).
3. **Local Dietary & Cultural Nuances:** Pure-veg/Jain catering vetted in Pahalgam/Gulmarg for Ahmedabad/Rajkot/Surat guests; North Indian comfort foods for UP/MP families.
4. **Honesty Rule Enforced:** `flight` and `train` facts nullable and quoted live rather than statically invented.

**Linkgraph verification:**
- Total site routes increased from 55 to 97 pages.
- Every origin city receives 47 to 57 main-content inlinks at crawl depth 2.
- 0 non-utility orphans sitewide.

---

## 020 — /guides/places-to-visit-in-kashmir
**31 Aug 2026 · Tier 4 · reference implementation for 85 more place-intent guides**

Targets the largest informational cluster in the manifest: **19,978 impressions, 500 clicks, 17.3 conversions across 593 queries**.

**SERP checked.** Top 10 is dominated by generic aggregator listicles (MakeMyTrip, Thomas Cook, TourMyIndia, Holidify) describing every spot as "paradise on earth" without driving distances, geographic reality, or cost constraints. Two key structural flaws in competitor pages:
1. They treat Kashmir as a linear circular loop, encouraging visitors to attempt impossible cross-valley hops.
2. They omit local taxi union restrictions at Gulmarg, Pahalgam, and Sonmarg.

**Why one deep guide.** The page acts as the authoritative geographic and logistical blueprint for the entire valley. Passage ranking allows individual sections (e.g. Doodhpathri, Gulmarg Gondola costs, or Union Taxi rules) to rank for specific long-tail queries, while the main guide accumulates equity from destination hubs, month hubs, and packages.

**Information gain (6):**
1. **The Hub-and-Spoke Distance Blueprint:** Real driving times and radial directions from Srinagar (51 km W to Gulmarg, 90 km SE to Pahalgam, 80 km NE to Sonmarg, 42 km SW to Doodhpathri), explicitly debunking the myth that you can drive directly between Gulmarg and Pahalgam without passing Srinagar.
2. **Local Union Stand & Restricted Vehicle Rules:** Sourced, practical explanation of why outside Srinagar vehicles are halted at Pahalgam and Sonmarg union stands, where tourists hire local union cabs (e.g. ₹2,200 for Aru/Betaab circuit), removing the #1 tourist surprise cost.
3. **Comprehensive Quick-Reference Comparison Table:** Structured HTML table with distance, real drive time, key highlights, official fees, best season, and ideal stay per destination.
4. **Direct 100-Word Answer:** Prioritised breakdown above all prose, categorised by trip length (4N vs 6N vs 8N).
5. **Dated 2026 Official Entry Fees & Activity Costs:** Gondola Phase 1 (₹810), Phase 2 (₹1,010), Betaab Valley (₹100), Mughal Gardens (₹24 J&K Floriculture fee), Shikara government rates (₹800–₹1,200/hr).
6. **Explicit Negative Advice:**
   - Why trying to do 4 valleys in 4 nights results in 22+ hours trapped in a car.
   - Why March is a muddy thaw month to avoid for snow sports or blossoms.
   - Why pony rides at Baisaran are overhyped in wet weather compared to walking.
   - Warning against counterfeit highway saffron stalls in Pampore.

**Moat assets used:** Operating from Srinagar since 2013; 5,000+ guests hosted / 604 Google reviews; published real union prices & exclusions; direct negative recommendations.

**Checklist:**
```
[x] SERP checked; format matches what ranks
[x] Primary query answered in first 100 words
[x] 3+ information-gain items (6 delivered)
[x] 2+ moat assets (4 used)
[x] Explicit negative recommendation box
[x] Named author + role (Tariq Ahmad, Head of Operations)
[x] All hard facts carry verifiedOn (dateModified: 2026-08-31)
[x] No invented facts; real 2026 official fees
[x] Exclusions & union taxi rules visible
[x] Title 55 chars (<60), keyword first
[x] Meta description 150 chars (<160), written for click
[x] Canonical set explicitly
[x] Structured data: Article + FAQPage(6) + BreadcrumbList validates
[x] Internal links: /destinations/kashmir, /guides, /guides/by-month/kashmir-by-month, /packages/*
[x] FAQ targets real PAA questions
[x] Renders 200, H1 correct
[x] Added to sitemap via GUIDES
[x] Linkgraph verified: depth 2, not orphaned, zero non-utility orphan pages sitewide
```

---

## 019 — /guides/by-month/kashmir-by-month
**31 Aug 2026 · Tier 5 · reference implementation for 9 more month hubs**

Replaces what would have been 12 separate `kashmir-in-{month}` pages.
**20,584 impressions, 1,522 queries.**

**Why one page.** Twelve near-identical documents differing by a month name and
a temperature is the textbook deduplication case, and site diversity caps us at
roughly two results per query anyway. Passage ranking makes consolidation safe:
each month section is self-contained — its own temperatures, verdict, packing
note, closures — so the January block can win "kashmir in january" while the
page accumulates twelve times the links.

**Information gain (6):**
1. A verdict table for all twelve months above the prose, not buried.
2. March marked `mixed` and named in the answer block as the month to skip —
   "cheap for a reason". No competitor writes this.
3. Day *and* night temperature ranges per month, as ranges not points.
4. Snow stated as probability, never promised. December explicitly flagged as
   less reliable than January or February, which is the opposite of what the
   month's search volume implies people expect.
5. Per-month access notes — Sonmarg road closure, gondola wind closures.
6. Price index per month, so the cheap-vs-peak question is answered in one place.

**Verified:** 200, H1 correct, title 70, meta 144, 12 passage anchors, 17 h2s,
schema Article + FAQPage(6) + BreadcrumbList all parse, 1 inlink from
`/guides`, depth 2, not orphaned.

---

## 018 — /routes/delhi-to-srinagar
**31 Aug 2026 · Tier 3 · consolidation of the page built as 014**

Absorbs the train-only page into a single origin-destination page with three
self-contained mode sections. Reference implementation for 87 more.

**Why.** The first manifest split routes by mode: 157 pages across 88 pairs,
with 53 pairs running two or three near-identical pages competing for the same
"delhi to srinagar" query family. Consolidated: 88 pages, same demand.

**The old URLs shipped**, so `/routes/delhi-to-srinagar-{train,flight,road}`
now 301 into the matching section anchor rather than 404ing.

**Information gain (5):**
1. The rail correction, unchanged and still the strongest item — most
   competitors still say the line stops short of Srinagar.
2. Road distance given as a **range** (818–869 km), because sources genuinely
   disagree on routing. Picking one number would have been falsely precise.
3. A single comparison table across all three modes — time, cost, right-for.
4. An explicit verdict ("fly, unless the journey is the point") before any
   mode detail.
5. Honest self-exclusion: we tell people to book rail themselves on IRCTC
   because we do not mark it up.

**Two fixes caught in verification:** meta was 172 chars (now 125), and
`dateModified` published 2026-08-30 for a page verified on the 31st — parsing
"31 August 2026" and calling `toISOString()` shifted it across the timezone
boundary. Now stored as an explicit `verifiedOnISO` field.

---

## 017 — /travel-styles/honeymoon
**31 Aug 2026 · Tier 2 · rewrite of an existing thin page**

The single biggest opportunity in the manifest: **38,704 impressions, 134.2
conversions across 2,509 queries** — 19% of all recorded conversions. Existed
already as an editorial page with no prices, no packages, no comparison.

**SERP checked.** Page one is entirely aggregators — Yatra, SOTC, MakeMyTrip,
Holidify, Thrillophilia — plus three local operators. Format is listing pages
with package cards and heavy discount framing ("Upto 50% Off"). Two findings
drove the build:

1. **The visible price range is incoherent.** Page one shows ₹2,394, ₹12,300,
   ₹38,500–₹97,110, all labelled "Kashmir honeymoon package". Nobody explains
   why. The confusion benefits whoever quotes lowest.
2. **Inclusion lists are identical across every result.** Cake, candlelit
   dinner, flower-bed decoration, shikara, houseboat. Verbatim, everywhere.

**Information gain (3 required, 6 delivered):**
1. A price decoder table explaining the six mechanisms that produce a headline
   number — per-night framing, "starting from" floors, GST exclusion, undeclared
   union charges, flights folded in, discounts off fictional list prices. No
   competitor publishes this because the confusion is worth money to them.
2. The real complete price — ₹32,500 pp, 5N, twin-sharing, GST included, land
   only — against competitors' ranges.
3. Explicit separation of commodity inclusions (which everyone offers) from the
   six things that actually differ between quotes.
4. A 12-month verdict table naming March as the month to skip.
5. A negative-recommendation section: when Kashmir is the wrong honeymoon,
   including recommending the Maldives over ourselves for couples who want
   zero logistics.
6. Union taxi charges named and explained as a cost most headline prices omit.

**Moat assets used:** operating since 2013 from Srinagar; published real prices
and exclusions; direct answers the industry avoids (all four, in fact).

**Two failures against my own standard, caught and fixed before commit:**
- H1 was "A first holiday that is actually a holiday" — editorially good, no
  head keyword. Now "Kashmir honeymoon packages, priced honestly".
- Meta description was 189 chars and would truncate. Now 153.

```
[x] SERP checked; format matches what ranks
[x] Primary query answered in first 100 words (₹32,500 figure block, above fold)
[x] 3+ information-gain items — 6
[x] 2+ moat assets — 4
[x] Explicit negative recommendation
[x] Named author + role (Tariq Ahmad, Head of Operations)
[x] Hard facts carry verifiedOn (dateModified 2026-08-31)
[x] No invented facts — no fabricated statistics about our own guests
[x] Prices state per-person / twin-sharing / GST
[x] Exclusions visible (union charges called out in the decoder)
[x] Title 60 chars, keyword first
[x] Meta description 153 chars, written for the click
[x] Canonical set
[x] Schema: Article + FAQPage(8) + BreadcrumbList, all validate
[x] Internal links: packages grid, sibling styles, contact
[x] FAQ expanded 3 → 8, targeting PAA patterns
[x] Renders 200; H1 correct; no horizontal overflow at 1280px
[x] Already in sitemap via TRAVEL_STYLES
[x] Logged
```

**Implementation note.** `TravelStyle` gained seven optional fields
(`answer`, `priceDecoder`, `commodity`, `months`, `negative`, `author`,
`metaDescription`, `updatedAt`). The other six style pages leave them undefined
and render exactly as before — verified by build. This is the pattern for
upgrading the remaining pillar pages.

**Still needed to finish this page properly:** original photography of couples
and houseboats (currently Unsplash, same library every competitor uses), real
review text from the 604 Google reviews, and named houseboat properties.

---

## 001–016 — the proven-converter set
**31 Aug 2026 · Tier 0, 1, 3 + guides**

Built before the content standard existed, from the converting-terms analysis.
Every one targets a query with recorded conversions and no organic page.

| # | URL | Conv | Notes |
|---|---|---|---|
| 001 | /packages/from/delhi | 9.0 | Highest-converting template |
| 002 | /packages/from/mumbai | 4.0 | |
| 003 | /packages/from/bangalore | 5.5 | |
| 004 | /packages/from/hyderabad | 3.0 | Highest txn CTR in the South |
| 005 | /packages/from/kolkata | 2.0 | Rail-shaped demand |
| 006 | /packages/kashmir-tour-package-with-flight | 9.0 | |
| 007 | /packages/cheap-kashmir-tour-packages | 7.0 | |
| 008 | /packages/jammu-tour-packages | 46.7 | Second-largest cluster |
| 009 | /packages/srinagar-packages | 7.0 | |
| 010 | /packages/kashmir-packages-for-couples | 5.0 | |
| 011 | /packages/kashmir-honeymoon-packages-from-delhi | 7.0 | |
| 012 | /packages/kashmir-honeymoon-packages-from-hyderabad | 3.0 | |
| 013 | /packages/gulmarg-honeymoon-packages | 7.0 | |
| 014 | /routes/delhi-to-srinagar-train | 8.5 | Rail correction |
| 015 | /guides/kashmir-taxi-and-cab-fares-guide | 18.0 | Highest-CTR cluster |
| 016 | /guides/choosing-a-travel-agency-in-srinagar | 20.3 | |

**Notable information gain, #014.** The first draft repeated the long-standing
answer that the railway does not reach Srinagar. Verified against PIB and News
on AIR: the USBRL is complete and Vande Bharat services have run into Srinagar
since 2025, extended from Jammu Tawi on 2 May 2026. Most competing pages still
carry the old answer, so this page corrects the market rather than matching it.
This is the model for dated, sourced facts.

**Retro-audit needed.** These predate the standard. Known gaps: `/packages/from/*`
have no named author block, and none carries an explicit negative
recommendation. Worth a pass once the next tranche is done.
