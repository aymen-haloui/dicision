import postgres from 'postgres'
import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

function loadEnv(filePath) {
  try {
    const data = readFileSync(filePath, 'utf8')
    const env = {}
    for (const line of data.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const value = trimmed.slice(idx + 1).trim()
      env[key] = value
    }
    return env
  } catch (error) {
    throw new Error(`Unable to load env file at ${filePath}: ${error.message}`)
  }
}

function parseArgs() {
  const result = { envFile: null, databaseUrl: null }
  const args = process.argv.slice(2)

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--env' && args[i + 1]) {
      result.envFile = args[i + 1]
      i += 1
    } else if (arg === '--database-url' && args[i + 1]) {
      result.databaseUrl = args[i + 1]
      i += 1
    } else if (arg === '--help') {
      console.log('Usage: node prisma/check_production_demo.mjs [--env .env-file] [--database-url <url>]')
      process.exit(0)
    } else {
      console.error('Unknown argument:', arg)
      process.exit(1)
    }
  }

  return result
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = parseArgs()
let databaseUrl = args.databaseUrl
let source = 'process.env'

if (args.envFile) {
  const envPath = resolve(__dirname, '..', args.envFile)
  if (!existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`)
  }
  const env = loadEnv(envPath)
  if (!env.DATABASE_URL) {
    throw new Error(`DATABASE_URL not found in ${envPath}`)
  }
  databaseUrl = env.DATABASE_URL
  source = envPath
  console.log('Loaded DATABASE_URL from', envPath)
} else {
  const defaultEnvPath = resolve(__dirname, '../.env')
  if (existsSync(defaultEnvPath)) {
    const env = loadEnv(defaultEnvPath)
    for (const [key, value] of Object.entries(env)) {
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
    if (!databaseUrl && process.env.DATABASE_URL) {
      databaseUrl = process.env.DATABASE_URL
      source = defaultEnvPath
    }
  }
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL not found. Set DATABASE_URL in environment or in the loaded .env file.')
}

console.log('Using DATABASE_URL from', source)
console.log('Using DATABASE_URL:', databaseUrl.replace(/(postgresql:\/\/[^:]+):[^@]+@/, '$1:***@'))
const sql = postgres(databaseUrl)

async function check() {
  const demoPatients = await sql`SELECT id, first_name, last_name, medical_record_number FROM patients WHERE medical_record_number LIKE 'DEMO-%' ORDER BY created_at DESC`
  const demoCases = await sql`SELECT id, patient_id, case_type, status FROM cases WHERE case_type LIKE 'DEMO_%' ORDER BY created_at DESC`

  console.log('demo patients count:', demoPatients.length)
  console.log('demo patients:', demoPatients.map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}`, mrn: p.medical_record_number })))
  console.log('demo cases count:', demoCases.length)
  console.log('demo cases:', demoCases.map(c => ({ id: c.id, patient_id: c.patient_id, case_type: c.case_type, status: c.status })))

  await sql.end()
}

check().catch(error => {
  console.error(error)
  process.exit(1)
})
