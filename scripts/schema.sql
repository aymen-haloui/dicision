-- Medical App Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(50),
  medical_record_number VARCHAR(100),
  allergies TEXT,
  comorbidities TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  generic_name VARCHAR(255),
  category VARCHAR(255),
  dosage_form VARCHAR(100),
  default_dosage VARCHAR(100),
  warnings TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drug interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id_1 UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  medication_id_2 UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  interaction_type VARCHAR(255),
  severity VARCHAR(50) CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
  description TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  case_type VARCHAR(50) CHECK (case_type IN ('emergency', 'clinical')) NOT NULL,
  chief_complaint TEXT,
  symptoms TEXT,
  vital_signs JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case medications (prescriptions) table
CREATE TABLE IF NOT EXISTS case_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  route VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  risk_score NUMERIC(5, 2),
  risk_level VARCHAR(50) CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
  findings JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
