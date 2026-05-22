import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

async function ensureAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  return null
}

export async function GET(request: NextRequest) {
  try {
    const authError = await ensureAuth()
    if (authError) return authError

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 100)
    const offset = (page - 1) * limit

    let whereClause = ''
    const params: any[] = []
    if (q) {
      whereClause = `WHERE (full_name ILIKE $1 OR email ILIKE $1 OR specialization ILIKE $1)`
      params.push(`%${q}%`)
    }

    // total count
    const countQuery = whereClause ? sql`${sql.raw(`SELECT count(*)::int as total FROM users ${whereClause}`)}` : sql`SELECT count(*)::int as total FROM users`
    const countRes = await countQuery
    const total = countRes[0]?.total ?? 0

    // data
    const dataQuery = whereClause
      ? sql`${sql.raw(`SELECT id, email, full_name, specialization, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)}`
      : sql`${sql.raw(`SELECT id, email, full_name, specialization, created_at FROM users ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)}`
    const rows = await dataQuery

    return NextResponse.json({ data: rows, total })
  } catch (err: any) {
    return NextResponse.json({ error: 'Echec de la recuperation des utilisateurs' }, { status: 500 })
  }
}
