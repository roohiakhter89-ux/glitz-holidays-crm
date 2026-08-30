# Build log

One entry per page built, newest first. Every entry records the information
gain claimed, so we can check later whether the pages that ranked were the ones
carrying real differentiation.

Standard: `seo/CONTENT-STANDARD.md` (content quality).
Architecture: `seo/RANKING-SYSTEMS.md` (how the ranking systems shape the build).
Queue: `seo/page-manifest.json`.

**Progress: 18 of 270**

| Tier | Built | Total |
|---|---|---|
| 0 · Proven converters | 7 | 7 |
| 1 · Origin city | 5 | 47 |
| 2 · Honeymoon & family | 4 | 22 |
| 3 · Transport routes | 1 | 88 |
| 4 · Place × intent | 0 | 86 |
| 5 · Month hubs | 1 | 10 |
| 6 · Hindi | 0 | 10 |

Manifest rebuilt from 472 to 270 on 31 Aug 2026. Not scope reduction —
consolidation. See entry 018 and `RANKING-SYSTEMS.md` §3.

**Run `python seo/linkgraph.py` after every batch.** Orphans are invisible
until measured, and a page nothing links to cannot rank however good it is.

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
