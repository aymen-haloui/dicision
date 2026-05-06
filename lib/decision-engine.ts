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
        p.weight, p.height,
        p.renal_creatinine_clearance,
        p.hepatic_status,
        p.pregnancy_status,
        p.gender,
        -- new extended fields
        p.smoking_status,
        p.alcohol_use,
        p.immunodepression,
        p.creatinine,
        p.renal_stage,
        p.asat,
        p.alat,
        p.bilirubin,
        p.glycemia,
        p.sodium,
        p.potassium,
        p.crp,
        p.lactates,
        p.prolonged_fasting,
        p.blood_donor,
        p.sudden_medication_stop,
        p.uncontrolled_natural_products,
        p.previous_intoxication,
        p.allergy_reaction_types,
        p.night_shift
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

    // ── 9. ALCOHOL + HEPATOTOXIC DRUGS ────────────────────────────────────
    const alcoholUse: string = caseData.alcohol_use ?? 'none'
    if (alcoholUse === 'heavy' || alcoholUse === 'moderate') {
      const hepatotoxicMeds = ['paracetamol', 'acetaminophen', 'isoniazide', 'methotrexate',
        'amoxicillin-clavulanate', 'ketoconazole', 'fluconazole', 'amiodarone', 'statines',
        'atorvastatin', 'simvastatin', 'valproate', 'valproic acid', 'rifampicine']
      for (const med of medications) {
        const mn = med.name.toLowerCase()
        if (hepatotoxicMeds.some(h => mn.includes(h))) {
          const score = alcoholUse === 'heavy' ? 30 : 15
          addFinding({
            type: 'alcohol_hepatotoxicity',
            severity: alcoholUse === 'heavy' ? 'critical' : 'high',
            description: `${med.name} + consommation ${alcoholUse === 'heavy' ? 'excessive' : 'moderee'} d'alcool — risque eleve d'hepatotoxicite`,
            recommendation: `Eviter ${med.name} en cas de consommation d'alcool significative. Surveiller ASAT/ALAT. Considerez dose reduite ou alternative.`,
          }, score)
          addRec({
            title: `Interaction Alcool + ${med.name}`,
            description: `Hepatotoxicite potentialisee par l'alcool`,
            priority: alcoholUse === 'heavy' ? 'high' : 'medium',
            action: `Bilan hepatique avant et pendant traitement. Abstinence alcoolique recommandee.`,
          })
        }
      }
    }

    // ── 10. SMOKING → CYP1A2 INDUCTION ────────────────────────────────────
    const smokingStatus: string = caseData.smoking_status ?? 'non-smoker'
    if (smokingStatus === 'smoker' || smokingStatus === 'former') {
      // CYP1A2-metabolised drugs with narrow therapeutic index
      const cyp1a2Drugs: Record<string, string> = {
        theophylline: 'La fumee de cigarette induit CYP1A2 → taux plasmatiques reduits. Ajuster la dose.',
        clozapine: 'CYP1A2 induit par tabac → efficacite reduite. Attention si arret tabac soudain.',
        olanzapine: 'Metabolisme CYP1A2 accelere chez fumeur — dose superieure necessaire.',
        haloperidol: 'Clearance acceleree chez fumeur (CYP1A2).',
        warfarine: 'Induction CYP1A2/CYP3A4 par tabac → INR altere. Surveillance rapprochee.',
        warfarin: 'Induction CYP1A2 par tabac → INR altere. Surveillance rapprochee.',
        caffeine: 'Metabolisme accelere par induction CYP1A2.',
        ropivacaine: 'Induction CYP1A2 peut reduire l\'efficacite anesthesique.',
      }
      for (const med of medications) {
        const mn = med.name.toLowerCase()
        for (const [drug, note] of Object.entries(cyp1a2Drugs)) {
          if (mn.includes(drug)) {
            addFinding({
              type: 'cyp1a2_interaction',
              severity: smokingStatus === 'former' ? 'moderate' : 'high',
              description: `${med.name} — patient ${smokingStatus === 'former' ? 'ancien fumeur' : 'fumeur actif'} : ${note}`,
              recommendation: smokingStatus === 'former'
                ? `Attention si arret recent du tabac : le taux plasmatique de ${med.name} peut augmenter rapidement. Monitorer et reduire la dose.`
                : `Ajuster la dose de ${med.name} en tenant compte de l'induction CYP1A2. Monitorer a l'arret du tabac.`,
            }, smokingStatus === 'former' ? 10 : 8)
          }
        }
      }
    }

    // ── 11. BMI EXTREMES ───────────────────────────────────────────────────
    const weightKgBMI = caseData.weight ? parseFloat(caseData.weight) : undefined
    const heightCm = caseData.height ? parseFloat(caseData.height) : undefined
    if (weightKgBMI && heightCm && heightCm > 10) {
      const bmi = weightKgBMI / ((heightCm / 100) ** 2)
      if (bmi >= 35) {
        addFinding({
          type: 'bmi_obesity',
          severity: bmi >= 40 ? 'high' : 'moderate',
          description: `Obesite severe (IMC ${bmi.toFixed(1)}) — distribution et elimination de certains medicaments modifiees`,
          recommendation: `Ajuster les doses selon le poids ideal ou ajuste pour les medicaments lipophiles (benzodiazepines, antibiotiques). Risque thromboembolique accru.`,
        }, bmi >= 40 ? 10 : 5)
      } else if (bmi < 18.5) {
        addFinding({
          type: 'bmi_underweight',
          severity: 'moderate',
          description: `Insuffisance ponderale (IMC ${bmi.toFixed(1)}) — volume de distribution reduit, liaison proteique alteree`,
          recommendation: `Commencer avec doses reduites. Surveiller les medicaments a faible marge therapeutique.`,
        }, 5)
      }
    }

    // ── 12. ELECTROLYTE IMBALANCES ─────────────────────────────────────────
    const potassium = caseData.potassium ? parseFloat(caseData.potassium) : undefined
    const sodium    = caseData.sodium    ? parseFloat(caseData.sodium)    : undefined

    if (potassium !== undefined) {
      if (potassium < 3.5) {
        const hypoKSeverity = potassium < 3.0 ? 'critical' : 'high'
        const hypoKScore    = potassium < 3.0 ? 25 : 15
        addFinding({
          type: 'hypokalemia',
          severity: hypoKSeverity,
          description: `Hypokaliemie (K+ ${potassium} mEq/L) — risque de troubles du rythme cardiaque, potentialisation des effets de la digoxine et des medicaments allongeant le QT`,
          recommendation: `Corriger la kaliemie avant toute administration de digitale ou medicament pro-arythmique. Supplement potassique. ECG de surveillance.`,
        }, hypoKScore)
        // Extra check: digoxin + hypokalemia
        for (const med of medications) {
          if (med.name.toLowerCase().includes('digoxin') || med.name.toLowerCase().includes('digitale')) {
            addFinding({
              type: 'digoxin_hypokalemia',
              severity: 'critical',
              description: `DANGER — Digoxine + hypokaliemie (K+ ${potassium}) = risque de toxicite digitalique letale`,
              recommendation: `Arreter la digoxine jusqu'a normalisation du potassium. Monitoring cardiaque en continu.`,
            }, 40)
          }
        }
      } else if (potassium > 5.5) {
        addFinding({
          type: 'hyperkalemia',
          severity: 'high',
          description: `Hyperkaliemie (K+ ${potassium} mEq/L) — risque accru avec IEC, ARA2, diuretiques epargneurs de potassium, trimethoprime`,
          recommendation: `Eviter les medicaments elevateurss du K+. ECG urgent. Traitement de l'hyperkaliemie si K+ > 6.0.`,
        }, 20)
        const hyperKMeds = ['enalapril', 'lisinopril', 'ramipril', 'captopril', 'losartan',
          'valsartan', 'spironolactone', 'eplerenone', 'trimethoprim', 'heparin', 'heparine']
        for (const med of medications) {
          if (hyperKMeds.some(m => med.name.toLowerCase().includes(m))) {
            addFinding({
              type: 'hyperkalemia_drug',
              severity: 'high',
              description: `${med.name} peut aggraver l'hyperkaliemie (K+ ${potassium} mEq/L)`,
              recommendation: `Reevaler l'indication de ${med.name} et surveiller le potassium quotidiennement.`,
            }, 15)
          }
        }
      }
    }

    if (sodium !== undefined) {
      if (sodium < 135) {
        addFinding({
          type: 'hyponatremia',
          severity: sodium < 125 ? 'critical' : 'moderate',
          description: `Hyponatremie (Na+ ${sodium} mEq/L) — certains medicaments peuvent aggraver cette condition`,
          recommendation: `Eviter AINS, IRS, carbamazepine, diuretiques thiazidiques. Correction progressive de la natremia.`,
        }, sodium < 125 ? 20 : 10)
      }
    }

    // ── 13. ELEVATED LIVER ENZYMES ─────────────────────────────────────────
    const asatVal  = caseData.asat  ? parseFloat(caseData.asat)  : undefined
    const alatVal  = caseData.alat  ? parseFloat(caseData.alat)  : undefined
    const ULN = 40 // Upper Limit of Normal for ASAT/ALAT

    if (asatVal !== undefined || alatVal !== undefined) {
      const maxTransaminase = Math.max(asatVal ?? 0, alatVal ?? 0)
      const foldULN = maxTransaminase / ULN

      if (foldULN >= 10) {
        addFinding({
          type: 'severe_hepatocellular_damage',
          severity: 'critical',
          description: `Cytolyse hepatique severe (ASAT ${asatVal ?? '?'} / ALAT ${alatVal ?? '?'} U/L — > 10× LSN) — hepatotoxicite majeure`,
          recommendation: `ARRETER tous les medicaments hepatotoxiques immediatement. Bilan hepatique complet. Avis hepatologique urgent.`,
        }, 40)
      } else if (foldULN >= 3) {
        // Flag all hepatotoxic meds
        const htMeds = ['paracetamol', 'acetaminophen', 'isoniazide', 'methotrexate',
          'valproate', 'amiodarone', 'statines', 'atorvastatin', 'simvastatin',
          'ketoconazole', 'fluconazole', 'rifampicine', 'tetracycline']
        for (const med of medications) {
          if (htMeds.some(h => med.name.toLowerCase().includes(h))) {
            addFinding({
              type: 'transaminase_hepatotoxic_drug',
              severity: 'high',
              description: `${med.name} est hepatotoxique et les transaminases sont elevees (>${foldULN.toFixed(1)}× LSN)`,
              recommendation: `Envisager l'arret de ${med.name}. Bilan hepatique hebdomadaire. Criteres d'arret: transaminases > 3× LSN.`,
            }, 20)
          }
        }
      }
    }

    // ── 14. GLYCEMIA ABNORMALITIES ─────────────────────────────────────────
    const glycemia = caseData.glycemia ? parseFloat(caseData.glycemia) : undefined
    if (glycemia !== undefined) {
      const antidiabeticMeds = ['metformin', 'metformine', 'insulin', 'insuline', 'glibenclamide',
        'glipizide', 'gliclazide', 'glimepiride', 'sitagliptin', 'empagliflozin', 'dapagliflozin']
      const hasAntidiabetic = medications.some(m =>
        antidiabeticMeds.some(a => m.name.toLowerCase().includes(a))
      )

      if (glycemia < 0.7) {
        addFinding({
          type: 'hypoglycemia_critical',
          severity: 'critical',
          description: `Hypoglycemie severe (glycemie ${glycemia} g/L < 0.7 g/L) — urgence medicale`,
          recommendation: `Resucrage immédiat. Si traitement antidiabetique en cours, ajuster la dose. Monitoring glucometrique continu.`,
        }, 35)
      } else if (glycemia < 0.9 && hasAntidiabetic) {
        addFinding({
          type: 'hypoglycemia_risk',
          severity: 'high',
          description: `Glycemie limite basse (${glycemia} g/L) chez patient sous antidiabetique — risque d'hypoglycemie`,
          recommendation: `Surveiller la glycemie capillaire. Adapter les doses d'antidiabetiques. Eviter le jeune prolonge.`,
        }, 15)
      } else if (glycemia > 2.0) {
        addFinding({
          type: 'hyperglycemia',
          severity: 'moderate',
          description: `Hyperglycemie (${glycemia} g/L > 2.0 g/L) — efficacite des antidiabetiques a reevaluer, certains medicaments peuvent aggraver`,
          recommendation: `Reajuster traitement antidiabetique. Eviter corticoides et diuretiques thiazidiques si possible. Controler HbA1c.`,
        }, 8)
      }

      // Fasting + antidiabetics
      if (caseData.prolonged_fasting && hasAntidiabetic) {
        addFinding({
          type: 'fasting_antidiabetic',
          severity: 'high',
          description: `Jeune prolonge + traitement antidiabetique — risque d'hypoglycemie potentiellement severe`,
          recommendation: `Suspendre ou adapter les antidiabetiques pendant le jeune. Monitorer la glycemie toutes les 4h.`,
        }, 20)
      }
    }

    // ── 15. LACTATES + METFORMIN (LACTIC ACIDOSIS) ────────────────────────
    const lactates = caseData.lactates ? parseFloat(caseData.lactates) : undefined
    if (lactates !== undefined && lactates > 2) {
      addFinding({
        type: 'hyperlactatemia',
        severity: lactates > 4 ? 'critical' : 'high',
        description: `Hyperlactatemie (lactates ${lactates} mmol/L > 2 mmol/L) — risque d'acidose lactique`,
        recommendation: `Recherche de cause (sepsis, hepatopathie, ischemic). Arreter tout biguanide (Metformine).`,
      }, lactates > 4 ? 30 : 15)

      for (const med of medications) {
        if (med.name.toLowerCase().includes('metformin') || med.name.toLowerCase().includes('metformine')) {
          addFinding({
            type: 'metformin_lactic_acidosis',
            severity: 'critical',
            description: `CONTRE-INDICATION ABSOLUE — Metformine + lactates ${lactates} mmol/L > 2 mmol/L = risque d'acidose lactique fatale`,
            recommendation: `ARRETER la Metformine immediatement. Rehydratation IV. Bilan metabolique urgent. Ne pas reprendre tant que les lactates restent eleves.`,
          }, 50)
          addRec({
            title: 'Arret urgent Metformine',
            description: 'Hyperlactatemie incompatible avec la Metformine',
            priority: 'high',
            action: 'Arreter Metformine. Mesurer les lactates toutes les 2h.',
          })
        }
      }
    }

    // ── 16. IMMUNODEPRESSION ───────────────────────────────────────────────
    const immunodepression: string = caseData.immunodepression ?? 'none'
    if (immunodepression !== 'none') {
      // Live vaccines
      const liveVaccines = ['bcg', 'mmr', 'varicella', 'varicelle', 'rotavirus', 'yellow fever',
        'fievre jaune', 'oral polio', 'nasal flu', 'vaccin vivant']
      for (const med of medications) {
        if (liveVaccines.some(v => med.name.toLowerCase().includes(v))) {
          addFinding({
            type: 'live_vaccine_immunodepressed',
            severity: 'critical',
            description: `${med.name} est un vaccin vivant attenue — CONTRE-INDIQUE chez patient immunodeprime (${immunodepression})`,
            recommendation: `Utiliser uniquement des vaccins inactives. Consulter un infectiologue ou un specialiste en vaccinologie.`,
          }, 45)
        }
      }
      // NSAIDs in immunodepressed (mask infection signs)
      const nsaids = ['ibuprofen', 'ibuprofene', 'ketoprofen', 'ketoprofene', 'naproxen',
        'diclofenac', 'aspirin', 'aspirine', 'celebrex', 'celecoxib']
      for (const med of medications) {
        if (nsaids.some(n => med.name.toLowerCase().includes(n))) {
          addFinding({
            type: 'nsaid_immunodepressed',
            severity: 'moderate',
            description: `${med.name} (AINS) chez patient immunodeprime — risque de masquer les signes d'infection, de reduire la reponse immunitaire`,
            recommendation: `Preferer le paracetamol comme antipyretique. Si AINS indispensable, surveiller de pres les signes infectieux.`,
          }, 10)
        }
      }
    }

    // ── 17. BREASTFEEDING — DRUG EXCRETION RISK ───────────────────────────
    if (caseData.pregnancy_status === 'breastfeeding') {
      const breastfeedingRiskDrugs: Record<string, string> = {
        amiodarone: 'Passage important dans le lait maternel — thyrotoxicose neonatale possible',
        lithium: 'Concentrations elevees dans le lait — toxicite neonatale',
        methotrexate: 'Contre-indique — antimetabolite',
        cyclophosphamide: 'Contre-indique — immunosuppresseur',
        chloramphenicol: 'Risque de syndrome gris du nourrisson',
        ergotamine: 'Vasospasme et vomissements chez nourrisson',
        bromocriptine: 'Inhibe la lactation',
        tetracycline: 'Coloration dentaire permanente chez nourrisson',
        doxycycline: 'Coloration dentaire chez nourrisson',
        fluoroquinolone: 'Risque articulaire chez nourrisson',
        ciprofloxacin: 'Risque articulaire chez nourrisson',
        codeine: 'Metabolite morphinique — sedation/apnee neonatale (si mere metaboliseuse rapide)',
      }
      for (const med of medications) {
        const mn = med.name.toLowerCase()
        for (const [drug, note] of Object.entries(breastfeedingRiskDrugs)) {
          if (mn.includes(drug)) {
            addFinding({
              type: 'breastfeeding_risk',
              severity: 'high',
              description: `${med.name} — Allaitement : ${note}`,
              recommendation: `Evaluer le rapport benefice/risque. Envisager l'arret de l'allaitement ou le remplacement du medicament. Consulter LactMed/CRAT.`,
            }, 20)
          }
        }
      }
    }

    // ── 18. SUDDEN MEDICATION STOP + WITHDRAWAL RISK ─────────────────────
    if (caseData.sudden_medication_stop) {
      const withdrawalRiskMeds = ['benzodiazepine', 'diazepam', 'alprazolam', 'clonazepam',
        'lorazepam', 'beta-blocker', 'atenolol', 'metoprolol', 'propranolol', 'bisoprolol',
        'corticoides', 'prednisone', 'prednisolone', 'dexamethasone', 'ssri', 'paroxetine',
        'venlafaxine', 'antiepileptic', 'valproate', 'carbamazepine', 'clonidine']
      for (const med of medications) {
        const mn = med.name.toLowerCase()
        if (withdrawalRiskMeds.some(w => mn.includes(w))) {
          addFinding({
            type: 'withdrawal_risk',
            severity: 'high',
            description: `${med.name} — arret brutal signal. Risque de syndrome de sevrage (convulsions, rebond, instabilite hemodynamique)`,
            recommendation: `Ne jamais arreter ${med.name} brutalement. Decroissance progressive obligatoire. Surveillance medicale.`,
          }, 15)
        }
      }
    }

    // ── 19. RISK CLASSIFICATION ────────────────────────────────────────────
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
