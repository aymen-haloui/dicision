import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface PatientCondition {
  id?: string
  condition_name: string
  category: string
  severity: string
  status: string
  diagnosed_at?: string
  notes?: string
}

interface PatientAllergy {
  id?: string
  allergen_name: string
  allergen_category: string
  reaction_type: string
  severity: string
  onset_delay: string
}

interface PatientMedication {
  id?: string
  medication_name: string
  dosage?: string
  frequency?: string
  route?: string
  started_at?: string
  ongoing?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { error: 'First and last name are required' },
        { status: 400 }
      )
    }

    // Create patient record
    const patient = await prisma.patients.create({
      data: {
        user_id: session.user.id,
        first_name: body.first_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth ? new Date(body.date_of_birth) : null,
        gender: body.gender || null,
        medical_record_number: body.medical_record_number || null,
        weight: body.weight ? parseFloat(body.weight) : null,
        height: body.height ? parseFloat(body.height) : null,
        pregnancy_status: body.pregnancy_status === true || body.pregnancy_status === 'true' ? true : false,
        pregnancy_trimester: body.pregnancy_trimester || null,
        breastfeeding_status: body.breastfeeding_status === true || body.breastfeeding_status === 'true' ? true : false,
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
        created_at: true,
      },
    })

    // Create conditions if provided
    if (body.conditions && Array.isArray(body.conditions)) {
      for (const condition of body.conditions) {
        if (condition.condition_name) {
          await prisma.patient_conditions.create({
            data: {
              patient_id: patient.id,
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

    // Create allergies if provided
    if (body.allergies && Array.isArray(body.allergies)) {
      for (const allergy of body.allergies) {
        if (allergy.allergen_name) {
          await prisma.patient_allergies.create({
            data: {
              patient_id: patient.id,
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

    // Create medications if provided
    if (body.medications && Array.isArray(body.medications)) {
      for (const medication of body.medications) {
        if (medication.medication_name) {
          // First, check if medication exists in medications table
          let medicationId: string
          const existingMed = await prisma.medications.findUnique({
            where: { name: medication.medication_name },
            select: { id: true },
          })

          if (existingMed) {
            medicationId = existingMed.id
          } else {
            // Create new medication record
            const newMed = await prisma.medications.create({
              data: {
                name: medication.medication_name,
                category: 'general',
              },
              select: { id: true },
            })
            medicationId = newMed.id
          }

          // Create patient medication record
          await prisma.patient_medications.create({
            data: {
              patient_id: patient.id,
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

    // Create lifestyle data if provided
    if (body.sleep_hours || body.diet_type || body.night_shift || body.housing_conditions) {
      await prisma.patient_lifestyle.create({
        data: {
          patient_id: patient.id,
          diet_type: body.diet_type || null,
          sleep_hours: body.sleep_hours ? parseFloat(body.sleep_hours) : null,
          night_shift: body.night_shift === true || body.night_shift === 'true' ? true : false,
          sun_exposure: body.sun_exposure || null,
          prolonged_fasting: body.prolonged_fasting === true || body.prolonged_fasting === 'true' ? true : false,
          restrictive_diet: body.restrictive_diet === true || body.restrictive_diet === 'true' ? true : false,
          uncontrolled_natural_products: body.uncontrolled_natural_products === true || body.uncontrolled_natural_products === 'true' ? true : false,
          blood_donor: body.blood_donor === true || body.blood_donor === 'true' ? true : false,
          immunodepression: body.immunodepression || 'none',
          sudden_medication_stop: body.sudden_medication_stop === true || body.sudden_medication_stop === 'true' ? true : false,
          regular_checkup: body.regular_checkup !== false && body.regular_checkup !== 'false' ? true : true,
          self_diagnosis: body.self_diagnosis === true || body.self_diagnosis === 'true' ? true : false,
          housing_conditions: body.housing_conditions || null,
          previous_intoxication: body.previous_intoxication === true || body.previous_intoxication === 'true' ? true : false,
        },
      })
    }

    return NextResponse.json(
      { patient },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Patient creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create patient' },
      { status: 500 }
    )
  }
}
