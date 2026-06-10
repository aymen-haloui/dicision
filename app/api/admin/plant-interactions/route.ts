import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const interactions = await sql`
      SELECT pdi.id, pdi.severity, pdi.description, pdi.recommendation,
             pdi.plant_id, pdi.medication_id,
             p.name AS plant_name,
             m.name AS medication_name
      FROM plant_drug_interactions pdi
      JOIN plants p ON pdi.plant_id = p.id
      JOIN medications m ON pdi.medication_id = m.id
      ORDER BY pdi.severity DESC, p.name ASC
    `

    return NextResponse.json(interactions)
  } catch {
    return NextResponse.json({ error: 'Echec du chargement des interactions plante-medicament' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { plantId, medicationId, severity, description, recommendation } = await request.json()

    if (!plantId || !medicationId || !severity) {
      return NextResponse.json(
        { error: 'La plante, le medicament et la gravite sont obligatoires' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO plant_drug_interactions (plant_id, medication_id, severity, description, recommendation)
      VALUES (${plantId}, ${medicationId}, ${severity}, ${description ?? null}, ${recommendation ?? null})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Echec de la creation de l interaction plante-medicament' }, { status: 500 })
  }
}
