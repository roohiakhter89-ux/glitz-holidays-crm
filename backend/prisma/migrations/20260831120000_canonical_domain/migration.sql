-- Point stored SEO records at the canonical domain.
--
-- The business moved from glitzholidays.in (legacy PHP site) to the
-- hyphenated glitz-holidays.in — see migration/README.md. Code defaults were
-- updated in ac3abf8, but that only changed what a NEW SeoSite row is created
-- with. Installations seeded before the move kept the legacy host, and because
-- the seeding path only fires when the table is empty, the old value was never
-- replaced. Every link in the SEO dashboard resolved against it, sending the
-- team to the retired site.
--
-- Written as conditional UPDATEs so this is idempotent — safe to re-run, and a
-- no-op on any environment already using the canonical host.
--
-- SeoSite.url and SeoOffPage(siteId, url) are UNIQUE, so each statement skips
-- rows whose rewritten value would collide with one that already exists.
-- Leaving a duplicate in place is recoverable; failing the migration mid-deploy
-- is not.

UPDATE "SeoSite" AS s
SET "url" = 'https://glitz-holidays.in',
    "updatedAt" = NOW()
WHERE s."url" IN (
  'https://glitzholidays.in',
  'https://www.glitzholidays.in',
  'http://glitzholidays.in',
  'http://www.glitzholidays.in'
)
AND NOT EXISTS (
  SELECT 1 FROM "SeoSite" t WHERE t."url" = 'https://glitz-holidays.in'
);

-- Historic audit rows carry the host they were crawled against. Rewriting the
-- host keeps each row's path intact, so the dashboard can still match an audit
-- to its manifest entry and the leaderboard links resolve correctly.
-- No unique constraint on SeoAudit.url, so no guard needed.
UPDATE "SeoAudit"
SET "url" = replace(
      replace("url", 'https://www.glitzholidays.in', 'https://glitz-holidays.in'),
      'https://glitzholidays.in', 'https://glitz-holidays.in'
    )
WHERE "url" LIKE '%glitzholidays.in%';

-- Off-page metrics are keyed (siteId, url); skip any rewrite that would
-- collide with an existing row for the same site.
UPDATE "SeoOffPage" AS o
SET "url" = replace(
      replace(o."url", 'https://www.glitzholidays.in', 'https://glitz-holidays.in'),
      'https://glitzholidays.in', 'https://glitz-holidays.in'
    ),
    "updatedAt" = NOW()
WHERE o."url" LIKE '%glitzholidays.in%'
AND NOT EXISTS (
  SELECT 1 FROM "SeoOffPage" x
  WHERE x."siteId" = o."siteId"
    AND x."url" = replace(
      replace(o."url", 'https://www.glitzholidays.in', 'https://glitz-holidays.in'),
      'https://glitzholidays.in', 'https://glitz-holidays.in'
    )
);
