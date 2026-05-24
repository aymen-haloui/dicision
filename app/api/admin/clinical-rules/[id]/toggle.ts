import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import sql from '@/lib/postgres'

async function ensureAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return session.user.id
}

// Toggle enabled/disabled status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const userId = await ensureAuth()
    if (typeof userId !== 'string') return userId

    const body = await request.json()
    const { enabled } = body

    const result = await sql`
      UPDATE clinical_rules SET enabled = ${enabled}
      WHERE id = ${id}
      RETURNING id, name, enabled, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Règle non trouvée' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error('PATCH /api/admin/clinical-rules/[id]/toggle error:', error)
    const message = process.env.NODE_ENV === 'production' ? 'Erreur lors de la mise à jour du statut' : error?.message || String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
