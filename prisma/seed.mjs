import postgres from 'postgres'
import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    const env = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      env[key] = value
    }
    return env
  } catch {
    return null
  }
}

function parseArgs() {
  const result = { envFile: null }
  const args = process.argv.slice(2)

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--env' && args[i + 1]) {
      result.envFile = args[i + 1]
      i += 1
    } else if (arg === '--help') {
      console.log('Usage: node prisma/seed.mjs [--env .env-file]')
      process.exit(0)
    }
  }

  return result
}

const args = parseArgs()
let databaseUrl = null
let envSource = 'default (.env.local)'

if (args.envFile) {
  const envPath = resolve(__dirname, '..', args.envFile)
  if (!existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`)
  }
  const env = loadEnvFile(envPath)
  if (!env || !env.DATABASE_URL) {
    throw new Error(`DATABASE_URL not found in ${envPath}`)
  }
  databaseUrl = env.DATABASE_URL
  envSource = args.envFile
  console.log('Loaded DATABASE_URL from', envPath)
} else {
  // Try .env.local first, then .env
  for (const file of ['.env.local', '.env']) {
    const envPath = resolve(__dirname, '..', file)
    if (!existsSync(envPath)) continue
    const env = loadEnvFile(envPath)
    if (!env) continue
    for (const [key, value] of Object.entries(env)) {
      if (!process.env[key]) process.env[key] = value
    }
    if (!databaseUrl && env.DATABASE_URL) {
      databaseUrl = env.DATABASE_URL
      envSource = file
      break
    }
  }
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL not found. Set DATABASE_URL in environment or one of .env, .env.local.')
}

console.log('Using DATABASE_URL from', envSource)
const sql = postgres(databaseUrl)

// Demo markers
const DEMO_MEDICAL_RECORD = 'DEMO-TOX-001'
const DEMO_CASE_TYPE = 'DEMO_TOXICOLOGY'

async function run() {
  console.log('Starting demo data refresh for toxicology workflow...')

  // Ensure at least one user exists
  let user = await sql`SELECT id, email FROM users WHERE email = 'admin@hexa.local' LIMIT 1`
  if (!user || user.length === 0) {
    user = await sql`SELECT id, email FROM users LIMIT 1`
    if (!user || user.length === 0) {
      throw new Error('No user account found in users table. Create at least one user before seeding demo data.')
    }
  }
  const userId = user[0].id

  // Remove previous demo cases and demo patient
  console.log('Removing previous demo records (if any)...')
  await sql.begin(async (tx) => {
    await tx`DELETE FROM cases WHERE case_type = ${DEMO_CASE_TYPE}`
    await tx`DELETE FROM patients WHERE medical_record_number = ${DEMO_MEDICAL_RECORD}`
  })

  // Preferred medications to pick from existing medications (include French variants)
  const preferredMeds = [
    'Warfarin', 'Warfarine',
    'Aspirin', 'Aspirine',
    'Furosemide', 'Furosémide',
    'Metformin', 'Metformine',
    'Prednisone'
  ]
  const allMeds = await sql`SELECT id, name FROM medications`
  const meds = allMeds.filter((m) => preferredMeds.includes(m.name))
  if (!meds || meds.length === 0) {
    throw new Error('None of the preferred demo medications were found in medications table. Ensure at least one exists: ' + preferredMeds.join(', '))
  }
  const selectedMeds = meds.slice(0, 2)

  console.log('Selected medications for demo:', selectedMeds.map((m) => m.name).join(', '))

  // Create patient
  console.log('Creating demo patient...')
  const dob = new Date()
  dob.setFullYear(dob.getFullYear() - 67)

  const patientInsert = await sql`
    INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, medical_record_number, weight, height, smoking_status, alcohol_use, stress_level, physical_activity, created_at)
    VALUES (
      ${userId}, 'Marie', 'Dubois', ${dob.toISOString().slice(0, 10)}, 'FEMALE', ${DEMO_MEDICAL_RECORD}, ${58.0}, ${160.0}, 'FORMER', 'NONE', 'MODERATE', 'LOW', now()
    ) RETURNING id
  `
  const patientId = patientInsert[0].id

  // Lifestyle
  await sql`
    INSERT INTO patient_lifestyle (patient_id, smoking_details, stress_details, medical_followup_status, regular_checkup, created_at)
    VALUES (${patientId}, 'Former smoker, quit 10 years ago', 'Moderate', 'Chronic follow-up', true, now())
  `

  // Allergies
  await sql`
    INSERT INTO patient_allergies (patient_id, allergen_name, allergen_category, reaction_type, severity, created_at)
    VALUES (${patientId}, 'Sulfonamides', 'DRUG', 'RASH', 'MODERATE', now())
  `

  // Conditions
  await sql`
    INSERT INTO patient_conditions (patient_id, condition_name, category, severity, status, diagnosed_at, created_at)
    VALUES
      (${patientId}, 'Hypertension', 'CARDIOVASCULAR', 'MODERATE', 'CHRONIC', now(), now()),
      (${patientId}, 'Chronic kidney disease', 'RENAL', 'MODERATE', 'CHRONIC', now(), now()),
      (${patientId}, 'Mild hepatic impairment', 'HEPATIC', 'MILD', 'CHRONIC', now(), now())
  `

  // Create emergency case
  console.log('Creating emergency case linked to patient...')
  const caseInsert = await sql`
    INSERT INTO cases (user_id, patient_id, case_type, chief_complaint, symptoms, status, priority_level, created_at)
    VALUES (
      ${userId}, ${patientId}, ${DEMO_CASE_TYPE}, 'Fatigue and dizziness', 'Fatigue; Dizziness; Medication review requested', 'active', 'high', now()
    ) RETURNING id
  `
  const caseId = caseInsert[0].id

  // Link medications to case and patient
  for (const med of selectedMeds) {
    await sql`
      INSERT INTO case_medications (case_id, medication_id, dosage, frequency, duration, route, created_at)
      VALUES (${caseId}, ${med.id}, ${med.name === 'Warfarin' ? '5 mg' : med.name === 'Aspirin' ? '81 mg' : '10 mg'}, 'once daily', 'ongoing', 'oral', now())
    `
    await sql`
      INSERT INTO patient_medications (patient_id, medication_id, dosage, frequency, route, started_at, ongoing, created_at)
      VALUES (${patientId}, ${med.id}, 'as prescribed', 'once daily', 'oral', now(), true, now())
    `
  }

  // Vitals
  await sql`
    INSERT INTO case_vitals (case_id, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, temperature_c, spo2, measured_at)
    VALUES (${caseId}, 150, 90, 78, 16, 36.7, 97, now())
  `

  // Labs
  await sql`
    INSERT INTO case_lab_results (case_id, test_name, value, unit, abnormal_flag, measured_at)
    VALUES
      (${caseId}, 'Creatinine', 1.8, 'mg/dL', 'H', now()),
      (${caseId}, 'eGFR', 42, 'mL/min/1.73m2', 'L', now()),
      (${caseId}, 'Potassium', 3.3, 'mmol/L', 'L', now()),
      (${caseId}, 'AST', 55, 'U/L', 'H', now()),
      (${caseId}, 'ALT', 48, 'U/L', 'H', now())
  `

  // Symptoms
  await sql`
    INSERT INTO case_symptoms (case_id, symptom_name, severity, duration, created_at)
    VALUES (${caseId}, 'Fatigue', 'MODERATE', '2 days', now()), (${caseId}, 'Dizziness', 'MODERATE', '1 day', now())
  `

  console.log('Demo data created successfully.')

  // Verify
  const verifyPatient = await sql`SELECT id, first_name, last_name, medical_record_number FROM patients WHERE id = ${patientId}`
  const verifyCase = await sql`SELECT id, case_type, status FROM cases WHERE id = ${caseId}`
  const verifyMeds = await sql`SELECT cm.id, m.name FROM case_medications cm JOIN medications m ON m.id = cm.medication_id WHERE cm.case_id = ${caseId}`

  console.log('Verify patient:', verifyPatient[0])
  console.log('Verify case:', verifyCase[0])
  console.log('Medications on case:', verifyMeds.map((r) => r.name).join(', '))
}

run()
  .catch((error) => {
    console.error('Failed to seed demo toxicology data:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await sql.end()
  })
