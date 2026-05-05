import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

// PUT — update a medication
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, genericName, category, dosageForm, defaultDosage,
      warnings, maxDailyDoseAdult, maxDailyDoseChild,
      contraindications, toxicityThresholds, overdoseManagement, pharmacologicalData,
    } = body

    const result = await sql`
      UPDATE medications SET
        name = ${name},
        generic_name = ${genericName ?? null},
        category = ${category ?? null},
        dosage_form = ${dosageForm ?? null},
        default_dosage = ${defaultDosage ?? null},
        warnings = ${warnings ?? null},
        max_daily_dose_adult = ${maxDailyDoseAdult ?? null},
        max_daily_dose_child = ${maxDailyDoseChild ?? null},
        contraindications = ${JSON.stringify(contraindications ?? [])},
        toxicity_thresholds = ${JSON.stringify(toxicityThresholds ?? {})},
        overdose_management = ${overdoseManagement ?? null},
        pharmacological_data = ${JSON.stringify(pharmacologicalData ?? {})}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }
    return NextResponse.json(result[0])
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update medication' }, { status: 500 })
  }
}

// DELETE — remove a medication
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await sql`DELETE FROM medications WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete medication' }, { status: 500 })
  }
}
