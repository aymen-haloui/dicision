-- Migration: add vital_signs JSONB to cases
ALTER TABLE "cases"
ADD COLUMN IF NOT EXISTS "vital_signs" JSONB DEFAULT '{}'::jsonb;

-- Optionally backfill NULLs
UPDATE "cases" SET vital_signs = '{}'::jsonb WHERE vital_signs IS NULL;
