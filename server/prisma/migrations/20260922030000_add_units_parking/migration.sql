-- Additive: 총 세대수, 총 주차 가능대수.
ALTER TABLE "Listing" ADD COLUMN "totalUnits" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "totalParkingSpots" INTEGER;
