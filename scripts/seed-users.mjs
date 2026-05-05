import bcryptjs from 'bcryptjs'
import postgres from 'postgres'

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
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing')
  }

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
  await sql.end()
}

run().catch(async (error) => {
  console.error('Failed to seed users:', error.message)
  await sql.end()
  process.exit(1)
})
