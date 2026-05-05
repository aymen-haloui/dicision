import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeCase } from '@/lib/decision-engine'
import { createRiskAssessment, getRiskAssessmentByCase } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Analyze case using decision engine
    const analysis = await analyzeCase(id, session.user.id)

    // Save risk assessment to database
    const assessment = await createRiskAssessment(
      id,
      analysis.riskScore,
      analysis.riskLevel,
      { findings: analysis.findings },
      { recommendations: analysis.recommendations }
    )

    return NextResponse.json(assessment)
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze case' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing assessment
    const assessment = await getRiskAssessmentByCase(id)

    if (!assessment) {
      return NextResponse.json(
        { error: 'No assessment found' },
        { status: 404 }
      )
    }

    return NextResponse.json(assessment)
  } catch (error: any) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    )
  }
}
