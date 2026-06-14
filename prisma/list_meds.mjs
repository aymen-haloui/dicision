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

async function list() {
  const meds = await sql`SELECT name FROM medications ORDER BY name`
  console.log('Medications in DB:')
  meds.forEach((m, i) => console.log(i+1, m.name))
  await sql.end()
}

list().catch((e)=>{console.error(e); process.exit(1)})
