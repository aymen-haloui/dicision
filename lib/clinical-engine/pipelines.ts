import { ClinicalContext, ClinicalEngineConfig, ClinicalEngineResult, ClinicalRuleDefinition, RuleOutputs, TriggeredRule, ClinicalAlert, ExplainabilityEntry } from '@/types/clinical-engine'
import { inferRuleFamily } from './rule-family'
import { recordRuleAudit } from './audit'

function deepGet(obj: any, path: string): any {
  if (typeof path !== 'string' || !path.trim()) return undefined
  const parts = path.split('.')
  function walk(current: any, index: number): any {
    if (current == null) return undefined
    if (index >= parts.length) return current
    const key = parts[index]
    if (Array.isArray(current)) {
      const values = current
        .map(item => walk(item, index))
        .flatMap(value => (Array.isArray(value) ? value : value === undefined ? [] : [value]))
      return values.length > 0 ? values : undefined
    }
    return walk(current[key], index + 1)
  }
  return walk(obj, 0)
}

function asArray(value: any): any[] {
  return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]
}

function compareText(actual: any, value: any): boolean {
  return String(actual).toLowerCase().includes(String(value).toLowerCase())
}

function evaluateCondition(condition: any, context: ClinicalContext): boolean {
  if (!condition) return false
  if ((condition as any).logic) {
    const g = condition as any
    if (!Array.isArray(g.conditions)) return false
    if (g.logic === 'AND') return g.conditions.every((c: any) => evaluateCondition(c, context))
    return g.conditions.some((c: any) => evaluateCondition(c, context))
  }
  const { operator, field, value } = condition as any
  const actual = deepGet(context, field)
  if (Array.isArray(actual)) {
    switch (operator) {
      case '=': return actual.some((item: any) => item === value)
      case '!=': return actual.every((item: any) => item !== value)
      case '>': return actual.some((item: any) => typeof item === 'number' && typeof value === 'number' && item > value)
      case '>=': return actual.some((item: any) => typeof item === 'number' && typeof value === 'number' && item >= value)
      case '<': return actual.some((item: any) => typeof item === 'number' && typeof value === 'number' && item < value)
      case '<=': return actual.some((item: any) => typeof item === 'number' && typeof value === 'number' && item <= value)
      case 'includes': return actual.some((item: any) => typeof item === 'string' ? compareText(item, value) : item === value)
      case 'not_includes': return actual.every((item: any) => typeof item === 'string' ? !compareText(item, value) : item !== value)
      default: return false
    }
  }
  switch (operator) {
    case '=': return actual === value
    case '!=': return actual !== value
    case '>': return typeof actual === 'number' && actual > value
    case '>=': return typeof actual === 'number' && actual >= value
    case '<': return typeof actual === 'number' && actual < value
    case '<=': return typeof actual === 'number' && actual <= value
    case 'includes': return typeof actual === 'string' && compareText(actual, value)
    case 'not_includes': return typeof actual === 'string' && !compareText(actual, value)
    default: return false
  }
}

function mergeRiskScores(dest: Record<string, number | undefined>, src: Record<string, number | undefined> | undefined) {
  if (!src) return
  for (const k of Object.keys(src)) {
    const v = Number((src as any)[k])
    if (!Number.isFinite(v)) continue
    dest[k] = (dest[k] || 0) + v
  }
}

function buildConditionExplanation(condition: any): string {
  if (!condition) return 'Condition non définie'
  if (condition.logic && Array.isArray(condition.conditions)) {
    return condition.conditions.map((item: any) => buildConditionExplanation(item)).join(condition.logic === 'OR' ? ' OU ' : ' ET ')
  }
  return `${condition.field || 'champ'} ${condition.operator || '='} ${String(condition.value ?? '')}`
}

function extractTriggerWords(medications: ClinicalContext['medications'], condition: any): string[] {
  const text = JSON.stringify(condition || {}).toLowerCase()
  return (medications || []).filter(med => {
    const haystack = `${med.name} ${med.category ?? ''} ${med.generic_name ?? ''}`.toLowerCase()
    return text.includes(med.name.toLowerCase()) || (med.category && text.includes(med.category.toLowerCase())) || text.includes(haystack.trim())
  }).map(med => med.name)
}

function extractPatientFactors(context: ClinicalContext, family: string): string[] {
  const factors: string[] = []
  if (context.patient?.age != null) factors.push(`Age ${context.patient.age}`)
  if (context.patient?.smoking_status) factors.push(`Tabagisme: ${context.patient.smoking_status}`)
  if (context.patient?.alcohol_use) factors.push(`Alcool: ${context.patient.alcohol_use}`)
  if ((context.patient as any)?.renal_creatinine_clearance != null) factors.push(`Clairance créatinine: ${(context.patient as any).renal_creatinine_clearance}`)
  if ((context.patient as any)?.hepatic_status) factors.push(`Statut hépatique: ${(context.patient as any).hepatic_status}`)
  if (family === 'EMERGENCY') {
    if (context.vitals?.spo2 != null) factors.push(`SpO2 ${context.vitals.spo2}%`)
    if (context.vitals?.heart_rate != null || context.vitals?.heartRate != null) factors.push(`FC ${context.vitals.heart_rate ?? context.vitals?.heartRate}`)
  }
  return factors
}

function summarizeOutputs(outputs: RuleOutputs): string[] {
  const parts: string[] = []
  if (outputs.risk_scores) {
    for (const [key, value] of Object.entries(outputs.risk_scores)) {
      if (Number.isFinite(Number(value))) parts.push(`Score ${key} +${value}`)
    }
  }
  if ((outputs as any).urgency) parts.push(`Urgence ${(outputs as any).urgency}`)
  if (Array.isArray(outputs.alerts) && outputs.alerts.length) parts.push(`${outputs.alerts.length} alerte(s)`)
  if (Array.isArray(outputs.contraindications) && outputs.contraindications.length) parts.push(`${outputs.contraindications.length} contre-indication(s)`)
  if (Array.isArray(outputs.recommendations) && outputs.recommendations.length) parts.push(`${outputs.recommendations.length} recommandation(s)`)
  if (Array.isArray(outputs.therapeutic_warnings) && outputs.therapeutic_warnings.length) parts.push(`${outputs.therapeutic_warnings.length} avertissement(s)`)
  return parts
}

type PartialAssessment = {
  baseline_risks: any[]
  emergency_alerts: ClinicalAlert[]
  contraindications: any[]
  interaction_alerts: ClinicalAlert[]
  toxicology_alerts: any[]
  overdose_alerts: any[]
  therapeutic_warnings: any[]
  recommendations: string[]
  dosing_adjustments: any[]
  triggered_rules: TriggeredRule[]
  explainability: ExplainabilityEntry[]
  risk_scores: Record<string, number | undefined>
  toxicology_risk: number
  overdose_risk: number
  urgency_level?: string
}

async function processRulesForFamilies(
  context: ClinicalContext,
  rules: ClinicalRuleDefinition[],
  families: string[],
  caseId: string | null,
  config: ClinicalEngineConfig
): Promise<PartialAssessment> {
  const res: PartialAssessment = {
    baseline_risks: [],
    emergency_alerts: [],
    contraindications: [],
    interaction_alerts: [],
    toxicology_alerts: [],
    overdose_alerts: [],
    therapeutic_warnings: [],
    recommendations: [],
    dosing_adjustments: [],
    triggered_rules: [],
    explainability: [],
    risk_scores: {},
    toxicology_risk: 0,
    overdose_risk: 0,
  }

  for (const rule of rules) {
    const ruleFamily = rule.rule_family || inferRuleFamily(rule)
    if (!families.includes(ruleFamily)) continue

    const matched = evaluateCondition(rule.conditions, context)
    if (!matched) continue

    const outputs = (rule.outputs || {}) as RuleOutputs

    // Only accept outputs allowed for the rule family (simplified model)
    switch (ruleFamily) {
      case 'CONTRAINDICATION':
        if (Array.isArray(outputs.contraindications)) res.contraindications.push(...outputs.contraindications as any)
        break
      case 'DRUG_INTERACTION':
        if (Array.isArray(outputs.alerts)) res.interaction_alerts.push(...(outputs.alerts as ClinicalAlert[]))
        break
      case 'TOXICOLOGY':
        if (Array.isArray(outputs.alerts)) res.toxicology_alerts.push(...(outputs.alerts as any))
        break
      case 'OVERDOSE':
        if (Array.isArray(outputs.alerts)) res.overdose_alerts.push(...(outputs.alerts as any))
        break
      case 'EMERGENCY':
        if ((outputs as any).urgency) {
          const order = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
          if (!res.urgency_level || order.indexOf((outputs as any).urgency) > order.indexOf(res.urgency_level)) {
            res.urgency_level = (outputs as any).urgency
          }
        }
        if (Array.isArray(outputs.alerts)) res.emergency_alerts.push(...(outputs.alerts as ClinicalAlert[]))
        break
      case 'THERAPEUTIC_WARNING':
        if (Array.isArray(outputs.therapeutic_warnings)) res.therapeutic_warnings.push(...outputs.therapeutic_warnings as any)
        if (Array.isArray(outputs.recommendations)) res.recommendations.push(...outputs.recommendations)
        break
      case 'DOSING_ADJUSTMENT':
        if (Array.isArray((outputs as any).dosing_adjustments)) res.dosing_adjustments.push(...(outputs as any).dosing_adjustments)
        break
      case 'PATIENT_RISK':
      default:
        // patient risk may supply risk_scores and recommendations
        mergeRiskScores(res.risk_scores, outputs.risk_scores as any)
        if (Array.isArray(outputs.recommendations)) res.recommendations.push(...outputs.recommendations)
        break
    }

    const triggered: TriggeredRule = {
      rule_id: rule.id,
      rule_name: rule.name,
      rule_category: rule.category,
      rule_family: ruleFamily,
      priority: rule.priority,
      matched_conditions: [ { condition: rule.conditions, matched_value: null, context_value: null } ],
      outputs_applied: outputs,
      triggered_at: new Date(),
      explanation: `Rule "${rule.name}" matched.`,
    }
    res.triggered_rules.push(triggered)

    res.explainability.push({
      rule_id: rule.id,
      rule_name: rule.name,
      rule_family: ruleFamily,
      matched_conditions: [buildConditionExplanation(rule.conditions)],
      triggered_medications: extractTriggerWords(context.medications, rule.conditions),
      patient_factors: extractPatientFactors(context, ruleFamily),
      generated_outputs: summarizeOutputs(outputs),
      narrative: rule.explanation_template || `La règle ${rule.name} (${ruleFamily}) s'est déclenchée.`,
    } as ExplainabilityEntry)

    if (caseId) {
      await recordRuleAudit(caseId, rule.id, rule.name, rule.conditions, outputs, {
        patientId: context.patient?.id ?? null,
        ruleFamily,
        clinicalExplanation: rule.explanation_template || `Rule ${rule.name} (${ruleFamily}) triggered`
      })
    }
  }

  return res
}

export async function evaluatePatientBaseline(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  const families = ['PATIENT_RISK']
  const p = await processRulesForFamilies(context, rules, families, caseId, config)
  return {
    baseline_risks: p.baseline_risks,
    triggered_rules: p.triggered_rules,
    explainability: p.explainability,
    risk_scores: p.risk_scores,
  }
}

export async function evaluateClinicalUrgency(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  const families = ['EMERGENCY']
  const p = await processRulesForFamilies(context, rules, families, caseId, config)
  return {
    emergency_alerts: p.emergency_alerts,
    triggered_rules: p.triggered_rules,
    explainability: p.explainability,
    urgency_level: p.urgency_level,
  }
}

export async function evaluateMedicationSafety(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  const families = ['CONTRAINDICATION', 'THERAPEUTIC_WARNING', 'DOSING_ADJUSTMENT']
  const p = await processRulesForFamilies(context, rules, families, caseId, config)
  return {
    contraindications: p.contraindications,
    recommendations: p.recommendations,
    therapeutic_warnings: p.therapeutic_warnings,
    dosing_adjustments: p.dosing_adjustments,
    triggered_rules: p.triggered_rules,
    explainability: p.explainability,
  }
}

export async function evaluateDrugInteractions(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  const families = ['DRUG_INTERACTION']
  const p = await processRulesForFamilies(context, rules, families, caseId, config)
  return {
    interaction_alerts: p.interaction_alerts,
    triggered_rules: p.triggered_rules,
    explainability: p.explainability,
  }
}

export async function evaluateToxicology(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  const families = ['TOXICOLOGY', 'OVERDOSE']
  const p = await processRulesForFamilies(context, rules, families, caseId, config)
  return {
    toxicology_alerts: p.toxicology_alerts,
    overdose_alerts: p.overdose_alerts,
    toxicology_risk: p.toxicology_risk,
    overdose_risk: p.overdose_risk,
    triggered_rules: p.triggered_rules,
    explainability: p.explainability,
  }
}

// Wrapper functions matching requested architecture
export async function evaluateBaselineRisks(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  return evaluatePatientBaseline(context, rules, caseId, config)
}

export async function evaluateContraindications(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  // CONTRAINDICATION family only
  const p = await processRulesForFamilies(context, rules, ['CONTRAINDICATION'], caseId, config)
  return {
    contraindications: p.contraindications,
    triggered_rules: p.triggered_rules,
    explainability: p.explainability,
  }
}

export async function evaluateInteractions(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  return evaluateDrugInteractions(context, rules, caseId, config)
}

export async function evaluateOverdose(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  // OVERDOSE family only
  const p = await processRulesForFamilies(context, rules, ['OVERDOSE'], caseId, config)
  return {
    overdose_alerts: p.overdose_alerts,
    overdose_risk: p.overdose_risk,
    triggered_rules: p.triggered_rules,
    explainability: p.explainability,
  }
}

export async function evaluateEmergency(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  return evaluateClinicalUrgency(context, rules, caseId, config)
}

export async function evaluateTherapeuticWarnings(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  // THERAPEUTIC_WARNING family only
  const p = await processRulesForFamilies(context, rules, ['THERAPEUTIC_WARNING'], caseId, config)
  return {
    therapeutic_warnings: p.therapeutic_warnings,
    recommendations: p.recommendations,
    triggered_rules: p.triggered_rules,
    explainability: p.explainability,
  }
}

export async function evaluateDoseAdjustments(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  // DOSING_ADJUSTMENT family only
  const p = await processRulesForFamilies(context, rules, ['DOSING_ADJUSTMENT'], caseId, config)
  return {
    dosing_adjustments: p.dosing_adjustments,
    triggered_rules: p.triggered_rules,
    explainability: p.explainability,
  }
}

// Simple aliases for MVP naming
export const evaluateTherapeutic = evaluateTherapeuticWarnings
export const evaluateDosing = evaluateDoseAdjustments

export async function evaluateClinicalCase(context: ClinicalContext, rules: ClinicalRuleDefinition[], caseId: string | null, config: ClinicalEngineConfig) {
  const baseline = await evaluateBaselineRisks(context, rules, caseId, config)
  const contraindications = await evaluateContraindications(context, rules, caseId, config)
  const interactions = await evaluateInteractions(context, rules, caseId, config)
  const toxicology = await evaluateToxicology(context, rules, caseId, config)
  const overdose = await evaluateOverdose(context, rules, caseId, config)
  const emergency = await evaluateEmergency(context, rules, caseId, config)
  const therapeutic = await evaluateTherapeuticWarnings(context, rules, caseId, config)
  const dosing = await evaluateDoseAdjustments(context, rules, caseId, config)

  const final = buildFinalClinicalAssessment({
    baseline: { ...baseline },
    contraindications: { ...contraindications },
    interactions: { ...interactions },
    toxicology: { ...toxicology },
    overdose: { ...overdose },
    urgency: { ...emergency },
    medication: { ...therapeutic },
    dosing: { ...dosing }
  }, config)

  // enrich structured summary
  ;(final as any).clinical_summary = {
    global_risk_score: final.total_risk_score,
    urgency_level: final.urgency_level,
    has_critical_alert: (final.alerts || []).some(a => a.severity === 'CRITICAL') || (final.interaction_alerts || []).some(a => a.severity === 'CRITICAL'),
    requires_immediate_attention: final.urgency_level === 'CRITICAL' || (final.alerts || []).some(a => a.severity === 'CRITICAL')
  }

  return final
}

export function buildFinalClinicalAssessment(
  parts: any,
  config: ClinicalEngineConfig
): ClinicalEngineResult {
  // Construct the simplified final result expected by the MVP
  const explainability = [
    ...(parts.baseline?.explainability || []),
    ...(parts.contraindications?.explainability || []),
    ...(parts.interactions?.explainability || []),
    ...(parts.toxicology?.explainability || []),
    ...(parts.overdose?.explainability || []),
    ...(parts.urgency?.explainability || []),
    ...(parts.medication?.explainability || []),
    ...(parts.dosing?.explainability || []),
  ]

  const triggered_rules = [
    ...(parts.contraindications?.triggered_rules || []),
    ...(parts.interactions?.triggered_rules || []),
    ...(parts.toxicology?.triggered_rules || []),
    ...(parts.overdose?.triggered_rules || []),
    ...(parts.urgency?.triggered_rules || []),
    ...(parts.medication?.triggered_rules || []),
    ...(parts.dosing?.triggered_rules || []),
    ...(parts.baseline?.triggered_rules || []),
  ]

  const result: ClinicalEngineResult = {
    // legacy fields kept where useful
    total_risk_score: Number((parts.baseline?.risk_scores && Object.values(parts.baseline.risk_scores).reduce((s: number, v: any) => s + (Number(v) || 0), 0)) || 0),
    urgency_level: parts.urgency?.urgency_level || 'LOW',
    toxicology_risk: parts.toxicology?.toxicology_risk || 0,
    overdose_risk: parts.overdose?.overdose_risk || 0,
    risk_scores: parts.baseline?.risk_scores || {},

    // Explicit family-grouped outputs for MVP
    alerts: parts.urgency?.emergency_alerts || [],
    interaction_alerts: parts.interactions?.interaction_alerts || [],
    contraindications: parts.contraindications?.contraindications || [],
    recommendations: parts.medication?.recommendations || [],
    therapeutic_warnings: parts.medication?.therapeutic_warnings || [],
    baseline_risks: parts.baseline?.baseline_risks || [],
    emergency_alerts: parts.urgency?.emergency_alerts || [],
    toxicology_alerts: parts.toxicology?.toxicology_alerts || [],
    overdose_alerts: parts.overdose?.overdose_alerts || [],
    dosing_adjustments: parts.dosing?.dosing_adjustments || [],

    explainability,
    triggered_rules,
    evaluation_timestamp: new Date(),
    evaluated_by_engine_version: config.version,
    summary: `Risk Score: ${Number((parts.baseline?.risk_scores && Object.values(parts.baseline.risk_scores).reduce((s: number, v: any) => s + (Number(v) || 0), 0)) || 0).toFixed(1)}/100 | Urgency: ${parts.urgency?.urgency_level || 'LOW'} | Rules Triggered: ${triggered_rules.length}`,
  }

  return result
}
