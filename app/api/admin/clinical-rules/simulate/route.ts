import { NextRequest, NextResponse } from 'next/server'
import { evaluateRulesForContext } from '@/lib/clinical-engine/engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Build a minimal ClinicalContext expected by engine
    const context = {
      patient: body.patient,
      labs: body.labs || {},
      vitals: body.vitals || {},
      medications: body.medications || [],
      symptoms: body.symptoms || [],
      timestamp: new Date(),
    }

    const result = await evaluateRulesForContext(context as any)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Simulation failed' }, { status: 500 })
  }
}
