import postgres from 'postgres'
import { readFileSync } from 'fs'

// Defaults can be overridden with SOURCE_EMAIL and TARGET_EMAIL env vars
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

  const pcountBefore = await sql`SELECT count(*)::int AS cnt FROM patients WHERE user_id = ${s.id}`
  const ccountBefore = await sql`SELECT count(*)::int AS cnt FROM cases WHERE user_id = ${s.id}`
  console.log(`Patients to move: ${pcountBefore[0].cnt}`)
  console.log(`Cases to move: ${ccountBefore[0].cnt}`)

  if (pcountBefore[0].cnt === 0 && ccountBefore[0].cnt === 0) {
    console.log('Nothing to move. Exiting.')
    await sql.end()
    process.exit(0)
  }

  // Run updates inside a transaction
  try {
    await sql.begin(async (tx) => {
      await tx`UPDATE patients SET user_id = ${t.id} WHERE user_id = ${s.id}`
      await tx`UPDATE cases SET user_id = ${t.id} WHERE user_id = ${s.id}`
    })
  } catch (e) {
    console.error('Transaction failed, aborting:', e)
    await sql.end()
    process.exit(1)
  }

  const pcountAfter = await sql`SELECT count(*)::int AS cnt FROM patients WHERE user_id = ${t.id}`
  const ccountAfter = await sql`SELECT count(*)::int AS cnt FROM cases WHERE user_id = ${t.id}`
  console.log(`Patients now owned by target: ${pcountAfter[0].cnt}`)
  console.log(`Cases now owned by target: ${ccountAfter[0].cnt}`)

  await sql.end()
}

main().catch(e=>{console.error(e); process.exit(1)})
