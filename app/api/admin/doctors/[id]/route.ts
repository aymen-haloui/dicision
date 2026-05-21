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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const authError = await ensureAuth()
    if (authError) return authError

    await sql`DELETE FROM users WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Echec de la suppression de l\'utilisateur' }, { status: 500 })
  }
}
