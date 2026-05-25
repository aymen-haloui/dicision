import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateRule } from '@/lib/clinical-engine/validator'
import sql from '@/lib/postgres'
import { inferRuleFamily } from '@/lib/clinical-engine/rule-family'

function sortRules<T extends { priority?: number | null; created_at?: string | Date | null }>(rules: T[]) {
  return rules.sort((left, right) => {
    const leftPriority = left.priority ?? 0
    const rightPriority = right.priority ?? 0
    if (leftPriority !== rightPriority) return rightPriority - leftPriority

    const leftCreated = left.created_at ? new Date(left.created_at).getTime() : 0
    const rightCreated = right.created_at ? new Date(right.created_at).getTime() : 0
    if (leftCreated !== rightCreated) return rightCreated - leftCreated

    return 0
  })
}

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

    const rules = await sql`SELECT * FROM clinical_rules`
    return NextResponse.json(sortRules(rules))
  } catch (error: any) {
    console.error('GET /api/admin/clinical-rules error:', error)
    const message = process.env.NODE_ENV === 'production' ? 'Échec du chargement des règles cliniques' : error?.message || String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await ensureAuth()
    if (typeof userId !== 'string') return userId

    const body = await request.json()
    const { name, description, rule_family, explanation_template, category, severity, priority, enabled, trigger_type, conditions, outputs, ui_schema, output_schema, tags } = body
    const normalizedFamily = rule_family || inferRuleFamily({ category, severity, trigger_type })

    // Validate structure
    const validation = validateRule({ name, description, rule_family: normalizedFamily, explanation_template, category, severity, priority, enabled, trigger_type, conditions, outputs })
    if (!validation.is_valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO clinical_rules (
        name, description, rule_family, category, severity, priority, enabled, trigger_type, explanation_template, ui_schema, output_schema, conditions, outputs, created_by, version, tags, updated_at
      ) VALUES (
        ${name},
        ${description ?? null},
        ${normalizedFamily},
        ${category ?? 'GENERAL'},
        ${severity ?? 'MODERATE'},
        ${priority ?? 0},
        ${enabled ?? true},
        ${trigger_type ?? null},
        ${explanation_template ?? `Règle ${name} déclenchée pour ${normalizedFamily}`},
        ${JSON.stringify(ui_schema ?? {})},
        ${JSON.stringify(output_schema ?? {})},
        ${JSON.stringify(conditions)},
        ${JSON.stringify(outputs)},
        ${userId},
        1,
        ${JSON.stringify(tags ?? [])},
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error: any) {
    console.error('Error creating rule:', error)
    const message = process.env.NODE_ENV === 'production' ? 'Échec de la création de la règle clinique' : error?.message || String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
