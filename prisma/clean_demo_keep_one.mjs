import postgres from 'postgres'
import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    const env = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      env[key] = value
    }
    return env
  } catch {
    return null
  }
}

function loadDefaultEnv() {
  const searchPaths = [
    resolve(__dirname, '../.env'),
    resolve(__dirname, '../.env.production'),
    resolve(__dirname, '../.env.local'),
  ]

  for (const filePath of searchPaths) {
    if (!existsSync(filePath)) continue
    const env = loadEnvFile(filePath)
    if (!env) continue
    for (const [key, value] of Object.entries(env)) {
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
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
      console.log('Usage: node prisma/clean_demo_keep_one.mjs [--env .env-file] [--database-url <url>]')
      process.exit(0)
    } else {
      console.error('Unknown argument:', arg)
      process.exit(1)
    }
  }

  return result
}

const args = parseArgs()
let databaseUrl = args.databaseUrl
let source = 'process.env'

if (args.envFile) {
  const envPath = resolve(__dirname, '..', args.envFile)
  if (!existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`)
  }
  const env = loadEnvFile(envPath)
  if (!env || !env.DATABASE_URL) {
    throw new Error(`DATABASE_URL not found in ${envPath}`)
  }
  databaseUrl = env.DATABASE_URL
  source = envPath
  console.log('Loaded DATABASE_URL from', envPath)
} else {
  loadDefaultEnv()
  if (!databaseUrl) {
    databaseUrl = process.env.DATABASE_URL
  }
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL not found. Set DATABASE_URL in environment or one of .env, .env.local, .env.production.')
}

console.log('Using DATABASE_URL from', source)
console.log('Using DATABASE_URL:', databaseUrl.replace(/(postgresql:\/\/[^:]+):[^@]+@/, '$1:***@'))
const sql = postgres(databaseUrl)

async function clean() {
  const keepMrn = process.env.KEEP_DEMO_PATIENT_MRN || 'DEMO-TOX-001'
  console.log('Cleaning demo patients from database while preserving MRN:', keepMrn)

  const dbInfo = await sql`SELECT current_database() AS db, current_user AS user`
  console.log('Connected to database:', dbInfo[0]?.db, 'as user:', dbInfo[0]?.user)

  const allDemo = await sql`
    SELECT id, medical_record_number
    FROM patients
    WHERE medical_record_number LIKE 'DEMO-%'
    ORDER BY medical_record_number
  `
  console.log('Found demo patients in DB:', allDemo.map((p) => p.medical_record_number).join(', ') || 'none')

  const toDelete = await sql`
    SELECT id, medical_record_number
    FROM patients
    WHERE medical_record_number LIKE 'DEMO-%'
      AND medical_record_number != ${keepMrn}
  `

  if (!toDelete || toDelete.length === 0) {
    console.log('No other demo patients found.')
    await sql.end()
    return
  }

  console.log('Deleting demo patients:', toDelete.map((p) => p.medical_record_number).join(', '))

  await sql.begin(async (tx) => {
    for (const patient of toDelete) {
      const id = patient.id
      await tx`DELETE FROM cases WHERE patient_id = ${id}`
      await tx`DELETE FROM patient_medications WHERE patient_id = ${id}`
      await tx`DELETE FROM patient_allergies WHERE patient_id = ${id}`
      await tx`DELETE FROM patient_conditions WHERE patient_id = ${id}`
      await tx`DELETE FROM patient_lifestyle WHERE patient_id = ${id}`
      await tx`DELETE FROM patients WHERE id = ${id}`
    }
  })

  const remaining = await sql`
    SELECT id, medical_record_number
    FROM patients
    WHERE medical_record_number LIKE 'DEMO-%'
    ORDER BY medical_record_number
  `

  console.log('Remaining demo patients:', remaining.map((p) => p.medical_record_number).join(', ') || 'none')
  if (remaining.length === 1 && remaining[0].medical_record_number === keepMrn) {
    console.log('Success: only the preserved demo patient remains.')
  } else if (remaining.length === 0) {
    console.log('Warning: no demo patients remain after cleanup.')
  } else {
    console.warn('Warning: there are still demo patients remaining after cleanup.')
  }

  await sql.end()
}

clean().catch((e) => {
  console.error(e)
  process.exit(1)
})
