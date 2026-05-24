import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateRule } from '@/lib/clinical-engine/validator'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

async function ensureAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autoriseé' }, { status: 401 })
  }
  return session.user.id
}

export async function GET(request: NextRequest) {
  try {
    const userId = await ensureAuth()
    if (typeof userId !== 'string') return userId

    const rules = await sql`
      SELECT id, name, description, category, severity, priority, enabled, trigger_type, conditions, outputs, created_at, updated_at, created_by, version, tags
      FROM clinical_rules
      ORDER BY priority DESC, created_at DESC
    `
    return NextResponse.json(rules)
  } catch (error: any) {
    return NextResponse.json({ error: 'Échec du chargement des règles cliniques' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await ensureAuth()
    if (typeof userId !== 'string') return userId

    const body = await request.json()
    const { name, description, category, severity, priority, enabled, trigger_type, conditions, outputs, tags } = body

    // Validate structure
    const validation = validateRule({ name, description, category, severity, priority, enabled, trigger_type, conditions, outputs })
    if (!validation.is_valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO clinical_rules (
        name, description, category, severity, priority, enabled, trigger_type, conditions, outputs, created_by, version, tags
      ) VALUES (
        ${name},
        ${description ?? null},
        ${category ?? 'GENERAL'},
        ${severity ?? 'MODERATE'},
        ${priority ?? 0},
        ${enabled ?? true},
        ${trigger_type ?? null},
        ${JSON.stringify(conditions)},
        ${JSON.stringify(outputs)},
        ${userId},
        1,
        ${JSON.stringify(tags ?? [])}
      )
      RETURNING id, name, description, category, severity, priority, enabled, trigger_type, conditions, outputs, created_at, updated_at, created_by, version, tags
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error('Error creating rule:', error)
    return NextResponse.json({ error: 'Échec de la création de la règle clinique' }, { status: 500 })
  }
}
