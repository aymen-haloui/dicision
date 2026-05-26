import postgres from 'postgres'
import { readFileSync } from 'fs'

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

const sql = postgres(process.env.DATABASE_URL)

async function run(){
  const rows = await sql`SELECT email, full_name, specialization FROM users ORDER BY created_at DESC LIMIT 10`
  console.log('users:', rows)
}

run().catch(e=>{console.error(e); process.exit(1)}).finally(()=>sql.end())
