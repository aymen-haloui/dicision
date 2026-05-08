import bcryptjs from 'bcryptjs'
import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local manually
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

const accounts = [
  {
    email: 'admin@hexa.local',
    password: 'Admin@123456',
    fullName: 'HEXA Admin',
    specialization: 'admin',
  },
  {
    email: 'medecin@hexa.local',
    password: 'Medecin@123456',
    fullName: 'Dr Medecin HEXA',
    specialization: 'medecin',
  },
]

async function run() {
  console.log('Seeding user accounts...')

  for (const account of accounts) {
    const passwordHash = await bcryptjs.hash(account.password, 10)

    await sql`
      INSERT INTO users (email, password_hash, full_name, specialization)
      VALUES (${account.email}, ${passwordHash}, ${account.fullName}, ${account.specialization})
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        specialization = EXCLUDED.specialization
    `

    console.log(`  - ${account.email} (${account.specialization}) ready`)
  }

  console.log('\nCredentials:')
  for (const account of accounts) {
    console.log(`  email: ${account.email} | password: ${account.password}`)
  }

  console.log('\nIMPORTANT: change these passwords after first login.')
}

run()
  .catch((error) => {
    console.error('Failed to seed users:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await sql.end()
  })
