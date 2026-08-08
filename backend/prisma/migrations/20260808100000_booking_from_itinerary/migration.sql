-- Booking can now be created from an ItineraryOption (in addition to a
-- QuoteOption). Both columns are nullable because a booking that pre-dates
-- this migration has neither and a lead-only booking never had a quote.
ALTER TABLE "Booking" ADD COLUMN "itineraryId"       TEXT;
ALTER TABLE "Booking" ADD COLUMN "itineraryOptionId" TEXT;
