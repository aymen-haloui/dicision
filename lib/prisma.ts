/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client')
const { PrismaNeonHttp } = require('@prisma/adapter-neon')

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

const adapter = new PrismaNeonHttp(connectionString, {})

export const prisma = global.prisma || new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
