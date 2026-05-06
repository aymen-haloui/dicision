import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPatientById, updatePatient, type PatientInput } from '@/lib/db'

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

    const patient = await getPatientById(id, session.user.id)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error: any) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const updates: Partial<PatientInput> = {}
    const numericFields = ['weight', 'height', 'renalCreatinineClearance', 'creatinine',
      'asat', 'alat', 'bilirubin', 'sleepHours', 'glycemia', 'sodium', 'potassium', 'crp', 'lactates']
    const boolFields = ['nightShift', 'prolongedFasting', 'restrictiveDiet', 'uncontrolledNaturalProducts',
      'bloodDonor', 'suddenMedicationStop', 'regularCheckup', 'selfDiagnosis', 'previousIntoxication']
    const stringFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'medicalRecordNumber',
      'allergies', 'comorbidities', 'renalStage', 'hepaticStatus', 'pregnancyStatus',
      'smokingStatus', 'alcoholUse', 'substanceUse', 'professionalExposure', 'physicalActivity',
      'dietType', 'stressLevel', 'sleepQuality', 'sunExposure', 'immunodepression',
      'housingConditions', 'allergyReactionTypes']

    for (const field of stringFields) {
      if (body[field] !== undefined) (updates as any)[field] = body[field]
    }
    for (const field of numericFields) {
      if (body[field] !== undefined && body[field] !== '') (updates as any)[field] = parseFloat(body[field])
    }
    for (const field of boolFields) {
      if (body[field] !== undefined) (updates as any)[field] = body[field] === true || body[field] === 'true'
    }

    const patient = await updatePatient(id, session.user.id, updates)
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error: any) {
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    )
  }
}
