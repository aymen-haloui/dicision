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

export async function GET(request: NextRequest) {
  try {
    const userId = await ensureAuth()
    if (typeof userId !== 'string') return userId

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const severity = searchParams.get('severity')
    const enabled = searchParams.get('enabled')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    // Build parameterized query
    const conditions: string[] = []
    const params: any[] = []
    if (category) { params.push(category); conditions.push(`category = $${params.length}`) }
    if (severity) { params.push(severity); conditions.push(`severity = $${params.length}`) }
    if (enabled !== null) { params.push(enabled === 'true'); conditions.push(`enabled = $${params.length}`) }
    if (tag) { params.push(tag); conditions.push(`$${params.length} = ANY(tags)`) }
    if (search) { params.push(`%${search}%`); params.push(`%${search}%`); conditions.push(`(name ILIKE $${params.length-1} OR description ILIKE $${params.length})`) }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const sqlText = `SELECT id, name, description, category, severity, priority, enabled, trigger_type, created_at, updated_at, tags FROM clinical_rules ${where} ORDER BY priority DESC, created_at DESC`
    const results = await sql.unsafe(sqlText, params)
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('GET /api/admin/clinical-rules/search error:', error)
    const message = process.env.NODE_ENV === 'production' ? 'Erreur de filtrage' : error?.message || String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
