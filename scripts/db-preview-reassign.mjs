import postgres from 'postgres'
import { readFileSync } from 'fs'

// Defaults: source = medecin@hexa.local, target = admin@hexa.local
const SOURCE_EMAIL = process.env.SOURCE_EMAIL || 'medecin@hexa.local'
const TARGET_EMAIL = process.env.TARGET_EMAIL || 'admin@hexa.local'

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
  // ignore
}

const sql = postgres(process.env.DATABASE_URL)

async function main(){
  const src = await sql`SELECT id, email, full_name FROM users WHERE email = ${SOURCE_EMAIL} LIMIT 1`
  const tgt = await sql`SELECT id, email, full_name FROM users WHERE email = ${TARGET_EMAIL} LIMIT 1`
  if (!src || src.length === 0) { console.error('Source user not found:', SOURCE_EMAIL); await sql.end(); process.exit(1) }
  if (!tgt || tgt.length === 0) { console.error('Target user not found:', TARGET_EMAIL); await sql.end(); process.exit(1) }
  const s = src[0], t = tgt[0]
  console.log('Source:', `${s.id}\t${s.email}\t${s.full_name}`)
  console.log('Target:', `${t.id}\t${t.email}\t${t.full_name}`)

  const pcount = await sql`SELECT count(*)::int AS cnt FROM patients WHERE user_id = ${s.id}`
  const ccount = await sql`SELECT count(*)::int AS cnt FROM cases WHERE user_id = ${s.id}`
  console.log(`Patients to move: ${pcount[0].cnt}`)
  console.log(`Cases to move: ${ccount[0].cnt}`)

  const patients = await sql`SELECT id, first_name, last_name, medical_record_number FROM patients WHERE user_id = ${s.id} ORDER BY created_at DESC LIMIT 50`
  console.log('Patient IDs (up to 50):')
  for (const p of patients) console.log(p.id + '\t' + p.first_name + ' ' + p.last_name + '\t' + (p.medical_record_number || ''))

  await sql.end()
}

main().catch(e=>{console.error(e); process.exit(1)})
