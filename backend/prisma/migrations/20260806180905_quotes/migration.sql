-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('HOTEL', 'HOUSEBOAT', 'TRANSPORT', 'GUIDE', 'ACTIVITY', 'RESTAURANT', 'PHOTOGRAPHER', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('PEAK', 'SHOULDER', 'OFF', 'FESTIVE');

-- CreateEnum
CREATE TYPE "MealPlan" AS ENUM ('EP', 'CP', 'MAP', 'AP');

-- CreateEnum
CREATE TYPE "RateBasis" AS ENUM ('PER_ROOM_NIGHT', 'PER_PERSON', 'PER_PERSON_NIGHT', 'PER_VEHICLE_DAY', 'PER_TRANSFER', 'PER_UNIT');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('HOTEL', 'TRANSPORT', 'ACTIVITY', 'FLIGHT', 'GUIDE', 'MEAL', 'PERMIT', 'MISC');

-- CreateEnum
CREATE TYPE "MarkupMode" AS ENUM ('INHERIT', 'PERCENT', 'FIXED', 'MANUAL');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REVISED');

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VendorType" NOT NULL DEFAULT 'HOTEL',
    "city" TEXT,
    "area" TEXT,
    "address" TEXT,
    "starRating" INTEGER,
    "falconGrade" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "altPhone" TEXT,
    "email" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifsc" TEXT,
    "gstin" TEXT,
    "panNumber" TEXT,
    "paymentTerms" TEXT,
    "unionZone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRate" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "season" "Season" NOT NULL DEFAULT 'PEAK',
    "mealPlan" "MealPlan",
    "rateBasis" "RateBasis" NOT NULL DEFAULT 'PER_ROOM_NIGHT',
    "netRate" INTEGER NOT NULL,
    "rackRate" INTEGER,
    "extraBedRate" INTEGER,
    "childRate" INTEGER,
    "maxOccupancy" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultMarkupPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "hotelMarkupPercent" DOUBLE PRECISION,
    "transportMarkupPercent" DOUBLE PRECISION,
    "activityMarkupPercent" DOUBLE PRECISION,
    "flightMarkupPercent" DOUBLE PRECISION,
    "guideMarkupPercent" DOUBLE PRECISION,
    "mealMarkupPercent" DOUBLE PRECISION,
    "permitMarkupPercent" DOUBLE PRECISION,
    "miscMarkupPercent" DOUBLE PRECISION,
    "minMarginPercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "monthlyOverhead" INTEGER,
    "filesPerMonth" INTEGER,
    "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "roundTo" INTEGER NOT NULL DEFAULT 10,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "title" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "leadId" TEXT NOT NULL,
    "createdById" TEXT,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteOption" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "children" INTEGER NOT NULL DEFAULT 0,
    "nights" INTEGER NOT NULL DEFAULT 0,
    "markupPercent" DOUBLE PRECISION,
    "totalNet" INTEGER NOT NULL DEFAULT 0,
    "totalSell" INTEGER NOT NULL DEFAULT 0,
    "totalMargin" INTEGER NOT NULL DEFAULT 0,
    "marginPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markupPercentEffective" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perPersonSell" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'HOTEL',
    "description" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorRateId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "units" INTEGER NOT NULL DEFAULT 1,
    "unitNet" INTEGER NOT NULL,
    "markupMode" "MarkupMode" NOT NULL DEFAULT 'INHERIT',
    "markupValue" DOUBLE PRECISION,
    "lineNet" INTEGER NOT NULL DEFAULT 0,
    "lineSell" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vendor_type_idx" ON "Vendor"("type");

-- CreateIndex
CREATE INDEX "Vendor_city_idx" ON "Vendor"("city");

-- CreateIndex
CREATE INDEX "Vendor_isActive_idx" ON "Vendor"("isActive");

-- CreateIndex
CREATE INDEX "VendorRate_vendorId_idx" ON "VendorRate"("vendorId");

-- CreateIndex
CREATE INDEX "VendorRate_season_idx" ON "VendorRate"("season");

-- CreateIndex
CREATE INDEX "VendorRate_isActive_idx" ON "VendorRate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE INDEX "Quote_leadId_idx" ON "Quote"("leadId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "QuoteOption_quoteId_idx" ON "QuoteOption"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteLine_optionId_idx" ON "QuoteLine"("optionId");

-- AddForeignKey
ALTER TABLE "VendorRate" ADD CONSTRAINT "VendorRate_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteOption" ADD CONSTRAINT "QuoteOption_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuoteOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
