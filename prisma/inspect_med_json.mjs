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

const sql = postgres(process.env.DATABASE_URL, { ssl: true })

const rows = await sql`
  select name, jsonb_typeof(contraindications::jsonb) as contra_type, contraindications,
         jsonb_typeof(pharmacological_data::jsonb) as phar_type
  from medications
  where name in ('Ibuprofen','Amoxicillin')
  order by name
`
console.log(JSON.stringify(rows, null, 2))
await sql.end()
