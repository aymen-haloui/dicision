import postgres from 'postgres'
import { readFileSync } from 'fs'

// Load .env (simple parser)
try {
  const envContent = readFileSync('./.env', 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    process.env[key] = val
  }
} catch (e) {
  // ignore if no .env
}

const sql = postgres(process.env.DATABASE_URL)

async function main() {
  const haloui = await sql`SELECT id, email, full_name FROM users WHERE full_name ILIKE ${'%haloui%'} OR email ILIKE ${'%haloui%'} LIMIT 1`
  if (!haloui || haloui.length === 0) {
    console.log('Found user: none')
    await sql.end()
    return
  }
  const h = haloui[0]
  console.log('Found user:', `${h.id}\t${h.email}\t${h.full_name}`)

  const adminRes = await sql`SELECT id, email, full_name FROM users WHERE email = ${'admin@hexa.local'} LIMIT 1`
  if (adminRes && adminRes.length > 0) console.log('Admin user:', `${adminRes[0].id}\t${adminRes[0].email}\t${adminRes[0].full_name}`)
  else console.log('Admin user: none')

  const patientCountRes = await sql`SELECT count(*)::int AS cnt FROM patients WHERE user_id = ${h.id}`
  console.log(`Patients owned by ${h.full_name}:`, patientCountRes[0].cnt)

  const samplePatients = await sql`SELECT id, first_name, last_name, medical_record_number, created_at FROM patients WHERE user_id = ${h.id} LIMIT 5`
  console.log('Sample patients (up to 5):')
  for (const p of samplePatients) {
    console.log(`${p.id}\t${p.first_name} ${p.last_name}\tmrn=${p.medical_record_number}\tcreated_at=${p.created_at}`)
  }

  const caseCountRes = await sql`SELECT count(*)::int AS cnt FROM cases WHERE user_id = ${h.id}`
  console.log(`Cases owned by ${h.full_name}:`, caseCountRes[0].cnt)

  const sampleCases = await sql`SELECT id, patient_id, created_at FROM cases WHERE user_id = ${h.id} LIMIT 5`
  console.log('Sample cases (up to 5):')
  for (const c of sampleCases) {
    console.log(`${c.id}\tpatient_id=${c.patient_id}\tcreated_at=${c.created_at}`)
  }

  // Top patient owners
  const topOwners = await sql`SELECT p.user_id, u.email, u.full_name, count(*)::int AS cnt FROM patients p LEFT JOIN users u ON p.user_id = u.id GROUP BY p.user_id, u.email, u.full_name ORDER BY cnt DESC LIMIT 10`
  console.log('Top patient owners:')
  for (const t of topOwners) {
    console.log(`${t.user_id}\t${t.email || 'NULL'}\t${t.full_name || 'NULL'}\tcount=${t.cnt}`)
  }

  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
