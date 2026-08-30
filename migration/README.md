# Domain migration — glitzholidays.in ➜ glitz-holidays.in

Glitz Holidays has historically operated on **glitzholidays.in** (PHP, est. 2013).
It ranks #1 for the brand name, carries the Google Knowledge Panel, and has
604 Google reviews associated with it.

The new Next.js site lives on **glitz-holidays.in** (hyphenated). This folder
holds everything needed to move the ranking signal across.

## The three domains, after migration

| Domain | Role | Indexed? |
|---|---|---|
| `glitz-holidays.in` | Main brand site (Next.js on Vercel) | **Yes** |
| `glitzholidays.in` | Legacy — 301s everything to the new site | No (redirects) |
| `go.glitz-holidays.in` | Google Ads landers (PHP on cPanel) | **No** — `noindex` |

## Runbook — do these in order

Order matters. Redirecting before the new site is ready throws away the
signal instead of moving it.

### 1. Verify every redirect target returns 200

Every URL in `glitzholidays.in.htaccess` must already exist on the new site.
A 301 pointing at a 404 destroys the equity it was meant to carry.

```bash
for p in / /about /contact /packages /destinations /destinations/kashmir /destinations/ladakh /destinations/vaishno-devi /travel-styles/adventure /privacy-policy /terms-and-conditions /packages/classic-kashmir-4-nights /packages/complete-kashmir-6-nights /packages/kashmir-honeymoon-5-nights; do printf '%s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://glitz-holidays.in$p"; done
```

All should print `200`.

### 2. Set up Search Console on the new domain

Add `glitz-holidays.in` as a property in Google Search Console and verify it
(Vercel exposes a DNS TXT or you can use the HTML meta tag). Submit
`https://glitz-holidays.in/sitemap.xml`.

### 3. Upload the redirect map

Copy `glitzholidays.in.htaccess` to the **document root of the old site** and
rename it to `.htaccess`. If an `.htaccess` already exists there, back it up
first — the new rules should come before any existing PHP routing rules.

Verify:

```bash
curl -sI "https://glitzholidays.in/region.php?r=kashmir" | head -5
```

Expect `HTTP/1.1 301` and `location: https://glitz-holidays.in/destinations/kashmir`.

### 4. File the Change of Address

In Search Console, on the **old** `glitzholidays.in` property:
Settings → Change of address → select `glitz-holidays.in`.

This is the step that actually tells Google the move is intentional. The
redirects alone are treated as ambiguous and transfer far more slowly.

### 5. Update every off-site reference

These are what carry the Knowledge Panel and the review association:

- **Google Business Profile** → Website field → `https://glitz-holidays.in`
- **Instagram** (@glitzholidays9) → bio link
- **Facebook** page → website field
- Any directory listings, JustDial, TripAdvisor, partner sites

### 6. Leave it alone for 12 months

Keep the redirects live and the old domain registered for at least a year.
Authority transfers over repeated crawls, not in one pass. Removing the
redirects early strands the equity mid-move.

## What to expect

- **Weeks 1–3**: rankings wobble. This is normal and not a sign of failure.
- **Weeks 4–8**: new URLs replace old ones in the index; traffic recovers.
- **Months 2–4**: Knowledge Panel reattaches to the new domain.

Because this direction of move (established → new domain) loses roughly
10–15% of link equity in the hop, expect the recovered position to be
slightly below where the old domain sat, then to climb past it as the new
site's much deeper content starts ranking for terms the old one never
targeted.

## If it goes wrong

The move is reversible. Remove the `.htaccess`, cancel the Change of Address
in Search Console, and point the GBP website field back. Do this within the
first few weeks if at all — after that, partial transfer makes a rollback
messier than pressing on.
