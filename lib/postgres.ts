import postgres from 'postgres'

// Create a singleton SQL client to avoid multiple connections per request
let sql: ReturnType<typeof postgres>

if (!globalThis.__postgres_sql) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  globalThis.__postgres_sql = postgres(process.env.DATABASE_URL, { ssl: process.env.DB_SSL === 'true' })
}

sql = globalThis.__postgres_sql

export default sql
