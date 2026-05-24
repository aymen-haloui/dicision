import { NextRequest, NextResponse } from 'next/server'
import { validateRule } from '@/lib/clinical-engine/validator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = validateRule(body)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
