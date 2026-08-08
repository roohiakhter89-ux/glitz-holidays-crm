-- Itinerary-as-quote: multi-tier pricing.

-- ---- ItineraryItem: structural qty/units + priceable flag ----
ALTER TABLE "ItineraryItem" ADD COLUMN "quantity"  INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ItineraryItem" ADD COLUMN "units"     INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ItineraryItem" ADD COLUMN "priceable" BOOLEAN NOT NULL DEFAULT false;

-- ---- ItineraryOption: tiers (Budget / Standard / Deluxe) ----
CREATE TABLE "ItineraryOption" (
  "id"                     TEXT PRIMARY KEY,
  "itineraryId"            TEXT NOT NULL,
  "name"                   TEXT NOT NULL,
  "sortOrder"              INTEGER NOT NULL DEFAULT 0,
  "isRecommended"          BOOLEAN NOT NULL DEFAULT false,
  "markupPercent"          DOUBLE PRECISION,
  "totalNet"               INTEGER NOT NULL DEFAULT 0,
  "totalSell"              INTEGER NOT NULL DEFAULT 0,
  "totalMargin"            INTEGER NOT NULL DEFAULT 0,
  "marginPercent"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "markupPercentEffective" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "perPersonSell"          INTEGER NOT NULL DEFAULT 0,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItineraryOption_itineraryId_fkey"
    FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE
);
CREATE INDEX "ItineraryOption_itineraryId_idx" ON "ItineraryOption"("itineraryId");

-- ---- ItineraryItemPricing: per-item, per-option price cell ----
CREATE TABLE "ItineraryItemPricing" (
  "id"            TEXT PRIMARY KEY,
  "itemId"        TEXT NOT NULL,
  "optionId"      TEXT NOT NULL,
  "vendorRateId"  TEXT,
  "vendorId"      TEXT,
  "unitNet"       INTEGER NOT NULL,
  "markupPercent" DOUBLE PRECISION,
  "lineNet"       INTEGER NOT NULL DEFAULT 0,
  "lineSell"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItineraryItemPricing_itemId_fkey"
    FOREIGN KEY ("itemId")   REFERENCES "ItineraryItem"("id")   ON DELETE CASCADE,
  CONSTRAINT "ItineraryItemPricing_optionId_fkey"
    FOREIGN KEY ("optionId") REFERENCES "ItineraryOption"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "ItineraryItemPricing_itemId_optionId_key"
  ON "ItineraryItemPricing"("itemId", "optionId");
CREATE INDEX "ItineraryItemPricing_optionId_idx"
  ON "ItineraryItemPricing"("optionId");
