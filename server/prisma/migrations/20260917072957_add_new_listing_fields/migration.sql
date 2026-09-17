-- Additive step: add new Listing columns without touching existing data.
-- (agentName, agentPhone, area are migrated into the new columns by a
-- backfill script, then dropped in the following migration.)
ALTER TABLE "Listing" ADD COLUMN "listingNumber" TEXT;
ALTER TABLE "Listing" ADD COLUMN "platform" TEXT;
ALTER TABLE "Listing" ADD COLUMN "areaSqm" DOUBLE PRECISION;
ALTER TABLE "Listing" ADD COLUMN "rooms" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "maintenanceFeeIncludes" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Listing" ADD COLUMN "nearestStation" TEXT;
ALTER TABLE "Listing" ADD COLUMN "agents" TEXT NOT NULL DEFAULT '[]';
