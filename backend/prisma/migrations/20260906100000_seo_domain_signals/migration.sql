-- Site-wide off-page signals.
--
-- SeoOffPage is keyed (siteId, url) and holds per-page metrics. Google Business
-- Profile completeness, review volume, citation consistency and site-level
-- referring domains belong to the domain, not to any single URL. Storing them
-- per-page would mean copying identical values across all 270 pages and
-- updating every row whenever a review lands.
--
-- One row per site, lifting every page's score equally.

CREATE TABLE IF NOT EXISTS "SeoDomainSignals" (
  "id"                     TEXT NOT NULL,
  "siteId"                 TEXT NOT NULL,

  "gbpCompleteness"        INTEGER,
  "gbpReviewCount"         INTEGER,
  "gbpAverageRating"       DOUBLE PRECISION,
  "gbpPostsLast30d"        INTEGER,

  "citationsTotal"         INTEGER,
  "citationsNapConsistent" INTEGER,

  "brandMentionsLinked"    INTEGER,
  "brandMentionsUnlinked"  INTEGER,

  "referringDomainsTotal"  INTEGER,
  "toxicDomainCount"       INTEGER,

  "verifiedOn"             TIMESTAMP(3),
  "notes"                  TEXT,

  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeoDomainSignals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeoDomainSignals_siteId_key"
  ON "SeoDomainSignals" ("siteId");

ALTER TABLE "SeoDomainSignals"
  ADD CONSTRAINT "SeoDomainSignals_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "SeoSite" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
