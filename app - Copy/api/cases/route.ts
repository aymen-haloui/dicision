import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCase, addMedicationToCase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      patientId,
      caseType,
      chiefComplaint,
      symptoms,
      vitalSigns,
      medications,
    } = await request.json()

    if (!patientId || !caseType || !chiefComplaint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create case
    const newCase = await createCase(
      session.user.id,
      patientId,
      caseType,
      chiefComplaint,
      symptoms,
      vitalSigns
    )

    // Add medications if provided
    if (medications && Array.isArray(medications)) {
      for (const med of medications) {
        if (med.medicationId) {
          await addMedicationToCase(
            newCase.id,
            med.medicationId,
            med.dosage,
            med.frequency,
            med.duration,
            med.route
          )
        }
      }
    }

    return NextResponse.json(newCase, { status: 201 })
  } catch (error: any) {
    console.error('Case creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    )
  }
}
