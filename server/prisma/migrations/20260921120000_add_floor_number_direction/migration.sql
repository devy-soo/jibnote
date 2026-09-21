-- Additive: 구조화된 층수/방향. 기존 "floor" 텍스트 컬럼은 백필 후 별도 마이그레이션에서 제거.
ALTER TABLE "Listing" ADD COLUMN "floorNumber" INTEGER;
ALTER TABLE "Listing" ADD COLUMN "direction" TEXT;
