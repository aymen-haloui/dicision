import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPatient } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, dateOfBirth, gender, medicalRecordNumber, allergies, comorbidities,
            weight, renalCreatinineClearance, hepaticStatus, pregnancyStatus } =
      await request.json()

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First and last name are required' },
        { status: 400 }
      )
    }

    const patient = await createPatient(
      session.user.id,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      medicalRecordNumber,
      allergies,
      comorbidities,
      weight,
      renalCreatinineClearance,
      hepaticStatus,
      pregnancyStatus
    )

    return NextResponse.json(patient, { status: 201 })
  } catch (error: any) {
    console.error('Patient creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}
