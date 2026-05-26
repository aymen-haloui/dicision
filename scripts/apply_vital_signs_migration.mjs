import postgres from 'postgres'
import fs from 'fs'

function loadEnvFile(path = '.env') {
  try {
    const text = fs.readFileSync(path, 'utf8')
    const match = text.match(/^DATABASE_URL=(.*)$/m)
    if (match) return match[1].trim().replace(/^"|"$/g, '')
  } catch (e) {
    // ignore
  }
  return undefined
}

const DATABASE_URL = process.env.DATABASE_URL || loadEnvFile()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment or .env')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { max: 1 })

async function run() {
  try {
    console.log('Connecting to database...')
    await sql`SELECT 1`

    console.log('Applying migration: ADD COLUMN IF NOT EXISTS vital_signs JSONB DEFAULT {}')
    await sql`ALTER TABLE "cases" ADD COLUMN IF NOT EXISTS "vital_signs" JSONB DEFAULT '{}'::jsonb;`

    console.log('Backfilling NULL vital_signs -> {}')
    await sql`UPDATE "cases" SET vital_signs = '{}'::jsonb WHERE vital_signs IS NULL;`

    console.log('Migration applied successfully.')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(2)
  } finally {
    try { await sql.end() } catch (e) {}
  }
}

run()
