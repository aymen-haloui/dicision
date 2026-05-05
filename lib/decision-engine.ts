import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

interface CaseMedication {
  id: string
  medication_id: string
  name: string
  dosage: string       // e.g. "500mg" or "10mg/kg"
  frequency: string    // e.g. "3x/day"
  duration: string
  route: string
  max_daily_dose_adult: number | null
  max_daily_dose_child: number | null
  contraindications: ContraIndication[]
  toxicity_thresholds: ToxicityThresholds
  warnings: string | null
  overdose_management: string | null
}

interface ContraIndication {
  condition: string           // "renal_insufficiency" | "hepatic_insufficiency" | "pregnancy_trimester_3" | "age_under_6" | etc.
  severity: 'absolute' | 'relative'
  description: string
  threshold?: number          // for numeric conditions like CrCl < 30
}

interface ToxicityThresholds {
  adult_toxic_dose?: number   // mg — dose above which toxicity is expected
  child_toxic_dose_per_kg?: number  // mg/kg
  child_severe_dose_per_kg?: number
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

// ─── helpers ────────────────────────────────────────────────────────────────

/** Parse a dosage string like "500mg", "1g", "10mg/kg" → milligrams per dose */
function parseDosageMg(dosageStr: string, weightKg?: number): number | null {
  if (!dosageStr) return null
  const lower = dosageStr.toLowerCase().trim()

  // "Xmg/kg" → weight-based
  const perKgMatch = lower.match(/^([\d.]+)\s*mg\/kg/i)
  if (perKgMatch && weightKg) {
    return parseFloat(perKgMatch[1]) * weightKg
  }

  // "Xg" → grams
  const gMatch = lower.match(/^([\d.]+)\s*g\b/)
  if (gMatch) return parseFloat(gMatch[1]) * 1000

  // "Xmg"
  const mgMatch = lower.match(/^([\d.]+)\s*mg/)
  if (mgMatch) return parseFloat(mgMatch[1])

  return null
}

/** Parse frequency string "3x/day", "2/day", "TID", "BID" → doses per day */
function parseFrequencyPerDay(freq: string): number {
  if (!freq) return 1
  const lower = freq.toLowerCase()
  if (lower.includes('tid') || lower.includes('3x') || lower.includes('3 times')) return 3
  if (lower.includes('bid') || lower.includes('2x') || lower.includes('2 times')) return 2
  if (lower.includes('qid') || lower.includes('4x') || lower.includes('4 times')) return 4
  if (lower.includes('once') || lower.includes('1x') || lower.includes('qd')) return 1
  const numMatch = lower.match(/(\d+)\s*[x\/]/)
  if (numMatch) return parseInt(numMatch[1])
  return 1
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
    // ── 1. Load case + patient ──────────────────────────────────────────────
    const caseResult = await sql`
      SELECT
        c.id, c.case_type, c.vital_signs, c.symptoms,
        p.allergies, p.comorbidities,
        p.date_of_birth,
        p.weight,
        p.renal_creatinine_clearance,
        p.hepatic_status,
        p.pregnancy_status,
        p.gender
      FROM cases c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.id = ${caseId} AND c.user_id = ${userId}
    `

    if (caseResult.length === 0) throw new Error('Case not found')

    const caseData = caseResult[0]

    // Compute patient age from date_of_birth
    let patientAgeYears: number | null = null
    if (caseData.date_of_birth) {
      const dob = new Date(caseData.date_of_birth)
      const now = new Date()
      patientAgeYears = now.getFullYear() - dob.getFullYear()
      if (
        now.getMonth() < dob.getMonth() ||
        (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
      ) {
        patientAgeYears--
      }
    }
    const isChild = patientAgeYears !== null && patientAgeYears < 18
    const weightKg: number | undefined = caseData.weight ? parseFloat(caseData.weight) : undefined
    const crcl: number | undefined = caseData.renal_creatinine_clearance
      ? parseFloat(caseData.renal_creatinine_clearance)
      : undefined

    // ── 2. Load case medications with full pharmacological data ────────────
    const medRows = await sql`
      SELECT
        cm.id,
        m.id            AS medication_id,
        m.name,
        m.warnings,
        m.contraindications,
        m.max_daily_dose_adult,
        m.max_daily_dose_child,
        m.toxicity_thresholds,
        cm.dosage,
        cm.frequency,
        cm.duration,
        cm.route
      FROM case_medications cm
      JOIN medications m ON cm.medication_id = m.id
      WHERE cm.case_id = ${caseId}
    `

    const medications = medRows as unknown as CaseMedication[]
    const findings: Finding[] = []
    const recommendations: Recommendation[] = []
    let riskScore = 0

    const addFinding = (f: Finding, score: number) => {
      findings.push(f)
      riskScore += score
    }

    const addRec = (r: Recommendation) => recommendations.push(r)

    // ── 3. ALLERGY CHECK ────────────────────────────────────────────────────
    if (caseData.allergies) {
      const allergyText = caseData.allergies.toLowerCase()
      for (const med of medications) {
        const medLower = med.name.toLowerCase()
        // direct name match or class keywords
        const classKeywords: Record<string, string[]> = {
          amoxicillin:  ['beta-lactam', 'penicillin', 'cephalosporin', 'amoxicillin'],
          ibuprofen:    ['nsaid', 'aspirin', 'ibuprofen'],
          metformin:    ['metformin', 'biguanide'],
        }
        const keywords = classKeywords[medLower] ?? [medLower]
        if (keywords.some(k => allergyText.includes(k))) {
          addFinding({
            type: 'allergy_risk',
            severity: 'critical',
            description: `Patient has documented allergy to ${med.name} or its class`,
            recommendation: `STOP — Do not administer ${med.name}. Consider an alternative.`,
          }, 50)
          addRec({
            title: 'Allergy Alert',
            description: `Patient allergic to ${med.name}`,
            priority: 'high',
            action: 'Substitute with a non-cross-reactive medication',
          })
        }
      }
    }

    // ── 4. CONTRAINDICATION CHECKS ─────────────────────────────────────────
    for (const med of medications) {
      const ciList: ContraIndication[] = Array.isArray(med.contraindications)
        ? med.contraindications
        : []

      for (const ci of ciList) {
        let triggered = false
        let triggerDetail = ''

        switch (ci.condition) {
          case 'renal_insufficiency':
            if (crcl !== undefined && ci.threshold !== undefined && crcl < ci.threshold) {
              triggered = true
              triggerDetail = `CrCl ${crcl} ml/min < ${ci.threshold} ml/min`
            } else if (
              crcl === undefined &&
              caseData.comorbidities?.toLowerCase().includes('renal')
            ) {
              triggered = true
              triggerDetail = 'documented renal insufficiency'
            }
            break
          case 'hepatic_insufficiency':
            if (
              caseData.hepatic_status === 'severe' ||
              caseData.comorbidities?.toLowerCase().includes('hepatic') ||
              caseData.comorbidities?.toLowerCase().includes('liver')
            ) {
              triggered = true
              triggerDetail = 'hepatic insufficiency'
            }
            break
          case 'pregnancy_trimester_3':
            if (
              caseData.pregnancy_status === 'trimester_3' ||
              caseData.pregnancy_status === 'pregnant'
            ) {
              triggered = true
              triggerDetail = 'pregnancy ≥ 6 months'
            }
            break
          case 'age_under_6':
            if (patientAgeYears !== null && patientAgeYears < 6) {
              triggered = true
              triggerDetail = `patient age ${patientAgeYears} years`
            }
            break
          case 'cardiac_insufficiency':
            if (caseData.comorbidities?.toLowerCase().includes('cardiac')) {
              triggered = true
              triggerDetail = 'cardiac insufficiency'
            }
            break
          case 'alcoholism':
            if (caseData.comorbidities?.toLowerCase().includes('alcohol')) {
              triggered = true
              triggerDetail = 'alcoholism'
            }
            break
          case 'epilepsy':
            if (caseData.comorbidities?.toLowerCase().includes('epilep')) {
              triggered = true
              triggerDetail = 'epilepsy'
            }
            break
        }

        if (triggered) {
          const sev = ci.severity === 'absolute' ? 'critical' : 'high'
          const scoreAdd = ci.severity === 'absolute' ? 45 : 20
          addFinding({
            type: 'contraindication',
            severity: sev,
            description: `${med.name} — CONTRAINDICATED: ${ci.description} (${triggerDetail})`,
            recommendation: ci.severity === 'absolute'
              ? `STOP — Do not administer ${med.name}. ${ci.description}`
              : `Use with extreme caution. ${ci.description}`,
          }, scoreAdd)
          addRec({
            title: `Contraindication: ${med.name}`,
            description: ci.description,
            priority: 'high',
            action: ci.severity === 'absolute' ? 'Stop medication immediately' : 'Reassess benefit/risk',
          })
        }
      }
    }

    // ── 5. OVERDOSE / DAILY DOSE CHECK ─────────────────────────────────────
    for (const med of medications) {
      const doseMg = parseDosageMg(med.dosage, weightKg)
      const freq = parseFrequencyPerDay(med.frequency)

      if (doseMg !== null && freq > 0) {
        const dailyDoseMg = doseMg * freq
        const maxDose = isChild ? med.max_daily_dose_child : med.max_daily_dose_adult

        if (maxDose && dailyDoseMg > maxDose) {
          addFinding({
            type: 'overdose_risk',
            severity: 'critical',
            description: `${med.name}: prescribed daily dose ${dailyDoseMg.toFixed(0)} mg exceeds maximum ${maxDose} mg/day`,
            recommendation: `Reduce dose. Max allowed: ${maxDose} mg/day for ${isChild ? 'children' : 'adults'}.`,
          }, 40)
          addRec({
            title: `Dose Exceeded: ${med.name}`,
            description: `Daily dose ${dailyDoseMg.toFixed(0)} mg > max ${maxDose} mg/day`,
            priority: 'high',
            action: `Adjust to ≤ ${maxDose} mg/day`,
          })
        }

        // Toxicity threshold check
        const tox: ToxicityThresholds = med.toxicity_thresholds ?? {}
        const childSevereTox =
          isChild &&
          weightKg &&
          tox.child_severe_dose_per_kg &&
          doseMg / weightKg >= tox.child_severe_dose_per_kg

        if (childSevereTox) {
          addFinding({
            type: 'toxicity_threshold',
            severity: 'critical',
            description: `${med.name}: single dose ${doseMg.toFixed(0)} mg (${(doseMg / weightKg!).toFixed(1)} mg/kg) reaches severe toxicity threshold (≥${tox.child_severe_dose_per_kg} mg/kg)`,
            recommendation: `Immediate medical review. ${med.overdose_management ?? ''}`,
          }, 50)
        }
      }
    }

    // ── 6. DRUG–DRUG INTERACTIONS (from interactions table) ────────────────
    if (medications.length > 1) {
      for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
          const rows = await sql`
            SELECT interaction_type, severity, description, recommendation
            FROM interactions
            WHERE (medication_id_1 = ${medications[i].medication_id} AND medication_id_2 = ${medications[j].medication_id})
               OR (medication_id_1 = ${medications[j].medication_id} AND medication_id_2 = ${medications[i].medication_id})
            LIMIT 1
          `
          if (rows.length > 0) {
            const r = rows[0]
            const scoreMap: Record<string, number> = { critical: 40, severe: 25, moderate: 10, mild: 5 }
            addFinding({
              type: 'drug_interaction',
              severity: r.severity as Finding['severity'],
              description: `${medications[i].name} + ${medications[j].name}: ${r.description}`,
              recommendation: r.recommendation,
            }, scoreMap[r.severity] ?? 5)
            addRec({
              title: `${r.interaction_type ?? 'Drug'} Interaction`,
              description: `${medications[i].name} and ${medications[j].name} interact`,
              priority: ['critical', 'severe'].includes(r.severity) ? 'high' : 'medium',
              action: r.recommendation,
            })
          }
        }
      }
    }

    // ── 7. COMORBIDITY-SPECIFIC RULES ──────────────────────────────────────
    const comorbLower = (caseData.comorbidities ?? '').toLowerCase()
    for (const med of medications) {
      const medLower = med.name.toLowerCase()

      // Nephrotoxic drugs in renal disease
      if (
        comorbLower.includes('renal') &&
        ['gentamicin', 'tobramycin', 'vancomycin', 'amikacin'].includes(medLower)
      ) {
        addFinding({
          type: 'comorbidity_risk',
          severity: 'high',
          description: `${med.name} is nephrotoxic and patient has renal disease`,
          recommendation: 'Dose adjustment required. Monitor drug levels and renal function.',
        }, 15)
      }

      // Metformine + any renal issue: check CrCl
      if (medLower === 'metformin' || medLower === 'metformine') {
        if (crcl !== undefined && crcl < 30) {
          addFinding({
            type: 'contraindication',
            severity: 'critical',
            description: `Metformine is absolutely contraindicated with CrCl < 30 ml/min (patient: ${crcl} ml/min) — risk of fatal lactic acidosis`,
            recommendation: 'STOP Metformine immediately. Switch to an alternative.',
          }, 50)
        } else if (crcl !== undefined && crcl < 45) {
          addFinding({
            type: 'comorbidity_risk',
            severity: 'high',
            description: `Metformine should be used with caution when CrCl 30–45 ml/min (patient: ${crcl} ml/min)`,
            recommendation: 'Reduce dose and monitor renal function every 3–6 months.',
          }, 20)
        }
      }
    }

    // ── 8. VITAL SIGNS ─────────────────────────────────────────────────────
    if (caseData.vital_signs) {
      const vitals = caseData.vital_signs as Record<string, any>
      if (vitals.heartRate && (vitals.heartRate > 120 || vitals.heartRate < 50)) {
        addFinding({
          type: 'abnormal_vital',
          severity: 'moderate',
          description: `Abnormal heart rate: ${vitals.heartRate} bpm`,
          recommendation: 'Cardiac monitoring required',
        }, 10)
      }
      if (vitals.temperature && vitals.temperature > 39) {
        addFinding({
          type: 'abnormal_vital',
          severity: 'high',
          description: `Hyperthermia: ${vitals.temperature}°C — risk of sepsis`,
          recommendation: 'Culture blood, consider broad-spectrum antibiotics, antipyretics',
        }, 15)
      }
      if (vitals.bloodPressure) {
        const [sys] = String(vitals.bloodPressure).split('/').map(Number)
        if (sys > 180 || sys < 80) {
          addFinding({
            type: 'abnormal_vital',
            severity: 'high',
            description: `Abnormal systolic BP: ${vitals.bloodPressure} mmHg`,
            recommendation: 'Urgent BP management needed',
          }, 15)
        }
      }
    }

    // ── 9. RISK CLASSIFICATION ─────────────────────────────────────────────
    riskScore = Math.min(riskScore, 100)
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low'
    if (riskScore >= 80)      riskLevel = 'critical'
    else if (riskScore >= 50) riskLevel = 'high'
    else if (riskScore >= 20) riskLevel = 'moderate'

    if (recommendations.length === 0) {
      addRec({
        title: 'No Major Concerns',
        description: 'Analysis found no critical issues',
        priority: 'low',
        action: 'Continue with planned treatment. Routine monitoring.',
      })
    }

    return { riskScore, riskLevel, findings, recommendations }
  } catch (error) {
    console.error('Decision engine error:', error)
    throw error
  }
}
