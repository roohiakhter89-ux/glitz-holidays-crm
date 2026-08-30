# Ranking systems → build rules

How each of Google's documented ranking systems actually works, and what it
changes about how we build these pages. Ordered by how much leverage it gives
us, not by how often it gets talked about.

Companion to `CONTENT-STANDARD.md`, which covers content quality. This file
covers architecture.

---

## 1. Link analysis and PageRank — the biggest lever we control

**What it is.** PageRank is still live. Google has confirmed they use an
evolved version of it as one of many link signals. It models a surfer following
links; a page accumulates score from the pages that link to it, weighted by
their own score and divided by how many links they emit.

**Why it dominates "ranking quickly".** External links to a new site are slow
and hard. Internal links are free and instant. On a site of this size, the
single strongest predictor of whether a new page ranks within weeks rather than
months is **how much internal equity reaches it and how few clicks it sits from
the home page**.

**What we found when we measured.** The 16 pages built in the last session were
almost entirely orphaned — present in the sitemap, but with no internal link
pointing at them. A crawl from the home page reached 39 pages and found only 2
of the 16. Sitemap-only discovery gets a page crawled; it does not pass equity,
and it is a weak trust signal on its own.

| | Before fix | After fix |
|---|---|---|
| Pages reachable from home | 39 | 54 |
| Of the 16 new pages, reachable | 2 | 16 |
| Avg PageRank of new pages vs site avg | 0.44× | 0.92× |
| Max crawl depth | 2 | 3 |

**Build rules:**

- No page ships without at least one **main-content** inlink from a topically
  related page. Nav and footer links are sitewide boilerplate and carry less
  weight under the reasonable-surfer model.
- Everything within **3 clicks** of the home page.
- Push equity *down* from high-PageRank pages. Package detail pages carry the
  most equity here, so they are the right place to link departure-city and
  comparison pages from.
- Prefer contextual links from a topically matched page over a link in a
  generic hub grid. The honeymoon pillar linking the honeymoon collections is
  worth more than the same link on `/packages`.
- Re-run `scratchpad/linkgraph.py` after every batch. Orphans are invisible
  until measured.

---

## 2. Passage ranking — the system that should reshape the plan

**What it is.** Since 2021 Google can rank an individual passage from a page,
even when the page as a whole is about something broader. The page still has to
be indexed and reasonably authoritative, but a single well-structured section
can win a specific long-tail query.

**Why it matters here.** It undermines the assumption behind a 472-page plan.
The reason to build `kashmir-in-january` as its own URL was to have something
targeting that query. Passage ranking means a well-structured January section
inside a strong `kashmir-by-month` page can win the same query — while the
consolidated page accumulates all the links, all the engagement, and all the
authority that would otherwise be split twelve ways.

**Build rules:**

- Each section must be **self-contained**. A passage that only makes sense
  after reading the previous three cannot be lifted out and ranked.
- Descriptive `<h2>`/`<h3>` that state the question the section answers.
- Answer inside the section — do not defer to a later paragraph.
- Tables and lists inside the section, since those are what get lifted into
  featured snippets.

---

## 3. Deduplication and the site diversity system — why more pages is not more traffic

**Deduplication** filters near-identical documents. **Site diversity** typically
caps a single domain at about two results for a query. Together they punish
exactly the pattern a naive programmatic build produces.

**What we found.** Measured across the manifest:

- **Tier 5:** 108 month pages across only **10 places**. Twelve near-identical
  pages per place, differing mostly by a month name and a temperature.
- **Tier 3:** 157 route pages across **88 origin–destination pairs**. 53 pairs
  carry two or three mode pages competing with each other for the same
  "delhi to srinagar" query family.
- **Tier 6:** 40 of the 45 Hindi pages are mirrors that reuse their source
  page's impressions. That is not additional demand; it is the same demand
  counted twice.

**Consolidation maths:**

| Change | Pages saved |
|---|---|
| One month page per place (12 passages each) | −98 |
| One route page per pair (mode sections) | −69 |
| Drop speculative Hindi mirrors, keep 5 demand-backed seeds | −35 |
| **472 → ~270** | **−43%** |

**This is not scope reduction, it is expected-traffic improvement.** Ten deep
month pages will outrank 108 thin ones, because each accumulates twelve times
the links and engagement, and because 108 near-duplicates risk being filtered
before they ever compete.

---

## 4. BERT — why phrasing matters more than keywords

**What it is.** BERT reads a query bidirectionally, so word order, prepositions
and negation change meaning rather than being discarded as stop words. It
applies to effectively all English queries.

**Build rules:**

- "Kashmir package **from** Delhi" and "Delhi package **from** Kashmir" are
  different queries. Never strip prepositions for keyword density.
- Phrase FAQ questions **exactly as people ask them**, including the function
  words: "can we", "is it safe to", "how many nights do we need", "without".
- Negation is understood. "Which month **not** to visit" is a query we can win
  precisely because competitors avoid answering it.
- Keyword stuffing is not just ignored, it actively reads as lower quality.

---

## 5. RankBrain and neural matching — how the tail gets matched

**RankBrain** interprets queries never seen before by mapping them into an
embedding space. **Neural matching** connects concepts in the query to concepts
in the document. Neither matches strings.

**Why it matters.** A large share of the 54,458 queries in the report are
effectively unique. We cannot build a page per query and should not try. What
we can do is make a page's *concept coverage* rich enough that novel phrasings
land on it.

**Build rules:**

- Cover the entity properly. A Gulmarg page that mentions gondola, Apharwat,
  Kongdoori, phases, altitude, Tangmarg, Khilanmarg and the snow months has a
  far richer representation than one repeating "Gulmarg tour package".
- Cover concept synonyms naturally — cheap / budget / affordable / low cost —
  because users phrase the same intent differently and neural matching bridges
  them.
- This is the real argument for depth over breadth: one comprehensive page
  matches more novel queries than five narrow ones.

---

## 6. Helpful content, now part of core

Folded into core ranking in March 2024, so it is continuous rather than a
periodic penalty. It has a **site-level** component: a large volume of unhelpful
pages can weigh on the whole domain.

**The direct implication for us:** publishing 472 pages where 200 are thin does
not give us 272 good pages plus some filler. It risks dragging the 272 down.
This is the second independent argument for consolidating to ~270 strong pages.

---

## 7. Spam systems — the specific policy this project could trip

**Scaled content abuse** (March 2024) targets generating many pages primarily
to game search, regardless of whether a human or a machine wrote them. A
template that swaps a city name into otherwise identical copy is the textbook
case.

The defence is per-page substance, and it is the same test as in the content
standard: a real price, real transport facts, an original observation, an
explicit negative. If a page cannot carry three, it should be a section on a
parent page rather than a URL.

---

## 8. Freshness (QDF) — apply selectively

Query-deserves-freshness triggers on queries with a recency need. Applies to
month pages, fare pages and anything with a year in the query. Does not apply
to "how to reach Pahalgam".

**Build rule:** only carry a visible `dateModified` where freshness is part of
the intent, and only bump it when the page has genuinely been re-verified.
Bumping dates without changing content is exactly what these classifiers look
for.

---

## 9. Original content systems

Rewards first-hand reporting and prefers the canonical source of a claim. This
is the system that most rewards the one thing we have and aggregators do not —
an office in Srinagar since 2013.

**Build rule:** every page carries at least one observation that could only
come from operating there. The rail correction on
`/routes/delhi-to-srinagar-train` is the model: most competing pages still say
the railway stops short of Srinagar, which stopped being true in May 2026.

---

## 10. Page experience and Core Web Vitals — real but weak

INP replaced FID in March 2024. Google describes page experience as closer to a
tiebreaker than a lever. Worth keeping clean; never worth trading content
quality for.

**Build rules:** reserve space for hero images so the LCP element does not
shift, keep tables in `overflow-x` containers so mobile never scrolls
sideways, and do not let reveal animations leave content invisible if the
observer fails.

---

## Revised plan

| | Original | Revised |
|---|---|---|
| Total pages | 472 | ~270 |
| Month pages | 108 | 10 deep |
| Route pages | 157 | 88 |
| Hindi | 45 | 10 |
| Everything else | 162 | 162 |

Fewer pages, each stronger, each properly linked. Both the deduplication
maths and the site-level helpful-content signal point the same way, and the
link-equity maths says a smaller set concentrates far more PageRank per page.

**Build order stays demand-first:** tier 0 and 1 (commercial, proven
converters), then tier 2, then the consolidated tier 4 place hubs, then routes,
then months.
