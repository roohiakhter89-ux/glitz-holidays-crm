-- Google Search Console performance data at date x page x query grain.
--
-- The Ads search-terms report told us what to build. This tells us whether it
-- worked: which pages rank, for what, and how close to page one.
--
-- All four natural-key columns are NOT NULL on purpose. AdSpend's natural key
-- spans nullable columns and Postgres treats NULLs as distinct, so upserting
-- against it inserts duplicates; this key does not have that problem. Search
-- Console restates recent days, so re-syncing a window must update in place.

CREATE TABLE IF NOT EXISTS "SeoSearchAnalytics" (
  "id"          TEXT NOT NULL,
  "siteId"      TEXT NOT NULL,

  "date"        TIMESTAMP(3) NOT NULL,
  "page"        TEXT NOT NULL,
  "query"       TEXT NOT NULL,

  "clicks"      INTEGER NOT NULL DEFAULT 0,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  -- PERCENT (0-100). The API returns a 0-1.0 fraction.
  "ctr"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "position"    DOUBLE PRECISION NOT NULL DEFAULT 0,

  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeoSearchAnalytics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeoSearchAnalytics_natural_key"
  ON "SeoSearchAnalytics" ("siteId", "date", "page", "query");

CREATE INDEX IF NOT EXISTS "SeoSearchAnalytics_siteId_date_idx"
  ON "SeoSearchAnalytics" ("siteId", "date");

CREATE INDEX IF NOT EXISTS "SeoSearchAnalytics_siteId_page_idx"
  ON "SeoSearchAnalytics" ("siteId", "page");

-- Supports the striking-distance query (positions 11-20).
CREATE INDEX IF NOT EXISTS "SeoSearchAnalytics_siteId_position_idx"
  ON "SeoSearchAnalytics" ("siteId", "position");

ALTER TABLE "SeoSearchAnalytics"
  ADD CONSTRAINT "SeoSearchAnalytics_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "SeoSite" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
