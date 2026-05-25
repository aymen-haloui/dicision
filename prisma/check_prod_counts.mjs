import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'

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
  console.error('No DATABASE_URL found in .env')
  process.exit(1)
}

function maskConn(s) {
  try {
    return s.replace(/:[^:@]+@/, ':****@')
  } catch { return 'masked' }
}

const requiresSsl = process.env.DB_SSL === 'true' || connectionString.includes('.neon.tech') || /sslmode=require/i.test(connectionString)
const sql = postgres(connectionString, { ssl: requiresSsl })

async function run() {
  console.log('Connection used (masked):', maskConn(connectionString))
  console.log('Host:', process.env.PGHOST || process.env.POSTGRES_HOST || 'unknown')
  console.log('Using SSL:', requiresSsl)

  const tables = ['medications','interactions','clinical_rules','patients']
  for (const t of tables) {
    try {
      const r = await sql`SELECT count(*) FROM ${sql(t)}`
      console.log(`${t}:`, r[0].count)
    } catch (err) {
      console.log(`${t}: error (${err.message})`)
    }
  }

  await sql.end()
}

run().catch(err => { console.error(err.message); process.exit(1) })
