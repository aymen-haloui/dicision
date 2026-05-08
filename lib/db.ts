import postgres from 'postgres'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const sql = postgres(process.env.DATABASE_URL!)

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  specialization?: string
) {
  try {
    const existing = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existing) {
      throw new Error('User already exists')
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10)

    const result = await prisma.users.create({
      data: {
        email,
        password_hash: passwordHash,
        full_name: fullName,
        specialization: specialization || null,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        specialization: true,
      },
    })

    return result
  } catch (error) {
    throw error
  }
}

export async function getUserById(userId: string) {
  try {
    const result = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        specialization: true,
      },
    })

    return result || null
  } catch (error) {
    throw error
  }
}

export async function getPatientsByUserId(userId: string) {
  try {
    const result = await sql`
      SELECT id, first_name, last_name, date_of_birth, gender, medical_record_number, allergies, comorbidities
      FROM patients
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return result
  } catch (error) {
    throw error
  }
}

export interface PatientInput {
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  medicalRecordNumber?: string
  allergies?: string
  comorbidities?: string
  // Anthropometric
  weight?: number
  height?: number
  // Renal
  renalCreatinineClearance?: number
  creatinine?: number
  renalStage?: string
  // Hepatic
  hepaticStatus?: string
  asat?: number
  alat?: number
  bilirubin?: number
  // Reproductive
  pregnancyStatus?: string
  // Lifestyle
  smokingStatus?: string
  alcoholUse?: string
  substanceUse?: string
  professionalExposure?: string
  physicalActivity?: string
  dietType?: string
  stressLevel?: string
  sleepQuality?: string
  sleepHours?: number
  nightShift?: boolean
  sunExposure?: string
  prolongedFasting?: boolean
  restrictiveDiet?: boolean
  uncontrolledNaturalProducts?: boolean
  // Medical factors
  bloodDonor?: boolean
  immunodepression?: string
  suddenMedicationStop?: boolean
  regularCheckup?: boolean
  selfDiagnosis?: boolean
  housingConditions?: string
  previousIntoxication?: boolean
  allergyReactionTypes?: string
  // Biological complementary
  glycemia?: number
  sodium?: number
  potassium?: number
  crp?: number
  lactates?: number
  // Full validated clinical/toxicology profile
  extendedProfile?: Record<string, any>
}

export async function createPatient(userId: string, data: PatientInput) {
  try {
    const result = await sql`
      INSERT INTO patients (
        user_id, first_name, last_name, date_of_birth, gender,
        medical_record_number, allergies, comorbidities,
        weight, height,
        renal_creatinine_clearance, creatinine, renal_stage,
        hepatic_status, asat, alat, bilirubin,
        pregnancy_status,
        smoking_status, alcohol_use, substance_use, professional_exposure,
        physical_activity, diet_type, stress_level, sleep_quality, sleep_hours,
        night_shift, sun_exposure, prolonged_fasting, restrictive_diet,
        uncontrolled_natural_products,
        blood_donor, immunodepression, sudden_medication_stop, regular_checkup,
        self_diagnosis, housing_conditions, previous_intoxication,
        allergy_reaction_types,
        glycemia, sodium, potassium, crp, lactates,
        extended_profile
      )
      VALUES (
        ${userId}, ${data.firstName}, ${data.lastName},
        ${data.dateOfBirth || null}, ${data.gender || null},
        ${data.medicalRecordNumber || null}, ${data.allergies || null}, ${data.comorbidities || null},
        ${data.weight ?? null}, ${data.height ?? null},
        ${data.renalCreatinineClearance ?? null}, ${data.creatinine ?? null}, ${data.renalStage || null},
        ${data.hepaticStatus || null}, ${data.asat ?? null}, ${data.alat ?? null}, ${data.bilirubin ?? null},
        ${data.pregnancyStatus || null},
        ${data.smokingStatus || null}, ${data.alcoholUse || null},
        ${data.substanceUse || null}, ${data.professionalExposure || null},
        ${data.physicalActivity || null}, ${data.dietType || null},
        ${data.stressLevel || null}, ${data.sleepQuality || null}, ${data.sleepHours ?? null},
        ${data.nightShift ?? false}, ${data.sunExposure || null},
        ${data.prolongedFasting ?? false}, ${data.restrictiveDiet ?? false},
        ${data.uncontrolledNaturalProducts ?? false},
        ${data.bloodDonor ?? false}, ${data.immunodepression || null},
        ${data.suddenMedicationStop ?? false}, ${data.regularCheckup ?? true},
        ${data.selfDiagnosis ?? false}, ${data.housingConditions || null},
        ${data.previousIntoxication ?? false},
        ${data.allergyReactionTypes || null},
        ${data.glycemia ?? null}, ${data.sodium ?? null}, ${data.potassium ?? null},
        ${data.crp ?? null}, ${data.lactates ?? null},
        ${JSON.stringify(data.extendedProfile ?? {})}::jsonb
      )
      RETURNING *
    `
    return result[0]
  } catch (error) {
    throw error
  }
}

export async function getPatientById(patientId: string, userId: string) {
  try {
    const result = await sql`
      SELECT *
      FROM patients
      WHERE id = ${patientId} AND user_id = ${userId}
    `
    return result[0] || null
  } catch (error) {
    throw error
  }
}

export async function updatePatient(
  patientId: string,
  userId: string,
  updates: Partial<PatientInput>
) {
  try {
    const columnMap: Record<keyof PatientInput, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      medicalRecordNumber: 'medical_record_number',
      allergies: 'allergies',
      comorbidities: 'comorbidities',
      weight: 'weight',
      height: 'height',
      renalCreatinineClearance: 'renal_creatinine_clearance',
      creatinine: 'creatinine',
      renalStage: 'renal_stage',
      hepaticStatus: 'hepatic_status',
      asat: 'asat',
      alat: 'alat',
      bilirubin: 'bilirubin',
      pregnancyStatus: 'pregnancy_status',
      smokingStatus: 'smoking_status',
      alcoholUse: 'alcohol_use',
      substanceUse: 'substance_use',
      professionalExposure: 'professional_exposure',
      physicalActivity: 'physical_activity',
      dietType: 'diet_type',
      stressLevel: 'stress_level',
      sleepQuality: 'sleep_quality',
      sleepHours: 'sleep_hours',
      nightShift: 'night_shift',
      sunExposure: 'sun_exposure',
      prolongedFasting: 'prolonged_fasting',
      restrictiveDiet: 'restrictive_diet',
      uncontrolledNaturalProducts: 'uncontrolled_natural_products',
      bloodDonor: 'blood_donor',
      immunodepression: 'immunodepression',
      suddenMedicationStop: 'sudden_medication_stop',
      regularCheckup: 'regular_checkup',
      selfDiagnosis: 'self_diagnosis',
      housingConditions: 'housing_conditions',
      previousIntoxication: 'previous_intoxication',
      allergyReactionTypes: 'allergy_reaction_types',
      glycemia: 'glycemia',
      sodium: 'sodium',
      potassium: 'potassium',
      crp: 'crp',
      lactates: 'lactates',
      extendedProfile: 'extended_profile',
    }

    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    for (const [key, value] of Object.entries(updates)) {
      const col = columnMap[key as keyof PatientInput]
      if (col) {
        if (key === 'extendedProfile') {
          fields.push(`${col} = $${idx}::jsonb`)
          values.push(JSON.stringify(value ?? {}))
          idx++
          continue
        }
        fields.push(`${col} = $${idx}`)
        values.push(value ?? null)
        idx++
      }
    }

    if (fields.length === 0) return null

    values.push(patientId, userId)
    const query = `
      UPDATE patients SET ${fields.join(', ')}
      WHERE id = $${idx} AND user_id = $${idx + 1}
      RETURNING *
    `
    const result = await sql.unsafe(query, values)
    return result[0] || null
  } catch (error) {
    throw error
  }
}

export async function getMedicationByName(name: string) {
  try {
    const result = await sql`
      SELECT id, name, generic_name, category, dosage_form, default_dosage, warnings
      FROM medications
      WHERE name = ${name}
    `

    return result[0] || null
  } catch (error) {
    throw error
  }
}

export async function getAllMedications() {
  try {
    const result = await sql`
      SELECT id, name, generic_name, category, dosage_form, default_dosage, warnings
      FROM medications
      ORDER BY name
    `

    return result
  } catch (error) {
    throw error
  }
}

export async function createCase(
  userId: string,
  patientId: string,
  caseType: 'emergency' | 'clinical',
  chiefComplaint?: string,
  symptoms?: string,
  vitalSigns?: Record<string, any>
) {
  try {
    const result = await sql`
      INSERT INTO cases (
        user_id, patient_id, case_type, chief_complaint, symptoms, vital_signs
      )
      VALUES (
        ${userId}, ${patientId}, ${caseType}, ${chiefComplaint || null}, ${symptoms || null}, ${JSON.stringify(vitalSigns || {})}
      )
      RETURNING id, case_type, chief_complaint, symptoms, vital_signs, status, created_at
    `

    return result[0]
  } catch (error) {
    throw error
  }
}

export async function getCasesByPatientId(patientId: string, userId: string) {
  try {
    const result = await sql`
      SELECT id, case_type, chief_complaint, symptoms, status, created_at
      FROM cases
      WHERE patient_id = ${patientId} AND user_id = ${userId}
      ORDER BY created_at DESC
    `

    return result
  } catch (error) {
    throw error
  }
}

export async function getCaseById(caseId: string, userId: string) {
  try {
    const result = await sql`
      SELECT id, patient_id, case_type, chief_complaint, symptoms, vital_signs, status, created_at
      FROM cases
      WHERE id = ${caseId} AND user_id = ${userId}
    `

    return result[0] || null
  } catch (error) {
    throw error
  }
}

export async function addMedicationToCase(
  caseId: string,
  medicationId: string,
  dosage?: string,
  frequency?: string,
  duration?: string,
  route?: string
) {
  try {
    const result = await sql`
      INSERT INTO case_medications (
        case_id, medication_id, dosage, frequency, duration, route
      )
      VALUES (
        ${caseId}, ${medicationId}, ${dosage || null}, ${frequency || null}, ${duration || null}, ${route || null}
      )
      RETURNING id, dosage, frequency, duration, route
    `

    return result[0]
  } catch (error) {
    throw error
  }
}

export async function getCaseMedications(caseId: string) {
  try {
    const result = await sql`
      SELECT cm.id, m.id as medication_id, m.name, m.generic_name, m.warnings,
             cm.dosage, cm.frequency, cm.duration, cm.route
      FROM case_medications cm
      JOIN medications m ON cm.medication_id = m.id
      WHERE cm.case_id = ${caseId}
    `

    return result
  } catch (error) {
    throw error
  }
}

export async function getInteractionsBetweenMedications(
  medicationId1: string,
  medicationId2: string
) {
  try {
    const result = await sql`
      SELECT id, interaction_type, severity, description, recommendation
      FROM interactions
      WHERE (medication_id_1 = ${medicationId1} AND medication_id_2 = ${medicationId2})
         OR (medication_id_1 = ${medicationId2} AND medication_id_2 = ${medicationId1})
    `

    return result
  } catch (error) {
    throw error
  }
}

export async function createRiskAssessment(
  caseId: string,
  riskScore: number,
  riskLevel: 'low' | 'moderate' | 'high' | 'critical',
  findings: Record<string, any>,
  recommendations: Record<string, any>
) {
  try {
    const result = await sql`
      INSERT INTO risk_assessments (
        case_id, risk_score, risk_level, findings, recommendations
      )
      VALUES (
        ${caseId}, ${riskScore}, ${riskLevel}, ${JSON.stringify(findings)}, ${JSON.stringify(recommendations)}
      )
      RETURNING id, risk_score, risk_level, findings, recommendations, created_at
    `

    return result[0]
  } catch (error) {
    throw error
  }
}

export async function getRiskAssessmentByCase(caseId: string) {
  try {
    const result = await sql`
      SELECT id, risk_score, risk_level, findings, recommendations, created_at
      FROM risk_assessments
      WHERE case_id = ${caseId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    return result[0] || null
  } catch (error) {
    throw error
  }
}
