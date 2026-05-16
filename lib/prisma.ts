// Force Prisma to use the binary engine in server builds.
// This prevents PrismaClientConstructorValidationError in build hosts where the client engine is not configured.
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary'

/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client')

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

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
