import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPatient, type PatientInput } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'First and last name are required' },
        { status: 400 }
      )
    }

    const data: PatientInput = {
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      medicalRecordNumber: body.medicalRecordNumber,
      allergies: body.allergies,
      comorbidities: body.comorbidities,
      weight: body.weight ? parseFloat(body.weight) : undefined,
      height: body.height ? parseFloat(body.height) : undefined,
      renalCreatinineClearance: body.renalCreatinineClearance ? parseFloat(body.renalCreatinineClearance) : undefined,
      creatinine: body.creatinine ? parseFloat(body.creatinine) : undefined,
      renalStage: body.renalStage,
      hepaticStatus: body.hepaticStatus,
      asat: body.asat ? parseFloat(body.asat) : undefined,
      alat: body.alat ? parseFloat(body.alat) : undefined,
      bilirubin: body.bilirubin ? parseFloat(body.bilirubin) : undefined,
      pregnancyStatus: body.pregnancyStatus,
      smokingStatus: body.smokingStatus,
      alcoholUse: body.alcoholUse,
      substanceUse: body.substanceUse,
      professionalExposure: body.professionalExposure,
      physicalActivity: body.physicalActivity,
      dietType: body.dietType,
      stressLevel: body.stressLevel,
      sleepQuality: body.sleepQuality,
      sleepHours: body.sleepHours ? parseFloat(body.sleepHours) : undefined,
      nightShift: body.nightShift === true || body.nightShift === 'true',
      sunExposure: body.sunExposure,
      prolongedFasting: body.prolongedFasting === true || body.prolongedFasting === 'true',
      restrictiveDiet: body.restrictiveDiet === true || body.restrictiveDiet === 'true',
      uncontrolledNaturalProducts: body.uncontrolledNaturalProducts === true || body.uncontrolledNaturalProducts === 'true',
      bloodDonor: body.bloodDonor === true || body.bloodDonor === 'true',
      immunodepression: body.immunodepression,
      suddenMedicationStop: body.suddenMedicationStop === true || body.suddenMedicationStop === 'true',
      regularCheckup: body.regularCheckup !== false && body.regularCheckup !== 'false',
      selfDiagnosis: body.selfDiagnosis === true || body.selfDiagnosis === 'true',
      housingConditions: body.housingConditions,
      previousIntoxication: body.previousIntoxication === true || body.previousIntoxication === 'true',
      allergyReactionTypes: body.allergyReactionTypes,
      glycemia: body.glycemia ? parseFloat(body.glycemia) : undefined,
      sodium: body.sodium ? parseFloat(body.sodium) : undefined,
      potassium: body.potassium ? parseFloat(body.potassium) : undefined,
      crp: body.crp ? parseFloat(body.crp) : undefined,
      lactates: body.lactates ? parseFloat(body.lactates) : undefined,
      extendedProfile: body.extendedProfile && typeof body.extendedProfile === 'object'
        ? body.extendedProfile
        : undefined,
    }

    const patient = await createPatient(session.user.id, data)
    return NextResponse.json(patient, { status: 201 })
  } catch (error: any) {
    console.error('Patient creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }
}
