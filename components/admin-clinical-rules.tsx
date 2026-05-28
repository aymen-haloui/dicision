'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, ShieldAlert, Search, CheckCircle2, X, ArrowUpDown, Users, Pill, FlaskConical, Siren, AlertTriangle, Scale, ClipboardList, Info } from 'lucide-react'
import { getAllowedConditionTypesForFamily, RULE_FAMILY_DESCRIPTIONS, RULE_FAMILY_LABELS, RULE_FAMILY_ORDER, inferRuleFamily } from '@/lib/clinical-engine/rule-family'
import type { RuleFamily } from '@/types/clinical-engine'

type ConditionType =
  | 'CONDITION'
  | 'MEDICATION'
  | 'LAB_RESULT'
  | 'VITAL_SIGN'
  | 'SYMPTOM'
  | 'EMERGENCY_FLAG'
  | 'AGE'
  | 'ALLERGY'

type Operator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'includes' | 'not_includes'

type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

type RuleCondition = {
  id: string
  conditionType: ConditionType
  field: string
  operator: Operator
  value: string
}

type RiskScoreEntry = {
  id: string
  name: string
  value: string
}

type AlertEntry = {
  id: string
  type: string
  severity: SeverityLevel
  message: string
}

type ContraindicationEntry = {
  id: string
  medication: string
  reason: string
  severity: SeverityLevel
}

type ClinicalRuleForm = {
  ruleFamily: RuleFamily
  name: string
  description: string
  category: string
  severity: SeverityLevel
  enabled: boolean
  triggerType: string
  explanationTemplate: string
  conditionJoin: 'all' | 'any'
  conditions: RuleCondition[]
  riskScores: RiskScoreEntry[]
  urgency: SeverityLevel
  alerts: AlertEntry[]
  contraindications: ContraindicationEntry[]
  recommendations: string[]
  warnings: string[]
}

type FieldDataType = 'string' | 'number' | 'boolean' | 'array' | 'date'

type FieldOption = {
  value: string
  label: string
  dataType: FieldDataType
}

type FieldGroup = {
  label: string
  options: FieldOption[]
}

interface ClinicalRule {
  id: string
  name: string
  description: string | null
  rule_family: RuleFamily | null
  category: string | null
  severity: SeverityLevel
  enabled: boolean
  trigger_type: string | null
  explanation_template: string | null
  conditions: any
  outputs: any
  created_at: string
}

const CONDITION_TYPES: ConditionType[] = [
  'CONDITION',
  'MEDICATION',
  'LAB_RESULT',
  'VITAL_SIGN',
  'SYMPTOM',
  'EMERGENCY_FLAG',
  'AGE',
  'ALLERGY',
]

const OPERATORS: Operator[] = ['=', '!=', '>', '<', '>=', '<=', 'includes', 'not_includes']

const SEVERITY_OPTIONS: SeverityLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  LOW: 'Faible',
  MODERATE: 'Modéré',
  HIGH: 'Élevé',
  CRITICAL: 'Critique',
}

const CATEGORY_OPTIONS = [
  'TOXICITY',
  'INTERACTION',
  'RENAL',
  'CARDIAC',
  'EMERGENCY',
  'OVERDOSE',
  'CONTRAINDICATION',
]

const FAMILY_ICONS: Record<RuleFamily, any> = {
  PATIENT_RISK: Users,
  DRUG_INTERACTION: Pill,
  CONTRAINDICATION: ClipboardList,
  TOXICOLOGY: FlaskConical,
  OVERDOSE: AlertTriangle,
  EMERGENCY: Siren,
  THERAPEUTIC_WARNING: Info,
  DOSING_ADJUSTMENT: Scale,
}

const TRIGGER_TYPES = [
  'LAB_THRESHOLD',
  'MEDICATION_INTERACTION',
  'CONDITION_MEDICATION',
  'VITAL_SIGN',
  'EMERGENCY_FLAG',
  'COMPOSITE',
]

const SEVERITY_BADGE: Record<SeverityLevel, string> = {
  CRITICAL: 'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] border-[var(--color-border)]',
  HIGH: 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] border-[var(--color-border)]',
  MODERATE: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] border-[var(--color-border)]',
  LOW: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] border-[var(--color-border)]',
}

const FIELD_CATALOG: Record<string, FieldGroup[]> = {
  AGE: [{ label: 'Patient age', options: [{ value: 'patient.age', label: 'Patient age', dataType: 'number' }] }],
  CONDITION: [
    {
      label: 'Profil patient',
      options: [
        { value: 'patient.id', label: 'ID patient', dataType: 'string' },
        { value: 'patient.name', label: 'Nom du patient', dataType: 'string' },
        { value: 'patient.gender', label: 'Sexe', dataType: 'string' },
        { value: 'patient.weight', label: 'Poids', dataType: 'number' },
        { value: 'patient.weight_kg', label: 'Poids (kg)', dataType: 'number' },
        { value: 'patient.height', label: 'Taille', dataType: 'number' },
        { value: 'patient.immunostatus', label: 'Statut immunitaire', dataType: 'string' },
        { value: 'patient.pregnancy_status', label: 'Statut de grossesse', dataType: 'string' },
        { value: 'patient.smoking_status', label: 'Tabagisme', dataType: 'string' },
        { value: 'patient.alcohol_use', label: 'Consommation d\'alcool', dataType: 'string' },
        { value: 'patient.renal_creatinine_clearance', label: 'Clairance de créatinine', dataType: 'number' },
        { value: 'patient.hepatic_status', label: 'Statut hépatique', dataType: 'string' },
        { value: 'patient.breastfeeding_status', label: 'Allaitement', dataType: 'boolean' },
        { value: 'patient.sudden_medication_stop', label: 'Arrêt brusque de médicament', dataType: 'boolean' },
        { value: 'patient.immunodepression', label: 'Immunodépression', dataType: 'string' },
      ],
    },
    {
      label: 'Contexte clinique',
      options: [
        { value: 'case_type', label: 'Type de cas', dataType: 'string' },
        { value: 'presenting_complaint', label: 'Motif de consultation', dataType: 'string' },
        { value: 'duration_of_illness', label: 'Durée de la maladie', dataType: 'string' },
        { value: 'timestamp', label: 'Horodatage', dataType: 'date' },
      ],
    },
    {
      label: 'Conditions et indicateurs',
      options: [
        { value: 'conditions', label: 'Conditions', dataType: 'array' },
        { value: 'allergies', label: 'Allergies', dataType: 'array' },
        { value: 'symptoms', label: 'Symptômes', dataType: 'array' },
        { value: 'emergency_flags', label: 'Signaux d\'urgence', dataType: 'array' },
        { value: 'interactions_found', label: 'Interactions trouvées', dataType: 'array' },
      ],
    },
  ],
  LAB_RESULT: [
    {
      label: 'Bilans courants',
      options: [
        { value: 'labs.potassium.value', label: 'Potassium', dataType: 'number' },
        { value: 'labs.sodium.value', label: 'Sodium', dataType: 'number' },
        { value: 'labs.glycemia.value', label: 'Glycémie', dataType: 'number' },
        { value: 'labs.lactates.value', label: 'Lactates', dataType: 'number' },
        { value: 'labs.asat.value', label: 'ASAT', dataType: 'number' },
        { value: 'labs.alat.value', label: 'ALAT', dataType: 'number' },
        { value: 'labs.creatinine.value', label: 'Créatinine', dataType: 'number' },
        { value: 'labs.eGFR.value', label: 'eGFR', dataType: 'number' },
      ],
    },
  ],
  VITAL_SIGN: [
    {
      label: 'Signes vitaux',
      options: [
        { value: 'vitals.heart_rate', label: 'Fréquence cardiaque', dataType: 'number' },
        { value: 'vitals.heartRate', label: 'Fréquence cardiaque (alt)', dataType: 'number' },
        { value: 'vitals.blood_pressure_systolic', label: 'TAS (systolique)', dataType: 'number' },
        { value: 'vitals.blood_pressure_diastolic', label: 'TAD (diastolique)', dataType: 'number' },
        { value: 'vitals.bloodPressure.systolic', label: 'TAS (objet)', dataType: 'number' },
        { value: 'vitals.bloodPressure.diastolic', label: 'TAD (objet)', dataType: 'number' },
        { value: 'vitals.respiratory_rate', label: 'Fréquence respiratoire', dataType: 'number' },
        { value: 'vitals.temperature', label: 'Température', dataType: 'number' },
        { value: 'vitals.spo2', label: 'SpO2', dataType: 'number' },
        { value: 'vitals.glucose', label: 'Glycémie', dataType: 'number' },
      ],
    },
  ],
  MEDICATION: [
    {
      label: 'Informations médicament',
      options: [
        { value: 'medications.name', label: 'Nom du médicament', dataType: 'array' },
        { value: 'medications.category', label: 'Catégorie', dataType: 'array' },
        { value: 'medications.dosage', label: 'Dosage', dataType: 'array' },
        { value: 'medications.frequency', label: 'Fréquence', dataType: 'array' },
        { value: 'medications.duration', label: 'Durée', dataType: 'array' },
        { value: 'medications.route', label: 'Voie d\'administration', dataType: 'array' },
        { value: 'medications.generic_name', label: 'Nom générique', dataType: 'array' },
        { value: 'medications.warnings', label: 'Avertissements', dataType: 'array' },
        { value: 'medications.overdose_management', label: 'Prise en charge surdosage', dataType: 'array' },
        { value: 'medications.max_daily_dose_adult', label: 'Dose max journalière adulte', dataType: 'array' },
        { value: 'medications.max_daily_dose_child', label: 'Dose max journalière enfant', dataType: 'array' },
        { value: 'medications.contraindications.target', label: 'Cible contre-indication', dataType: 'array' },
        { value: 'medications.contraindications.reason', label: 'Raison contre-indication', dataType: 'array' },
        { value: 'medications.contraindications.severity', label: 'Gravité contre-indication', dataType: 'array' },
        { value: 'medications.toxicity_thresholds.adult_toxic_dose', label: 'Dose toxique adulte', dataType: 'array' },
        { value: 'medications.toxicity_thresholds.child_toxic_dose_per_kg', label: 'Dose toxique enfant (mg/kg)', dataType: 'array' },
        { value: 'medications.toxicity_thresholds.child_severe_dose_per_kg', label: 'Dose sévère enfant (mg/kg)', dataType: 'array' },
      ],
    },
  ],
  SYMPTOM: [{ label: 'Symptômes', options: [{ value: 'symptoms', label: 'Symptômes', dataType: 'array' }, { value: 'presenting_complaint', label: 'Motif de consultation', dataType: 'string' }] }],
  ALLERGY: [{ label: 'Allergies', options: [{ value: 'allergies', label: 'Allergies', dataType: 'array' }, { value: 'patient.allergies', label: 'Allergies du patient', dataType: 'array' }] }],
  EMERGENCY_FLAG: [{ label: 'Signaux d\'urgence', options: [{ value: 'emergency_flags', label: 'Signaux d\'urgence', dataType: 'array' }] }],
}

const FAMILY_UI: Record<RuleFamily, { bg: string; accent: string; border: string }> = {
  PATIENT_RISK: { bg: 'bg-blue-50', accent: 'text-blue-600', border: 'border-blue-200' },
  DRUG_INTERACTION: { bg: 'bg-yellow-50', accent: 'text-yellow-700', border: 'border-yellow-200' },
  CONTRAINDICATION: { bg: 'bg-red-50', accent: 'text-red-700', border: 'border-red-200' },
  TOXICOLOGY: { bg: 'bg-pink-50', accent: 'text-pink-700', border: 'border-pink-200' },
  OVERDOSE: { bg: 'bg-amber-50', accent: 'text-amber-700', border: 'border-amber-200' },
  EMERGENCY: { bg: 'bg-red-50', accent: 'text-red-700', border: 'border-red-200' },
  THERAPEUTIC_WARNING: { bg: 'bg-green-50', accent: 'text-green-700', border: 'border-green-200' },
  DOSING_ADJUSTMENT: { bg: 'bg-indigo-50', accent: 'text-indigo-700', border: 'border-indigo-200' },
}

function getFieldGroups(conditionType: ConditionType): FieldGroup[] {
  return FIELD_CATALOG[conditionType] || FIELD_CATALOG.CONDITION
}

function getFieldOption(conditionType: ConditionType, field: string): FieldOption | undefined {
  return getFieldGroups(conditionType).flatMap(group => group.options).find(option => option.value === field)
}

function getDefaultField(conditionType: ConditionType): string {
  return getFieldGroups(conditionType).flatMap(group => group.options)[0]?.value || ''
}

function getOperatorOptions(dataType?: FieldDataType): Operator[] {
  switch (dataType) {
    case 'number':
    case 'date':
      return ['=', '!=', '>', '<', '>=', '<=']
    case 'boolean':
      return ['=', '!=']
    case 'array':
      return ['includes', 'not_includes']
    default:
      return OPERATORS
  }
}

function parseConditionValue(field: string, value: string): string | number | boolean {
  const fieldOption = Object.values(FIELD_CATALOG).flatMap(group => group.flatMap(section => section.options)).find(option => option.value === field)
  if (!fieldOption) return value
  if (fieldOption.dataType === 'number') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : value
  }
  if (fieldOption.dataType === 'boolean') {
    return value === 'true'
  }
  return value
}

function mapLegacyConditionType(type?: string): ConditionType {
  switch (type) {
    case 'LAB_RESULT': return 'LAB_RESULT'
    case 'MEDICATION': return 'MEDICATION'
    case 'VITAL_SIGN': return 'VITAL_SIGN'
    case 'SYMPTOM': return 'SYMPTOM'
    case 'ALLERGY': return 'ALLERGY'
    case 'AGE': return 'AGE'
    case 'EMERGENCY_FLAG': return 'EMERGENCY_FLAG'
    default: return 'CONDITION'
  }
}

function normalizeRuleConditions(ruleConditions: any) {
  if (!ruleConditions) return { logic: 'AND', conditions: [] as any[] }
  if (Array.isArray(ruleConditions.conditions)) {
    return { logic: ruleConditions.logic === 'OR' ? 'OR' : 'AND', conditions: ruleConditions.conditions }
  }
  if (Array.isArray(ruleConditions.items)) {
    return {
      logic: ruleConditions.logic === 'any' ? 'OR' : 'AND',
      conditions: ruleConditions.items.map((item: any) => ({
        type: mapLegacyConditionType(item.condition_type),
        field: item.field || '',
        operator: item.operator || '=',
        value: item.value,
      })),
    }
  }
  if (Array.isArray(ruleConditions.all)) return { logic: 'AND', conditions: ruleConditions.all }
  if (Array.isArray(ruleConditions.any)) return { logic: 'OR', conditions: ruleConditions.any }
  return { logic: 'AND', conditions: [] as any[] }
}

function normalizeRiskScores(riskScores: any): RiskScoreEntry[] {
  if (Array.isArray(riskScores)) {
    return riskScores.map((item: any) => ({ id: makeId(), name: item.name || '', value: String(item.value ?? '') }))
  }
  if (riskScores && typeof riskScores === 'object') {
    return Object.entries(riskScores).map(([name, value]) => ({ id: makeId(), name, value: String(value ?? '') }))
  }
  return [{ id: makeId(), name: 'renal_risk', value: '20' }]
}

function normalizeAlertEntries(alerts: any): AlertEntry[] {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return [{ id: makeId(), type: 'clinical', severity: 'CRITICAL', message: 'Verifier la fonction renale' }]
  }
  return alerts.map((item: any) => ({
    id: makeId(),
    type: item.type || 'clinical',
    severity: item.severity ?? 'CRITICAL',
    message: item.message || '',
  }))
}

function normalizeContraindications(contraindications: any): ContraindicationEntry[] {
  if (!Array.isArray(contraindications) || contraindications.length === 0) {
    return [{ id: makeId(), medication: 'Metformin', reason: 'Insuffisance renale grave', severity: 'CRITICAL' }]
  }
  return contraindications.map((item: any) => ({
    id: makeId(),
    medication: item.medication || item.target || '',
    reason: item.reason || '',
    severity: item.severity ?? 'CRITICAL',
  }))
}

function makeId() {
  return `id_${Math.random().toString(36).slice(2, 10)}`
}

function makeDefaultConditionForFamily(family: RuleFamily): RuleCondition {
  switch (family) {
    case 'EMERGENCY':
      return { id: makeId(), conditionType: 'VITAL_SIGN', field: 'vitals.spo2', operator: '<', value: '85' }
    case 'OVERDOSE':
      return { id: makeId(), conditionType: 'MEDICATION', field: 'medications.max_daily_dose_adult', operator: '>', value: '1' }
    case 'CONTRAINDICATION':
      return { id: makeId(), conditionType: 'MEDICATION', field: 'medications.name', operator: 'includes', value: 'Metformin' }
    case 'TOXICOLOGY':
      return { id: makeId(), conditionType: 'LAB_RESULT', field: 'labs.creatinine.value', operator: '>', value: '2' }
    case 'DOSING_ADJUSTMENT':
      return { id: makeId(), conditionType: 'LAB_RESULT', field: 'labs.eGFR.value', operator: '<', value: '30' }
    case 'THERAPEUTIC_WARNING':
      return { id: makeId(), conditionType: 'CONDITION', field: 'patient.smoking_status', operator: '=', value: 'smoker' }
    case 'DRUG_INTERACTION':
      return { id: makeId(), conditionType: 'MEDICATION', field: 'medications.name', operator: 'includes', value: 'Warfarin' }
    case 'PATIENT_RISK':
    default:
      return { id: makeId(), conditionType: 'CONDITION', field: 'patient.smoking_status', operator: '=', value: 'smoker' }
  }
}

function makeDefaultExplanationTemplate(family: RuleFamily, name = 'Cette règle') {
  return `${name} déclenchée pour la famille ${RULE_FAMILY_LABELS[family]}. Expliquer les facteurs cliniques, le niveau de risque et la conduite à tenir.`
}

function makeEmptyRuleForm(family: RuleFamily = 'DRUG_INTERACTION'): ClinicalRuleForm {
  return {
    ruleFamily: family,
    name: '',
    description: '',
    category: 'INTERACTION',
    severity: 'HIGH',
    enabled: true,
    triggerType: 'COMPOSITE',
    conditionJoin: 'all',
    explanationTemplate: makeDefaultExplanationTemplate(family),
    conditions: [makeDefaultConditionForFamily(family)],
    riskScores: [{ id: makeId(), name: 'renal_risk', value: '20' }],
    urgency: 'HIGH',
    alerts: [{ id: makeId(), type: 'clinical', severity: 'CRITICAL', message: 'Verifier la fonction renale' }],
    contraindications: [{ id: makeId(), medication: 'Metformin', reason: 'Insuffisance renale grave', severity: 'CRITICAL' }],
    recommendations: ['Arreter Metformin'],
    warnings: ['Surveiller creatinine et fonction renale'],
  }
}

function getFieldGroupsForFamily(family: RuleFamily, conditionType: ConditionType): FieldGroup[] {
  const allowed = getAllowedConditionTypesForFamily(family)
  if (!allowed.includes(conditionType)) {
    return FIELD_CATALOG[allowed[0]] || FIELD_CATALOG.CONDITION
  }
  return FIELD_CATALOG[conditionType] || FIELD_CATALOG.CONDITION
}

function parseNumber(value: string) {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : value
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}

function buildConditionSummary(conditions: any): string {
  const normalized = normalizeRuleConditions(conditions)
  if (!normalized.conditions.length) return 'Aucune condition définie'
  return normalized.conditions
    .map((item: any) => `${item.type || item.condition_type || 'CONDITION'} ${item.field} ${item.operator} ${item.value}`)
    .join(` ${normalized.logic === 'OR' ? 'OU' : 'ET'} `)
}

function buildOutputSummary(outputs: any): string {
  if (!outputs) return 'Aucun output defini'
  const parts: string[] = []
  if (Array.isArray(outputs.risk_scores)) {
    parts.push(outputs.risk_scores.map((r: any) => `${r.name} +${r.value}`).join(', '))
  } else if (outputs.risk_scores && typeof outputs.risk_scores === 'object') {
    parts.push(Object.entries(outputs.risk_scores).map(([name, value]) => `${name} +${value}`).join(', '))
  }
  if (outputs.urgency) {
    parts.push(`Urgence ${outputs.urgency}`)
  }
  if (outputs.alerts?.length) {
    parts.push(`${outputs.alerts.length} alerte(s)`)
  }
  if (outputs.contraindications?.length) {
    parts.push(`${outputs.contraindications.length} CI(s)`)
  }
  if (outputs.recommendations?.length) {
    parts.push(`${outputs.recommendations.length} recommandation(s)`)
  }
  const warningCount = Array.isArray(outputs.therapeutic_warnings)
    ? outputs.therapeutic_warnings.length
    : Array.isArray(outputs.warnings)
      ? outputs.warnings.length
      : 0
  if (warningCount) {
    parts.push(`${warningCount} avertissement(s)`)
  }
  return parts.join(' · ') || 'Aucun output defini'
}

export default function AdminClinicalRules() {
  const [rules, setRules] = useState<ClinicalRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [familyFilter, setFamilyFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<ClinicalRuleForm>(makeEmptyRuleForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'severity' | 'status'>('recent')

  useEffect(() => {
    loadRules()
  }, [])

  async function loadRules() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/clinical-rules')
      if (!res.ok) throw new Error('Chargement impossible')
      const data = await res.json()
      setRules(data)
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm(makeEmptyRuleForm())
    setEditingId(null)
    setShowEditor(false)
    setError('')
  }

  function openEditor(rule: ClinicalRule | null) {
    if (!rule) {
      resetForm()
      setShowEditor(true)
      return
    }

    const conditions = normalizeRuleConditions(rule.conditions)
    const outputs = rule.outputs ?? {}
    const ruleFamily = inferRuleFamily(rule)

    setForm({
      ruleFamily,
      name: rule.name ?? '',
      description: rule.description ?? '',
      category: rule.category ?? 'INTERACTION',
      severity: rule.severity ?? 'HIGH',
      enabled: rule.enabled ?? true,
      triggerType: rule.trigger_type ?? 'COMPOSITE',
      explanationTemplate: rule.explanation_template ?? makeDefaultExplanationTemplate(ruleFamily, rule.name),
      conditionJoin: conditions.logic === 'OR' ? 'any' : 'all',
      conditions: conditions.conditions.length > 0
        ? conditions.conditions.map((item: any) => ({
          id: makeId(),
          conditionType: mapLegacyConditionType(item.type),
          field: item.field || getDefaultField(mapLegacyConditionType(item.type)),
          operator: item.operator || '=',
          value: item.value != null ? String(item.value) : '',
        }))
        : [{ id: makeId(), conditionType: 'AGE', field: 'patient.age', operator: '>', value: '65' }],
      riskScores: normalizeRiskScores(outputs.risk_scores),
      urgency: outputs.urgency ?? 'HIGH',
      alerts: normalizeAlertEntries(outputs.alerts),
      contraindications: normalizeContraindications(outputs.contraindications),
      recommendations: Array.isArray(outputs.recommendations) ? outputs.recommendations.slice() : ['Arreter Metformin'],
      warnings: Array.isArray(outputs.therapeutic_warnings)
        ? outputs.therapeutic_warnings.map((item: any) => item.warning || '').filter(Boolean)
        : Array.isArray(outputs.warnings)
          ? outputs.warnings.slice()
          : ['Surveiller creatinine et fonction renale'],
    })
    setEditingId(rule.id)
    setShowEditor(true)
    setError('')
  }

  function updateCondition(id: string, data: Partial<RuleCondition>) {
    setForm(form => ({
      ...form,
      conditions: form.conditions.map(cond => cond.id === id ? { ...cond, ...data } : cond),
    }))
  }

  function addCondition() {
    setForm(form => ({
      ...form,
      conditions: [...form.conditions, { id: makeId(), conditionType: 'CONDITION', field: getDefaultField('CONDITION'), operator: '=', value: '' }],
    }))
  }

  function removeCondition(id: string) {
    setForm(form => ({ ...form, conditions: form.conditions.filter(cond => cond.id !== id) }))
  }

  function addRiskScore() {
    setForm(form => ({
      ...form,
      riskScores: [...form.riskScores, { id: makeId(), name: '', value: '' }],
    }))
  }

  function updateRiskScore(id: string, data: Partial<RiskScoreEntry>) {
    setForm(form => ({
      ...form,
      riskScores: form.riskScores.map(item => item.id === id ? { ...item, ...data } : item),
    }))
  }

  function removeRiskScore(id: string) {
    setForm(form => ({ ...form, riskScores: form.riskScores.filter(item => item.id !== id) }))
  }

  function addAlert() {
    setForm(form => ({
      ...form,
      alerts: [...form.alerts, { id: makeId(), type: 'clinical', severity: 'HIGH', message: '' }],
    }))
  }

  function updateAlert(id: string, data: Partial<AlertEntry>) {
    setForm(form => ({
      ...form,
      alerts: form.alerts.map(item => item.id === id ? { ...item, ...data } : item),
    }))
  }

  function removeAlert(id: string) {
    setForm(form => ({ ...form, alerts: form.alerts.filter(item => item.id !== id) }))
  }

  function addContraindication() {
    setForm(form => ({
      ...form,
      contraindications: [...form.contraindications, { id: makeId(), medication: '', reason: '', severity: 'CRITICAL' }],
    }))
  }

  function updateContraindication(id: string, data: Partial<ContraindicationEntry>) {
    setForm(form => ({
      ...form,
      contraindications: form.contraindications.map(item => item.id === id ? { ...item, ...data } : item),
    }))
  }

  function removeContraindication(id: string) {
    setForm(form => ({
      ...form,
      contraindications: form.contraindications.filter(item => item.id !== id),
    }))
  }

  function addRecommendation() {
    setForm(form => ({ ...form, recommendations: [...form.recommendations, ''] }))
  }

  function updateRecommendation(index: number, value: string) {
    setForm(form => ({
      ...form,
      recommendations: form.recommendations.map((item, idx) => idx === index ? value : item),
    }))
  }

  function removeRecommendation(index: number) {
    setForm(form => ({
      ...form,
      recommendations: form.recommendations.filter((_, idx) => idx !== index),
    }))
  }

  function addWarning() {
    setForm(form => ({ ...form, warnings: [...form.warnings, ''] }))
  }

  function updateWarning(index: number, value: string) {
    setForm(form => ({
      ...form,
      warnings: form.warnings.map((item, idx) => idx === index ? value : item),
    }))
  }

  function removeWarning(index: number) {
    setForm(form => ({ ...form, warnings: form.warnings.filter((_, idx) => idx !== index) }))
  }

  function applyRuleFamily(family: RuleFamily) {
    setForm(form => ({
      ...form,
      ruleFamily: family,
      triggerType:
        family === 'EMERGENCY' ? 'EMERGENCY_FLAG'
          : family === 'DRUG_INTERACTION' ? 'MEDICATION_INTERACTION'
            : family === 'CONTRAINDICATION' ? 'CONDITION_MEDICATION'
              : family === 'TOXICOLOGY' ? 'LAB_THRESHOLD'
                : family === 'OVERDOSE' ? 'COMPOSITE'
                  : family === 'DOSING_ADJUSTMENT' ? 'LAB_THRESHOLD'
                    : family === 'THERAPEUTIC_WARNING' ? 'COMPOSITE'
                      : 'COMPOSITE',
      conditions: [makeDefaultConditionForFamily(family)],
      explanationTemplate: makeDefaultExplanationTemplate(family, form.name || 'Cette règle'),
    }))
  }

  function buildPayload(): any {
    return {
      name: form.name,
      description: form.description || null,
      rule_family: form.ruleFamily,
      category: form.category || null,
      severity: form.severity,
      enabled: form.enabled,
      trigger_type: form.triggerType || null,
      explanation_template: form.explanationTemplate.trim() || makeDefaultExplanationTemplate(form.ruleFamily, form.name),
      conditions: {
        logic: form.conditionJoin === 'any' ? 'OR' : 'AND',
        conditions: form.conditions.map(item => ({
          type: item.conditionType,
          field: item.field,
          operator: item.operator,
          value: parseConditionValue(item.field, item.value),
        })),
      },
      outputs: {
        risk_scores: form.riskScores
          .filter(row => row.name.trim())
          .reduce<Record<string, number | string>>((acc, row) => {
            acc[row.name.trim()] = parseNumber(row.value) as number | string
            return acc
          }, {}),
        urgency: form.urgency,
        alerts: form.alerts.filter(a => a.message.trim()).map(a => ({
          type: a.type.trim() || 'clinical',
          severity: a.severity,
          message: a.message.trim(),
        })),
        contraindications: form.contraindications
          .filter(c => c.medication.trim() || c.reason.trim())
          .map(c => ({
            target: c.medication.trim(),
            reason: c.reason.trim(),
            severity: c.severity,
          })),
        recommendations: form.recommendations.filter(Boolean),
        therapeutic_warnings: form.warnings.filter(Boolean).map(warning => ({ warning })),
      },
    }
  }

  async function saveRule(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    if (!form.name.trim()) {
      setError('Le nom de la règle est obligatoire.')
      setSaving(false)
      return
    }

    if (form.conditions.length === 0 || form.conditions.every(cond => !cond.field.trim())) {
      setError('Au moins une condition doit être définie.')
      setSaving(false)
      return
    }

    const payload = buildPayload()
    const url = editingId ? `/api/admin/clinical-rules/${editingId}` : '/api/admin/clinical-rules'
    const method = editingId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body?.error || 'Erreur lors de l’enregistrement de la règle')
      }
      await loadRules()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRule(id: string) {
    if (!confirm('Supprimer cette règle clinique ?')) return
    await fetch(`/api/admin/clinical-rules/${id}`, { method: 'DELETE' })
    await loadRules()
  }

  async function toggleEnabled(rule: ClinicalRule) {
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...rule,
        enabled: !rule.enabled,
      }
      const res = await fetch(`/api/admin/clinical-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body?.error || 'Impossible de mettre à jour le statut')
      }
      await loadRules()
    } catch (err: any) {
      setError(err.message || 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const text = search.trim().toLowerCase()
      const matchesText =
        !text ||
        rule.name.toLowerCase().includes(text) ||
        (rule.description || '').toLowerCase().includes(text) ||
        (rule.category || '').toLowerCase().includes(text) ||
        (rule.trigger_type || '').toLowerCase().includes(text)

      const matchesCategory = !categoryFilter || rule.category === categoryFilter
      const matchesFamily = !familyFilter || inferRuleFamily(rule).toString() === familyFilter
      const matchesSeverity = !severityFilter || rule.severity === severityFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && rule.enabled) ||
        (statusFilter === 'disabled' && !rule.enabled)

      return matchesText && matchesCategory && matchesFamily && matchesSeverity && matchesStatus
    })
  }, [rules, search, categoryFilter, familyFilter, severityFilter, statusFilter])

  const sortedRules = useMemo(() => {
    const severityWeight: Record<SeverityLevel, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MODERATE: 2,
      LOW: 1,
    }

    const copy = [...filteredRules]
    copy.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'status') return Number(b.enabled) - Number(a.enabled)
      if (sortBy === 'severity') return severityWeight[b.severity] - severityWeight[a.severity]
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return copy
  }, [filteredRules, sortBy])

  const pageSize = 8
  const pageCount = Math.max(1, Math.ceil(sortedRules.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRules = sortedRules.slice((safePage - 1) * pageSize, safePage * pageSize)

  const activeRules = rules.filter(rule => rule.enabled).length
  const criticalRules = rules.filter(rule => rule.severity === 'CRITICAL').length

  const renderEditorForm = () => (
    <form onSubmit={saveRule} className="space-y-5">
      <details open className="rounded-xl border border-[var(--color-border)] bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">1. General Information</summary>
        <div className="mt-3 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {RULE_FAMILY_ORDER.map(family => {
              const Icon = FAMILY_ICONS[family] || ShieldAlert
              const familyUi = FAMILY_UI[family] || FAMILY_UI.PATIENT_RISK
              const active = form.ruleFamily === family
              return (
                <button
                  key={family}
                  type="button"
                  onClick={() => applyRuleFamily(family)}
                  className={`flex h-full flex-col gap-2 rounded-xl border p-3 text-left transition ${active ? `${familyUi.border} ${familyUi.bg} shadow-sm` : 'border-[var(--color-border)] bg-white hover:border-slate-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg border p-2 ${active ? familyUi.border : 'border-[var(--color-border)] bg-[var(--color-muted)]/10'}`}>
                      <Icon className={`h-4 w-4 ${active ? familyUi.accent : 'text-slate-500'}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{RULE_FAMILY_LABELS[family]}</p>
                      <p className="text-xs text-slate-500">{family}</p>
                    </div>
                  </div>
                  <p className="text-xs leading-5 text-slate-600">{RULE_FAMILY_DESCRIPTIONS[family]}</p>
                </button>
              )
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="rule-name">Nom de la regle</Label>
              <Input id="rule-name" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="rule-category">Categorie</Label>
              <select id="rule-category" value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} title="Categorie de la regle" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="rule-severity">Severite</Label>
              <select id="rule-severity" value={form.severity} onChange={e => setForm(prev => ({ ...prev, severity: e.target.value as SeverityLevel }))} title="Severite de la regle" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{SEVERITY_LABELS[option] || option}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="rule-trigger">Type de declencheur</Label>
              <select id="rule-trigger" value={form.triggerType} onChange={e => setForm(prev => ({ ...prev, triggerType: e.target.value }))} title="Type de declencheur" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                {TRIGGER_TYPES.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="rule-status">Statut</Label>
              <select id="rule-status" value={form.enabled ? 'enabled' : 'disabled'} onChange={e => setForm(prev => ({ ...prev, enabled: e.target.value === 'enabled' }))} title="Statut de la regle" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                <option value="enabled">Activee</option>
                <option value="disabled">Desactivee</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="rule-description">Description</Label>
            <textarea id="rule-description" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="min-h-[96px] w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
          </div>

          <div>
            <Label htmlFor="rule-explanation-template">Template explicatif</Label>
            <textarea id="rule-explanation-template" value={form.explanationTemplate} onChange={e => setForm(prev => ({ ...prev, explanationTemplate: e.target.value }))} rows={3} className="min-h-[96px] w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
          </div>
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--color-border)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">2. Clinical Conditions</summary>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-500">Combinaison</span>
          <select value={form.conditionJoin} onChange={e => setForm(prev => ({ ...prev, conditionJoin: e.target.value as 'all' | 'any' }))} title="Mode de combinaison des conditions" className="h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
            <option value="all">ET</option>
            <option value="any">OU</option>
          </select>
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--color-border)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">3. Dynamic Logic Builder</summary>
        <div className="mt-3 space-y-3">
          {form.conditions.map(condition => (
            <div key={condition.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label>Type</Label>
                  <select value={condition.conditionType} onChange={e => { const nextType = e.target.value as ConditionType; const nextGroups = getFieldGroupsForFamily(form.ruleFamily, nextType); const nextField = nextGroups.flatMap(group => group.options)[0]?.value || getDefaultField(nextType); updateCondition(condition.id, { conditionType: nextType, field: nextField, operator: getOperatorOptions(getFieldOption(nextType, nextField)?.dataType)[0] }) }} title="Type de condition" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                    {getAllowedConditionTypesForFamily(form.ruleFamily).map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Champ cible</Label>
                  <select value={condition.field || getDefaultField(condition.conditionType)} onChange={e => { const nextField = e.target.value; const nextFieldOption = getFieldOption(condition.conditionType, nextField); updateCondition(condition.id, { field: nextField, operator: getOperatorOptions(nextFieldOption?.dataType)[0] }) }} title="Champ clinique" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                    {getFieldGroupsForFamily(form.ruleFamily, condition.conditionType).map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Operateur</Label>
                  {(() => {
                    const fieldOption = getFieldOption(condition.conditionType, condition.field || getDefaultField(condition.conditionType))
                    const operatorOptions = getOperatorOptions(fieldOption?.dataType)
                    return (
                      <select value={condition.operator} onChange={e => updateCondition(condition.id, { operator: e.target.value as Operator })} title="Operateur de comparaison" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                        {operatorOptions.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    )
                  })()}
                </div>
                <div>
                  <Label>Valeur</Label>
                  <Input value={condition.value} onChange={e => updateCondition(condition.id, { value: e.target.value })} placeholder="ex. Metformin" className="h-10" />
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeCondition(condition.id)}>
                  <Trash2 className="h-4 w-4" /> Supprimer
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addCondition}>
            <Plus className="h-4 w-4" /> Ajouter une condition
          </Button>
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--color-border)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">4. Recommendations</summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Actions cliniques recommandees</p>
            <Button type="button" variant="secondary" size="sm" onClick={addRecommendation}><Plus className="h-4 w-4" /> Ajouter</Button>
          </div>
          {form.recommendations.map((rec, index) => (
            <div key={`rec_${index}`} className="grid gap-2 md:grid-cols-[1fr_auto]">
              <Input value={rec} onChange={e => updateRecommendation(index, e.target.value)} placeholder="Recommandation clinique" />
              <Button type="button" variant="outline" size="sm" onClick={() => removeRecommendation(index)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--color-border)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">5. Contraindications</summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Medicaments ou classes impactes</p>
            <Button type="button" variant="secondary" size="sm" onClick={addContraindication}><Plus className="h-4 w-4" /> Ajouter</Button>
          </div>
          {form.contraindications.map(ci => (
            <div key={ci.id} className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_1fr_140px_auto]">
              <Input value={ci.medication} onChange={e => updateContraindication(ci.id, { medication: e.target.value })} placeholder="Medicament" />
              <Input value={ci.reason} onChange={e => updateContraindication(ci.id, { reason: e.target.value })} placeholder="Raison" />
              <select value={ci.severity} onChange={e => updateContraindication(ci.id, { severity: e.target.value as SeverityLevel })} title="Severite de la contre-indication" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{SEVERITY_LABELS[option] || option}</option>)}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={() => removeContraindication(ci.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--color-border)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">6. Actions & Automation</summary>
        <div className="mt-3 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Urgence globale</Label>
              <select value={form.urgency} onChange={e => setForm(prev => ({ ...prev, urgency: e.target.value as SeverityLevel }))} title="Urgence globale" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{SEVERITY_LABELS[option] || option}</option>)}
              </select>
            </div>
            <div>
              <Label>Score de risque</Label>
              <div className="space-y-2">
                {form.riskScores.map(score => (
                  <div key={score.id} className="grid gap-2 sm:grid-cols-[1fr_96px_auto]">
                    <Input value={score.name} onChange={e => updateRiskScore(score.id, { name: e.target.value })} placeholder="renal_risk" />
                    <Input value={score.value} onChange={e => updateRiskScore(score.id, { value: e.target.value })} placeholder="20" />
                    <Button type="button" variant="outline" size="sm" onClick={() => removeRiskScore(score.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={addRiskScore}><Plus className="h-4 w-4" /> Ajouter un score</Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Alertes</p>
              <Button type="button" variant="secondary" size="sm" onClick={addAlert}><Plus className="h-4 w-4" /> Ajouter</Button>
            </div>
            {form.alerts.map(alert => (
              <div key={alert.id} className="grid gap-2 md:grid-cols-2 xl:grid-cols-[140px_120px_1fr_auto]">
                <Input value={alert.type} onChange={e => updateAlert(alert.id, { type: e.target.value })} placeholder="type" />
                <select value={alert.severity} onChange={e => updateAlert(alert.id, { severity: e.target.value as SeverityLevel })} title="Severite de l'alerte" className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                  {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{SEVERITY_LABELS[option] || option}</option>)}
                </select>
                <Input value={alert.message} onChange={e => updateAlert(alert.id, { message: e.target.value })} placeholder="Message d'alerte" />
                <Button type="button" variant="outline" size="sm" onClick={() => removeAlert(alert.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Avertissements therapeutiques</p>
              <Button type="button" variant="secondary" size="sm" onClick={addWarning}><Plus className="h-4 w-4" /> Ajouter</Button>
            </div>
            {form.warnings.map((text, index) => (
              <div key={`warn_${index}`} className="grid gap-2 md:grid-cols-[1fr_auto]">
                <Input value={text} onChange={e => updateWarning(index, e.target.value)} placeholder="Avertissement therapeutique" />
                <Button type="button" variant="outline" size="sm" onClick={() => removeWarning(index)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--color-border)] bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">7. Preview/Test</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Conditions match</p>
            <p className="mt-2 text-sm text-slate-700">{buildConditionSummary({ logic: form.conditionJoin === 'any' ? 'OR' : 'AND', conditions: form.conditions })}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Sorties generees</p>
            <p className="mt-2 text-sm text-slate-700">{buildOutputSummary(buildPayload().outputs)}</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tracabilite</p>
            <p className="mt-2 text-sm text-slate-700">Famille: {RULE_FAMILY_LABELS[form.ruleFamily]} · Declencheur: {form.triggerType}</p>
            <p className="mt-2 text-xs text-slate-500">{form.explanationTemplate || makeDefaultExplanationTemplate(form.ruleFamily, form.name || 'Cette regle')}</p>
          </div>
        </div>
      </details>

      <div className="sticky bottom-2 z-20 rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{editingId ? 'Modification d une regle existante.' : 'Nouvelle regle en cours de creation.'}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : editingId ? 'Mettre a jour la regle' : 'Creer la regle'}</Button>
          </div>
        </div>
      </div>
    </form>
  )

  return (
    <div className="max-w-full space-y-5 overflow-hidden">
      <section className="rounded-2xl border border-[var(--color-border)] bg-slate-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
              <ShieldAlert className="h-3.5 w-3.5" /> Studio de regles cliniques
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Moteur de regles cliniques</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">Interface de gouvernance clinique moderne pour creer, auditer et maintenir les regles avec une lecture claire pour les equipes medicales.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => openEditor(null)} className="h-10">
              <Plus className="h-4 w-4" /> Nouvelle regle
            </Button>
            <Button type="button" variant="outline" className="h-10 xl:hidden" onClick={() => setMobileFiltersOpen(true)}>
              <Search className="h-4 w-4" /> Filtres
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="h-full rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total regles</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{rules.length}</p>
          </Card>
          <Card className="h-full rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Regles visibles</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{filteredRules.length}</p>
          </Card>
          <Card className="h-full rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Actives</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{activeRules}</p>
          </Card>
          <Card className="h-full rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Critiques</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{criticalRules}</p>
          </Card>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-destructive)]/10 px-3 py-2 text-sm text-[var(--color-destructive-foreground)]">
          {error}
        </div>
      )}

      <Card className="sticky top-2 z-20 rounded-xl border border-[var(--color-border)] bg-white/95 p-3 backdrop-blur">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center">
          <div className="relative min-w-0">
            <label htmlFor="rules-search" className="sr-only">Recherche des regles</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" aria-hidden />
            <Input
              id="rules-search"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher nom, categorie, type de declencheur..."
              className="h-10 rounded-xl pl-10 focus-visible:ring-2"
              aria-label="Recherche"
            />
          </div>

          <Button type="button" variant="outline" className="h-10 xl:hidden" onClick={() => setMobileFiltersOpen(true)}>
            Filtres
          </Button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'recent' | 'name' | 'severity' | 'status')}
            title="Tri des regles"
            className="h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="recent">Trier: Plus recentes</option>
            <option value="name">Trier: Nom</option>
            <option value="severity">Trier: Severite</option>
            <option value="status">Trier: Statut</option>
          </select>

          <Button
            type="button"
            variant="ghost"
            className="h-10"
            onClick={() => {
              setSearch('')
              setCategoryFilter('')
              setFamilyFilter('')
              setSeverityFilter('')
              setStatusFilter('all')
              setPage(1)
            }}
          >
            Reinitialiser
          </Button>
        </div>
      </Card>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[320px_420px_minmax(0,1fr)] 2xl:grid-cols-[320px_460px_minmax(0,1fr)]">
        <aside className={`min-w-0 ${sidebarOpen ? 'block' : 'hidden'} xl:block`}>
          <Card className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-[var(--color-border)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Filtres</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="xl:hidden">Fermer</Button>
            </div>

            <details open className="rounded-xl border border-[var(--color-border)] p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">Classification</summary>
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="filter-category">Categorie</Label>
                  <select id="filter-category" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }} title="Filtre de categorie" className="mt-1 h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                    <option value="">Toutes categories</option>
                    {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="filter-family">Famille clinique</Label>
                  <select id="filter-family" value={familyFilter} onChange={e => { setFamilyFilter(e.target.value); setPage(1) }} title="Filtre de famille" className="mt-1 h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                    <option value="">Toutes familles</option>
                    {RULE_FAMILY_ORDER.map(option => <option key={option} value={option}>{RULE_FAMILY_LABELS[option]}</option>)}
                  </select>
                </div>
              </div>
            </details>

            <details open className="mt-3 rounded-xl border border-[var(--color-border)] p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">Risque et statut</summary>
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="filter-severity">Severite</Label>
                  <select id="filter-severity" value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1) }} title="Filtre de severite" className="mt-1 h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                    <option value="">Toutes severites</option>
                    {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{SEVERITY_LABELS[option] || option}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="filter-status">Statut</Label>
                  <select id="filter-status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }} title="Filtre de statut" className="mt-1 h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
                    <option value="all">Tous statuts</option>
                    <option value="enabled">Activees</option>
                    <option value="disabled">Desactivees</option>
                  </select>
                </div>
              </div>
            </details>
          </Card>
        </aside>

        <main className="min-w-0 space-y-3">
          {loading ? (
            <Card className="rounded-xl p-6 text-sm text-slate-500">Chargement des regles...</Card>
          ) : pageRules.length === 0 ? (
            <Card className="rounded-xl p-6 text-center text-sm text-slate-500">Aucun resultat. Ajustez les filtres ou creez une nouvelle regle.</Card>
          ) : (
            <div className="space-y-3">
              {pageRules.map(rule => {
                const isSelected = editingId === rule.id && showEditor
                return (
                  <article
                    key={rule.id}
                    className={`rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${isSelected ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-[var(--color-border)]'}`}
                  >
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-slate-900">{rule.name}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_BADGE[rule.severity]}`}>{rule.severity}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-xs ${FAMILY_UI[inferRuleFamily(rule)].bg} ${FAMILY_UI[inferRuleFamily(rule)].accent} ${FAMILY_UI[inferRuleFamily(rule)].border}`}>{RULE_FAMILY_LABELS[inferRuleFamily(rule)]}</span>
                            {rule.category && <span className="rounded-full border border-[var(--color-border)] bg-slate-50 px-2 py-0.5 text-xs text-slate-600">{rule.category}</span>}
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => toggleEnabled(rule)} aria-pressed={rule.enabled}>
                          {rule.enabled ? 'Activee' : 'Inactive'}
                        </Button>
                      </div>

                      <p className="line-clamp-2 text-sm text-slate-600">{rule.description || 'Aucune description clinique.'}</p>
                      <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 px-3 py-2">Conditions: {buildConditionSummary(rule.conditions)}</div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">Sorties: {buildOutputSummary(rule.outputs)}</div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span>Derniere mise a jour: {formatDate(rule.created_at)}</span>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => openEditor(rule)}>Modifier</Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => deleteRule(rule.id)}>Supprimer</Button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {pageCount > 1 && (
            <Card className="rounded-xl border border-[var(--color-border)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <span>{`${(safePage - 1) * pageSize + 1} - ${Math.min(safePage * pageSize, sortedRules.length)} sur ${sortedRules.length}`}</span>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Button>
                  <Button type="button" variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Suivant</Button>
                </div>
              </div>
            </Card>
          )}
        </main>

        <aside className="hidden min-w-0 xl:block">
          {showEditor ? (
            <Card className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-[var(--color-border)] p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{editingId ? 'Modifier la regle' : 'Nouvelle regle'}</h3>
                  <p className="text-sm text-slate-500">Configuration clinique complete avec sections collapsibles.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={resetForm} title="Fermer l'editeur">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {renderEditorForm()}
            </Card>
          ) : (
            <Card className="rounded-xl p-6 text-sm text-slate-500">Selectionnez une regle pour afficher l'editeur.</Card>
          )}
        </aside>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Filtres">
          <button className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} aria-label="Fermer les filtres" />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Filtres</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMobileFiltersOpen(false)}>Fermer</Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="mobile-filter-category">Categorie</Label>
                <select id="mobile-filter-category" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }} title="Filtre de categorie" className="mt-1 h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                  <option value="">Toutes categories</option>
                  {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="mobile-filter-family">Famille</Label>
                <select id="mobile-filter-family" value={familyFilter} onChange={e => { setFamilyFilter(e.target.value); setPage(1) }} title="Filtre de famille" className="mt-1 h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                  <option value="">Toutes familles</option>
                  {RULE_FAMILY_ORDER.map(option => <option key={option} value={option}>{RULE_FAMILY_LABELS[option]}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="mobile-filter-severity">Severite</Label>
                <select id="mobile-filter-severity" value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1) }} title="Filtre de severite" className="mt-1 h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                  <option value="">Toutes severites</option>
                  {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{SEVERITY_LABELS[option] || option}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="mobile-filter-status">Statut</Label>
                <select id="mobile-filter-status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }} title="Filtre de statut" className="mt-1 h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm outline-none">
                  <option value="all">Tous statuts</option>
                  <option value="enabled">Activees</option>
                  <option value="disabled">Desactivees</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Editeur de regle">
          <button className="absolute inset-0 bg-black/40" onClick={resetForm} aria-label="Fermer l'editeur" />
          <div className="absolute inset-0 overflow-y-auto bg-white p-4">
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between border-b border-[var(--color-border)] bg-white pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{editingId ? 'Modifier la regle' : 'Nouvelle regle'}</h3>
                <p className="text-sm text-slate-500">Edition plein ecran pour usage mobile.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {renderEditorForm()}
          </div>
        </div>
      )}
    </div>
  )
}
