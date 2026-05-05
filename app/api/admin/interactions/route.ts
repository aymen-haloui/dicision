import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

// GET all interactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const interactions = await sql`
      SELECT i.id, i.interaction_type, i.severity, i.description, i.recommendation,
             m1.name AS drug1, m2.name AS drug2,
             i.medication_id_1, i.medication_id_2
      FROM interactions i
      JOIN medications m1 ON i.medication_id_1 = m1.id
      JOIN medications m2 ON i.medication_id_2 = m2.id
      ORDER BY i.severity DESC, m1.name
    `
    return NextResponse.json(interactions)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 })
  }
}

// POST — add a new interaction rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { medicationId1, medicationId2, interactionType, severity, description, recommendation } =
      await request.json()

    if (!medicationId1 || !medicationId2 || !severity) {
      return NextResponse.json(
        { error: 'Both medications and severity are required' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO interactions (medication_id_1, medication_id_2, interaction_type, severity, description, recommendation)
      VALUES (${medicationId1}, ${medicationId2}, ${interactionType ?? null}, ${severity}, ${description ?? null}, ${recommendation ?? null})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create interaction rule' }, { status: 500 })
  }
}

// DELETE — remove an interaction rule
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    await sql`DELETE FROM interactions WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete interaction' }, { status: 500 })
  }
}
