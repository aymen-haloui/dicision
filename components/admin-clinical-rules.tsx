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

const SEVERITY_BADGE: Record<SeverityLevel, string> = {
  LOW: 'bg-blue-50 border-blue-200 text-blue-700',
  MODERATE: 'bg-amber-50 border-amber-200 text-amber-700',
  HIGH: 'bg-orange-50 border-orange-200 text-orange-700',
  CRITICAL: 'bg-red-50 border-red-200 text-red-700',
}

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  LOW: 'Basse',
  MODERATE: 'Modérée',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
}

const SEVERITY_OPTIONS: SeverityLevel[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL']
const CATEGORY_OPTIONS: string[] = ['Cardio', 'Rénal', 'Hépatique', 'Endocrino', 'Infectio', 'Neuro', 'Autre']
const TRIGGER_TYPES: string[] = ['COMPOSITE', 'MEDICATION_INTERACTION', 'LAB_THRESHOLD', 'CONDITION_MEDICATION', 'EMERGENCY_FLAG']

const FAMILY_ICONS: Record<RuleFamily, any> = {
  PATIENT_RISK: Users,
  DRUG_INTERACTION: Pill,
  CONTRAINDICATION: AlertTriangle,
  TOXICOLOGY: FlaskConical,
  OVERDOSE: Siren,
  EMERGENCY: Siren,
  THERAPEUTIC_WARNING: AlertTriangle,
  DOSING_ADJUSTMENT: Scale,
}

const FAMILY_UI: Record<RuleFamily, { bg: string; accent: string; border: string }> = {
  PATIENT_RISK: { bg: 'bg-blue-50', accent: 'text-blue-600', border: 'border-blue-200' },
  DRUG_INTERACTION: { bg: 'bg-amber-50', accent: 'text-amber-600', border: 'border-amber-200' },
  CONTRAINDICATION: { bg: 'bg-red-50', accent: 'text-red-600', border: 'border-red-200' },
  TOXICOLOGY: { bg: 'bg-purple-50', accent: 'text-purple-600', border: 'border-purple-200' },
  OVERDOSE: { bg: 'bg-red-50', accent: 'text-red-600', border: 'border-red-200' },
  EMERGENCY: { bg: 'bg-red-50', accent: 'text-red-600', border: 'border-red-200' },
  THERAPEUTIC_WARNING: { bg: 'bg-yellow-50', accent: 'text-yellow-600', border: 'border-yellow-200' },
  DOSING_ADJUSTMENT: { bg: 'bg-green-50', accent: 'text-green-600', border: 'border-green-200' },
}

const makeId = () => Math.random().toString(36).slice(2, 11)
const makeDefaultConditionForFamily = (family: RuleFamily): RuleCondition => ({
  id: makeId(),
  conditionType: 'MEDICATION',
  field: 'medication_name',
  operator: '=',
  value: '',
})
const makeDefaultExplanationTemplate = (family: RuleFamily, name: string) => `${name} s'est déclenchée selon le protocole clinique de famille ${RULE_FAMILY_LABELS[family]}.`
const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR')
const buildConditionSummary = (conditions: any) => {
  if (!conditions?.conditions?.length) return 'Aucune condition'
  return `${conditions.conditions.length} condition(s) - Mode: ${conditions.logic}`
}
const buildOutputSummary = (outputs: any) => {
  if (!outputs) return 'Aucune sortie'
  const counts = [outputs.risk_scores, outputs.alerts, outputs.contraindications].filter(Boolean).length
  return `${counts} catégorie(s) de sortie`
}
const parseConditionValue = (field: string, value: string) => value
const parseNumber = (value: string) => parseInt(value, 10) || 0
const getFieldGroupsForFamily = (family: RuleFamily, conditionType: ConditionType): FieldGroup[] => [
  { label: 'Clinique', options: [{ value: 'symptom', label: 'Symptôme', dataType: 'string' }] },
  { label: 'Médicaments', options: [{ value: 'medication', label: 'Médicament', dataType: 'string' }] },
]
const getDefaultField = (conditionType: ConditionType) => 'default_field'
const getFieldOption = (conditionType: ConditionType, field: string): FieldOption | undefined => ({
  value: field,
  label: field,
  dataType: 'string',
})
const getOperatorOptions = (dataType?: FieldDataType) => ['=', '!=', '>', '<'] as Operator[]

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
  const [showEditor, setShowEditor] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClinicalRuleForm>({
    ruleFamily: 'PATIENT_RISK',
    name: '',
    description: '',
    category: '',
    severity: 'MODERATE',
    enabled: true,
    triggerType: '',
    explanationTemplate: '',
    conditionJoin: 'all',
    conditions: [makeDefaultConditionForFamily('PATIENT_RISK')],
    riskScores: [],
    urgency: 'MODERATE',
    alerts: [],
    contraindications: [],
    recommendations: [],
    warnings: [],
  })

  const loadRules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/clinical-rules')
      if (!res.ok) throw new Error('Erreur de chargement')
      const data = await res.json()
      setRules(Array.isArray(data) ? data : data.rules || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  const openEditor = (rule: ClinicalRule | null) => {
    if (rule) {
      setEditingId(rule.id)
      setForm({
        ruleFamily: rule.rule_family || 'PATIENT_RISK',
        name: rule.name,
        description: rule.description || '',
        category: rule.category || '',
        severity: rule.severity,
        enabled: rule.enabled,
        triggerType: rule.trigger_type || '',
        explanationTemplate: rule.explanation_template || '',
        conditionJoin: rule.conditions?.logic === 'OR' ? 'any' : 'all',
        conditions: rule.conditions?.conditions || [makeDefaultConditionForFamily(rule.rule_family || 'PATIENT_RISK')],
        riskScores: Object.entries(rule.outputs?.risk_scores || {}).map(([name, value]) => ({ id: makeId(), name, value: String(value) })),
        urgency: 'MODERATE',
        alerts: rule.outputs?.alerts || [],
        contraindications: rule.outputs?.contraindications || [],
        recommendations: rule.outputs?.recommendations || [],
        warnings: rule.outputs?.therapeutic_warnings?.map((w: any) => w.warning) || [],
      })
    } else {
      setEditingId(null)
      resetForm()
    }
    setShowEditor(true)
  }

  const resetForm = () => {
    setShowEditor(false)
    setEditingId(null)
    setForm({
      ruleFamily: 'PATIENT_RISK',
      name: '',
      description: '',
      category: '',
      severity: 'MODERATE',
      enabled: true,
      triggerType: '',
      explanationTemplate: '',
      conditionJoin: 'all',
      conditions: [makeDefaultConditionForFamily('PATIENT_RISK')],
      riskScores: [],
      urgency: 'MODERATE',
      alerts: [],
      contraindications: [],
      recommendations: [],
      warnings: [],
    })
  }

  const updateCondition = (id: string, data: Partial<RuleCondition>) => {
    setForm(form => ({
      ...form,
      conditions: form.conditions.map(item => item.id === id ? { ...item, ...data } : item),
    }))
  }

  const removeCondition = (id: string) => {
    setForm(form => ({ ...form, conditions: form.conditions.filter(item => item.id !== id) }))
  }

  const addCondition = () => {
    setForm(form => ({
      ...form,
      conditions: [...form.conditions, makeDefaultConditionForFamily(form.ruleFamily)],
    }))
  }

  const addRiskScore = () => {
    setForm(form => ({
      ...form,
      riskScores: [...form.riskScores, { id: makeId(), name: '', value: '' }],
    }))
  }

  const updateRiskScore = (id: string, data: Partial<RiskScoreEntry>) => {
    setForm(form => ({
      ...form,
      riskScores: form.riskScores.map(item => item.id === id ? { ...item, ...data } : item),
    }))
  }

  const removeRiskScore = (id: string) => {
    setForm(form => ({ ...form, riskScores: form.riskScores.filter(item => item.id !== id) }))
  }

  const addAlert = () => {
    setForm(form => ({
      ...form,
      alerts: [...form.alerts, { id: makeId(), type: 'clinical', severity: 'HIGH', message: '' }],
    }))
  }

  const updateAlert = (id: string, data: Partial<AlertEntry>) => {
    setForm(form => ({
      ...form,
      alerts: form.alerts.map(item => item.id === id ? { ...item, ...data } : item),
    }))
  }

  const removeAlert = (id: string) => {
    setForm(form => ({ ...form, alerts: form.alerts.filter(item => item.id !== id) }))
  }

  const addContraindication = () => {
    setForm(form => ({
      ...form,
      contraindications: [...form.contraindications, { id: makeId(), medication: '', reason: '', severity: 'CRITICAL' }],
    }))
  }

  const updateContraindication = (id: string, data: Partial<ContraindicationEntry>) => {
    setForm(form => ({
      ...form,
      contraindications: form.contraindications.map(item => item.id === id ? { ...item, ...data } : item),
    }))
  }

  const removeContraindication = (id: string) => {
    setForm(form => ({
      ...form,
      contraindications: form.contraindications.filter(item => item.id !== id),
    }))
  }

  const addRecommendation = () => {
    setForm(form => ({ ...form, recommendations: [...form.recommendations, ''] }))
  }

  const updateRecommendation = (index: number, value: string) => {
    setForm(form => ({
      ...form,
      recommendations: form.recommendations.map((item, idx) => idx === index ? value : item),
    }))
  }

  const removeRecommendation = (index: number) => {
    setForm(form => ({
      ...form,
      recommendations: form.recommendations.filter((_, idx) => idx !== index),
    }))
  }

  const addWarning = () => {
    setForm(form => ({ ...form, warnings: [...form.warnings, ''] }))
  }

  const updateWarning = (index: number, value: string) => {
    setForm(form => ({
      ...form,
      warnings: form.warnings.map((item, idx) => idx === index ? value : item),
    }))
  }

  const removeWarning = (index: number) => {
    setForm(form => ({ ...form, warnings: form.warnings.filter((_, idx) => idx !== index) }))
  }

  const applyRuleFamily = (family: RuleFamily) => {
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

  const buildPayload = (): any => {
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

  const saveRule = async (event: React.FormEvent) => {
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
        throw new Error(body?.error || 'Erreur lors de l'enregistrement de la règle')
      }
      await loadRules()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  const deleteRule = async (id: string) => {
    if (!confirm('Supprimer cette règle clinique ?')) return
    await fetch(`/api/admin/clinical-rules/${id}`, { method: 'DELETE' })
    await loadRules()
  }

  const toggleEnabled = async (rule: ClinicalRule) => {
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

  const pageSize = 8
  const pageCount = Math.max(1, Math.ceil(filteredRules.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRules = filteredRules.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="space-y-4 md:space-y-6 px-3 md:px-6 lg:px-8">
      {/* Header */}
      <div className="rounded-2xl bg-slate-50 p-4 md:p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5 sm:space-y-2.5 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium text-slate-600">
              <ShieldAlert className="h-3.5 w-3.5" />
              Studio de règles
            </div>
            <div className="space-y-1 sm:space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                Moteur de règles cliniques
              </h2>
              <p className="max-w-4xl text-xs sm:text-sm leading-5 sm:leading-6 text-slate-600">
                Créez, modifiez et activez des règles cliniques dynamiques. L'éditeur garde la logique métier intacte tout en présentant les conditions, les sorties et l'explicabilité.
              </p>
            </div>
          </div>
          <Button type="button" variant="default" onClick={() => openEditor(null)} className="h-8 sm:h-9 shadow-sm gap-2 text-xs sm:text-sm w-full md:w-auto">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nouvelle</span> règle
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Grid: Rules List (LEFT) + Editor (RIGHT) */}
      <div className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-[35%_65%] xl:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        
        {/* LEFT: Rules List */}
        <div className="space-y-3 md:space-y-4 order-2 lg:order-1">
          {/* Search & Filters */}
          <div className="space-y-2 md:space-y-3 rounded-lg bg-white p-3 md:p-4 shadow-sm">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Rechercher..."
                className="h-9 md:h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 md:pl-12 pr-3 md:pr-4 text-xs md:text-sm placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>
            
            {/* Filters Grid */}
            <div className="space-y-2 border-t border-slate-100 pt-2 md:pt-3">
              <div className="grid grid-cols-2 gap-1.5 md:gap-2.5">
                <select
                  value={categoryFilter}
                  onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
                  title="Filtre de catégorie"
                  className="h-7 md:h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Cat.</option>
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={severityFilter}
                  onChange={e => { setSeverityFilter(e.target.value); setPage(1) }}
                  title="Filtre de gravité"
                  className="h-7 md:h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Grav.</option>
                  {SEVERITY_OPTIONS.map(option => (
                    <option key={option} value={option}>{SEVERITY_LABELS[option]?.charAt(0).toUpperCase() || option}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-1.5 md:gap-2.5">
                <select
                  value={familyFilter}
                  onChange={e => { setFamilyFilter(e.target.value); setPage(1) }}
                  title="Filtre de famille"
                  className="h-7 md:h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Fam.</option>
                  {RULE_FAMILY_ORDER.map(option => (
                    <option key={option} value={option}>{RULE_FAMILY_LABELS[option]?.substring(0, 10)}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }}
                  title="Filtre de statut"
                  className="h-7 md:h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="all">Statut</option>
                  <option value="enabled">Act.</option>
                  <option value="disabled">Inact.</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-2">
            {pageRules.length === 0 && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-6 text-center text-xs text-slate-500">
                <p className="font-medium">Aucune règle trouvée</p>
                <p className="mt-1">Affinez vos filtres ou créez une nouvelle règle</p>
              </div>
            )}

            {pageRules.map(rule => (
              <button
                key={rule.id}
                onClick={() => openEditor(rule)}
                className={`w-full text-left rounded-lg border p-3.5 transition-all duration-150 ${
                  editingId === rule.id
                    ? 'border-teal-500 bg-teal-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm hover:bg-slate-50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-2 justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{rule.name}</p>
                      {rule.description && <p className="mt-1 text-xs text-slate-500 line-clamp-1">{rule.description}</p>}
                    </div>
                    <span className={`inline-flex flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${SEVERITY_BADGE[rule.severity]}`}>
                      {rule.severity}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-sm border text-[10px] font-medium px-1.5 py-0.5 ${FAMILY_UI[inferRuleFamily(rule)].bg} ${FAMILY_UI[inferRuleFamily(rule)].accent} ${FAMILY_UI[inferRuleFamily(rule)].border}`}>
                      {RULE_FAMILY_LABELS[inferRuleFamily(rule)]}
                    </span>
                    {rule.enabled && (
                      <span className="rounded-sm bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-medium px-1.5 py-0.5">
                        Activée
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>Page {safePage} sur {pageCount}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >←</button>
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => setPage(page + 1)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >→</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Rule Editor */}
        {showEditor && (
          <div className="space-y-3 md:space-y-4 bg-white rounded-lg p-3 md:p-6 shadow-sm lg:sticky lg:top-6 order-1 lg:order-2">
            <div className="flex items-start justify-between gap-2 md:gap-4 border-b border-slate-200 pb-3 md:pb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-base font-semibold text-slate-900">{editingId ? 'Modifier' : 'Nouvelle'} règle</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5 md:mt-1">Conditions et résultats</p>
              </div>
              <button type="button" onClick={resetForm} title="Fermer" className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                <X className="h-4 md:h-5 w-4 md:w-5" />
              </button>
            </div>

            <form onSubmit={saveRule} className="space-y-3 md:space-y-6 max-h-[calc(100vh-200px)] md:max-h-none overflow-y-auto md:overflow-visible pb-20 md:pb-0">
              {/* Section: Informations générales */}
              <details open className="group rounded-lg bg-slate-50 p-4 border border-slate-200">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900">
                  <span className="text-sm">Informations générales</span>
                  <span className="text-xs text-slate-500">{RULE_FAMILY_LABELS[form.ruleFamily]}</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="rule-name" className="text-xs md:text-sm font-medium">Nom de la règle</Label>
                    <Input
                      id="rule-name"
                      value={form.name}
                      onChange={e => setForm(form => ({ ...form, name: e.target.value }))}
                      placeholder="ex: Interaction Métformine-Alcool"
                      required
                      className="mt-1 md:mt-1.5 h-8 md:h-9 text-xs md:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                    <div>
                      <Label htmlFor="rule-category" className="text-xs md:text-sm font-medium">Catégorie</Label>
                      <select
                        id="rule-category"
                        value={form.category}
                        onChange={e => setForm(form => ({ ...form, category: e.target.value }))}
                        className="mt-1 md:mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 md:px-3 h-8 md:h-9 text-xs md:text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="">Sélectionner...</option>
                        {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="rule-severity" className="text-xs md:text-sm font-medium">Gravité</Label>
                      <select
                        id="rule-severity"
                        value={form.severity}
                        onChange={e => setForm(form => ({ ...form, severity: e.target.value as SeverityLevel }))}
                        className="mt-1 md:mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 md:px-3 h-8 md:h-9 text-xs md:text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      >
                        {SEVERITY_OPTIONS.map(option => <option key={option} value={option}>{SEVERITY_LABELS[option]}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rule-description" className="text-xs md:text-sm font-medium">Description</Label>
                    <textarea
                      id="rule-description"
                      value={form.description}
                      onChange={e => setForm(form => ({ ...form, description: e.target.value }))}
                      rows={2}
                      placeholder="Décrivez le contexte clinique..."
                      className="mt-1 md:mt-1.5 min-h-[60px] md:min-h-[84px] w-full rounded-lg border border-slate-200 bg-white px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
              </details>

              {/* Section: Conditions */}
              <details open className="group rounded-lg bg-slate-50 p-3 md:p-4 border border-slate-200">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900 text-xs md:text-sm">
                  <span>Conditions</span>
                  <span className="text-xs text-slate-500">{form.conditions.length} condition(s)</span>
                </summary>
                <div className="mt-3 md:mt-4 space-y-2 md:space-y-4">
                  {form.conditions.map((condition) => (
                    <div key={condition.id} className="flex gap-1.5 md:gap-2 items-end flex-col md:flex-row">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1.5 md:gap-2 w-full">
                        <Input
                          value={condition.conditionType}
                          onChange={e => updateCondition(condition.id, { conditionType: e.target.value as ConditionType })}
                          placeholder="Type"
                          className="h-7 md:h-8 text-xs"
                        />
                        <Input
                          value={condition.field}
                          onChange={e => updateCondition(condition.id, { field: e.target.value })}
                          placeholder="Champ"
                          className="h-7 md:h-8 text-xs"
                        />
                        <Input
                          value={condition.value}
                          onChange={e => updateCondition(condition.id, { value: e.target.value })}
                          placeholder="Valeur"
                          className="h-7 md:h-8 text-xs"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(condition.id)}
                        className="h-7 md:h-8 w-7 md:w-8 p-0 flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCondition}
                    className="w-full h-7 md:h-8 text-xs md:text-sm"
                  >
                    <Plus className="h-3.5 md:h-4 w-3.5 md:w-4" /> Ajouter
                  </Button>
                </div>
              </details>

              {/* Section: Résultats */}
              <details open className="group rounded-lg bg-slate-50 p-3 md:p-4 border border-slate-200">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900 text-xs md:text-sm">
                  <span>Résultats</span>
                  <span className="text-xs text-slate-500">{form.alerts.length + form.recommendations.length} élément(s)</span>
                </summary>
                <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                  <div>
                    <Label className="text-xs md:text-sm font-medium mb-1.5 md:mb-2 block">Alertes</Label>
                    {form.alerts.map((alert) => (
                      <div key={alert.id} className="flex gap-1.5 md:gap-2 items-end mb-1.5 md:mb-2 flex-col sm:flex-row">
                        <Input
                          value={alert.message}
                          onChange={e => updateAlert(alert.id, { message: e.target.value })}
                          placeholder="Message d'alerte"
                          className="flex-1 h-7 md:h-8 text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAlert(alert.id)}
                          className="h-7 md:h-8 w-7 md:w-8 p-0 flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAlert}
                      className="w-full h-7 md:h-8 text-xs md:text-sm"
                    >
                      <Plus className="h-3.5 md:h-4 w-3.5 md:w-4" /> Ajouter
                    </Button>
                  </div>
                </div>
              </details>

              {/* Section: Métadonnées */}
              <details open className="group rounded-lg bg-slate-50 p-3 md:p-4 border border-slate-200">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900 text-xs md:text-sm">
                  <span>Métadonnées</span>
                </summary>
                <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                    <div>
                      <Label htmlFor="rule-status" className="text-xs md:text-sm font-medium">Statut</Label>
                      <select
                        id="rule-status"
                        value={form.enabled ? 'enabled' : 'disabled'}
                        onChange={e => setForm(form => ({ ...form, enabled: e.target.value === 'enabled' }))}
                        className="mt-1 md:mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 md:px-3 h-8 md:h-9 text-xs md:text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="enabled">Activée</option>
                        <option value="disabled">Désactivée</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="rule-trigger" className="text-sm font-medium">Déclencheur</Label>
                      <select
                        id="rule-trigger"
                        value={form.triggerType}
                        onChange={e => setForm(form => ({ ...form, triggerType: e.target.value }))}
                        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      >
                        {TRIGGER_TYPES.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </details>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-1.5 md:gap-2 pt-3 md:pt-4 border-t border-slate-200 sticky bottom-0 bg-white py-2.5 md:py-3 -mx-3 md:-mx-6 px-3 md:px-6 md:static md:bg-transparent md:py-0 md:mx-0 md:px-0">
                <Button type="submit" disabled={saving} className="flex-1 h-8 md:h-9 text-xs md:text-sm">
                  {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 sm:flex-none h-8 md:h-9 text-xs md:text-sm px-3 md:px-4">
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
