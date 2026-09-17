-- Fully additive: building/option details, all nullable or defaulted.
ALTER TABLE "Listing" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "Listing" ADD COLUMN "buildingType" TEXT;
ALTER TABLE "Listing" ADD COLUMN "totalFloors" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "approvalDate" TEXT;
ALTER TABLE "Listing" ADD COLUMN "isViolationBuilding" BOOLEAN;
ALTER TABLE "Listing" ADD COLUMN "parkingAvailable" BOOLEAN;
ALTER TABLE "Listing" ADD COLUMN "options" TEXT NOT NULL DEFAULT '[]';
