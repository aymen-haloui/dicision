import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildLifestylePayload, hasLifestyleData } from '@/lib/patient-lifestyle'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: patientId } = await params

    // Fetch patient with all related data
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      include: {
        patient_conditions: true,
        patient_allergies: true,
        patient_medications: {
          include: {
            medications: true,
          },
        },
        patient_lifestyle: true,
      },
    })

    if (!patient || patient.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ patient }, { status: 200 })
  } catch (error: any) {
    console.error('Patient fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch patient' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: patientId } = await params
    const body = await request.json()

    // Verify patient belongs to user
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { user_id: true },
    })

    if (!patient || patient.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Update patient record
    const updatedPatient = await prisma.patients.update({
      where: { id: patientId },
      data: {
        first_name: body.first_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth ? new Date(body.date_of_birth) : undefined,
        gender: body.gender || null,
        medical_record_number: body.medical_record_number || null,
        weight: body.weight ? parseFloat(body.weight) : null,
        height: body.height ? parseFloat(body.height) : null,
        pregnancy_status: body.pregnancy_status === true || body.pregnancy_status === 'true' ? true : false,
        pregnancy_trimester: body.pregnancy_trimester || null,
        pregnancy_duration_weeks: body.pregnancy_duration_weeks ? parseInt(body.pregnancy_duration_weeks, 10) : null,
        breastfeeding_status: body.breastfeeding_status === true || body.breastfeeding_status === 'true' ? true : false,
        breastfeeding_infant_age: body.breastfeeding_infant_age || null,
        breastfeeding_type: body.breastfeeding_type || null,
        smoking_status: body.smoking_status || null,
        alcohol_use: body.alcohol_use || null,
        physical_activity: body.physical_activity || null,
        stress_level: body.stress_level || null,
        sleep_quality: body.sleep_quality || null,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    })

    // Handle conditions
    if (body.conditions && Array.isArray(body.conditions)) {
      // Delete existing conditions not in the new list
      const existingConditionIds = body.conditions
        .filter((c: any) => c.id)
        .map((c: any) => c.id)

      await prisma.patient_conditions.deleteMany({
        where: {
          patient_id: patientId,
          id: {
            notIn: existingConditionIds,
          },
        },
      })

      // Create or update conditions
      for (const condition of body.conditions) {
        if (condition.id) {
          // Update existing
          await prisma.patient_conditions.update({
            where: { id: condition.id },
            data: {
              condition_name: condition.condition_name,
              category: condition.category || null,
              severity: condition.severity || null,
              status: condition.status || null,
              diagnosed_at: condition.diagnosed_at ? new Date(condition.diagnosed_at) : null,
              notes: condition.notes || null,
            },
          })
        } else if (condition.condition_name) {
          // Create new
          await prisma.patient_conditions.create({
            data: {
              patient_id: patientId,
              condition_name: condition.condition_name,
              category: condition.category || null,
              severity: condition.severity || null,
              status: condition.status || null,
              diagnosed_at: condition.diagnosed_at ? new Date(condition.diagnosed_at) : null,
              notes: condition.notes || null,
            },
          })
        }
      }
    }

    // Handle allergies
    if (body.allergies && Array.isArray(body.allergies)) {
      const existingAllergyIds = body.allergies
        .filter((a: any) => a.id)
        .map((a: any) => a.id)

      await prisma.patient_allergies.deleteMany({
        where: {
          patient_id: patientId,
          id: {
            notIn: existingAllergyIds,
          },
        },
      })

      for (const allergy of body.allergies) {
        if (allergy.id) {
          await prisma.patient_allergies.update({
            where: { id: allergy.id },
            data: {
              allergen_name: allergy.allergen_name,
              allergen_category: allergy.allergen_category || null,
              reaction_type: allergy.reaction_type || null,
              severity: allergy.severity || null,
              onset_delay: allergy.onset_delay || null,
            },
          })
        } else if (allergy.allergen_name) {
          await prisma.patient_allergies.create({
            data: {
              patient_id: patientId,
              allergen_name: allergy.allergen_name,
              allergen_category: allergy.allergen_category || null,
              reaction_type: allergy.reaction_type || null,
              severity: allergy.severity || null,
              onset_delay: allergy.onset_delay || null,
            },
          })
        }
      }
    }

    // Handle medications
    if (body.medications && Array.isArray(body.medications)) {
      const existingMedicationIds = body.medications
        .filter((m: any) => m.id)
        .map((m: any) => m.id)

      await prisma.patient_medications.deleteMany({
        where: {
          patient_id: patientId,
          id: {
            notIn: existingMedicationIds,
          },
        },
      })

      for (const medication of body.medications) {
        if (medication.id) {
          // Update existing
          await prisma.patient_medications.update({
            where: { id: medication.id },
            data: {
              dosage: medication.dosage || null,
              frequency: medication.frequency || null,
              route: medication.route || null,
              started_at: medication.started_at ? new Date(medication.started_at) : null,
              ongoing: medication.ongoing !== false,
            },
          })
        } else if (medication.medication_name) {
          // Get or create medication
          const existingMed = await prisma.medications.findUnique({
            where: { name: medication.medication_name },
            select: { id: true },
          })

          if (!existingMed) {
            return NextResponse.json(
              { error: `Médicament non reconnu: ${medication.medication_name}` },
              { status: 400 }
            )
          }
          const medicationId = existingMed.id

          // Create patient medication
          await prisma.patient_medications.create({
            data: {
              patient_id: patientId,
              medication_id: medicationId,
              dosage: medication.dosage || null,
              frequency: medication.frequency || null,
              route: medication.route || null,
              started_at: medication.started_at ? new Date(medication.started_at) : null,
              ongoing: medication.ongoing !== false,
            },
          })
        }
      }
    }

    // Handle lifestyle
    const existingLifestyle = await prisma.patient_lifestyle.findFirst({
      where: { patient_id: patientId },
    })

    if (hasLifestyleData(body)) {
      const lifestyleData = buildLifestylePayload(body)
      if (existingLifestyle) {
        await prisma.patient_lifestyle.update({
          where: { id: existingLifestyle.id },
          data: lifestyleData,
        })
      } else {
        await prisma.patient_lifestyle.create({
          data: {
            patient_id: patientId,
            ...lifestyleData,
          },
        })
      }
    }

    return NextResponse.json({ patient: updatedPatient }, { status: 200 })
  } catch (error: any) {
    console.error('Patient update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update patient' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: patientId } = await params

    // Verify patient belongs to user
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { user_id: true },
    })

    if (!patient || patient.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete patient (cascade will delete related records)
    await prisma.patients.delete({
      where: { id: patientId },
    })

    return NextResponse.json({ message: 'Patient deleted' }, { status: 200 })
  } catch (error: any) {
    console.error('Patient delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete patient' },
      { status: 500 }
    )
  }
}
