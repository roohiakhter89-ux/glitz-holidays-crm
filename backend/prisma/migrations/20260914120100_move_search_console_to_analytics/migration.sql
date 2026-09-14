-- Move any existing Search Console integration onto the ANALYTICS category
-- added by the previous migration.
--
-- Kept separate from the ALTER TYPE because Postgres refuses to use a newly
-- added enum value in the transaction that added it.
--
-- Idempotent: a no-op wherever nothing is filed under the old category.

UPDATE "Integration"
SET "category" = 'ANALYTICS',
    "updatedAt" = NOW()
WHERE "provider" = 'google_search_console'
  AND "category" <> 'ANALYTICS';
