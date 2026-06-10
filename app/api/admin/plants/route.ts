import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

function normalizePlantRow(row: any) {
  return {
    ...row,
    toxicity_data: parseJsonField(row.toxicity_data, {}),
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const plants = await sql`
      SELECT id, name, common_name, toxic_parts, toxic_compounds, toxicity_data, overdose_management, created_at
      FROM plants
      ORDER BY name ASC
    `

    return NextResponse.json(plants.map(normalizePlantRow))
  } catch {
    return NextResponse.json({ error: 'Echec du chargement des plantes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      commonName,
      toxicParts,
      toxicCompounds,
      toxicityData,
      overdoseManagement,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO plants (name, common_name, toxic_parts, toxic_compounds, toxicity_data, overdose_management)
      VALUES (
        ${name},
        ${commonName ?? null},
        ${toxicParts ?? null},
        ${toxicCompounds ?? null},
        ${sql.json(toxicityData ?? {})},
        ${overdoseManagement ?? null}
      )
      RETURNING *
    `

    return NextResponse.json(normalizePlantRow(result[0]), { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Une plante portant ce nom existe deja' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Echec de la creation de la plante' }, { status: 500 })
  }
}
