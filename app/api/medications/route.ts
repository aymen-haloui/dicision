import { NextRequest, NextResponse } from 'next/server'
import { getAllMedications } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const medications = await getAllMedications()
    return NextResponse.json(medications)
  } catch (error: any) {
    console.error('Error fetching medications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medications' },
      { status: 500 }
    )
  }
}
