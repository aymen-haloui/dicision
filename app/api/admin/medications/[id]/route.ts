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

function normalizeMedicationRow(row: any) {
  return {
    ...row,
    contraindications: parseJsonField(row.contraindications, []),
    toxicity_thresholds: parseJsonField(row.toxicity_thresholds, {}),
    pharmacological_data: parseJsonField(row.pharmacological_data, {}),
  }
}

// GET — fetch a single medication by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const result = await sql`
      SELECT id, name, generic_name, category, dosage_form, default_dosage,
             warnings, max_daily_dose_adult, max_daily_dose_child,
             contraindications, toxicity_thresholds, overdose_management, pharmacological_data,
             created_at
      FROM medications
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Medicament introuvable' }, { status: 404 })
    }

    return NextResponse.json(normalizeMedicationRow(result[0]))
  } catch (error: any) {
    return NextResponse.json({ error: 'Echec du chargement du medicament' }, { status: 500 })
  }
}

// PUT — update a medication
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
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
        contraindications = ${sql.json(contraindications ?? [])},
        toxicity_thresholds = ${sql.json(toxicityThresholds ?? {})},
        overdose_management = ${overdoseManagement ?? null},
        pharmacological_data = ${sql.json(pharmacologicalData ?? {})}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Medicament introuvable' }, { status: 404 })
    }
    return NextResponse.json(normalizeMedicationRow(result[0]))
  } catch (error: any) {
    return NextResponse.json({ error: 'Echec de la mise a jour du medicament' }, { status: 500 })
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
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    await sql`DELETE FROM medications WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Echec de la suppression du medicament' }, { status: 500 })
  }
}
