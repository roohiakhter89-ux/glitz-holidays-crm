-- Attribution module. See prisma/schema.prisma for the "why" of the shape.
-- This migration is additive — no existing tables are touched except Lead,
-- which gains a nullable visitId column and index.

CREATE TYPE "AdChannel" AS ENUM (
  'GOOGLE_ADS',
  'META_ADS',
  'INSTAGRAM',
  'YOUTUBE',
  'LINKEDIN',
  'SEO',
  'EMAIL',
  'AFFILIATE',
  'OTHER'
);

CREATE TABLE "LandingPage" (
  "id"        TEXT PRIMARY KEY,
  "slug"      TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "url"       TEXT,
  "campaign"  TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "LandingPage_slug_key" ON "LandingPage"("slug");
CREATE INDEX "LandingPage_isActive_idx" ON "LandingPage"("isActive");

CREATE TABLE "Visit" (
  "id"            TEXT PRIMARY KEY,
  "visitorId"     TEXT NOT NULL,
  "sessionId"     TEXT NOT NULL,
  "landingPageId" TEXT,
  "pagePath"      TEXT NOT NULL,
  "utmSource"     TEXT,
  "utmMedium"     TEXT,
  "utmCampaign"   TEXT,
  "utmTerm"       TEXT,
  "utmContent"    TEXT,
  "gclid"         TEXT,
  "fbclid"        TEXT,
  "referrer"      TEXT,
  "keyword"       TEXT,
  "device"        TEXT,
  "userAgent"     TEXT,
  "ipAddress"     TEXT,
  "country"       TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Visit_landingPageId_fkey"
    FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE SET NULL
);
CREATE INDEX "Visit_visitorId_idx" ON "Visit"("visitorId");
CREATE INDEX "Visit_sessionId_idx" ON "Visit"("sessionId");
CREATE INDEX "Visit_landingPageId_createdAt_idx" ON "Visit"("landingPageId", "createdAt");
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");

CREATE TABLE "AdSpend" (
  "id"            TEXT PRIMARY KEY,
  "spendDate"     TIMESTAMP(3) NOT NULL,
  "channel"       "AdChannel" NOT NULL DEFAULT 'GOOGLE_ADS',
  "campaign"      TEXT,
  "adGroup"       TEXT,
  "landingPageId" TEXT,
  "amount"        INTEGER NOT NULL,
  "currency"      TEXT NOT NULL DEFAULT 'INR',
  "impressions"   INTEGER,
  "clicks"        INTEGER,
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdSpend_landingPageId_fkey"
    FOREIGN KEY ("landingPageId") REFERENCES "LandingPage"("id") ON DELETE SET NULL
);
-- Natural key: one spend row per (day, channel, campaign, page). NULLs count
-- as distinct in Postgres, so this only blocks duplicates once campaign +
-- landingPageId are filled in — a "channel total" row (both null) and a
-- specific-campaign row for the same day will coexist. That is intentional:
-- the operator uploads what the ad platform gives them; the report layer
-- avoids double-counting by preferring the most specific row.
CREATE UNIQUE INDEX "AdSpend_natural_key" ON "AdSpend"("spendDate", "channel", "campaign", "landingPageId");
CREATE INDEX "AdSpend_spendDate_idx" ON "AdSpend"("spendDate");
CREATE INDEX "AdSpend_channel_idx" ON "AdSpend"("channel");
CREATE INDEX "AdSpend_landingPageId_idx" ON "AdSpend"("landingPageId");

-- Link a captured lead back to the visit that produced it. Nullable — manual
-- adds and re-enquiries don't have a visit.
ALTER TABLE "Lead" ADD COLUMN "visitId" TEXT;
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_visitId_fkey"
  FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL;
CREATE INDEX "Lead_visitId_idx" ON "Lead"("visitId");
