import type { ConditionType, RuleFamily } from '@/types/clinical-engine'

export const RULE_FAMILY_ORDER: RuleFamily[] = [
  'PATIENT_RISK',
  'DRUG_INTERACTION',
  'CONTRAINDICATION',
  'TOXICOLOGY',
  'OVERDOSE',
  'EMERGENCY',
  'THERAPEUTIC_WARNING',
  'DOSING_ADJUSTMENT',
]

export const RULE_FAMILY_LABELS: Record<RuleFamily, string> = {
  PATIENT_RISK: 'Risque patient',
  DRUG_INTERACTION: 'Interaction médicamenteuse',
  CONTRAINDICATION: 'Contre-indication',
  TOXICOLOGY: 'Toxicologie',
  OVERDOSE: 'Surdosage',
  EMERGENCY: 'Urgence',
  THERAPEUTIC_WARNING: 'Avertissement thérapeutique',
  DOSING_ADJUSTMENT: 'Ajustement posologique',
}

export const RULE_FAMILY_DESCRIPTIONS: Record<RuleFamily, string> = {
  PATIENT_RISK: 'Évalue le terrain clinique et le risque de base du patient.',
  DRUG_INTERACTION: 'Analyse les interactions entre traitements actifs et chroniques.',
  CONTRAINDICATION: 'Détecte les situations où un traitement ne doit pas être administré.',
  TOXICOLOGY: 'Évalue les expositions toxiques, végétales ou médicamenteuses.',
  OVERDOSE: 'Détecte les dépassements de dose et le risque de toxicité aiguë.',
  EMERGENCY: 'Identifie les situations vitales nécessitant une prise en charge immédiate.',
  THERAPEUTIC_WARNING: 'Génère des avertissements cliniques et de surveillance.',
  DOSING_ADJUSTMENT: 'Adapte les posologies selon la fonction rénale, hépatique, l’âge ou le poids.',
}

export const RULE_FAMILY_CONDITION_TYPES: Record<RuleFamily, ConditionType[]> = {
  PATIENT_RISK: ['CONDITION', 'LAB_RESULT', 'VITAL_SIGN', 'SYMPTOM', 'AGE', 'ALLERGY'],
  DRUG_INTERACTION: ['MEDICATION', 'CONDITION', 'ALLERGY', 'LAB_RESULT', 'AGE'],
  CONTRAINDICATION: ['MEDICATION', 'CONDITION', 'ALLERGY', 'LAB_RESULT', 'VITAL_SIGN', 'AGE', 'EMERGENCY_FLAG'],
  TOXICOLOGY: ['MEDICATION', 'LAB_RESULT', 'VITAL_SIGN', 'CONDITION', 'SYMPTOM'],
  OVERDOSE: ['MEDICATION', 'LAB_RESULT', 'VITAL_SIGN', 'SYMPTOM', 'AGE'],
  EMERGENCY: ['LAB_RESULT', 'VITAL_SIGN', 'EMERGENCY_FLAG', 'SYMPTOM'],
  THERAPEUTIC_WARNING: ['CONDITION', 'MEDICATION', 'LAB_RESULT', 'VITAL_SIGN', 'SYMPTOM', 'ALLERGY'],
  DOSING_ADJUSTMENT: ['MEDICATION', 'LAB_RESULT', 'VITAL_SIGN', 'AGE', 'CONDITION'],
}

export function normalizeRuleFamily(value?: string | null): RuleFamily {
  switch (value) {
    case 'PATIENT_RISK':
    case 'DRUG_INTERACTION':
    case 'CONTRAINDICATION':
    case 'TOXICOLOGY':
    case 'OVERDOSE':
    case 'EMERGENCY':
    case 'THERAPEUTIC_WARNING':
    case 'DOSING_ADJUSTMENT':
      return value
    default:
      return 'PATIENT_RISK'
  }
}

export function inferRuleFamily(rule: { rule_family?: string | null; category?: string | null; trigger_type?: string | null; severity?: string | null }): RuleFamily {
  if (rule.rule_family) return normalizeRuleFamily(rule.rule_family)

  const category = (rule.category || '').toUpperCase()
  const triggerType = (rule.trigger_type || '').toUpperCase()
  const severity = (rule.severity || '').toUpperCase()

  if (triggerType.includes('INTERACTION') || category.includes('INTERACTION')) return 'DRUG_INTERACTION'
  if (triggerType.includes('EMERGENCY') || category.includes('EMERGENCY')) return 'EMERGENCY'
  if (triggerType.includes('DOSE') || category.includes('OVERDOSE')) return 'OVERDOSE'
  if (category.includes('TOXIC')) return 'TOXICOLOGY'
  if (category.includes('CONTRA')) return 'CONTRAINDICATION'
  if (category.includes('RENAL') || category.includes('DOSING')) return 'DOSING_ADJUSTMENT'
  if (category.includes('WARNING')) return 'THERAPEUTIC_WARNING'
  if (severity === 'CRITICAL') return 'EMERGENCY'
  return 'PATIENT_RISK'
}

export function getAllowedConditionTypesForFamily(family: RuleFamily): ConditionType[] {
  return RULE_FAMILY_CONDITION_TYPES[family] || RULE_FAMILY_CONDITION_TYPES.PATIENT_RISK
}

export function getRuleFamilyLabel(family?: string | null): string {
  const normalized = normalizeRuleFamily(family)
  return RULE_FAMILY_LABELS[normalized]
}
