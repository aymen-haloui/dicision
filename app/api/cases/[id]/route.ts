import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCaseById, getCaseMedications, getRiskAssessmentByCase } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseData = await getCaseById(params.id, session.user.id)
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const [medications, assessment] = await Promise.all([
      getCaseMedications(params.id),
      getRiskAssessmentByCase(params.id),
    ])

    return NextResponse.json({
      ...caseData,
      medications,
      assessment,
    })
  } catch (error: any) {
    console.error('Error fetching case:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    )
  }
}
