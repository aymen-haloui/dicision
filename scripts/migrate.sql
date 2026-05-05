-- Migration: expand schema for full medical rules support

ALTER TABLE medications ADD COLUMN IF NOT EXISTS contraindications JSONB DEFAULT '[]';
ALTER TABLE medications ADD COLUMN IF NOT EXISTS max_daily_dose_adult DECIMAL;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS max_daily_dose_child DECIMAL;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS toxicity_thresholds JSONB DEFAULT '{}';
ALTER TABLE medications ADD COLUMN IF NOT EXISTS overdose_management TEXT;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS pharmacological_data JSONB DEFAULT '{}';

ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight DECIMAL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS renal_creatinine_clearance DECIMAL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hepatic_status VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS pregnancy_status VARCHAR(50);

CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  common_name VARCHAR(255),
  toxic_parts TEXT,
  toxic_compounds TEXT,
  toxicity_data JSONB DEFAULT '{}',
  overdose_management TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plant_drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  severity VARCHAR(50) CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
  description TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
