import { RuleValidationResult, RuleValidationError, ClinicalRuleDefinition, RuleGroup, RuleCondition, ComparisonOperator } from '@/types/clinical-engine'

const ALLOWED_OPERATORS: ComparisonOperator[] = ['=', '!=', '>', '<', '>=', '<=', 'includes', 'not_includes']
const ALLOWED_CONDITION_TYPES = ['LAB_RESULT','MEDICATION','CONDITION','VITAL_SIGN','SYMPTOM','ALLERGY','AGE','EMERGENCY_FLAG','CUSTOM']
const ALLOWED_URGENCY = ['LOW','MODERATE','HIGH','CRITICAL']

function validateConditionObject(cond: any): RuleValidationError[] {
  const errs: RuleValidationError[] = []
  if (!cond) { errs.push({ field: 'condition', message: 'Empty condition', severity: 'error' }); return errs }
  if (cond.logic) {
    if (!['AND','OR'].includes(cond.logic)) errs.push({ field: 'conditions.logic', message: 'logic must be AND/OR', severity: 'error' })
    if (!Array.isArray(cond.conditions) || cond.conditions.length === 0) errs.push({ field: 'conditions', message: 'conditions must be a non-empty array', severity: 'error' })
    else {
      for (const c of cond.conditions) errs.push(...validateConditionObject(c))
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

  return { is_valid: errors.length === 0, errors, warnings }
}
