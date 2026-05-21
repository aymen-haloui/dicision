/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client')
const { PrismaNeonHttp } = require('@prisma/adapter-neon')
const { PrismaPg } = require('@prisma/adapter-pg')

declare global {
  // eslint-disable-next-line no-var
  var prisma: any
}

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED
if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED must be set')
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = connectionString
}

const isNeonUrl = connectionString.includes('.neon.tech')
const clientConfig = {
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
}

const adapter = isNeonUrl
  ? new PrismaNeonHttp(connectionString, {})
  : new PrismaPg(connectionString)

export const prisma = global.prisma || new PrismaClient({ adapter, ...clientConfig })

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
