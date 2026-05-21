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

export async function GET() {
  try {
    const authError = await ensureAuth()
    if (authError) return authError

    const rows = await sql`
      SELECT id, email, full_name, specialization, created_at
      FROM users
      ORDER BY created_at DESC
    `

    return NextResponse.json(rows)
  } catch (err: any) {
    return NextResponse.json({ error: 'Echec de la recuperation des utilisateurs' }, { status: 500 })
  }
}
