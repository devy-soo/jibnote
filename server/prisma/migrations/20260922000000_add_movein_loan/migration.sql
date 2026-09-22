-- Additive: 입주가능일, 융자금(근저당 등).
ALTER TABLE "Listing" ADD COLUMN "moveInDate" TEXT;
ALTER TABLE "Listing" ADD COLUMN "loanAmount" INTEGER;
