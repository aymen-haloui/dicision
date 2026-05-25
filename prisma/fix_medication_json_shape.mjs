import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'

const __dirname = dirname(fileURLToPath(import.meta.url))
for (const envPath of [resolve(__dirname, '../.env'), resolve(__dirname, '../.env.local')]) {
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
  throw new Error('DATABASE_URL not found')
}

const requiresSsl = process.env.DB_SSL === 'true' || connectionString.includes('.neon.tech') || /sslmode=require/i.test(connectionString)
const sql = postgres(connectionString, { ssl: requiresSsl })

await sql`
  UPDATE medications
  SET contraindications = (contraindications::jsonb #>> '{}')::jsonb
  WHERE contraindications IS NOT NULL
    AND jsonb_typeof(contraindications::jsonb) = 'string'
`

await sql`
  UPDATE medications
  SET pharmacological_data = (pharmacological_data::jsonb #>> '{}')::jsonb
  WHERE pharmacological_data IS NOT NULL
    AND jsonb_typeof(pharmacological_data::jsonb) = 'string'
`

const check = await sql`
  SELECT name,
         jsonb_typeof(contraindications::jsonb) AS contraindications_type,
         jsonb_typeof(pharmacological_data::jsonb) AS pharmacological_data_type
  FROM medications
  WHERE name IN ('Ibuprofen', 'Amoxicillin')
  ORDER BY name
`

console.log(JSON.stringify(check, null, 2))
await sql.end()
