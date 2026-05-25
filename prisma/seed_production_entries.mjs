import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env (fallback to .env.local)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPaths = [resolve(__dirname, '../.env'), resolve(__dirname, '../.env.local')]
for (const envPath of envPaths) {
  try {
    const envContent = readFileSync(envPath, 'utf8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {}
}

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED
if (!connectionString) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const requiresSsl = process.env.DB_SSL === 'true' || connectionString.includes('.neon.tech') || /sslmode=require/i.test(connectionString)
const sql = postgres(connectionString, { ssl: requiresSsl })

async function upsertMedication(med) {
  const { name, generic_name, category, dosage_form, default_dosage, warnings, contraindications, max_daily_dose_adult, max_daily_dose_child, pharmacological_data } = med
  const res = await sql`
    INSERT INTO medications (name, generic_name, category, dosage_form, default_dosage, warnings, contraindications, max_daily_dose_adult, max_daily_dose_child, pharmacological_data, created_at)
    VALUES (${name}, ${generic_name}, ${category}, ${dosage_form}, ${default_dosage}, ${warnings}, ${sql.json(contraindications)}, ${max_daily_dose_adult}, ${max_daily_dose_child}, ${sql.json(pharmacological_data)}, now())
    ON CONFLICT (name) DO UPDATE SET
      generic_name = EXCLUDED.generic_name,
      category = EXCLUDED.category,
      dosage_form = EXCLUDED.dosage_form,
      default_dosage = EXCLUDED.default_dosage,
      warnings = EXCLUDED.warnings,
      contraindications = EXCLUDED.contraindications,
      max_daily_dose_adult = EXCLUDED.max_daily_dose_adult,
      max_daily_dose_child = EXCLUDED.max_daily_dose_child,
      pharmacological_data = EXCLUDED.pharmacological_data
    RETURNING id
  `
  return res[0].id
}

async function upsertInteraction(aId, bId, data) {
  // check existing
  const existing = await sql`SELECT id FROM interactions WHERE (medication_id_1 = ${aId} AND medication_id_2 = ${bId}) OR (medication_id_1 = ${bId} AND medication_id_2 = ${aId}) LIMIT 1`
  if (existing.length) {
    const id = existing[0].id
    await sql`UPDATE interactions SET interaction_type = ${data.interaction_type}, severity = ${data.severity}, description = ${data.description}, recommendation = ${data.recommendation}, created_at = now() WHERE id = ${id}`
    return id
  }
  const res = await sql`INSERT INTO interactions (medication_id_1, medication_id_2, interaction_type, severity, description, recommendation, created_at)
    VALUES (${aId}, ${bId}, ${data.interaction_type}, ${data.severity}, ${data.description}, ${data.recommendation}, now()) RETURNING id`
  return res[0].id
}

async function upsertClinicalRule(name, data) {
  const existing = await sql`SELECT id FROM clinical_rules WHERE name = ${name} LIMIT 1`
  if (existing.length) {
    const id = existing[0].id
    await sql`UPDATE clinical_rules SET description = ${data.description}, category = ${data.category}, severity = ${data.severity}, priority = ${data.priority}, enabled = ${data.enabled}, trigger_type = ${data.trigger_type}, conditions = ${JSON.stringify(data.conditions)}, outputs = ${JSON.stringify(data.outputs)}, updated_at = now() WHERE id = ${id}`
    return id
  }
  const res = await sql`INSERT INTO clinical_rules (name, description, category, severity, priority, enabled, trigger_type, conditions, outputs, created_at, updated_at, created_by, tags)
    VALUES (${name}, ${data.description}, ${data.category}, ${data.severity}, ${data.priority}, ${data.enabled}, ${data.trigger_type}, ${JSON.stringify(data.conditions)}, ${JSON.stringify(data.outputs)}, now(), now(), ${data.created_by}, ${data.tags}) RETURNING id`
  return res[0].id
}

async function upsertPatient(patient) {
  // use medical_record_number as unique
  if (!patient.medical_record_number) patient.medical_record_number = `MRN-${Date.now()}`
  const existing = await sql`SELECT id FROM patients WHERE medical_record_number = ${patient.medical_record_number} LIMIT 1`
  if (existing.length) {
    const id = existing[0].id
    await sql`UPDATE patients SET first_name = ${patient.first_name}, last_name = ${patient.last_name}, date_of_birth = ${patient.date_of_birth}, gender = ${patient.gender}, weight = ${patient.weight}, height = ${patient.height}, updated_at = now() WHERE id = ${id}`
    return id
  }
  // find a user to attach to (prefer medecin), otherwise any user, otherwise create a minimal seed user
  let user = await sql`SELECT id FROM users WHERE email = 'medecin@hexa.local' LIMIT 1`
  if (!user.length) user = await sql`SELECT id FROM users LIMIT 1`
  let user_id = user.length ? user[0].id : null
  if (!user_id) {
    const created = await sql`INSERT INTO users (email, password_hash, full_name, specialization, created_at) VALUES ('seed@local', '', 'Seed User', 'seed', now()) RETURNING id`
    user_id = created[0].id
  }
  const res = await sql`INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, medical_record_number, weight, height, created_at)
    VALUES (${user_id}, ${patient.first_name}, ${patient.last_name}, ${patient.date_of_birth}, ${patient.gender}, ${patient.medical_record_number}, ${patient.weight}, ${patient.height}, now()) RETURNING id`
  return res[0].id
}

async function addPatientMedication(patientId, medicationId, medData) {
  const existing = await sql`SELECT id FROM patient_medications WHERE patient_id = ${patientId} AND medication_id = ${medicationId} LIMIT 1`
  if (existing.length) return existing[0].id
  const res = await sql`INSERT INTO patient_medications (patient_id, medication_id, dosage, frequency, route, started_at, ongoing, created_at)
    VALUES (${patientId}, ${medicationId}, ${medData.dosage}, ${medData.frequency}, ${medData.route}, ${medData.started_at}, ${medData.ongoing}, now()) RETURNING id`
  return res[0].id
}

async function run() {
  console.log('Seeding production entries: medications, interactions, clinical rule, patient...')

  // Medications
  const ibuprofen = {
    name: 'Ibuprofen',
    generic_name: 'Ibuprofen',
    category: 'NSAID',
    dosage_form: 'tablet / suspension',
    default_dosage: '200-400 mg per dose',
    warnings: 'Avoid in history of GI bleeding; caution with anticoagulants; avoid in late pregnancy',
    contraindications: ['Hypersensitivity to NSAIDs', 'Active peptic ulcer disease', 'Severe heart failure', 'Severe hepatic or renal impairment', 'Children <6 years (for some formulations)'],
    max_daily_dose_adult: 3200,
    max_daily_dose_child: 30,
    pharmacological_data: {
      mechanism: 'Non-selective COX inhibitor (propionic acid derivative). Analgesic, antipyretic, anti-inflammatory.',
      half_life_hours: 2,
      onset_minutes: 30
    }
  }

  const amoxicillin = {
    name: 'Amoxicillin',
    generic_name: 'Amoxicillin',
    category: 'Antibiotic - Beta-lactam',
    dosage_form: 'tablet / capsule / suspension / injectable',
    default_dosage: '250-1000 mg per dose depending on indication',
    warnings: 'Hypersensitivity reactions; adjust in severe renal impairment',
    contraindications: ['History of penicillin allergy', 'Severe renal impairment (dose adjust)'],
    max_daily_dose_adult: 3000,
    max_daily_dose_child: 100,
    pharmacological_data: {
      mechanism: 'Beta-lactam antibiotic inhibiting cell wall synthesis (PBP binding). Time-dependent bactericidal activity.'
    }
  }

  const ibuprofenId = await upsertMedication(ibuprofen)
  console.log('  - Ibuprofen id:', ibuprofenId)
  const amoxicillinId = await upsertMedication(amoxicillin)
  console.log('  - Amoxicillin id:', amoxicillinId)

  // Interaction: Ibuprofen + Anticoagulant (example: warfarin) - but warfarin may not exist; we'll create an interaction between Ibuprofen and Amoxicillin as a sample (usually low)
  const interactionData = {
    interaction_type: 'Drug-Drug',
    severity: 'MODERATE',
    description: 'Concurrent use of NSAIDs and certain antibiotics may increase bleeding risk or GI side effects; monitor accordingly.',
    recommendation: 'Use with caution; monitor for GI bleeding and consider alternatives in high risk patients.'
  }

  const interactionId = await upsertInteraction(ibuprofenId, amoxicillinId, interactionData)
  console.log('  - Interaction id:', interactionId)

  // Create a simple clinical rule that flags patient on Ibuprofen + Anticoagulant (we'll create a rule that checks for Ibuprofen + any medication with category containing "Anticoagulant" if present)
  const ruleName = 'NSAID + Anticoagulant bleeding risk (sample)'
  const ruleData = {
    description: 'Flag possible increased bleeding risk when patient is taking an NSAID and an anticoagulant.',
    category: 'DRUG_INTERACTION',
    severity: 'HIGH',
    priority: 100,
    enabled: true,
    trigger_type: 'ON_MEDICATION',
    conditions: { description: 'Sample condition: patient on Ibuprofen and any anticoagulant', medications: ['Ibuprofen'], requires_anticoagulant: true },
    outputs: { alerts: [{ message: 'Possible bleeding risk: NSAID + anticoagulant', severity: 'HIGH' }], recommendation: 'Reassess therapy; consider stopping NSAID or consult prescriber.' },
    created_by: 'seed-script',
    tags: ['seeded', 'drug-interaction']
  }

  const ruleId = await upsertClinicalRule(ruleName, ruleData)
  console.log('  - Clinical rule id:', ruleId)

  // Create a test patient
  const patient = {
    first_name: 'Test',
    last_name: 'Patient',
    date_of_birth: '1980-01-01',
    gender: 'MALE',
    medical_record_number: `SEED-MRN-IBU-AMOX`,
    weight: 75,
    height: 175
  }

  const patientId = await upsertPatient(patient)
  console.log('  - Patient id:', patientId)

  // Attach medications to patient
  await addPatientMedication(patientId, ibuprofenId, { dosage: '400 mg', frequency: 'EVERY_6_HOURS', route: 'ORAL', started_at: null, ongoing: true })
  await addPatientMedication(patientId, amoxicillinId, { dosage: '500 mg', frequency: 'EVERY_8_HOURS', route: 'ORAL', started_at: null, ongoing: true })
  console.log('  - Attached medications to patient')

  console.log('\nSeeding completed.')
}

run().catch((err) => {
  console.error('Seeding failed:', err.message)
  process.exit(1)
}).finally(async () => {
  await sql.end()
})
