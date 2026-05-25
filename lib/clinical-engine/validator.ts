import { RuleValidationResult, RuleValidationError, ClinicalRuleDefinition, RuleGroup, RuleCondition, ComparisonOperator, RuleFamily } from '@/types/clinical-engine'
import { inferRuleFamily, normalizeRuleFamily, RULE_FAMILY_LABELS } from './rule-family'

const ALLOWED_OPERATORS: ComparisonOperator[] = ['=', '!=', '>', '<', '>=', '<=', 'includes', 'not_includes']
const ALLOWED_CONDITION_TYPES = ['LAB_RESULT','MEDICATION','CONDITION','VITAL_SIGN','SYMPTOM','ALLERGY','AGE','EMERGENCY_FLAG','CUSTOM']
const ALLOWED_URGENCY = ['LOW','MODERATE','HIGH','CRITICAL']
const ALLOWED_FAMILIES = Object.keys(RULE_FAMILY_LABELS) as RuleFamily[]

function validateConditionObject(cond: any): RuleValidationError[] {
  const errs: RuleValidationError[] = []
  if (!cond) { errs.push({ field: 'condition', message: 'Empty condition', severity: 'error' }); return errs }
  if (cond.logic) {
    // Only allow a single-level group: top-level logic with atomic conditions (no nested groups)
    if (!['AND','OR'].includes(cond.logic)) errs.push({ field: 'conditions.logic', message: 'logic must be AND/OR', severity: 'error' })
    if (!Array.isArray(cond.conditions) || cond.conditions.length === 0) errs.push({ field: 'conditions', message: 'conditions must be a non-empty array', severity: 'error' })
    else {
      for (const c of cond.conditions) {
        if (c && c.logic) {
          errs.push({ field: 'conditions', message: 'Nested condition groups are not allowed; use simple rows only', severity: 'error' })
        } else {
          // validate atomic condition
          if (!c.type || !ALLOWED_CONDITION_TYPES.includes(c.type)) errs.push({ field: 'condition.type', message: 'Invalid condition type', severity: 'error' })
          if (!c.field) errs.push({ field: 'condition.field', message: 'Missing field', severity: 'error' })
          if (!c.operator || !ALLOWED_OPERATORS.includes(c.operator)) errs.push({ field: 'condition.operator', message: 'Invalid operator', severity: 'error' })
          if (c.value === undefined) errs.push({ field: 'condition.value', message: 'Missing value', severity: 'error' })
        }
      }
    }
    return errs
  }

  if (!cond.type || !ALLOWED_CONDITION_TYPES.includes(cond.type)) errs.push({ field: 'condition.type', message: 'Invalid condition type', severity: 'error' })
  if (!cond.field) errs.push({ field: 'condition.field', message: 'Missing field', severity: 'error' })
  if (!cond.operator || !ALLOWED_OPERATORS.includes(cond.operator)) errs.push({ field: 'condition.operator', message: 'Invalid operator', severity: 'error' })
  // value type checks are contextual and cannot be fully validated here, but ensure presence
  if (cond.value === undefined) errs.push({ field: 'condition.value', message: 'Missing value', severity: 'error' })
  return errs
}

export function validateRule(rule: any): RuleValidationResult {
  const errors: RuleValidationError[] = []
  const warnings: RuleValidationError[] = []

  if (!rule) return { is_valid: false, errors: [{ field: 'rule', message: 'Empty rule', severity: 'error' }], warnings: [] }
  if (!rule.name) errors.push({ field: 'name', message: 'Rule name is required', severity: 'error' })
  const ruleFamily = rule.rule_family ? normalizeRuleFamily(rule.rule_family) : inferRuleFamily(rule)
  if (rule.rule_family && !ALLOWED_FAMILIES.includes(ruleFamily)) {
    errors.push({ field: 'rule_family', message: 'Invalid rule family', severity: 'error' })
  }
  if (!rule.rule_family) {
    warnings.push({ field: 'rule_family', message: `Rule family missing, inferred as ${ruleFamily}`, severity: 'warning' })
  }
  if (!rule.conditions) errors.push({ field: 'conditions', message: 'conditions group required', severity: 'error' })
  else errors.push(...validateConditionObject(rule.conditions))

  if (rule.outputs) {
    if (rule.outputs.urgency && !ALLOWED_URGENCY.includes(rule.outputs.urgency)) errors.push({ field: 'outputs.urgency', message: 'Invalid urgency level', severity: 'error' })
    if (rule.outputs.risk_scores) {
      for (const k of Object.keys(rule.outputs.risk_scores)) {
        const v = rule.outputs.risk_scores[k]
        if (typeof v !== 'number') errors.push({ field: `outputs.risk_scores.${k}`, message: 'Risk score must be a number', severity: 'error' })
      }
    }
  } else {
    warnings.push({ field: 'outputs', message: 'Rule has no outputs', severity: 'warning' })
  }

  if (!rule.explanation_template) {
    warnings.push({ field: 'explanation_template', message: 'Missing explanation template', severity: 'warning' })
  }

  // Family-specific output validation
  const family = rule.rule_family ? normalizeRuleFamily(rule.rule_family) : inferRuleFamily(rule)
  // Strict allowed outputs per simplified family-based model
  const allowedByFamily: Record<string, string[]> = {
    PATIENT_RISK: ['risk_scores', 'recommendations'],
    CONTRAINDICATION: ['contraindications'],
    DRUG_INTERACTION: ['alerts'],
    TOXICOLOGY: ['alerts'],
    OVERDOSE: ['alerts'],
    EMERGENCY: ['urgency', 'alerts'],
    THERAPEUTIC_WARNING: ['therapeutic_warnings', 'recommendations'],
    DOSING_ADJUSTMENT: ['dosing_adjustments'],
  }

  if (rule.outputs) {
    const keys = Object.keys(rule.outputs)
    const allowed = allowedByFamily[family] || []
    for (const k of keys) {
      if (!allowed.includes(k)) {
        errors.push({ field: `outputs.${k}`, message: `Output '${k}' is not allowed for family ${family}`, severity: 'error' })
      }
    }
  }

  return { is_valid: errors.length === 0, errors, warnings }
}
