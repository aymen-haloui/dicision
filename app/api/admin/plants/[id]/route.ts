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

async function ensureAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const authError = await ensureAuth()
    if (authError) return authError

    const result = await sql`
      SELECT id, name, common_name, toxic_parts, toxic_compounds, toxicity_data, overdose_management, created_at
      FROM plants
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Plante introuvable' }, { status: 404 })
    }

    return NextResponse.json(normalizePlantRow(result[0]))
  } catch {
    return NextResponse.json({ error: 'Echec du chargement de la plante' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const authError = await ensureAuth()
    if (authError) return authError

    const body = await request.json()
    const {
      name,
      commonName,
      toxicParts,
      toxicCompounds,
      toxicityData,
      overdoseManagement,
    } = body

    const result = await sql`
      UPDATE plants SET
        name = ${name},
        common_name = ${commonName ?? null},
        toxic_parts = ${toxicParts ?? null},
        toxic_compounds = ${toxicCompounds ?? null},
        toxicity_data = ${sql.json(toxicityData ?? {})},
        overdose_management = ${overdoseManagement ?? null}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Plante introuvable' }, { status: 404 })
    }

    return NextResponse.json(normalizePlantRow(result[0]))
  } catch {
    return NextResponse.json({ error: 'Echec de la mise a jour de la plante' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const authError = await ensureAuth()
    if (authError) return authError

    await sql`DELETE FROM plants WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Echec de la suppression de la plante' }, { status: 500 })
  }
}
