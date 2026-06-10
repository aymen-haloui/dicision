import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

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
      SELECT pdi.id, pdi.severity, pdi.description, pdi.recommendation,
             pdi.plant_id, pdi.medication_id,
             p.name AS plant_name,
             m.name AS medication_name
      FROM plant_drug_interactions pdi
      JOIN plants p ON pdi.plant_id = p.id
      JOIN medications m ON pdi.medication_id = m.id
      WHERE pdi.id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Interaction introuvable' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch {
    return NextResponse.json({ error: 'Echec du chargement de l interaction plante-medicament' }, { status: 500 })
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

    const { plantId, medicationId, severity, description, recommendation } = await request.json()

    if (!plantId || !medicationId || !severity) {
      return NextResponse.json(
        { error: 'La plante, le medicament et la gravite sont obligatoires' },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE plant_drug_interactions SET
        plant_id = ${plantId},
        medication_id = ${medicationId},
        severity = ${severity},
        description = ${description ?? null},
        recommendation = ${recommendation ?? null}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Interaction introuvable' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch {
    return NextResponse.json({ error: 'Echec de la mise a jour de l interaction plante-medicament' }, { status: 500 })
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

    await sql`DELETE FROM plant_drug_interactions WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Echec de la suppression de l interaction plante-medicament' }, { status: 500 })
  }
}
