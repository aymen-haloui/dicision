import postgres from 'postgres'

// Create a singleton SQL client to avoid multiple connections per request
let sql: ReturnType<typeof postgres>

if (!globalThis.__postgres_sql) {
  const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const requiresSsl =
    process.env.DB_SSL === 'true' ||
    connectionString.includes('.neon.tech') ||
    /sslmode=require/i.test(connectionString)

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = connectionString
  }

  globalThis.__postgres_sql = postgres(connectionString, { ssl: requiresSsl })
}

sql = globalThis.__postgres_sql

export default sql
