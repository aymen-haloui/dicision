import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
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

const sql = postgres(process.env.DATABASE_URL)

async function check() {
  const demoPatientCount = await sql`SELECT count(*)::int as c FROM patients WHERE medical_record_number = 'DEMO-TOX-001'`
  const demoPatients = await sql`SELECT id, first_name, last_name, medical_record_number FROM patients WHERE medical_record_number LIKE 'DEMO-%' ORDER BY created_at DESC`
  const demoCaseCount = await sql`SELECT count(*)::int as c FROM cases WHERE case_type = 'DEMO_TOXICOLOGY'`
  const demoCases = await sql`SELECT id, patient_id, case_type, status FROM cases WHERE case_type LIKE 'DEMO_%' ORDER BY created_at DESC`

  console.log('demoPatientCount:', demoPatientCount[0].c)
  console.log('demoPatients:', demoPatients.map(p=>({id:p.id, name:`${p.first_name} ${p.last_name}`, mrn:p.medical_record_number})))
  console.log('demoCaseCount:', demoCaseCount[0].c)
  console.log('demoCases:', demoCases.map(c=>({id:c.id, patient_id:c.patient_id, case_type:c.case_type, status:c.status})))

  await sql.end()
}

check().catch(e=>{console.error(e); process.exit(1)})
