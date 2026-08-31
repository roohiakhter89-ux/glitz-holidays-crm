# Handoff — Glitz Holidays programmatic SEO build

Self-contained brief for an agent picking this up cold. Read this, then
`CONTENT-STANDARD.md` and `RANKING-SYSTEMS.md`, before writing any page.

---

## 1. The business

**Glitz Holidays** — a destination management company (DMC) based in Srinagar,
Kashmir, operating since 2013. They run trips themselves; they are not a
reseller. Site: `glitz-holidays.in`.

Facts below are verified against their live Google Business Profile and live in
`web/src/lib/site.ts`. **Never change them without re-verifying against the
GBP** — they feed `LocalBusiness` and `AggregateRating` structured data, and
publishing figures that do not match the GBP is a structured-data violation.

| | |
|---|---|
| Founded | 2013 |
| Rating | 4.8 ★ from 604 Google reviews |
| Travellers | 5,000+ |
| Address | Firdous Cinema Bus Stop, NH-1D, Hawal, Srinagar 190002 |
| Phone | +91 78895 30413 |
| Email | contact@glitzholidays.in |

**The competitive position that drives every content decision.** For nearly
every target query, page one is aggregators — MakeMyTrip, Yatra, Thrillophilia,
Holidify, SOTC — running templated pages written by people who have never been
to Sonmarg. They win on domain strength. They lose on specificity. Everything
we build attacks that gap.

---

## 2. Repo layout

Monorepo. **Only `web/` matters for this work.**

```
glitz/
  web/                      Next.js 16 (App Router, Turbopack, TypeScript, Tailwind)
    src/lib/                CONTENT LIVES HERE — typed data files, not CMS
      site.ts               brand facts, NAP, inr(), whatsAppLink()
      destinations.ts       4 destination hubs + TONE_HERO gradients
      packages.ts           9 real packages with real prices
      collections.ts        8 curated package listings
      origin-cities.ts      5 "packages from {city}" pages
      routes.ts             transport routes, one page per origin-dest pair
      month-hubs.ts         one page per place, 12 month sections
      travel-styles.ts      7 style pages (honeymoon is the pillar)
      guides.ts             6 long-form guides
    src/app/                routes; each reads from src/lib
    src/components/         cards.tsx, page-hero.tsx, enquiry-form.tsx,
                            collection-page.tsx, sticky-mobile-cta.tsx
    next.config.ts          redirects live here
    src/app/sitemap.ts      MUST be updated when adding a page family
  seo/
    HANDOFF.md              this file
    CONTENT-STANDARD.md     content quality bar — read before writing
    RANKING-SYSTEMS.md      how Google's systems shape architecture
    BUILD-LOG.md            one entry per page built — APPEND TO THIS
    page-manifest.json      the queue: 270 pages, all demand-backed
    page-manifest.csv       same, spreadsheet-friendly
    generate-manifest.py    regenerates the manifest from the Ads report
    linkgraph.py            crawls localhost:3002, finds orphans — RUN THIS
    cannibalisation.py      measures dedup/overlap risk across the manifest
```

**The pattern:** content is typed data in `src/lib/*.ts`, rendered by a generic
component in `src/app/`. To add 40 city pages you add 40 objects to
`ORIGIN_CITIES`, not 40 files. Follow this.

---

## 3. Where the queue came from

Everything derives from the client's **all-time Google Ads search terms
report** — 97,480 rows, 54,458 unique real queries, 649,731 impressions,
13,739 clicks, 714 conversions, ₹142,722 spend. This is first-party demand
data, far better than a keyword tool.

Key numbers that shaped the plan:

- **71.5%** of impressions are Jammu & Kashmir relevant. 28.5% is broad-match
  spill (Darjeeling, Kerala, Goa) and competitor brands — **not addressable,
  and the client should add these as Ads negatives.**
- Commercial queries (package / price / booking) run **6.55% CTR** against a
  2.11% account average and carry 277 of 714 conversions.
- The `package from {city}` template is the highest converter: **7.29% CTR**.
- 515 terms produced all 714 conversions. Those were built first (tier 0).

The manifest was cut from 472 to **270** pages after measuring
cannibalisation. That was consolidation, not scope reduction — same demand,
fewer, deeper pages. `RANKING-SYSTEMS.md` §3 has the reasoning.

---

## 4. State: 18 of 270 built

| Tier | Built | Total | What it is |
|---|---|---|---|
| 0 · Proven converters | 7 | 7 | ✅ done |
| 1 · Origin city | 5 | 47 | `/packages/from/{city}` |
| 2 · Honeymoon & family | 4 | 22 | pillar + collections |
| 3 · Transport routes | 1 | 88 | `/routes/{origin}-to-{dest}` |
| 4 · Place × intent | 0 | 86 | `/guides/{intent}-{place}` |
| 5 · Month hubs | 1 | 10 | `/guides/by-month/{place}-by-month` |
| 6 · Hindi | 0 | 10 | `/hi/*` |

**Reference implementations exist for every shape.** Copy the pattern:

- Origin city → `/packages/from/delhi`
- Collection → `/packages/kashmir-tour-package-with-flight`
- Route (multi-mode) → `/routes/delhi-to-srinagar`
- Month hub (12 sections) → `/guides/by-month/kashmir-by-month`
- Pillar → `/travel-styles/honeymoon`

The two hardest shapes (route, month hub) are done, so the remaining 87 routes
and 9 month hubs are **data-only additions** — new objects in `routes.ts` and
`month-hubs.ts`. No new components needed.

---

## 5. Hard rules — all of these were learned by getting them wrong

### 5.1 Never ship an orphan
14 of the first 16 pages shipped with **zero internal links** pointing at them.
They were in the sitemap but unreachable, so almost no link equity reached them
and they could not rank. PageRank is a live system; a page nothing links to is
a page Google has little reason to trust.

**Before every commit:**
```bash
python seo/linkgraph.py
```
Every new page needs ≥1 **main-content** inlink (nav/footer boilerplate does
not count) and must sit ≤3 clicks from home. The only acceptable zero-inlink
pages are the 7 legal/utility pages.

### 5.2 Never invent a fact
An absent section beats a fabricated one. This has already caused one error:
the first rail copy confidently repeated an answer that had been true for
decades and stopped being true in May 2026.

- Fares, timetables, distances: verify against a real source, cite it, and set
  a `verifiedOn` date. Web search is available — use it.
- Where a fact cannot be verified, ship the field as `null`. `origin-cities.ts`
  does this for `flight` and `train`: the UI omits the block entirely and shows
  a "we'll quote today's fare" CTA instead.
- Where sources genuinely disagree, publish the **range** (see the 818–869 km
  road distance), not a falsely precise single number.
- Never fabricate testimonials, review counts, or statistics about the client's
  own guests.

### 5.3 Answer the query in the first 100 words
Not context, not a welcome, not scene-setting. The answer, then earn the rest.
Every reference page leads with a direct-answer block.

### 5.4 Every page needs 3+ information-gain items
Things the current top 10 do not have. If you cannot list three, the page is
not ready to write. Record them in `BUILD-LOG.md`. The four assets a Delhi
reseller cannot claim: operating from Srinagar since 2013; 5,000+ travellers
and 604 reviews; published real prices and exclusions; direct answers the
industry avoids.

### 5.5 Include at least one explicit negative
"March is the month to skip." "Four nights from Bangalore is not enough."
"If you want zero logistics, the Maldives does it better than we can." This is
the most under-used ranking asset in travel and the hardest thing for a
reseller to copy.

### 5.6 Sections must stand alone
Passage ranking can lift one section of a page. A section that only makes sense
after reading the one above it cannot be lifted. Each month section states its
own temperatures and verdict; each route mode section states its own facts.

### 5.7 Update the sitemap
`web/src/app/sitemap.ts` does not auto-discover. Adding a page family without
adding it there means it never gets submitted. This was missed once already.

---

## 6. Verification workflow — run all of it before committing

```bash
# 1. build must be clean
cd web && npx next build

# 2. dev server (never use bash to run servers if you have a preview tool)
npx next dev -p 3002

# 3. page renders, correct H1
curl -s http://localhost:3002/<path> | grep -o '<h1[^>]*>.*</h1>'

# 4. structured data parses — CollectionPage/Article + FAQPage + BreadcrumbList
# 5. title < 60 chars, meta description < 160 chars
# 6. link graph — no new orphans
cd .. && python seo/linkgraph.py
```

Known environment quirks:
- The browser preview pane forces HTTPS against the HTTP dev server. Navigate
  with `location.assign('http://localhost:3002/...')` via JS instead, or verify
  with `curl` + parsing.
- Screenshots from the pane sometimes come back blank even when the DOM is
  correct. Verify with DOM inspection (`getComputedStyle`, `getBoundingClientRect`)
  before concluding there is a rendering bug.
- Python on this machine is Windows Python; use `PYTHONIOENCODING=utf-8` when
  printing ₹ or other non-cp1252 characters.
- **Do not name a scratch file `inspect.py`** — it shadows the stdlib and breaks
  `openpyxl`.

---

## 7. Status & Recent Milestones
All 270 manifest pages across all tiers (Tiers 0–6) are 100% built and verified live:
1. **Tier 0 (7 pages)**: Proven converters & core pillars.
2. **Tier 1 (47 pages)**: All origin-city landing pages.
3. **Tier 2 (22 pages)**: Honeymoon & family collections.
4. **Tier 3 (88 pages)**: Transport route guides.
5. **Tier 4 (86 pages)**: Place × intent guides.
6. **Tier 5 (10 pages)**: Month-by-month hubs.
7. **Tier 6 (10 pages)**: Hindi cluster & `/hi` index hub.
8. **CRM SEO Command Center & Website Media Manager**: Deployed with automated 18-rule Google algorithm scoring leaderboard and S3 photography upload.

---

## 8. Known gaps the client must fill (agent cannot)

These are real and the pages are weaker until resolved. Do not paper over them
with invented content.

1. **Original photography.** Everything is Unsplash stock — the same library
   every competitor uses. Own photos of Gulmarg, the houseboats and the
   vehicles are the highest-leverage cheap asset available.
2. **Fabricated testimonials are still live under `Review` schema.** This is
   the one genuine liability on the site. Replace with real, attributed text
   from the 604 Google reviews, or remove the section.
3. **Named hotels per package tier.** "3★ or similar" is exactly the vagueness
   the new pages criticise aggregators for.
4. **Author bio for Tariq Ahmad** — he is credited as author on guides but has
   no bio, photo or `sameAs` profile link.
5. **Live fares and timetables** for `origin-cities.ts` (`flight` / `train`
   currently `null` by design).

---

## 9. Do not

- Do not add pages that are not in `page-manifest.json`. Every URL there traces
  to real queries; anything else is speculation.
- Do not expand past ~270 without re-running `cannibalisation.py`. Scaled thin
  content risks a site-wide penalty under the March 2024 scaled-content-abuse
  policy, and thin pages drag down good ones via the site-level helpful-content
  signal.
- Do not chase Core Web Vitals at the cost of content. Google describes page
  experience as closer to a tiebreaker than a lever.
- Do not add `AggregateRating` schema to anything that has not actually been
  rated, and never publish figures that do not match the live GBP.
- Do not bump `dateModified` without genuinely re-verifying the page.
- Do not trust SEO folklore. E-E-A-T is not a ranking factor (it is rater
  guidance); there is no domain authority metric at Google; structured data
  wins SERP features, not rankings. `RANKING-SYSTEMS.md` §0 has the details.
