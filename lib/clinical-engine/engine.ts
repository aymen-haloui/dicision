import { ClinicalContext, ClinicalEngineConfig, ClinicalEngineResult, DEFAULT_ENGINE_CONFIG, RuleValidationResult, RuleValidationError, ClinicalRuleDefinition, RuleOutputs, TriggeredRule, RuleGroup } from '@/types/clinical-engine'
import { recordRuleAudit } from './audit'
import sql from '@/lib/postgres'

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
    SELECT id, name, description, category, severity, priority, enabled, trigger_type, conditions, outputs, created_at, updated_at, created_by, version, tags
    FROM clinical_rules
    WHERE enabled = true
    ORDER BY priority DESC, created_at DESC
  `
  return rows as unknown as ClinicalRuleDefinition[]
}

export async function evaluateRulesForContext(
  context: ClinicalContext,
  caseId: string | null = null,
  config: ClinicalEngineConfig = DEFAULT_ENGINE_CONFIG
): Promise<ClinicalEngineResult> {
  const rules = await loadEnabledRules()
  const result: ClinicalEngineResult = {
    total_risk_score: 0,
    urgency_level: 'LOW',
    risk_scores: {},
    alerts: [],
    contraindications: [],
    recommendations: [],
    therapeutic_warnings: [],
    triggered_rules: [],
    evaluation_timestamp: new Date(),
    evaluated_by_engine_version: config.version,
    summary: '',
  }

  for (const rule of rules) {
    const validation = validateRuleStructure(rule)
    if (!validation.is_valid) continue

    const matched = evaluateCondition(rule.conditions, context)
    if (!matched) continue

    // apply outputs
    const outputs = (rule.outputs || {}) as RuleOutputs

    // Aggregate risk scores
    mergeRiskScores(result.risk_scores, outputs.risk_scores as any)

    // Collect alerts
    if (Array.isArray(outputs.alerts)) {
      for (const a of outputs.alerts) result.alerts.push(a)
    }

    // contraindications
    if (Array.isArray(outputs.contraindications)) {
      for (const c of outputs.contraindications) result.contraindications.push(c as any)
    }

    if (Array.isArray(outputs.recommendations)) result.recommendations.push(...outputs.recommendations)
    if (Array.isArray(outputs.therapeutic_warnings)) result.therapeutic_warnings.push(...(outputs.therapeutic_warnings as any))

    if (outputs.urgency) {
      // escalate urgency
      const order = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
      if (order.indexOf(outputs.urgency) > order.indexOf(result.urgency_level)) {
        result.urgency_level = outputs.urgency
      }
    }

    // total risk score recompute
    result.total_risk_score = Math.min(
      Object.values(result.risk_scores).reduce<number>((sum, value) => sum + (value ?? 0), 0),
      config.max_risk_score,
    )

    // add triggered rule audit
    const triggered: TriggeredRule = {
      rule_id: rule.id,
      rule_name: rule.name,
      rule_category: rule.category,
      priority: rule.priority,
      matched_conditions: [
        // For now store the full condition object — validator later will add matched_values
        { condition: rule.conditions, matched_value: null, context_value: null },
      ],
      outputs_applied: outputs,
      triggered_at: new Date(),
      explanation: `Rule "${rule.name}" matched conditions and applied outputs`,
    }
    result.triggered_rules.push(triggered)

    // Record audit
    if (caseId) {
      await recordRuleAudit(caseId, rule.id, rule.name, rule.conditions, outputs)
    }
  }

  // finalize urgency based on thresholds if not set
  if (!result.urgency_level || result.urgency_level === 'LOW') {
    const sum = result.total_risk_score
    const t = config.default_urgency_thresholds!
    if (sum >= t.critical_min) result.urgency_level = 'CRITICAL'
    else if (sum > t.high_max) result.urgency_level = 'HIGH'
    else if (sum > t.moderate_max) result.urgency_level = 'MODERATE'
    else result.urgency_level = 'LOW'
  }

  // Generate summary
  result.summary = `Risk Score: ${result.total_risk_score.toFixed(1)}/100 | Urgency: ${result.urgency_level} | Rules Triggered: ${result.triggered_rules.length} | Alerts: ${result.alerts.length}`

  return result
}
