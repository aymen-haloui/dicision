import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

interface CaseMedication {
  id: string
  name: string
  dosage: string
  frequency: string
  duration: string
  route: string
}

interface Finding {
  type: string
  severity: 'low' | 'moderate' | 'high' | 'critical'
  description: string
  recommendation: string
}

interface Recommendation {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  action: string
}

export async function analyzeCase(
  caseId: string,
  userId: string
): Promise<{
  riskScore: number
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  findings: Finding[]
  recommendations: Recommendation[]
}> {
  try {
    // Get case details with medications
    const caseResult = await sql`
      SELECT c.id, c.case_type, c.vital_signs, c.symptoms, p.allergies, p.comorbidities
      FROM cases c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ${caseId} AND c.user_id = ${userId}
    `

    if (caseResult.length === 0) {
      throw new Error('Case not found')
    }

    const caseData = caseResult[0]

    // Get medications for the case
    const medicationsResult = await sql`
      SELECT cm.id, m.id as medication_id, m.name, m.warnings, cm.dosage, cm.frequency, cm.duration, cm.route
      FROM case_medications cm
      JOIN medications m ON cm.medication_id = m.id
      WHERE cm.case_id = ${caseId}
    `

    const medications = medicationsResult as CaseMedication[]
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    let riskScore = 0

    // Check for allergies
    if (caseData.allergies) {
      for (const med of medications) {
        if (
          caseData.allergies &&
          caseData.allergies.toLowerCase().includes(med.name.toLowerCase())
        ) {
          findings.push({
            type: 'allergy_risk',
            severity: 'critical',
            description: `Patient has documented allergy to ${med.name}`,
            recommendation: `STOP: Do not administer ${med.name}. Consider alternative medication.`,
          })
          riskScore += 50
          recommendations.push({
            title: 'Allergy Alert',
            description: `Patient is allergic to ${med.name}`,
            priority: 'high',
            action: 'Change medication immediately',
          })
        }
      }
    }

    // Check for drug-drug interactions
    if (medications.length > 1) {
      for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
          const interactions = await sql`
            SELECT id, interaction_type, severity, description, recommendation
            FROM interactions
            WHERE (medication_id_1 = ${medications[i].medication_id} AND medication_id_2 = ${medications[j].medication_id})
               OR (medication_id_1 = ${medications[j].medication_id} AND medication_id_2 = ${medications[i].medication_id})
            LIMIT 1
          `

          if (interactions.length > 0) {
            const interaction = interactions[0]
            findings.push({
              type: 'drug_interaction',
              severity: interaction.severity,
              description: `${interaction.description} (${medications[i].name} + ${medications[j].name})`,
              recommendation: interaction.recommendation,
            })

            const severityScore =
              interaction.severity === 'critical'
                ? 40
                : interaction.severity === 'severe'
                  ? 25
                  : interaction.severity === 'moderate'
                    ? 10
                    : 5

            riskScore += severityScore

            recommendations.push({
              title: `${interaction.interaction_type} Interaction Detected`,
              description: `${medications[i].name} and ${medications[j].name} interact`,
              priority:
                interaction.severity === 'critical'
                  ? 'high'
                  : interaction.severity === 'severe'
                    ? 'high'
                    : 'medium',
              action: interaction.recommendation,
            })
          }
        }
      }
    }

    // Check medication warnings
    for (const med of medications) {
      if (med.warnings) {
        findings.push({
          type: 'medication_warning',
          severity: 'moderate',
          description: `${med.name}: ${med.warnings}`,
          recommendation: `Review warnings and monitor patient accordingly`,
        })
        riskScore += 5
      }
    }

    // Check for comorbidities
    if (caseData.comorbidities) {
      for (const med of medications) {
        if (
          caseData.comorbidities &&
          caseData.comorbidities.toLowerCase().includes('renal') &&
          ['gentamicin', 'tobramycin', 'vancomycin'].includes(med.name.toLowerCase())
        ) {
          findings.push({
            type: 'comorbidity_risk',
            severity: 'high',
            description: `Patient has renal disease; ${med.name} requires careful monitoring`,
            recommendation: `Consider dose adjustment for renal impairment`,
          })
          riskScore += 15
          recommendations.push({
            title: 'Renal Impairment Concern',
            description: `${med.name} may accumulate in patients with renal disease`,
            priority: 'high',
            action: 'Adjust dosage based on renal function',
          })
        }
      }
    }

    // Check vital signs for emergency cases
    if (caseData.case_type === 'emergency' && caseData.vital_signs) {
      const vitals = caseData.vital_signs as Record<string, any>

      if (vitals.heartRate && (vitals.heartRate > 120 || vitals.heartRate < 60)) {
        findings.push({
          type: 'abnormal_vital',
          severity: 'moderate',
          description: `Abnormal heart rate: ${vitals.heartRate} bpm`,
          recommendation: `Monitor cardiac status closely`,
        })
        riskScore += 10
      }

      if (vitals.temperature && vitals.temperature > 39) {
        findings.push({
          type: 'abnormal_vital',
          severity: 'high',
          description: `High fever: ${vitals.temperature}°C`,
          recommendation: `Monitor for sepsis and consider antipyretics`,
        })
        riskScore += 15
      }
    }

    // Calculate final risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low'
    if (riskScore >= 80) {
      riskLevel = 'critical'
    } else if (riskScore >= 50) {
      riskLevel = 'high'
    } else if (riskScore >= 20) {
      riskLevel = 'moderate'
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100)

    // Add general safety recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'No Major Concerns',
        description: 'Case appears to be low risk based on current analysis',
        priority: 'low',
        action: 'Continue with planned treatment',
      })
    }

    return {
      riskScore,
      riskLevel,
      findings,
      recommendations,
    }
  } catch (error) {
    console.error('Error analyzing case:', error)
    throw error
  }
}
