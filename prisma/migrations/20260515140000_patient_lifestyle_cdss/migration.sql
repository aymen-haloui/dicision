-- Ensure the table exists so ALTER TABLE statements are idempotent
CREATE TABLE IF NOT EXISTS "patient_lifestyle" (
		"id" UUID NOT NULL DEFAULT gen_random_uuid(),
		"patient_id" UUID NOT NULL,
		"created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
		CONSTRAINT "patient_lifestyle_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'patient_lifestyle_patient_id_fkey'
    ) THEN
        ALTER TABLE "patient_lifestyle"
            ADD CONSTRAINT "patient_lifestyle_patient_id_fkey"
            FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END$$;

-- CDSS patient profile: lifestyle & special risk fields
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "substance_use" BOOLEAN DEFAULT false;
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "substance_type" VARCHAR(100);
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "substance_frequency" VARCHAR(100);
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "substance_route" VARCHAR(50);
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "fasting_type" VARCHAR(100);
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "fasting_frequency" VARCHAR(100);
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "special_condition_type" VARCHAR(50);
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "special_diagnosis" TEXT;
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "special_stage_classification" VARCHAR(100);
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "special_active_disease" BOOLEAN DEFAULT false;
ALTER TABLE "patient_lifestyle" ADD COLUMN IF NOT EXISTS "special_treatment_types" TEXT;
