-- Give AdSpend a platform-sync identity so pulling from an ad platform is
-- idempotent.
--
-- AdSpend_natural_key spans nullable columns (campaign, landingPageId) and
-- Postgres treats NULLs as distinct in a unique index, so an upsert against it
-- inserts a fresh duplicate on every run instead of updating the existing row.
-- Google Ads restates the last few days of cost data, which means a sync has to
-- be safely re-runnable — hence a key with no nullable part.
--
-- externalSource also marks ownership: a sync only ever touches rows carrying
-- its own source, so figures an operator typed by hand are never overwritten.

ALTER TABLE "AdSpend" ADD COLUMN IF NOT EXISTS "externalSource" TEXT;
ALTER TABLE "AdSpend" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "AdSpend" ADD COLUMN IF NOT EXISTS "syncedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "AdSpend_external_natural_key"
  ON "AdSpend" ("externalSource", "externalId");

CREATE INDEX IF NOT EXISTS "AdSpend_externalSource_idx"
  ON "AdSpend" ("externalSource");
