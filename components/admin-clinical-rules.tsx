'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, ShieldAlert, Search, CheckCircle2, X, ArrowUpDown } from 'lucide-react'

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
  name: string
  description: string
  category: string
  severity: SeverityLevel
  enabled: boolean
  triggerType: string
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
  category: string | null
  severity: SeverityLevel
  enabled: boolean
  trigger_type: string | null
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

const CATEGORY_OPTIONS = [
  'TOXICITY',
  'INTERACTION',
  'RENAL',
  'CARDIAC',
  'EMERGENCY',
  'OVERDOSE',
  'CONTRAINDICATION',
]

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

const FIELD_CATALOG: Record<ConditionType, FieldGroup[]> = {
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

function makeEmptyRuleForm(): ClinicalRuleForm {
  return {
    name: '',
    description: '',
    category: 'INTERACTION',
    severity: 'HIGH',
    enabled: true,
    triggerType: 'COMPOSITE',
    conditionJoin: 'all',
    conditions: [
      { id: makeId(), conditionType: 'LAB_RESULT', field: 'creatinine', operator: '>', value: '2' },
    ],
    riskScores: [{ id: makeId(), name: 'renal_risk', value: '20' }],
    urgency: 'HIGH',
    alerts: [{ id: makeId(), type: 'clinical', severity: 'CRITICAL', message: 'Verifier la fonction renale' }],
    contraindications: [{ id: makeId(), medication: 'Metformin', reason: 'Insuffisance renale grave', severity: 'CRITICAL' }],
    recommendations: ['Arreter Metformin'],
    warnings: ['Surveiller creatinine et fonction renale'],
  }
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

type EditorTab = 'builder' | 'explainability' | 'simulation'

type SimulationContextForm = {
  age: string
  weight: string
  gender: string
  potassium: string
  eGFR: string
  spo2: string
  medications: string
  conditions: string
  symptoms: string
  allergies: string
}

function makeEmptySimulationContextForm(): SimulationContextForm {
  return {
    age: '72',
    weight: '85',
    gender: 'M',
    potassium: '6.8',
    eGFR: '25',
    spo2: '88',
    medications: 'Warfarin\nIbuprofen\nMetformin',
    conditions: 'diabetes\nhypertension',
    symptoms: 'dizziness\nshortness_of_breath',
    allergies: '',
  }
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function buildSimulationContext(form: SimulationContextForm) {
  return {
    patient: {
      id: 'editor-preview',
      name: 'Preview Patient',
      age: parseNumber(form.age),
      weight: parseNumber(form.weight),
      gender: form.gender,
    },
    labs: {
      potassium: { name: 'potassium', value: parseNumber(form.potassium), unit: 'mEq/L', timestamp: new Date() },
      eGFR: { name: 'eGFR', value: parseNumber(form.eGFR), unit: 'mL/min', timestamp: new Date() },
    },
    vitals: {
      heart_rate: 110,
      spo2: parseNumber(form.spo2),
      heartRate: 110,
      blood_pressure_systolic: 160,
      blood_pressure_diastolic: 95,
      bloodPressure: { systolic: 160, diastolic: 95 },
      temperature: 37.2,
    },
    medications: splitLines(form.medications).map((name, index) => ({
      id: `med-${index + 1}`,
      name,
      category: 'UNKNOWN',
      dose: '',
      dosage: '',
      frequency: '',
      route: 'oral',
    })),
    symptoms: splitLines(form.symptoms),
    allergies: splitLines(form.allergies),
    conditions: splitLines(form.conditions),
    timestamp: new Date(),
  }
}

function summarizeDraftConditions(form: ClinicalRuleForm) {
  if (!form.conditions.length) return 'Aucune condition définie'
  return form.conditions
    .map(condition => `${condition.conditionType} ${condition.field || getDefaultField(condition.conditionType)} ${condition.operator} ${condition.value || '…'}`)
    .join(form.conditionJoin === 'any' ? ' OU ' : ' ET ')
}

function summarizeDraftOutputs(form: ClinicalRuleForm) {
  const parts: string[] = []
  parts.push(`Urgence ${form.urgency}`)
  parts.push(`${form.riskScores.filter(item => item.name.trim()).length} score(s)`)
  parts.push(`${form.alerts.filter(item => item.message.trim()).length} alerte(s)`)
  parts.push(`${form.contraindications.filter(item => item.medication.trim() || item.reason.trim()).length} contre-indication(s)`)
  parts.push(`${form.recommendations.filter(Boolean).length} recommandation(s)`)
  parts.push(`${form.warnings.filter(Boolean).length} avertissement(s)`)
  return parts.join(' · ')
}

export default function AdminClinicalRules() {
  const [rules, setRules] = useState<ClinicalRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<ClinicalRuleForm>(makeEmptyRuleForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editorTab, setEditorTab] = useState<EditorTab>('builder')
  const [simulationForm, setSimulationForm] = useState<SimulationContextForm>(makeEmptySimulationContextForm())
  const [simulationResult, setSimulationResult] = useState<any>(null)
  const [simulationLoading, setSimulationLoading] = useState(false)
  const [simulationError, setSimulationError] = useState('')

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
    setEditorTab('builder')
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

    setForm({
      name: rule.name ?? '',
      description: rule.description ?? '',
      category: rule.category ?? 'INTERACTION',
      severity: rule.severity ?? 'HIGH',
      enabled: rule.enabled ?? true,
      triggerType: rule.trigger_type ?? 'COMPOSITE',
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
    setEditorTab('builder')
    setError('')
  }

  async function runSimulation() {
    setSimulationLoading(true)
    setSimulationError('')
    try {
      const response = await fetch('/api/admin/clinical-rules/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: buildSimulationContext(simulationForm) }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Simulation impossible')
      }

      setSimulationResult(data)
    } catch (err: any) {
      setSimulationError(err.message || 'Simulation impossible')
    } finally {
      setSimulationLoading(false)
    }
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

  function buildPayload(): any {
    return {
      name: form.name,
      description: form.description || null,
      category: form.category || null,
      severity: form.severity,
      enabled: form.enabled,
      trigger_type: form.triggerType || null,
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
      const matchesSeverity = !severityFilter || rule.severity === severityFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && rule.enabled) ||
        (statusFilter === 'disabled' && !rule.enabled)

      return matchesText && matchesCategory && matchesSeverity && matchesStatus
    })
  }, [rules, search, categoryFilter, severityFilter, statusFilter])

  const pageSize = 8
  const pageCount = Math.max(1, Math.ceil(filteredRules.length / pageSize))
  const pageRules = filteredRules.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [pageCount, page])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
              <ShieldAlert className="h-3.5 w-3.5" />
              Studio de règles
            </div>
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-900">
                Moteur de règles cliniques
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Créez, modifiez et activez des règles cliniques dynamiques sans JSON brut. L’éditeur garde la logique métier intacte tout en présentant les conditions, les sorties et l’explicabilité dans un espace de travail lisible.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-[var(--color-muted-foreground)]">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-3 py-1">{filteredRules.length} règles visibles</span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-3 py-1">{rules.length} au total</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => openEditor(null)} className="shadow-sm">
              <Plus className="h-4 w-4" /> Nouvelle règle
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-destructive)]/10 px-4 py-3 text-sm text-[var(--color-destructive-foreground)]">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-4 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-1">
          <Card className="border-[var(--color-border)] p-4 shadow-sm bg-white">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <Input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Recherche par nom, catégorie, type..."
                  className="pl-10 h-9"
                />
              </div>
              <div className="flex gap-2 items-center w-full md:w-auto">
                <select
                  value={categoryFilter}
                  onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
                  title="Filtre de catégorie"
                  className="w-full md:w-48 h-9 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                >
                  <option value="">Toutes catégories</option>
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={severityFilter}
                  onChange={e => { setSeverityFilter(e.target.value); setPage(1) }}
                  title="Filtre de gravité"
                  className="w-full md:w-48 h-9 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                >
                  <option value="">Toutes gravités</option>
                  {SEVERITY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }}
                  title="Filtre de statut"
                  className="w-full md:w-40 h-9 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                >
                  <option value="all">Tous statuts</option>
                  <option value="enabled">Activées</option>
                  <option value="disabled">Désactivées</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            {pageRules.length === 0 && (
              <Card className="border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-muted-foreground)] shadow-sm bg-white">
                Aucun résultat trouvé. Ajustez le filtre ou créez une nouvelle règle.
              </Card>
            )}

            {pageRules.map(rule => (
              <Card key={rule.id} className="border-[var(--color-border)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md bg-white">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold text-[var(--color-foreground)]">{rule.name}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_BADGE[rule.severity]}`}>
                        {rule.severity}
                      </span>
                      {rule.category && (
                        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/5 px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
                          {rule.category}
                        </span>
                      )}
                      {rule.trigger_type && (
                        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/5 px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
                          {rule.trigger_type}
                        </span>
                      )}
                    </div>
                    {rule.description && <p className="text-sm text-[var(--color-muted-foreground)]">{rule.description}</p>}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                        <span className="font-semibold">Conditions:</span> {buildConditionSummary(rule.conditions)}
                      </div>
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                        <span className="font-semibold">Outputs:</span> {buildOutputSummary(rule.outputs)}
                      </div>
                    </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Créée le {formatDate(rule.created_at)}</span>
                      <span>{rule.enabled ? 'Activée' : 'Désactivée'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => toggleEnabled(rule)}>
                      {rule.enabled ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => openEditor(rule)}>
                      Modifier
                    </Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => deleteRule(rule.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-muted-foreground)] shadow-sm">
              <span>{`${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, filteredRules.length)} sur ${filteredRules.length}`}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >Précédent</Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount}
                  onClick={() => setPage(page + 1)}
                >Suivant</Button>
              </div>
            </div>
          )}
        </div>

        {showEditor && (
          <Card className="space-y-4 border-[var(--color-border)] p-5 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
            <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{editingId ? 'Modifier la règle' : 'Nouvelle règle'}</h3>
                  <p className="text-sm text-slate-500">Construisez les conditions, relisez la logique et testez un patient sans quitter le panneau.</p>
                </div>
                <button type="button" onClick={resetForm} title="Fermer le formulaire" className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                    { id: 'builder', label: 'Éditeur' },
                    { id: 'explainability', label: 'Explicabilité' },
                    { id: 'simulation', label: 'Simulation' },
                  ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEditorTab(tab.id as EditorTab)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${editorTab === tab.id ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-[var(--color-border)] bg-white text-[var(--color-muted-foreground)] hover:border-slate-300 hover:text-slate-900'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {editorTab === 'builder' && (
            <form onSubmit={saveRule} className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <Label htmlFor="rule-name">Nom de la règle</Label>
                  <Input
                    id="rule-name"
                    value={form.name}
                    onChange={e => setForm(form => ({ ...form, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rule-category">Catégorie</Label>
                  <select
                    id="rule-category"
                    value={form.category}
                    onChange={e => setForm(form => ({ ...form, category: e.target.value }))}
                    title="Catégorie de la règle"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                  >
                    {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="rule-severity">Sévérité</Label>
                  <select
                    id="rule-severity"
                    value={form.severity}
                    onChange={e => setForm(form => ({ ...form, severity: e.target.value as SeverityLevel }))}
                    title="Sévérité de la règle"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                  >
                    {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="rule-trigger">Type de déclencheur</Label>
                  <select
                    id="rule-trigger"
                    value={form.triggerType}
                    onChange={e => setForm(form => ({ ...form, triggerType: e.target.value }))}
                    title="Type de déclencheur"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                  >
                    {TRIGGER_TYPES.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="rule-status">Statut</Label>
                  <select
                    id="rule-status"
                    value={form.enabled ? 'enabled' : 'disabled'}
                    onChange={e => setForm(form => ({ ...form, enabled: e.target.value === 'enabled' }))}
                    title="Statut de la règle"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                  >
                    <option value="enabled">Activée</option>
                    <option value="disabled">Désactivée</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="rule-description">Description</Label>
                <textarea
                  id="rule-description"
                  value={form.description}
                  onChange={e => setForm(form => ({ ...form, description: e.target.value }))}
                  rows={3}
                  placeholder="Décrivez le comportement clinique de la règle"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                />
              </div>

              <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Conditions dynamiques</h4>
                    <p className="text-sm text-slate-600">Chaque ligne peut être combinée avec ET ou OU.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Combinaison</span>
                    <select
                      value={form.conditionJoin}
                      onChange={e => setForm(form => ({ ...form, conditionJoin: e.target.value as 'all' | 'any' }))}
                      title="Mode de combinaison des conditions"
                      className="rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                    >
                      <option value="all">ET</option>
                      <option value="any">OU</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {form.conditions.map((condition, index) => (
                    <div key={condition.id} className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2 items-start">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                        <div className="min-w-0">
                          <Label>Type</Label>
                          <select
                            value={condition.conditionType}
                            onChange={e => {
                              const nextType = e.target.value as ConditionType
                              updateCondition(condition.id, {
                                conditionType: nextType,
                                field: getDefaultField(nextType),
                                operator: getOperatorOptions(getFieldOption(nextType, getDefaultField(nextType))?.dataType)[0],
                              })
                            }}
                            title="Type de condition"
                            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                          >
                            {CONDITION_TYPES.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>

                        <div className="min-w-0">
                          <Label>Champ ciblé</Label>
                          <select
                            value={condition.field || getDefaultField(condition.conditionType)}
                            onChange={e => {
                              const nextField = e.target.value
                              const nextFieldOption = getFieldOption(condition.conditionType, nextField)
                              updateCondition(condition.id, {
                                field: nextField,
                                operator: getOperatorOptions(nextFieldOption?.dataType)[0],
                              })
                            }}
                            title="Champ clinique"
                            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                          >
                            {getFieldGroups(condition.conditionType).map(group => (
                              <optgroup key={group.label} label={group.label}>
                                {group.options.map(option => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div className="min-w-0">
                          <Label>Opérateur</Label>
                          {(() => {
                            const fieldOption = getFieldOption(condition.conditionType, condition.field || getDefaultField(condition.conditionType))
                            const operatorOptions = getOperatorOptions(fieldOption?.dataType)
                            return (
                          <select
                            value={condition.operator}
                            onChange={e => updateCondition(condition.id, { operator: e.target.value as Operator })}
                            title="Opérateur de comparaison"
                            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                          >
                            {operatorOptions.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                            )
                          })()}
                        </div>

                        <div className="min-w-0">
                          <Label>Valeur</Label>
                          <Input
                            value={condition.value}
                            onChange={e => updateCondition(condition.id, { value: e.target.value })}
                            placeholder="ex. Metformin"
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="flex items-start lg:items-start gap-2 mt-2 lg:mt-0">
                        <Button type="button" variant="outline" size="sm" onClick={() => removeCondition(condition.id)} className="h-9 w-9 p-0 flex items-center justify-center">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="secondary" size="sm" onClick={addCondition}>
                  <Plus className="h-4 w-4" /> Ajouter une condition
                </Button>
              </section>

              <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Résultats et recommandations</h4>
                    <p className="text-sm text-slate-600">Configurez les scores, alertes, contre-indications et recommandations cliniques.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-muted-foreground)]">
                    <ArrowUpDown className="h-4 w-4" /> Priorité {form.urgency}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label>Urgence globale</Label>
                    <select
                      value={form.urgency}
                      onChange={e => setForm(form => ({ ...form, urgency: e.target.value as SeverityLevel }))}
                      title="Urgence globale"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                    >
                      {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Score de risque</Label>
                    <div className="space-y-3">
                      {form.riskScores.map(score => (
                        <div key={score.id} className="grid gap-3 sm:grid-cols-[1fr_96px_auto]">
                          <Input
                            value={score.name}
                            onChange={e => updateRiskScore(score.id, { name: e.target.value })}
                            placeholder="renal_risk"
                          />
                          <Input
                            value={score.value}
                            onChange={e => updateRiskScore(score.id, { value: e.target.value })}
                            placeholder="20"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={() => removeRiskScore(score.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" size="sm" onClick={addRiskScore}>
                        <Plus className="h-4 w-4" /> Ajouter un score
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Alertes</p>
                        <p className="text-xs text-slate-500">Génère un message clinique et un niveau de gravité.</p>
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={addAlert}>
                        <Plus className="h-4 w-4" /> Ajouter
                      </Button>
                    </div>
                    {form.alerts.map(alert => (
                      <div key={alert.id} className="grid gap-3 lg:grid-cols-[140px_120px_1fr_auto]">
                        <Input
                          value={alert.type}
                          onChange={e => updateAlert(alert.id, { type: e.target.value })}
                          placeholder="type"
                        />
                        <select
                          value={alert.severity}
                          onChange={e => updateAlert(alert.id, { severity: e.target.value as SeverityLevel })}
                          title="Sévérité de l'alerte"
                          className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                        >
                          {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                        <Input
                          value={alert.message}
                          onChange={e => updateAlert(alert.id, { message: e.target.value })}
                          placeholder="Message d'alerte"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => removeAlert(alert.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Contre-indications</p>
                        <p className="text-xs text-slate-500">Liste les médicaments ou classes impactés.</p>
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={addContraindication}>
                        <Plus className="h-4 w-4" /> Ajouter
                      </Button>
                    </div>
                    {form.contraindications.map(ci => (
                      <div key={ci.id} className="grid gap-3 lg:grid-cols-[1fr_1fr_140px_auto]">
                        <Input
                          value={ci.medication}
                          onChange={e => updateContraindication(ci.id, { medication: e.target.value })}
                          placeholder="Médicament"
                        />
                        <Input
                          value={ci.reason}
                          onChange={e => updateContraindication(ci.id, { reason: e.target.value })}
                          placeholder="Raison"
                        />
                        <select
                          value={ci.severity}
                          onChange={e => updateContraindication(ci.id, { severity: e.target.value as SeverityLevel })}
                          title="Sévérité de la contre-indication"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        >
                          {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                        <Button type="button" variant="outline" size="sm" onClick={() => removeContraindication(ci.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Recommandations médicales</p>
                        <p className="text-xs text-slate-500">Liste les actions ou conseils cliniques.</p>
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={addRecommendation}>
                        <Plus className="h-4 w-4" /> Ajouter
                      </Button>
                    </div>
                    {form.recommendations.map((rec, index) => (
                      <div key={`rec_${index}`} className="grid gap-3 lg:grid-cols-[1fr_auto]">
                        <Input
                          value={rec}
                          onChange={e => updateRecommendation(index, e.target.value)}
                          placeholder="Recommandation clinique"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => removeRecommendation(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Avertissements thérapeutiques</p>
                        <p className="text-xs text-slate-500">Messages visibles pour le médecin.</p>
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={addWarning}>
                        <Plus className="h-4 w-4" /> Ajouter
                      </Button>
                    </div>
                    {form.warnings.map((text, index) => (
                      <div key={`warn_${index}`} className="grid gap-3 lg:grid-cols-[1fr_auto]">
                        <Input
                          value={text}
                          onChange={e => updateWarning(index, e.target.value)}
                          placeholder="Avertissement thérapeutique"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => removeWarning(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  {editingId ? 'Modification d’une règle existante.' : 'Nouvelle règle sauvegardée de façon dynamique.'}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour la règle' : 'Créer la règle'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                </div>
              </div>
            </form>
            )}

            {editorTab === 'explainability' && (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <Card className="border-[var(--color-border)] p-4 shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lecture clinique</p>
                      <h4 className="mt-1 text-lg font-semibold text-slate-950">{form.name || 'Règle sans nom'}</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        {form.description || 'Ajoutez une description clinique pour expliquer l’intention de la règle.'}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Conditions</p>
                        <p className="mt-2 text-sm text-slate-700">{summarizeDraftConditions(form)}</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sorties</p>
                        <p className="mt-2 text-sm text-slate-700">{summarizeDraftOutputs(form)}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Lecture rapide</p>
                      <div className="mt-3 grid gap-2 text-sm text-teal-950 sm:grid-cols-2">
                        <div>Combinaison: {form.conditionJoin === 'any' ? 'OU logique' : 'ET logique'}</div>
                        <div>{form.conditions.length} condition(s)</div>
                        <div>{form.alerts.filter(item => item.message.trim()).length} alerte(s)</div>
                        <div>{form.warnings.filter(Boolean).length} avertissement(s)</div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border-[var(--color-border)] p-4 shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Structure canonique</p>
                      <p className="mt-1 text-sm text-slate-600">Aperçu de la règle normalisée qui sera envoyée au moteur.</p>
                    </div>
                    <pre className="max-h-[38rem] overflow-auto rounded-2xl border border-[var(--color-border)] bg-slate-950 p-4 text-xs leading-6 text-slate-100">
{JSON.stringify(buildPayload(), null, 2)}
                    </pre>
                  </div>
                </Card>
              </div>
            )}

            {editorTab === 'simulation' && (
              <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                <Card className="border-[var(--color-border)] p-4 shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Patient de test</p>
                      <p className="mt-1 text-sm text-slate-600">Réglez quelques paramètres cliniques, puis lancez l’évaluation sur le moteur actuel.</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Âge</Label>
                        <Input value={simulationForm.age} onChange={e => setSimulationForm(form => ({ ...form, age: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Poids</Label>
                        <Input value={simulationForm.weight} onChange={e => setSimulationForm(form => ({ ...form, weight: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Genre</Label>
                        <Input value={simulationForm.gender} onChange={e => setSimulationForm(form => ({ ...form, gender: e.target.value }))} />
                      </div>
                      <div>
                        <Label>SpO2</Label>
                        <Input value={simulationForm.spo2} onChange={e => setSimulationForm(form => ({ ...form, spo2: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Potassium</Label>
                        <Input value={simulationForm.potassium} onChange={e => setSimulationForm(form => ({ ...form, potassium: e.target.value }))} />
                      </div>
                      <div>
                        <Label>eGFR</Label>
                        <Input value={simulationForm.eGFR} onChange={e => setSimulationForm(form => ({ ...form, eGFR: e.target.value }))} />
                      </div>
                    </div>

                    <div>
                      <Label>Médicaments</Label>
                      <textarea
                        value={simulationForm.medications}
                        onChange={e => setSimulationForm(form => ({ ...form, medications: e.target.value }))}
                        rows={4}
                        title="Médicaments de simulation"
                        placeholder="Warfarin\nIbuprofen\nMetformin"
                        className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                      />
                    </div>

                    <div>
                      <Label>Conditions</Label>
                      <textarea
                        value={simulationForm.conditions}
                        onChange={e => setSimulationForm(form => ({ ...form, conditions: e.target.value }))}
                        rows={3}
                        title="Conditions de simulation"
                        placeholder="diabetes\nhypertension"
                        className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                      />
                    </div>

                    <div>
                      <Label>Symptômes</Label>
                      <textarea
                        value={simulationForm.symptoms}
                        onChange={e => setSimulationForm(form => ({ ...form, symptoms: e.target.value }))}
                        rows={3}
                        title="Symptômes de simulation"
                        placeholder="dizziness\nshortness_of_breath"
                        className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 h-9 text-sm text-[var(--color-foreground)] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 min-w-0"
                      />
                    </div>

                    <div>
                      <Label>Allergies</Label>
                      <textarea
                        value={simulationForm.allergies}
                        onChange={e => setSimulationForm(form => ({ ...form, allergies: e.target.value }))}
                        rows={2}
                        title="Allergies de simulation"
                        placeholder="penicillin"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    <Button type="button" onClick={runSimulation} disabled={simulationLoading} className="w-full">
                      {simulationLoading ? 'Évaluation...' : 'Lancer la simulation'}
                    </Button>
                  </div>
                </Card>

                <div className="space-y-4">
                  {simulationError && (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-destructive)]/10 px-4 py-3 text-sm text-[var(--color-destructive-foreground)]">
                      {simulationError}
                    </div>
                  )}

                  <Card className="border-slate-200/80 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Résultat</p>
                        <h4 className="mt-1 text-lg font-semibold text-slate-950">Aperçu clinique</h4>
                      </div>
                      {simulationResult?.urgency_level && (
                        <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-muted-foreground)]">
                          {simulationResult.urgency_level}
                        </span>
                      )}
                    </div>

                    {simulationResult ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Score total</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{Number(simulationResult.total_risk_score || 0).toFixed(1)}</p>
                          </div>
                          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Règles déclenchées</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{simulationResult.triggered_rules?.length || 0}</p>
                          </div>
                          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Résumé</p>
                            <p className="mt-2 text-sm text-slate-700">{simulationResult.summary || 'Aucun résumé disponible'}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Répartition du risque</p>
                          <div className="mt-3 space-y-2 text-sm text-slate-700">
                            {simulationResult.risk_scores ? Object.entries(simulationResult.risk_scores).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                                <span className="capitalize">{key}</span>
                                <span className="font-semibold text-slate-950">{Number(value).toFixed(1)}</span>
                              </div>
                            )) : <p className="text-slate-500">Aucun score disponible</p>}
                          </div>
                        </div>

                        {simulationResult.triggered_rules?.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Règles déclenchées</p>
                            {simulationResult.triggered_rules.map((rule: any, index: number) => (
                              <div key={`${rule.rule_name || 'rule'}-${index}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h5 className="font-semibold text-slate-950">{rule.rule_name}</h5>
                                    <p className="mt-1 text-sm text-slate-600">{rule.explanation}</p>
                                  </div>
                                  <span className="rounded-full border border-[var(--color-border)] bg-white px-2 py-1 text-xs font-semibold text-[var(--color-muted-foreground)]">
                                    {rule.priority}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">Aucun test n’a encore été lancé.</p>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
