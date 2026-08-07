-- Rate lookups filter on the contract period, so index it.
CREATE INDEX "VendorRate_validFrom_validTo_idx" ON "VendorRate"("validFrom", "validTo");

-- The natural key of a rate line in a supplier contract. Stops the same rate
-- being entered twice with different prices, where whichever sorted first
-- would silently win the quote.
--
-- mealPlan and rateBasis are part of the key on purpose: one hotel legitimately
-- has Deluxe/Peak at both CP and MAP for the same dates.
--
-- Postgres treats NULLs as distinct in a unique index, so this only bites once
-- mealPlan / rateBasis / validFrom are filled in.
CREATE UNIQUE INDEX "VendorRate_natural_key" ON "VendorRate"("vendorId", "variant", "season", "mealPlan", "rateBasis", "validFrom");
