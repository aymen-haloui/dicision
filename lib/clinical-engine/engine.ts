import { ClinicalContext, ClinicalEngineConfig, ClinicalEngineResult, DEFAULT_ENGINE_CONFIG, RuleValidationResult, RuleValidationError, ClinicalRuleDefinition, RuleOutputs, TriggeredRule, RuleGroup, ClinicalAlert, ExplainabilityEntry } from '@/types/clinical-engine'
import { recordRuleAudit } from './audit'
import sql from '@/lib/postgres'
import { inferRuleFamily } from './rule-family'
import { evaluatePatientBaseline, evaluateClinicalUrgency, evaluateMedicationSafety, evaluateDrugInteractions, evaluateToxicology, buildFinalClinicalAssessment, evaluateClinicalCase } from './pipelines'

// Simple validator placeholder — real validator implemented separately
function validateRuleStructure(rule: any): RuleValidationResult {
  const errors: RuleValidationError[] = []
  const warnings: RuleValidationError[] = []

  if (!rule.name) errors.push({ field: 'name', message: 'Missing rule name', severity: 'error' })
  if (!rule.conditions) errors.push({ field: 'conditions', message: 'Missing conditions', severity: 'error' })
  if (!rule.outputs) warnings.push({ field: 'outputs', message: 'No outputs defined', severity: 'warning' })

  return { is_valid: errors.length === 0, errors, warnings }
}

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

function compareMany(actual: any, predicate: (item: any) => boolean): boolean {
  return asArray(actual).some(predicate)
}

function compareText(actual: any, value: any): boolean {
  return String(actual).toLowerCase().includes(String(value).toLowerCase())
}

function evaluateCondition(condition: any, context: ClinicalContext): boolean {
  if (!condition) return false

  // Group
  if ((condition as RuleGroup).logic) {
    const g = condition as RuleGroup
    if (!Array.isArray(g.conditions)) return false
    if (g.logic === 'AND') {
      return g.conditions.every(c => evaluateCondition(c as any, context))
    }
    return g.conditions.some(c => evaluateCondition(c as any, context))
  }

  // Atomic
  const { type, field, operator, value } = condition as any
  const actual = deepGet(context, field)

  if (Array.isArray(actual)) {
    switch (operator) {
      case '=':
        return actual.some(item => item === value)
      case '!=':
        return actual.every(item => item !== value)
      case '>':
        return actual.some(item => typeof item === 'number' && typeof value === 'number' && item > value)
      case '>=':
        return actual.some(item => typeof item === 'number' && typeof value === 'number' && item >= value)
      case '<':
        return actual.some(item => typeof item === 'number' && typeof value === 'number' && item < value)
      case '<=':
        return actual.some(item => typeof item === 'number' && typeof value === 'number' && item <= value)
      case 'includes':
        return actual.some(item => typeof item === 'string' ? compareText(item, value) : item === value)
      case 'not_includes':
        return actual.every(item => typeof item === 'string' ? !compareText(item, value) : item !== value)
      default:
        return false
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
    const v = Number(src[k])
    if (!Number.isFinite(v)) continue
    dest[k] = (dest[k] || 0) + v
  }
}

export async function loadEnabledRules(): Promise<ClinicalRuleDefinition[]> {
  const rows = await sql`
    SELECT id, name, description, rule_family, category, severity, priority, enabled, trigger_type, explanation_template, conditions, outputs, created_at, updated_at, created_by, version, tags
    FROM clinical_rules
    WHERE enabled = true
    ORDER BY priority DESC, created_at DESC
  `
  return (rows as unknown as ClinicalRuleDefinition[]).map(rule => ({
    ...rule,
    rule_family: rule.rule_family || inferRuleFamily(rule),
  }))
}

export async function evaluateRulesForContext(
  context: ClinicalContext,
  caseId: string | null = null,
  config: ClinicalEngineConfig = DEFAULT_ENGINE_CONFIG
): Promise<ClinicalEngineResult> {
  const rules = await loadEnabledRules()

  // New orchestrator: evaluate the full clinical case using layered pipelines
  const final = await evaluateClinicalCase(context, rules, caseId, config)
  return final
}

// Backwards-compatible alias
export async function evaluateClinicalCaseForContext(context: ClinicalContext, caseId: string | null = null, config: ClinicalEngineConfig = DEFAULT_ENGINE_CONFIG) {
  return evaluateClinicalCase(context, await loadEnabledRules(), caseId, config)
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
  return medications.filter(med => {
    const haystack = `${med.name} ${med.category ?? ''} ${med.generic_name ?? ''}`.toLowerCase()
    return text.includes(med.name.toLowerCase()) || (med.category && text.includes(med.category.toLowerCase())) || text.includes(haystack.trim())
  }).map(med => med.name)
}

function extractPatientFactors(context: ClinicalContext, family: string): string[] {
  const factors: string[] = []
  if (context.patient.age != null) factors.push(`Age ${context.patient.age}`)
  if (context.patient.smoking_status) factors.push(`Tabagisme: ${context.patient.smoking_status}`)
  if (context.patient.alcohol_use) factors.push(`Alcool: ${context.patient.alcohol_use}`)
  if (context.patient.renal_creatinine_clearance != null) factors.push(`Clairance créatinine: ${context.patient.renal_creatinine_clearance}`)
  if (context.patient.hepatic_status) factors.push(`Statut hépatique: ${context.patient.hepatic_status}`)
  if (family === 'EMERGENCY') {
    if (context.vitals.spo2 != null) factors.push(`SpO2 ${context.vitals.spo2}%`)
    if (context.vitals.heart_rate != null || context.vitals.heartRate != null) factors.push(`FC ${context.vitals.heart_rate ?? context.vitals.heartRate}`)
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
  if (outputs.urgency) parts.push(`Urgence ${outputs.urgency}`)
  if (Array.isArray(outputs.alerts) && outputs.alerts.length) parts.push(`${outputs.alerts.length} alerte(s)`)
  if (Array.isArray(outputs.contraindications) && outputs.contraindications.length) parts.push(`${outputs.contraindications.length} contre-indication(s)`)
  if (Array.isArray(outputs.recommendations) && outputs.recommendations.length) parts.push(`${outputs.recommendations.length} recommandation(s)`)
  if (Array.isArray(outputs.therapeutic_warnings) && outputs.therapeutic_warnings.length) parts.push(`${outputs.therapeutic_warnings.length} avertissement(s)`)
  return parts
}
