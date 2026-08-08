-- Itinerary builder: Itinerary + ItineraryDay + ItineraryItem.

CREATE TYPE "ItineraryItemKind" AS ENUM (
  'STAY',
  'TRANSFER',
  'SIGHTSEEING',
  'MEAL',
  'ACTIVITY',
  'FREE_TIME',
  'NOTE'
);

CREATE TABLE "Itinerary" (
  "id"          TEXT PRIMARY KEY,
  "code"        TEXT NOT NULL,
  "leadId"      TEXT NOT NULL,
  "createdById" TEXT,
  "title"       TEXT NOT NULL,
  "headline"    TEXT,
  "intro"       TEXT,
  "totalPax"    INTEGER NOT NULL DEFAULT 2,
  "inclusions"  TEXT,
  "exclusions"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Itinerary_leadId_fkey"      FOREIGN KEY ("leadId")      REFERENCES "Lead"("id") ON DELETE CASCADE,
  CONSTRAINT "Itinerary_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE UNIQUE INDEX "Itinerary_code_key" ON "Itinerary"("code");
CREATE INDEX "Itinerary_leadId_idx"      ON "Itinerary"("leadId");

CREATE TABLE "ItineraryDay" (
  "id"          TEXT PRIMARY KEY,
  "itineraryId" TEXT NOT NULL,
  "dayNumber"   INTEGER NOT NULL,
  "date"        TIMESTAMP(3),
  "city"        TEXT,
  "headline"    TEXT,
  "summary"     TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItineraryDay_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "ItineraryDay_itineraryId_dayNumber_key" ON "ItineraryDay"("itineraryId", "dayNumber");
CREATE INDEX "ItineraryDay_itineraryId_idx" ON "ItineraryDay"("itineraryId");

CREATE TABLE "ItineraryItem" (
  "id"          TEXT PRIMARY KEY,
  "dayId"       TEXT NOT NULL,
  "kind"        "ItineraryItemKind" NOT NULL DEFAULT 'SIGHTSEEING',
  "time"        TEXT,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "location"    TEXT,
  "vendorId"    TEXT,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItineraryItem_dayId_fkey"    FOREIGN KEY ("dayId")    REFERENCES "ItineraryDay"("id") ON DELETE CASCADE,
  CONSTRAINT "ItineraryItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id")       ON DELETE SET NULL
);
CREATE INDEX "ItineraryItem_dayId_sortOrder_idx" ON "ItineraryItem"("dayId", "sortOrder");
