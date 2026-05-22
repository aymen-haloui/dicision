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

    const searchTerm = q ? `%${q}%` : null

    const countRes = await sql`
      SELECT count(*)::int AS total
      FROM users
      ${q ? sql`WHERE (full_name ILIKE ${searchTerm} OR email ILIKE ${searchTerm} OR specialization ILIKE ${searchTerm})` : sql``}
    `
    const total = countRes[0]?.total ?? 0

    const rows = await sql`
      SELECT id, email, full_name, specialization, created_at
      FROM users
      ${q ? sql`WHERE (full_name ILIKE ${searchTerm} OR email ILIKE ${searchTerm} OR specialization ILIKE ${searchTerm})` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    return NextResponse.json({ data: rows, total })
  } catch (err: any) {
    return NextResponse.json({ error: 'Echec de la recuperation des utilisateurs' }, { status: 500 })
  }
}
