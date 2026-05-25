ALTER TABLE "patients"
  ADD COLUMN IF NOT EXISTS "breastfeeding_status" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pregnancy_trimester" VARCHAR(20);

ALTER TABLE "patient_lifestyle"
  ADD COLUMN IF NOT EXISTS "blood_donor" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "diet_type" TEXT,
  ADD COLUMN IF NOT EXISTS "housing_conditions" TEXT,
  ADD COLUMN IF NOT EXISTS "immunodepression" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "night_shift" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "previous_intoxication" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "prolonged_fasting" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "regular_checkup" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "restrictive_diet" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "self_diagnosis" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sleep_hours" DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS "sudden_medication_stop" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sun_exposure" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "uncontrolled_natural_products" BOOLEAN DEFAULT false;
