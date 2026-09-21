-- Additive: 사용자별 "목표 조건" 프로필 (JSON 문자열).
ALTER TABLE "User" ADD COLUMN "preferences" TEXT NOT NULL DEFAULT '{}';
