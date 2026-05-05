import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

async function migrate() {
  await sql`ALTER TABLE medications ADD COLUMN IF NOT EXISTS contraindications JSONB DEFAULT '[]'`
  await sql`ALTER TABLE medications ADD COLUMN IF NOT EXISTS max_daily_dose_adult DECIMAL`
  await sql`ALTER TABLE medications ADD COLUMN IF NOT EXISTS max_daily_dose_child DECIMAL`
  await sql`ALTER TABLE medications ADD COLUMN IF NOT EXISTS toxicity_thresholds JSONB DEFAULT '{}'`
  await sql`ALTER TABLE medications ADD COLUMN IF NOT EXISTS overdose_management TEXT`
  await sql`ALTER TABLE medications ADD COLUMN IF NOT EXISTS pharmacological_data JSONB DEFAULT '{}'`

  await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight DECIMAL`
  await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS renal_creatinine_clearance DECIMAL`
  await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS hepatic_status VARCHAR(50)`
  await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS pregnancy_status VARCHAR(50)`

  await sql`
    CREATE TABLE IF NOT EXISTS plants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) UNIQUE NOT NULL,
      common_name VARCHAR(255),
      toxic_parts TEXT,
      toxic_compounds TEXT,
      toxicity_data JSONB DEFAULT '{}',
      overdose_management TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS plant_drug_interactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
      severity VARCHAR(50) CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
      description TEXT,
      recommendation TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  console.log('✓ Migration complete')
  await sql.end()
}

migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1) })
