-- Add `vital_signs` JSONB column to `cases` for compatibility with current app
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS vital_signs JSONB DEFAULT '{}'::jsonb;

-- Optionally backfill existing rows with an empty JSON object where NULL:
-- UPDATE cases SET vital_signs = '{}'::jsonb WHERE vital_signs IS NULL;
