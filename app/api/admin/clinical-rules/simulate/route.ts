import { NextRequest, NextResponse } from 'next/server'
import { evaluateRulesForContext } from '@/lib/clinical-engine/engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const context = body?.patient && body?.labs ? body.patient : body

    if (!context.timestamp) {
      context.timestamp = new Date()
    }

    const result = await evaluateRulesForContext(context as any)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Simulation failed' }, { status: 500 })
  }
}
