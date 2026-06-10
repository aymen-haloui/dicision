import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value as T
}

export async function GET(request: NextRequest) {
  try {
    const plants = await sql`
      SELECT id, name, common_name, toxic_parts, toxic_compounds, toxicity_data, overdose_management
      FROM plants
      ORDER BY name ASC
    `

    return NextResponse.json(
      plants.map((row: any) => ({
        ...row,
        toxicity_data: parseJsonField(row.toxicity_data, {}),
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Failed to fetch plants' }, { status: 500 })
  }
}
