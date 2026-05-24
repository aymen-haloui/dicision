import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { seedClinicalRules } from '@/lib/clinical-engine/seed'

export async function POST(request: NextRequest) {
  try {
    // Optionally require admin auth
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    await seedClinicalRules()

    return NextResponse.json({
      success: true,
      message: 'Clinical rules seeded successfully',
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error.message || 'Seeding failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed clinical rules',
  })
}
