import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

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

    let query = sql`SELECT id, name, description, category, severity, priority, enabled, trigger_type, created_at, updated_at, tags FROM clinical_rules WHERE 1=1`

    if (category) query = sql`${query} AND category = ${category}`
    if (severity) query = sql`${query} AND severity = ${severity}`
    if (enabled !== null) query = sql`${query} AND enabled = ${enabled === 'true'}`
    if (tag) query = sql`${query} AND ${tag} = ANY(tags)`
    if (search) query = sql`${query} AND (name ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})`

    query = sql`${query} ORDER BY priority DESC, created_at DESC`

    const results = await query
    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur de filtrage' }, { status: 500 })
  }
}
