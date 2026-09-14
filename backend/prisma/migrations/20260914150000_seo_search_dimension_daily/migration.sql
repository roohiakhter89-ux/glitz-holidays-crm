-- Search Console totals by one dimension per day: site, page, device, country.
--
-- Google omits anonymized queries from any breakdown by query while still
-- counting them in totals, so site and page figures summed from the
-- query-level table come out too low. These rows come from pulls without the
-- query dimension and are what the dashboard headline figures use.
--
-- All natural-key columns are NOT NULL (the site row uses an empty key), so the
-- unique index genuinely dedupes on re-sync.

CREATE TABLE IF NOT EXISTS "SeoSearchDimensionDaily" (
  "id"          TEXT NOT NULL,
  "siteId"      TEXT NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "dimension"   TEXT NOT NULL,
  "key"         TEXT NOT NULL,
  "clicks"      INTEGER NOT NULL DEFAULT 0,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "ctr"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "position"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeoSearchDimensionDaily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeoSearchDimensionDaily_natural_key"
  ON "SeoSearchDimensionDaily" ("siteId", "date", "dimension", "key");

CREATE INDEX IF NOT EXISTS "SeoSearchDimensionDaily_siteId_dimension_date_idx"
  ON "SeoSearchDimensionDaily" ("siteId", "dimension", "date");

ALTER TABLE "SeoSearchDimensionDaily"
  ADD CONSTRAINT "SeoSearchDimensionDaily_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "SeoSite" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
