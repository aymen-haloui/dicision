'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import AdminClinicalRules from '@/components/admin-clinical-rules'
import {
  Pill, Zap, Plus, Trash2, Search, AlertTriangle,
  ChevronDown, ChevronUp, FlaskConical, ShieldAlert, X,
} from 'lucide-react'

interface Medication {
  id: string
  name: string
  generic_name: string
  category: string
  dosage_form: string
  default_dosage: string
  warnings: string
  max_daily_dose_adult: number | null
  max_daily_dose_child: number | null
  contraindications: { condition: string; severity: string }[]
  toxicity_thresholds: Record<string, any>
  overdose_management: string
  pharmacological_data: Record<string, any>
}

interface Interaction {
  id: string
  drug1: string
  drug2: string
  interaction_type: string
  severity: string
  description: string
  recommendation: string
  medication_id_1: string
  medication_id_2: string
}

interface ClinicalRule {
  id: string
  name: string
  description: string | null
  severity: string
  condition: any
  finding: {
    type: string
    description: string
    recommendation: string
  }
  recommendation: {
    title: string
    description: string
    priority: string
    action: string
  }
  score: number | null
  is_active: boolean
}

const SEV_PILL: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  severe:   'bg-orange-100 text-orange-700 border border-orange-200',
  moderate: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  mild:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
}
const SEV_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  severe:   'bg-orange-500',
  moderate: 'bg-yellow-500',
  mild:     'bg-emerald-500',
}
const SEV_LABEL: Record<string, string> = {
  critical: 'Critique',
  severe: 'Severe',
  moderate: 'Moderee',
  mild: 'Faible',
}
const CATEGORY_COLORS: Record<string, string> = {
  nsaid:        'bg-blue-100 text-blue-700',
  antibiotic:   'bg-violet-100 text-violet-700',
  antidiabetic: 'bg-teal-100 text-teal-700',
  anticoagulant:'bg-amber-100 text-amber-700',
  statin:       'bg-indigo-100 text-indigo-700',
  analgesic:    'bg-sky-100 text-sky-700',
}

const MEDICATION_CATEGORIES = [
  { value: 'nsaid', label: 'AINS' },
  { value: 'antibiotic', label: 'Antibiotique' },
  { value: 'antidiabetic', label: 'Antidiabétique' },
  { value: 'ace_inhibitor', label: 'IEC' },
  { value: 'anticoagulant', label: 'Anticoagulant' },
  { value: 'analgesic', label: 'Antalgique' },
  { value: 'statin', label: 'Statine' },
]

function emptyMedicationForm() {
  return {
    name: '', genericName: '', category: '', dosageForm: '', defaultDosage: '',
    mechanism: '', routes: '', actionSpeed: '', actionDuration: '',
    indications: '', contraindicationsCritical: '', contraindicationsModerate: '',
    warnings: '', maxDailyDoseAdult: '', maxDailyDoseChild: '', pediatricToxicDose: '',
    pediatricSevereDose: '', adultToxicDose: '', overdoseSymptomsMild: '',
    overdoseSymptomsModerate: '', overdoseSymptomsSevere: '', overdoseManagement: '',
    dosingAdults: '', dosingChildren: '', renalAdjustment: '', adverseEffects: '',
  }
}

function parseLines(value: string) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function parseStructuredLines(value: string, keys: string[]) {
  return parseLines(value).map(line => {
    const parts = line.split('|').map(part => part.trim())
    return keys.reduce<Record<string, string>>((item, key, index) => {
      item[key] = parts[index] || ''
      return item
    }, {})
  })
}

function numberOrNull(value: string) {
  if (!value) return null
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function AdminRulesPage() {
  const [tab, setTab] = useState<'medications' | 'interactions' | 'clinical_rules'>('medications')
  const [medications, setMedications] = useState<Medication[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [rules, setRules] = useState<ClinicalRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMed, setShowAddMed] = useState(false)
  const [showAddInt, setShowAddInt] = useState(false)
  const [showAddRule, setShowAddRule] = useState(false)
  const [medStep, setMedStep] = useState(0)
  const [expandedMed, setExpandedMed] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [medSearch, setMedSearch] = useState('')
  const [intSearch, setIntSearch] = useState('')
  const [ruleSearch, setRuleSearch] = useState('')

  const [newMed, setNewMed] = useState(emptyMedicationForm())
  const [newInt, setNewInt] = useState({
    medicationId1: '', medicationId2: '', interactionType: '',
    severity: 'moderate', description: '', recommendation: '',
  })
  const [newRule, setNewRule] = useState({
    name: '', description: '', severity: 'high',
    active: true,
    conditionJson: '{\n  "all": [\n    { "fact": "patient.age", "operator": "lt", "value": 6 }\n  ]\n}',
    findingType: 'clinical_rule',
    findingDescription: '',
    findingRecommendation: '',
    recommendationTitle: '',
    recommendationDescription: '',
    recommendationAction: '',
    recommendationPriority: 'high',
    score: '25',
  })
  const [editingMedId, setEditingMedId] = useState<string | null>(null)
  const [editingIntId, setEditingIntId] = useState<string | null>(null)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [medsRes, intsRes, rulesRes] = await Promise.all([
      fetch('/api/admin/medications'),
      fetch('/api/admin/interactions'),
      fetch('/api/admin/clinical-rules'),
    ])
    if (medsRes.ok) setMedications(await medsRes.json())
    if (intsRes.ok) setInteractions(await intsRes.json())
    if (rulesRes.ok) setRules(await rulesRes.json())
    setLoading(false)
  }

  function resetMedicationForm() {
    setNewMed(emptyMedicationForm())
    setEditingMedId(null)
    setShowAddMed(false)
    setMedStep(0)
  }

  function populateMedicationForm(med: Medication) {
    const pharmacologicalData = med.pharmacological_data || {}
    setNewMed({
      name: med.name || '',
      genericName: med.generic_name || '',
      category: med.category || '',
      dosageForm: Array.isArray(pharmacologicalData.available_forms) ? pharmacologicalData.available_forms.join('\n') : med.dosage_form || '',
      defaultDosage: med.default_dosage || '',
      mechanism: pharmacologicalData.mechanism || '',
      routes: Array.isArray(pharmacologicalData.administration_routes) ? pharmacologicalData.administration_routes.join('\n') : '',
      actionSpeed: pharmacologicalData.action_speed || '',
      actionDuration: pharmacologicalData.action_duration || '',
      indications: Array.isArray(pharmacologicalData.common_indications) ? pharmacologicalData.common_indications.join('\n') : '',
      contraindicationsCritical: Array.isArray(med.contraindications) ? med.contraindications.filter(c => c.severity === 'critical').map(c => c.condition).join('\n') : '',
      contraindicationsModerate: Array.isArray(med.contraindications) ? med.contraindications.filter(c => c.severity !== 'critical').map(c => c.condition).join('\n') : '',
      warnings: med.warnings || '',
      maxDailyDoseAdult: med.max_daily_dose_adult != null ? String(med.max_daily_dose_adult) : '',
      maxDailyDoseChild: med.max_daily_dose_child != null ? String(med.max_daily_dose_child) : '',
      pediatricToxicDose: pharmacologicalData.child_toxic_dose_per_kg != null ? String(pharmacologicalData.child_toxic_dose_per_kg) : '',
      pediatricSevereDose: pharmacologicalData.child_severe_dose_per_kg != null ? String(pharmacologicalData.child_severe_dose_per_kg) : '',
      adultToxicDose: pharmacologicalData.adult_toxic_dose != null ? String(pharmacologicalData.adult_toxic_dose) : '',
      overdoseSymptomsMild: Array.isArray(pharmacologicalData.overdose?.symptoms?.mild) ? pharmacologicalData.overdose.symptoms.mild.join('\n') : '',
      overdoseSymptomsModerate: Array.isArray(pharmacologicalData.overdose?.symptoms?.moderate) ? pharmacologicalData.overdose.symptoms.moderate.join('\n') : '',
      overdoseSymptomsSevere: Array.isArray(pharmacologicalData.overdose?.symptoms?.severe) ? pharmacologicalData.overdose.symptoms.severe.join('\n') : '',
      overdoseManagement: med.overdose_management || '',
      dosingAdults: Array.isArray(pharmacologicalData.dosing?.adults) ? pharmacologicalData.dosing.adults.join('\n') : '',
      dosingChildren: Array.isArray(pharmacologicalData.dosing?.children) ? pharmacologicalData.dosing.children.join('\n') : '',
      renalAdjustment: Array.isArray(pharmacologicalData.dosing?.renal_adjustment) ? pharmacologicalData.dosing.renal_adjustment.join('\n') : '',
      adverseEffects: Array.isArray(pharmacologicalData.adverse_effects)
        ? pharmacologicalData.adverse_effects.map((item: any) =>
            typeof item === 'string'
              ? item
              : `${item.system || ''} | ${item.effect || ''} | ${item.frequency || ''} | ${item.severity || ''} | ${item.action || ''}`
          ).join('\n')
        : '',
    })
  }

  async function handleAddMedication(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const contraindications = [
      ...parseLines(newMed.contraindicationsCritical).map(condition => ({ condition, severity: 'critical' })),
      ...parseLines(newMed.contraindicationsModerate).map(condition => ({ condition, severity: 'moderate' })),
    ]
    const pharmacologicalData = {
      substance_name: newMed.name,
      mechanism: newMed.mechanism,
      available_forms: parseLines(newMed.dosageForm),
      administration_routes: parseLines(newMed.routes),
      action_speed: newMed.actionSpeed,
      action_duration: newMed.actionDuration,
      common_indications: parseLines(newMed.indications),
      dosing: {
        adults: parseLines(newMed.dosingAdults),
        children: parseLines(newMed.dosingChildren),
        renal_adjustment: parseLines(newMed.renalAdjustment),
      },
      adverse_effects: parseStructuredLines(newMed.adverseEffects, ['system', 'effect', 'frequency', 'severity', 'action']),
      overdose: {
        symptoms: {
          mild: parseLines(newMed.overdoseSymptomsMild),
          moderate: parseLines(newMed.overdoseSymptomsModerate),
          severe: parseLines(newMed.overdoseSymptomsSevere),
        },
      },
    }
    const toxicityThresholds = {
      adult_max_daily_dose_mg: numberOrNull(newMed.maxDailyDoseAdult),
      child_max_daily_dose_mg_per_day: numberOrNull(newMed.maxDailyDoseChild),
      child_toxic_dose_per_kg: numberOrNull(newMed.pediatricToxicDose),
      child_severe_dose_per_kg: numberOrNull(newMed.pediatricSevereDose),
      adult_toxic_dose: numberOrNull(newMed.adultToxicDose),
    }

    const url = editingMedId ? `/api/admin/medications/${editingMedId}` : '/api/admin/medications'
    const method = editingMedId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newMed.name, genericName: newMed.genericName,
        category: newMed.category, dosageForm: newMed.dosageForm,
        defaultDosage: newMed.defaultDosage, warnings: newMed.warnings,
        maxDailyDoseAdult: numberOrNull(newMed.maxDailyDoseAdult),
        maxDailyDoseChild: numberOrNull(newMed.maxDailyDoseChild),
        overdoseManagement: newMed.overdoseManagement,
        contraindications,
        toxicityThresholds,
        pharmacologicalData,
      }),
    })
    if (res.ok) {
      resetMedicationForm()
      await loadData()
    } else {
      setError((await res.json()).error || (editingMedId ? 'Echec de la mise a jour du medicament' : 'Echec de l\'ajout du medicament'))
    }
    setSaving(false)
  }

  function openEditMedication(med: Medication) {
    setEditingMedId(med.id)
    populateMedicationForm(med)
    setShowAddMed(true)
    setMedStep(0)
    setError('')
    setShowAddInt(false)
  }

  function resetInteractionForm() {
    setNewInt({ medicationId1: '', medicationId2: '', interactionType: '', severity: 'moderate', description: '', recommendation: '' })
    setEditingIntId(null)
    setShowAddInt(false)
  }

  function resetRuleForm() {
    setNewRule({
      name: '', description: '', severity: 'high',
      active: true,
      conditionJson: '{\n  "all": [\n    { "fact": "patient.age", "operator": "lt", "value": 6 }\n  ]\n}',
      findingType: 'clinical_rule',
      findingDescription: '',
      findingRecommendation: '',
      recommendationTitle: '',
      recommendationDescription: '',
      recommendationAction: '',
      recommendationPriority: 'high',
      score: '25',
    })
    setEditingRuleId(null)
    setShowAddRule(false)
  }

  function openEditInteraction(int: Interaction) {
    setEditingIntId(int.id)
    setNewInt({
      medicationId1: int.medication_id_1,
      medicationId2: int.medication_id_2,
      interactionType: int.interaction_type || '',
      severity: int.severity || 'moderate',
      description: int.description || '',
      recommendation: int.recommendation || '',
    })
    setShowAddInt(true)
    setError('')
    setShowAddMed(false)
  }

  function openEditRule(rule: ClinicalRule) {
    setEditingRuleId(rule.id)
    setNewRule({
      name: rule.name,
      description: rule.description || '',
      severity: rule.severity || 'high',
      active: rule.is_active,
      conditionJson: JSON.stringify(rule.condition ?? { all: [] }, null, 2),
      findingType: rule.finding?.type || 'clinical_rule',
      findingDescription: rule.finding?.description || '',
      findingRecommendation: rule.finding?.recommendation || '',
      recommendationTitle: rule.recommendation?.title || '',
      recommendationDescription: rule.recommendation?.description || '',
      recommendationAction: rule.recommendation?.action || '',
      recommendationPriority: rule.recommendation?.priority || 'high',
      score: rule.score != null ? String(rule.score) : '25',
    })
    setShowAddRule(true)
    setError('')
    setShowAddMed(false)
    setShowAddInt(false)
  }

  async function handleAddInteraction(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const url = editingIntId ? `/api/admin/interactions/${editingIntId}` : '/api/admin/interactions'
    const method = editingIntId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInt),
    })
    if (res.ok) {
      resetInteractionForm()
      await loadData()
    } else { setError((await res.json()).error || 'Echec de l\'ajout de la regle') }
    setSaving(false)
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')

    let condition
    try {
      condition = JSON.parse(newRule.conditionJson)
    } catch (err) {
      setError('Le format JSON de la condition est invalide.')
      setSaving(false)
      return
    }

    const payload = {
      name: newRule.name,
      description: newRule.description,
      severity: newRule.severity,
      is_active: newRule.active,
      condition,
      finding: {
        type: newRule.findingType,
        description: newRule.findingDescription,
        recommendation: newRule.findingRecommendation,
      },
      recommendation: {
        title: newRule.recommendationTitle,
        description: newRule.recommendationDescription,
        priority: newRule.recommendationPriority,
        action: newRule.recommendationAction,
      },
      score: numberOrNull(newRule.score),
    }

    const url = editingRuleId ? `/api/admin/clinical-rules/${editingRuleId}` : '/api/admin/clinical-rules'
    const method = editingRuleId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      resetRuleForm()
      await loadData()
    } else {
      const body = await res.json()
      setError(body.error || 'Echec de la sauvegarde de la regle clinique')
    }

    setSaving(false)
  }

  async function handleDeleteMedication(id: string) {
    if (!confirm('Supprimer ce medicament ? Toutes les regles d\'interaction et les donnees de cas associees seront egalement supprimees.')) return
    await fetch(`/api/admin/medications/${id}`, { method: 'DELETE' })
    await loadData()
  }

  async function handleDeleteInteraction(id: string) {
    if (!confirm('Supprimer cette regle d\'interaction ?')) return
    await fetch('/api/admin/interactions', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadData()
  }

  async function handleDeleteRule(id: string) {
    if (!confirm('Supprimer cette regle clinique ?')) return
    await fetch(`/api/admin/clinical-rules/${id}`, { method: 'DELETE' })
    await loadData()
  }

  const filteredMeds = useMemo(() =>
    medications.filter(m =>
      !medSearch || m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.category?.toLowerCase().includes(medSearch.toLowerCase())
    ), [medications, medSearch])

  const filteredInts = useMemo(() =>
    interactions.filter(i =>
      !intSearch || i.drug1.toLowerCase().includes(intSearch.toLowerCase()) ||
      i.drug2.toLowerCase().includes(intSearch.toLowerCase()) ||
      i.severity.toLowerCase().includes(intSearch.toLowerCase())
    ), [interactions, intSearch])

  const filteredRules = useMemo(() =>
    rules.filter(rule =>
      !ruleSearch ||
      rule.name.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      (rule.description || '').toLowerCase().includes(ruleSearch.toLowerCase()) ||
      rule.severity.toLowerCase().includes(ruleSearch.toLowerCase())
    ), [rules, ruleSearch])

  const criticalCount = interactions.filter(i => i.severity === 'critical').length
  const severeCount = interactions.filter(i => i.severity === 'severe').length
  const activeRulesCount = rules.filter(rule => rule.is_active).length
  const accentTextCls = 'text-[#2CB1BC]'
  const accentButtonCls = 'bg-[#2CB1BC] hover:bg-[#239AA3] text-white'
  const accentPanelCls = 'border-teal-200 bg-teal-50'
  const accentNoteCls = 'text-[#2CB1BC] bg-[#eef1ff] border border-[#cdd4ff]'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#2CB1BC] rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Chargement de la base des regles cliniques...</p>
      </div>
    )
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2CB1BC]/30 focus:border-[#2CB1BC] transition"
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1"

  return (
    <div className="space-y-6">

      {/* â”€â”€ PAGE HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className={`h-6 w-6 ${accentTextCls}`} />
            Moteur de regles cliniques
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Gere les medicaments, les contre-indications et les regles d\'interaction qui alimentent le moteur de decision.
          </p>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              {criticalCount} critique{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {severeCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              {severeCount} severe{severeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Doctors quick view */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Medicaments', value: medications.length, icon: <Pill className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Regles d\'interaction', value: interactions.length, icon: <Zap className="h-5 w-5" />, color: 'text-violet-600 bg-violet-50' },
          { label: 'Regles cliniques actives', value: activeRulesCount, icon: <ShieldAlert className="h-5 w-5" />, color: 'text-teal-600 bg-teal-50' },
          { label: 'Contre-indications', value: medications.reduce((n, m) => n + (m.contraindications?.length || 0), 0), icon: <FlaskConical className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <button type="button" aria-label="Fermer l'erreur" title="Fermer l'erreur" onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* â”€â”€ TABS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['medications', 'interactions', 'clinical_rules'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'medications' && <span className="flex items-center gap-2"><Pill className="h-4 w-4" />Medicaments ({medications.length})</span>}
            {t === 'interactions' && <span className="flex items-center gap-2"><Zap className="h-4 w-4" />Interactions ({interactions.length})</span>}
            {t === 'clinical_rules' && <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Regles ({rules.length})</span>}
          </button>
        ))}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MEDICATIONS TAB
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === 'medications' && (
        <div className="space-y-4">

          {/* toolbar */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={medSearch}
                onChange={e => setMedSearch(e.target.value)}
                placeholder="Rechercher par nom ou categorie..."
                className="pl-9 h-9"
              />
            </div>
            <Button
              onClick={() => { setShowAddMed(!showAddMed); setError('') }}
              className={`${accentButtonCls} h-9 gap-2`}
            >
              <Plus className="h-4 w-4" />
              Ajouter un medicament
            </Button>
          </div>

          {/* add form */}
          {showAddMed && (
            <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-6 backdrop-blur-sm sm:px-6 lg:px-8">
              <Card className={`mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 p-6 shadow-2xl ${accentPanelCls}`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Plus className={`h-4 w-4 ${accentTextCls}`} /> Nouveau medicament
                </h3>
                <button type="button" aria-label="Fermer le formulaire d'ajout de medicament" title="Fermer le formulaire d'ajout de medicament" onClick={resetMedicationForm} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleAddMedication} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Profil pharmacologique</p>
                </div>
                <div>
                  <label className={labelCls}>Nom *</label>
                  <input className={inputCls} value={newMed.name} onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))} placeholder="ex. Ibuprofene" required />
                </div>
                <div>
                  <label className={labelCls}>Nom generique</label>
                  <input className={inputCls} value={newMed.genericName} onChange={e => setNewMed(p => ({ ...p, genericName: e.target.value }))} placeholder="ex. Ibuprofene" />
                </div>
                <div>
                  <label className={labelCls}>Categorie</label>
                  <select aria-label="Categorie du medicament" className={inputCls} value={newMed.category} onChange={e => setNewMed(p => ({ ...p, category: e.target.value }))}>
                    <option value="">Selectionner...</option>
                    {MEDICATION_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Voies d'administration</label>
                  <input className={inputCls} value={newMed.routes} onChange={e => setNewMed(p => ({ ...p, routes: e.target.value }))} placeholder="ORAL, IV..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Mecanisme d'action</label>
                  <textarea className={inputCls} value={newMed.mechanism} onChange={e => setNewMed(p => ({ ...p, mechanism: e.target.value }))} rows={2} placeholder="Classe pharmacologique, mecanisme, proprietes..." />
                </div>
                <div>
                  <label className={labelCls}>Formes galeniques disponibles</label>
                  <textarea className={inputCls} value={newMed.dosageForm} onChange={e => setNewMed(p => ({ ...p, dosageForm: e.target.value }))} rows={3} placeholder="Une forme par ligne: comprime 200 mg, suspension 20 mg/ml..." />
                </div>
                <div>
                  <label className={labelCls}>Indications courantes</label>
                  <textarea className={inputCls} value={newMed.indications} onChange={e => setNewMed(p => ({ ...p, indications: e.target.value }))} rows={3} placeholder="Une indication par ligne..." />
                </div>
                <div>
                  <label className={labelCls}>Vitesse d'action</label>
                  <input className={inputCls} value={newMed.actionSpeed} onChange={e => setNewMed(p => ({ ...p, actionSpeed: e.target.value }))} placeholder="ex. rapide, progressif..." />
                </div>
                <div>
                  <label className={labelCls}>Duree d'action</label>
                  <input className={inputCls} value={newMed.actionDuration} onChange={e => setNewMed(p => ({ ...p, actionDuration: e.target.value }))} placeholder="ex. 6 a 12 heures" />
                </div>

                <div className="md:col-span-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Posologie et securite</p>
                </div>
                <div>
                  <label className={labelCls}>Posologie adulte</label>
                  <textarea className={inputCls} value={newMed.dosingAdults} onChange={e => setNewMed(p => ({ ...p, dosingAdults: e.target.value }))} rows={3} placeholder="Une regle par ligne, selon indication..." />
                </div>
                <div>
                  <label className={labelCls}>Posologie enfant</label>
                  <textarea className={inputCls} value={newMed.dosingChildren} onChange={e => setNewMed(p => ({ ...p, dosingChildren: e.target.value }))} rows={3} placeholder="Une regle par ligne, mg/kg/j si besoin..." />
                </div>
                <div>
                  <label className={labelCls}>Adaptation renale / dialyse</label>
                  <textarea className={inputCls} value={newMed.renalAdjustment} onChange={e => setNewMed(p => ({ ...p, renalAdjustment: e.target.value }))} rows={3} placeholder="Une regle par ligne..." />
                </div>
                <div>
                  <label className={labelCls}>Dose maximale journaliere adulte (mg)</label>
                  <input type="number" className={inputCls} value={newMed.maxDailyDoseAdult} onChange={e => setNewMed(p => ({ ...p, maxDailyDoseAdult: e.target.value }))} placeholder="ex. 3200" />
                </div>
                <div>
                  <label className={labelCls}>Dose maximale journaliere enfant (mg/jour)</label>
                  <input type="number" className={inputCls} value={newMed.maxDailyDoseChild} onChange={e => setNewMed(p => ({ ...p, maxDailyDoseChild: e.target.value }))} placeholder="ex. 40" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Contre-indications critiques</label>
                  <textarea className={inputCls} value={newMed.contraindicationsCritical} onChange={e => setNewMed(p => ({ ...p, contraindicationsCritical: e.target.value }))} rows={3} placeholder="Une contre-indication par ligne..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Contre-indications / precautions moderees</label>
                  <textarea className={inputCls} value={newMed.contraindicationsModerate} onChange={e => setNewMed(p => ({ ...p, contraindicationsModerate: e.target.value }))} rows={3} placeholder="Une precaution par ligne..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Effets indesirables structures</label>
                  <textarea className={inputCls} value={newMed.adverseEffects} onChange={e => setNewMed(p => ({ ...p, adverseEffects: e.target.value }))} rows={3} placeholder="Format par ligne: Systeme | Effet | Frequence | Gravite | Conduite a tenir" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Avertissements</label>
                  <textarea className={inputCls} value={newMed.warnings} onChange={e => setNewMed(p => ({ ...p, warnings: e.target.value }))} rows={2} placeholder="Risques cliniques connus..." />
                </div>

                <div className="md:col-span-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Surdosage et toxicite</p>
                </div>
                <div>
                  <label className={labelCls}>Seuil toxique enfant (mg/kg)</label>
                  <input type="number" className={inputCls} value={newMed.pediatricToxicDose} onChange={e => setNewMed(p => ({ ...p, pediatricToxicDose: e.target.value }))} placeholder="ex. 100" />
                </div>
                <div>
                  <label className={labelCls}>Seuil severe enfant (mg/kg)</label>
                  <input type="number" className={inputCls} value={newMed.pediatricSevereDose} onChange={e => setNewMed(p => ({ ...p, pediatricSevereDose: e.target.value }))} placeholder="ex. 400" />
                </div>
                <div>
                  <label className={labelCls}>Seuil toxique adulte (mg)</label>
                  <input type="number" className={inputCls} value={newMed.adultToxicDose} onChange={e => setNewMed(p => ({ ...p, adultToxicDose: e.target.value }))} placeholder="ex. 25000" />
                </div>
                <div>
                  <label className={labelCls}>Symptomes legers</label>
                  <textarea className={inputCls} value={newMed.overdoseSymptomsMild} onChange={e => setNewMed(p => ({ ...p, overdoseSymptomsMild: e.target.value }))} rows={3} placeholder="Un symptome par ligne..." />
                </div>
                <div>
                  <label className={labelCls}>Symptomes moderes</label>
                  <textarea className={inputCls} value={newMed.overdoseSymptomsModerate} onChange={e => setNewMed(p => ({ ...p, overdoseSymptomsModerate: e.target.value }))} rows={3} placeholder="Un symptome par ligne..." />
                </div>
                <div>
                  <label className={labelCls}>Symptomes severes</label>
                  <textarea className={inputCls} value={newMed.overdoseSymptomsSevere} onChange={e => setNewMed(p => ({ ...p, overdoseSymptomsSevere: e.target.value }))} rows={3} placeholder="Un symptome par ligne..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Prise en charge du surdosage</label>
                  <textarea className={inputCls} value={newMed.overdoseManagement} onChange={e => setNewMed(p => ({ ...p, overdoseManagement: e.target.value }))} rows={2} placeholder="Protocole de prise en charge du surdosage..." />
                </div>
                <div className="md:col-span-2 flex gap-3 pt-1">
                  <Button type="submit" disabled={saving} className={accentButtonCls}>
                    {saving ? 'Enregistrement...' : editingMedId ? 'Mettre a jour le medicament' : 'Enregistrer le medicament'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetMedicationForm}>Annuler</Button>
                </div>
              </form>
              </Card>
            </div>
          )}

          {/* medication cards */}
          <div className="space-y-2">
            {filteredMeds.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Pill className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucun medicament trouve</p>
                <p className="text-sm mt-1">Ajoutez-en un ci-dessus ou ajustez votre recherche</p>
              </div>
            )}
            {filteredMeds.map(med => {
              const catKey = med.category?.toLowerCase() ?? ''
              const catCls = CATEGORY_COLORS[catKey] ?? 'bg-slate-100 text-slate-600'
              const isExpanded = expandedMed === med.id
              return (
                <Card key={med.id} className="overflow-hidden">
                  <div className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{med.name}</span>
                        {med.generic_name && med.generic_name !== med.name && (
                          <span className="text-slate-400 text-sm">({med.generic_name})</span>
                        )}
                        {med.category && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${catCls}`}>{med.category}</span>
                        )}
                        {med.contraindications?.length > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-100">
                            {med.contraindications.length} CI{med.contraindications.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex gap-4 text-xs text-slate-500 flex-wrap">
                        {med.default_dosage && <span>Posologie par defaut : <strong className="text-slate-700">{med.default_dosage}</strong></span>}
                        {med.max_daily_dose_adult != null && <span>Max adulte : <strong className="text-slate-700">{med.max_daily_dose_adult} mg/jour</strong></span>}
                        {med.max_daily_dose_child != null && <span>Max enfant : <strong className="text-slate-700">{med.max_daily_dose_child} mg/jour</strong></span>}
                      </div>

                      {med.warnings && (
                        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg line-clamp-1">
                          âš  {med.warnings}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(med.contraindications?.length > 0 || med.overdose_management || med.pharmacological_data) && (
                        <button
                          type="button"
                          aria-label={isExpanded ? 'Replier les details du medicament' : 'Afficher les details du medicament'}
                          title={isExpanded ? 'Replier les details du medicament' : 'Afficher les details du medicament'}
                          onClick={() => setExpandedMed(isExpanded ? null : med.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                      <button type="button" onClick={() => openEditMedication(med)}
                        aria-label={`Modifier le medicament ${med.name}`}
                        title={`Modifier le medicament ${med.name}`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Supprimer le medicament ${med.name}`}
                        title={`Supprimer le medicament ${med.name}`}
                        onClick={() => handleDeleteMedication(med.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 space-y-3">
                      {med.pharmacological_data?.mechanism && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Mecanisme d'action</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{med.pharmacological_data.mechanism}</p>
                        </div>
                      )}
                      {med.pharmacological_data?.common_indications?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Indications</p>
                          <div className="flex flex-wrap gap-2">
                            {med.pharmacological_data.common_indications.map((item: string, i: number) => (
                              <span key={i} className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs text-blue-700">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {med.contraindications?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Contre-indications</p>
                          <div className="flex flex-wrap gap-2">
                            {med.contraindications.map((ci, i) => (
                              <span key={i} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${ci.severity === 'critical' || ci.severity === 'absolute' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${ci.severity === 'critical' || ci.severity === 'absolute' ? 'bg-red-500' : 'bg-orange-400'}`} />
                                {ci.condition.replace(/_/g, ' ')}
                                <span className="opacity-60">({ci.severity})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {med.overdose_management && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Protocole de surdosage</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{med.overdose_management}</p>
                        </div>
                      )}
                      {med.pharmacological_data?.overdose?.symptoms && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Symptomes de surdosage</p>
                          <div className="grid gap-2 md:grid-cols-3">
                            {(['mild', 'moderate', 'severe'] as const).map(level => (
                              <div key={level} className="rounded-lg border border-slate-200 bg-white p-2">
                                <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">{level}</p>
                                <p className="text-xs text-slate-600">
                                  {(med.pharmacological_data.overdose.symptoms[level] || []).join(', ') || 'Non renseigne'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          INTERACTIONS TAB
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {tab === 'interactions' && (
        <div className="space-y-4">

          {/* toolbar */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={intSearch}
                onChange={e => setIntSearch(e.target.value)}
                placeholder="Rechercher un nom de medicament ou une gravite..."
                className="pl-9 h-9"
              />
            </div>
            <Button
              onClick={() => { setShowAddInt(!showAddInt); setError('') }}
              className={`${accentButtonCls} h-9 gap-2`}
            >
              <Plus className="h-4 w-4" />
              Ajouter une regle
            </Button>
          </div>

          {/* add form */}
          {showAddInt && (
            <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-6 backdrop-blur-sm sm:px-6 lg:px-8">
              <Card className={`mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 p-6 shadow-2xl ${accentPanelCls}`}>
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className={`h-4 w-4 ${accentTextCls}`} />
                      <h3 className="font-bold text-slate-900">{editingIntId ? 'Modifier la regle d\'interaction' : 'Nouvelle regle d\'interaction'}</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Surface compacte pour lier deux médicaments et décrire le risque en une seule vue.</p>
                  </div>
                  <button type="button" aria-label="Fermer le formulaire d'ajout d'interaction" title="Fermer le formulaire d'ajout d'interaction" onClick={resetInteractionForm} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleAddInteraction} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className={labelCls}>Medicament 1 *</label>
                      <select aria-label="Medicament 1" value={newInt.medicationId1} onChange={e => setNewInt(p => ({ ...p, medicationId1: e.target.value }))} required className={inputCls}>
                        <option value="">Selectionner un medicament...</option>
                        {medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Gravite *</label>
                      <select aria-label="Gravite" value={newInt.severity} onChange={e => setNewInt(p => ({ ...p, severity: e.target.value }))} className={inputCls}>
                        <option value="mild">Faible</option>
                        <option value="moderate">Moderee</option>
                        <option value="severe">Severe</option>
                        <option value="critical">Critique</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Medicament 2 *</label>
                      <select aria-label="Medicament 2" value={newInt.medicationId2} onChange={e => setNewInt(p => ({ ...p, medicationId2: e.target.value }))} required className={inputCls}>
                        <option value="">Selectionner un medicament...</option>
                        {medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Type d\'interaction</label>
                      <input className={inputCls} value={newInt.interactionType} onChange={e => setNewInt(p => ({ ...p, interactionType: e.target.value }))} placeholder="ex. Risque hemorragique" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelCls}>Description</label>
                      <textarea className={inputCls} value={newInt.description} onChange={e => setNewInt(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Mecanisme de l'interaction..." />
                    </div>
                    <div>
                      <label className={labelCls}>Recommandation clinique</label>
                      <textarea className={inputCls} value={newInt.recommendation} onChange={e => setNewInt(p => ({ ...p, recommendation: e.target.value }))} rows={3} placeholder="Que doit faire le clinicien..." />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">Aperçu:</span>{' '}
                    {medications.find(m => m.id === newInt.medicationId1)?.name || 'Médicament 1'} × {medications.find(m => m.id === newInt.medicationId2)?.name || 'Médicament 2'}
                    {' · '}
                    {newInt.severity || 'moderate'}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button type="submit" disabled={saving} className={accentButtonCls}>
                      {saving ? 'Enregistrement...' : editingIntId ? 'Mettre a jour la regle' : 'Enregistrer la regle'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetInteractionForm}>Annuler</Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* interaction list */}
          <div className="space-y-2">
            {filteredInts.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Aucune regle d\'interaction trouvee</p>
                <p className="text-sm mt-1">Ajoutez-en une ci-dessus ou ajustez votre recherche</p>
              </div>
            )}
            {filteredInts.map(int => (
              <Card key={int.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{int.drug1}</span>
                      <span className="text-slate-300 font-light text-lg">+</span>
                      <span className="font-bold text-slate-900">{int.drug2}</span>
                      <span className={`flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${SEV_PILL[int.severity] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[int.severity] ?? 'bg-slate-400'}`} />
                        {SEV_LABEL[int.severity] ?? int.severity}
                      </span>
                      {int.interaction_type && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{int.interaction_type}</span>
                      )}
                    </div>
                    {int.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{int.description}</p>
                    )}
                    {int.recommendation && (
                      <p className={`text-xs px-2.5 py-1.5 rounded-lg ${accentNoteCls}`}>
                        â†’ {int.recommendation}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Supprimer l'interaction ${int.drug1} et ${int.drug2}`}
                    title={`Supprimer l'interaction ${int.drug1} et ${int.drug2}`}
                    onClick={() => handleDeleteInteraction(int.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                    <button
                      type="button"
                      aria-label={`Modifier l'interaction ${int.drug1} + ${int.drug2}`}
                      title={`Modifier l'interaction ${int.drug1} + ${int.drug2}`}
                      onClick={() => openEditInteraction(int)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'clinical_rules' && <AdminClinicalRules />}
    </div>
  )
}

