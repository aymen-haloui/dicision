import bcryptjs from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  console.log('Seeding user accounts with Prisma...')

  for (const account of accounts) {
    const passwordHash = await bcryptjs.hash(account.password, 10)

    await prisma.users.upsert({
      where: { email: account.email },
      update: {
        password_hash: passwordHash,
        full_name: account.fullName,
        specialization: account.specialization,
      },
      create: {
        email: account.email,
        password_hash: passwordHash,
        full_name: account.fullName,
        specialization: account.specialization,
      },
    })

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
    await prisma.$disconnect()
  })
