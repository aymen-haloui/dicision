-- Migration: Extended patient clinical parameters
-- Run against the existing database once.

ALTER TABLE patients
  -- Anthropometric
  ADD COLUMN IF NOT EXISTS height             NUMERIC(5,1),          -- cm

  -- Lifestyle habits
  ADD COLUMN IF NOT EXISTS smoking_status     VARCHAR(50)  DEFAULT 'non-smoker',  -- non-smoker|smoker|e-cigarette|hookah|former
  ADD COLUMN IF NOT EXISTS alcohol_use        VARCHAR(50)  DEFAULT 'none',        -- none|occasional|moderate|heavy
  ADD COLUMN IF NOT EXISTS substance_use      TEXT,                               -- cannabis, stimulants, opioids, etc.
  ADD COLUMN IF NOT EXISTS professional_exposure TEXT,                            -- pesticides, solvents, heavy metals, etc.
  ADD COLUMN IF NOT EXISTS physical_activity  VARCHAR(50),                        -- sedentary|light|moderate|intense|athlete
  ADD COLUMN IF NOT EXISTS diet_type          TEXT,                               -- special diets description
  ADD COLUMN IF NOT EXISTS stress_level       VARCHAR(50),                        -- low|moderate|high
  ADD COLUMN IF NOT EXISTS sleep_quality      VARCHAR(50),                        -- good|insomnia|fragmented
  ADD COLUMN IF NOT EXISTS sleep_hours        NUMERIC(3,1),                       -- hours per night
  ADD COLUMN IF NOT EXISTS night_shift        BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sun_exposure       VARCHAR(50),                        -- low|moderate|high
  ADD COLUMN IF NOT EXISTS prolonged_fasting  BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS restrictive_diet   BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS uncontrolled_natural_products BOOLEAN DEFAULT FALSE,

  -- Medical risk factors
  ADD COLUMN IF NOT EXISTS blood_donor        BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS immunodepression   VARCHAR(50)  DEFAULT 'none',        -- none|disease|treatment
  ADD COLUMN IF NOT EXISTS sudden_medication_stop BOOLEAN  DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS regular_checkup    BOOLEAN      DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS self_diagnosis     BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS housing_conditions TEXT,
  ADD COLUMN IF NOT EXISTS previous_intoxication BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allergy_reaction_types TEXT,                           -- cutaneous|respiratory|anaphylaxis

  -- Enhanced renal biology (creatinine in addition to CrCl)
  ADD COLUMN IF NOT EXISTS creatinine         NUMERIC(6,2),                       -- mg/dL
  ADD COLUMN IF NOT EXISTS renal_stage        VARCHAR(20),                        -- none|G1|G2|G3a|G3b|G4|G5

  -- Enhanced hepatic biology
  ADD COLUMN IF NOT EXISTS asat               NUMERIC(8,2),                       -- U/L
  ADD COLUMN IF NOT EXISTS alat               NUMERIC(8,2),                       -- U/L
  ADD COLUMN IF NOT EXISTS bilirubin          NUMERIC(6,2),                       -- mg/dL

  -- Biological complementary
  ADD COLUMN IF NOT EXISTS glycemia           NUMERIC(6,2),                       -- g/L
  ADD COLUMN IF NOT EXISTS sodium             NUMERIC(6,2),                       -- mEq/L
  ADD COLUMN IF NOT EXISTS potassium          NUMERIC(5,2),                       -- mEq/L
  ADD COLUMN IF NOT EXISTS crp                NUMERIC(8,2),                       -- mg/L
  ADD COLUMN IF NOT EXISTS lactates           NUMERIC(6,2);                       -- mmol/L
