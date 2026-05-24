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
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  MODERATE: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
    contraindications: [{ id: makeId(), medication: 'Metformin', reason: 'Insuffisance renale grave' }],
    recommendations: ['Arreter Metformin'],
    warnings: ['Surveiller creatinine et fonction renale'],
    warnings: [],
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
  if (!conditions || !Array.isArray(conditions.items)) return 'Aucune condition defini'
  return conditions.items
    .map((item: any) => `${item.condition_type} ${item.field} ${item.operator} ${item.value}`)
    .join(` ${conditions.logic === 'any' ? 'OU' : 'ET'} `)
}

function buildOutputSummary(outputs: any): string {
  if (!outputs) return 'Aucun output defini'
  const parts: string[] = []
  if (outputs.risk_scores?.length) {
    parts.push(outputs.risk_scores.map((r: any) => `${r.name} +${r.value}`).join(', '))
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
  if (outputs.warnings?.length) {
    parts.push(`${outputs.warnings.length} avertissement(s)`)
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
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<ClinicalRuleForm>(makeEmptyRuleForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)

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

    const conditions = rule.conditions ?? { logic: 'all', items: [] }
    const outputs = rule.outputs ?? {}

    setForm({
      name: rule.name ?? '',
      description: rule.description ?? '',
      category: rule.category ?? 'INTERACTION',
      severity: rule.severity ?? 'HIGH',
      enabled: rule.enabled ?? true,
      triggerType: rule.trigger_type ?? 'COMPOSITE',
      conditionJoin: conditions.logic === 'any' ? 'any' : 'all',
      conditions: Array.isArray(conditions.items) && conditions.items.length > 0
        ? conditions.items.map((item: any) => ({
          id: makeId(),
          conditionType: item.condition_type || 'CONDITION',
          field: item.field || '',
          operator: item.operator || '=',
          value: item.value != null ? String(item.value) : '',
        }))
        : [{ id: makeId(), conditionType: 'LAB_RESULT', field: 'creatinine', operator: '>', value: '2' }],
      riskScores: Array.isArray(outputs.risk_scores) && outputs.risk_scores.length > 0
        ? outputs.risk_scores.map((item: any) => ({ id: makeId(), name: item.name || '', value: String(item.value ?? '') }))
        : [{ id: makeId(), name: 'renal_risk', value: '20' }],
      urgency: outputs.urgency ?? 'HIGH',
      alerts: Array.isArray(outputs.alerts) && outputs.alerts.length > 0
        ? outputs.alerts.map((item: any) => ({
          id: makeId(),
          type: item.type || 'clinical',
          severity: item.severity ?? 'CRITICAL',
          message: item.message || '',
        }))
        : [{ id: makeId(), type: 'clinical', severity: 'CRITICAL', message: 'Verifier la fonction renale' }],
      contraindications: Array.isArray(outputs.contraindications) && outputs.contraindications.length > 0
        ? outputs.contraindications.map((item: any) => ({
          id: makeId(),
          medication: item.medication || '',
          reason: item.reason || '',
        }))
        : [{ id: makeId(), medication: 'Metformin', reason: 'Insuffisance renale grave' }],
      recommendations: Array.isArray(outputs.recommendations) ? outputs.recommendations.slice() : ['Arreter Metformin'],
      warnings: Array.isArray(outputs.warnings) ? outputs.warnings.slice() : ['Surveiller creatinine et fonction renale'],
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
      conditions: [...form.conditions, { id: makeId(), conditionType: 'CONDITION', field: '', operator: '=', value: '' }],
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
      contraindications: [...form.contraindications, { id: makeId(), medication: '', reason: '' }],
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
        logic: form.conditionJoin,
        items: form.conditions.map(item => ({
          condition_type: item.conditionType,
          field: item.field,
          operator: item.operator,
          value: parseNumber(item.value),
        })),
      },
      outputs: {
        risk_scores: form.riskScores
          .filter(row => row.name.trim())
          .map(row => ({ name: row.name.trim(), value: parseNumber(row.value) })),
        urgency: form.urgency,
        alerts: form.alerts.filter(a => a.message.trim()).map(a => ({
          type: a.type.trim() || 'clinical',
          severity: a.severity,
          message: a.message.trim(),
        })),
        contraindications: form.contraindications.filter(c => c.medication.trim() || c.reason.trim()),
        recommendations: form.recommendations.filter(Boolean),
        warnings: form.warnings.filter(Boolean),
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-teal-600" />
            Moteur de règles cliniques
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl">
            Créez, modifiez et activez des règles cliniques dynamiques sans JSON brut. Cette interface pilote le moteur centralisé de décision.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => openEditor(null)}>
            <Plus className="h-4 w-4" /> Nouvelle règle
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Recherche par nom, catégorie, type..."
                  className="pl-10"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  value={categoryFilter}
                  onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Toutes catégories</option>
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={severityFilter}
                  onChange={e => { setSeverityFilter(e.target.value); setPage(1) }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Toutes gravités</option>
                  {SEVERITY_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
              <Card className="p-10 text-center text-sm text-slate-500">
                Aucun résultat trouvé. Ajustez le filtre ou créez une nouvelle règle.
              </Card>
            )}

            {pageRules.map(rule => (
              <Card key={rule.id} className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold text-slate-900">{rule.name}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_BADGE[rule.severity]}`}>
                        {rule.severity}
                      </span>
                      {rule.category && (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {rule.category}
                        </span>
                      )}
                      {rule.trigger_type && (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {rule.trigger_type}
                        </span>
                      )}
                    </div>
                    {rule.description && <p className="text-sm text-slate-600">{rule.description}</p>}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span className="font-semibold">Conditions:</span> {buildConditionSummary(rule.conditions)}
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span className="font-semibold">Outputs:</span> {buildOutputSummary(rule.outputs)}
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
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
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
          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{editingId ? 'Modifier la règle' : 'Nouvelle règle'}</h3>
                <p className="text-sm text-slate-500">Construisez les conditions et les résultats sans toucher au JSON.</p>
              </div>
              <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="all">ET</option>
                      <option value="any">OU</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {form.conditions.map((condition, index) => (
                    <div key={condition.id} className="grid gap-3 md:grid-cols-[220px_180px_160px_1fr_auto] items-end">
                      <div>
                        <Label>Type</Label>
                        <select
                          value={condition.conditionType}
                          onChange={e => updateCondition(condition.id, { conditionType: e.target.value as ConditionType })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        >
                          {CONDITION_TYPES.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Champ ciblé</Label>
                        <Input
                          value={condition.field}
                          onChange={e => updateCondition(condition.id, { field: e.target.value })}
                          placeholder="ex. creatinine"
                        />
                      </div>
                      <div>
                        <Label>Opérateur</Label>
                        <select
                          value={condition.operator}
                          onChange={e => updateCondition(condition.id, { operator: e.target.value as Operator })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        >
                          {OPERATORS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Valeur</Label>
                        <Input
                          value={condition.value}
                          onChange={e => updateCondition(condition.id, { value: e.target.value })}
                          placeholder="ex. Metformin"
                        />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeCondition(condition.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="secondary" size="sm" onClick={addCondition}>
                  <Plus className="h-4 w-4" /> Ajouter une condition
                </Button>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Résultats et recommandations</h4>
                    <p className="text-sm text-slate-600">Configurez les scores, alertes, contre-indications et recommandations cliniques.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    <ArrowUpDown className="h-4 w-4" /> Priorité {form.urgency}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label>Urgence globale</Label>
                    <select
                      value={form.urgency}
                      onChange={e => setForm(form => ({ ...form, urgency: e.target.value as SeverityLevel }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
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
                      <div key={ci.id} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
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
          </Card>
        )}
      </div>
    </div>
  )
}
