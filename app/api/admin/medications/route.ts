import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

// GET all medications (with full pharmacological data)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const medications = await sql`
      SELECT id, name, generic_name, category, dosage_form, default_dosage,
             warnings, max_daily_dose_adult, max_daily_dose_child,
             contraindications, toxicity_thresholds, overdose_management, pharmacological_data,
             created_at
      FROM medications
      ORDER BY name ASC
    `
    return NextResponse.json(medications)
  } catch (error: any) {
    return NextResponse.json({ error: 'Echec du chargement des medicaments' }, { status: 500 })
  }
}

// POST — add a new medication
export async function POST(request: NextRequest) {
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

    if (!name) {
      return NextResponse.json({ error: 'Le nom est obligatoire' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO medications (
        name, generic_name, category, dosage_form, default_dosage, warnings,
        max_daily_dose_adult, max_daily_dose_child,
        contraindications, toxicity_thresholds, overdose_management, pharmacological_data
      ) VALUES (
        ${name}, ${genericName ?? null}, ${category ?? null}, ${dosageForm ?? null},
        ${defaultDosage ?? null}, ${warnings ?? null},
        ${maxDailyDoseAdult ?? null}, ${maxDailyDoseChild ?? null},
        ${JSON.stringify(contraindications ?? [])}, ${JSON.stringify(toxicityThresholds ?? {})},
        ${overdoseManagement ?? null}, ${JSON.stringify(pharmacologicalData ?? {})}
      )
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Un medicament portant ce nom existe deja' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Echec de la creation du medicament' }, { status: 500 })
  }
}
