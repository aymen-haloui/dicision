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
const sql = postgres(connectionString, { ssl: true })

const meds = await sql`
  SELECT name, category, warnings, default_dosage,
         pharmacological_data->>'mechanism' AS mechanism,
         jsonb_array_length(contraindications::jsonb) AS ci_count,
         jsonb_array_length((pharmacological_data::jsonb->'common_indications')) AS indications_count
  FROM medications
  WHERE name IN ('Ibuprofen','Amoxicillin')
  ORDER BY name
`

const inter = await sql`
  SELECT i.interaction_type, i.severity, i.description, i.recommendation
  FROM interactions i
  JOIN medications m1 ON m1.id = i.medication_id_1
  JOIN medications m2 ON m2.id = i.medication_id_2
  WHERE (m1.name='Ibuprofen' AND m2.name='Amoxicillin')
     OR (m1.name='Amoxicillin' AND m2.name='Ibuprofen')
  LIMIT 1
`

console.log('MEDS:', JSON.stringify(meds, null, 2))
console.log('INTERACTION:', JSON.stringify(inter, null, 2))
await sql.end()
