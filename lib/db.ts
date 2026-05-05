import postgres from 'postgres'
import bcryptjs from 'bcryptjs'

const sql = postgres(process.env.DATABASE_URL!)

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  specialization?: string
) {
  try {
    // Check if user exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existing.length > 0) {
      throw new Error('User already exists')
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10)

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, specialization)
      VALUES (${email}, ${passwordHash}, ${fullName}, ${specialization || null})
      RETURNING id, email, full_name, specialization
    `

    return result[0]
  } catch (error) {
    throw error
  }
}

export async function getUserById(userId: string) {
  try {
    const result = await sql`
      SELECT id, email, full_name, specialization
      FROM users
      WHERE id = ${userId}
    `

    return result[0] || null
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

export async function createPatient(
  userId: string,
  firstName: string,
  lastName: string,
  dateOfBirth?: string,
  gender?: string,
  medicalRecordNumber?: string,
  allergies?: string,
  comorbidities?: string,
  weight?: number,
  renalCreatinineClearance?: number,
  hepaticStatus?: string,
  pregnancyStatus?: string
) {
  try {
    const result = await sql`
      INSERT INTO patients (
        user_id, first_name, last_name, date_of_birth, gender,
        medical_record_number, allergies, comorbidities,
        weight, renal_creatinine_clearance, hepatic_status, pregnancy_status
      )
      VALUES (
        ${userId}, ${firstName}, ${lastName}, ${dateOfBirth || null}, ${gender || null},
        ${medicalRecordNumber || null}, ${allergies || null}, ${comorbidities || null},
        ${weight ?? null}, ${renalCreatinineClearance ?? null}, ${hepaticStatus || null}, ${pregnancyStatus || null}
      )
      RETURNING id, first_name, last_name, date_of_birth, gender, medical_record_number,
                allergies, comorbidities, weight, renal_creatinine_clearance, hepatic_status, pregnancy_status
    `

    return result[0]
  } catch (error) {
    throw error
  }
}

export async function getPatientById(patientId: string, userId: string) {
  try {
    const result = await sql`
      SELECT id, first_name, last_name, date_of_birth, gender, medical_record_number, allergies, comorbidities
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
  updates: {
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    gender?: string
    allergies?: string
    comorbidities?: string
  }
) {
  try {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex}`)
      values.push(updates.firstName)
      paramIndex++
    }
    if (updates.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex}`)
      values.push(updates.lastName)
      paramIndex++
    }
    if (updates.dateOfBirth !== undefined) {
      fields.push(`date_of_birth = $${paramIndex}`)
      values.push(updates.dateOfBirth || null)
      paramIndex++
    }
    if (updates.gender !== undefined) {
      fields.push(`gender = $${paramIndex}`)
      values.push(updates.gender || null)
      paramIndex++
    }
    if (updates.allergies !== undefined) {
      fields.push(`allergies = $${paramIndex}`)
      values.push(updates.allergies || null)
      paramIndex++
    }
    if (updates.comorbidities !== undefined) {
      fields.push(`comorbidities = $${paramIndex}`)
      values.push(updates.comorbidities || null)
      paramIndex++
    }

    if (fields.length === 0) {
      return null
    }

    values.push(patientId)
    values.push(userId)

    const query = `
      UPDATE patients
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING id, first_name, last_name, date_of_birth, gender, medical_record_number, allergies, comorbidities
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
