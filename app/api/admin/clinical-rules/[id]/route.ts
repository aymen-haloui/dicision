import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateRule } from '@/lib/clinical-engine/validator'
import sql from '@/lib/postgres'
import { inferRuleFamily } from '@/lib/clinical-engine/rule-family'

async function ensureAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return session.user.id
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const userId = await ensureAuth()
    if (typeof userId !== 'string') return userId

    const result = await sql`
      SELECT *
      FROM clinical_rules
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Règle clinique introuvable' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error('GET /api/admin/clinical-rules/[id] error:', error)
    const message = process.env.NODE_ENV === 'production' ? 'Échec du chargement de la règle clinique' : error?.message || String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // Get current version
    const current = await sql`SELECT version FROM clinical_rules WHERE id = ${id}`
    if (current.length === 0) {
      return NextResponse.json({ error: 'Règle clinique introuvable' }, { status: 404 })
    }
    const nextVersion = (current[0].version || 1) + 1

    const result = await sql`
      UPDATE clinical_rules SET
        name = ${name},
        description = ${description ?? null},
        rule_family = ${normalizedFamily},
        category = ${category ?? 'GENERAL'},
        severity = ${severity ?? 'MODERATE'},
        priority = ${priority ?? 0},
        enabled = ${enabled ?? true},
        trigger_type = ${trigger_type ?? null},
        explanation_template = ${explanation_template ?? `Règle ${name} déclenchée pour ${normalizedFamily}`},
        ui_schema = ${JSON.stringify(ui_schema ?? {})},
        output_schema = ${JSON.stringify(output_schema ?? {})},
        conditions = ${JSON.stringify(conditions)},
        outputs = ${JSON.stringify(outputs)},
        version = ${nextVersion},
        tags = ${JSON.stringify(tags ?? [])},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Règle clinique introuvable' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error('Error updating rule:', error)
    const message = process.env.NODE_ENV === 'production' ? 'Échec de la mise à jour de la règle clinique' : error?.message || String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const userId = await ensureAuth()
    if (typeof userId !== 'string') return userId

    await sql`DELETE FROM clinical_rules WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting rule:', error)
    const message = process.env.NODE_ENV === 'production' ? 'Échec de la suppression de la règle clinique' : error?.message || String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
