ALTER TABLE patients
ADD COLUMN IF NOT EXISTS extended_profile jsonb DEFAULT '{}'::jsonb;
