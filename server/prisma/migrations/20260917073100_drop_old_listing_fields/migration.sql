-- Old columns fully migrated to agents/areaSqm by the backfill script
-- (with original raw text preserved in memo). Safe to drop now.
ALTER TABLE "Listing" DROP COLUMN "agentName";
ALTER TABLE "Listing" DROP COLUMN "agentPhone";
ALTER TABLE "Listing" DROP COLUMN "area";
