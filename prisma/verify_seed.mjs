import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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
const requiresSsl = process.env.DB_SSL === 'true' || connectionString.includes('.neon.tech') || /sslmode=require/i.test(connectionString)
const sql = postgres(connectionString, { ssl: requiresSsl })

async function run() {
  console.log('Verifying seeded entries...')
  const meds = await sql`SELECT id, name, generic_name, category, dosage_form, default_dosage, created_at FROM medications WHERE name IN ('Ibuprofen','Amoxicillin') ORDER BY name`
  console.log('\nMedications:')
  console.log(JSON.stringify(meds, null, 2))

  const interactions = await sql`
    SELECT i.id, i.medication_id_1, i.medication_id_2, i.interaction_type, i.severity, i.description
    FROM interactions i
    WHERE i.medication_id_1 IN (SELECT id FROM medications WHERE name IN ('Ibuprofen','Amoxicillin'))
      OR i.medication_id_2 IN (SELECT id FROM medications WHERE name IN ('Ibuprofen','Amoxicillin'))
  `
  console.log('\nInteractions touching the seeded meds:')
  console.log(JSON.stringify(interactions, null, 2))

  const rules = await sql`SELECT id, name, category, severity, tags FROM clinical_rules WHERE tags @> ARRAY['seeded']::text[] LIMIT 10`
  console.log('\nClinical rules tagged seeded:')
  console.log(JSON.stringify(rules, null, 2))

  const patient = await sql`SELECT id, first_name, last_name, medical_record_number FROM patients WHERE medical_record_number = 'SEED-MRN-IBU-AMOX' LIMIT 1`
  console.log('\nPatient:')
  console.log(JSON.stringify(patient, null, 2))

  if (patient.length) {
    const patientMed = await sql`SELECT pm.id, pm.patient_id, pm.medication_id, m.name, pm.dosage, pm.frequency FROM patient_medications pm JOIN medications m ON m.id = pm.medication_id WHERE pm.patient_id = ${patient[0].id}`
    console.log('\nPatient medications:')
    console.log(JSON.stringify(patientMed, null, 2))
  }

  await sql.end()
}

run().catch((err) => {
  console.error('Verification failed:', err.message)
  process.exit(1)
})
