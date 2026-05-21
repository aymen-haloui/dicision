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
      SELECT i.id, i.interaction_type, i.severity, i.description, i.recommendation,
             i.medication_id_1, i.medication_id_2,
             m1.name AS drug1, m2.name AS drug2
      FROM interactions i
      JOIN medications m1 ON i.medication_id_1 = m1.id
      JOIN medications m2 ON i.medication_id_2 = m2.id
      WHERE i.id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Interaction introuvable' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    return NextResponse.json({ error: 'Echec du chargement de l\'interaction' }, { status: 500 })
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

    const {
      medicationId1,
      medicationId2,
      interactionType,
      severity,
      description,
      recommendation,
    } = await request.json()

    if (!medicationId1 || !medicationId2 || !severity) {
      return NextResponse.json(
        { error: 'Les deux medicaments et la gravite sont obligatoires' },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE interactions SET
        medication_id_1 = ${medicationId1},
        medication_id_2 = ${medicationId2},
        interaction_type = ${interactionType ?? null},
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
  } catch (error: any) {
    return NextResponse.json({ error: 'Echec de la mise a jour de l\'interaction' }, { status: 500 })
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

    await sql`DELETE FROM interactions WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Echec de la suppression de l\'interaction' }, { status: 500 })
  }
}
