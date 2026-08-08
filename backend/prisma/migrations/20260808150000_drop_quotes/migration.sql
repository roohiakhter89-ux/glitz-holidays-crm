-- Quotes module retired. The itinerary carries the price now (see
-- ItineraryOption + ItineraryItemPricing). Dropping the tables + the two
-- legacy Booking FKs. No data is being migrated because the itinerary path
-- has been the only one used in practice.

ALTER TABLE "Booking" DROP COLUMN IF EXISTS "quoteId";
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "quoteOptionId";

DROP TABLE IF EXISTS "QuoteLine" CASCADE;
DROP TABLE IF EXISTS "QuoteOption" CASCADE;
DROP TABLE IF EXISTS "Quote" CASCADE;
DROP TYPE  IF EXISTS "QuoteStatus";
