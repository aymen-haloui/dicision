'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Pill, Zap, Plus, Trash2, Search, AlertTriangle,
  ChevronDown, ChevronUp, FlaskConical, ShieldAlert, X,
} from 'lucide-react'

interface Medication {
  id: string
  name: string
  generic_name: string
  category: string
  default_dosage: string
  warnings: string
  max_daily_dose_adult: number | null
  max_daily_dose_child: number | null
  contraindications: { condition: string; severity: string }[]
  overdose_management: string
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
const CATEGORY_COLORS: Record<string, string> = {
  nsaid:        'bg-blue-100 text-blue-700',
  antibiotic:   'bg-violet-100 text-violet-700',
  antidiabetic: 'bg-teal-100 text-teal-700',
  anticoagulant:'bg-amber-100 text-amber-700',
  statin:       'bg-indigo-100 text-indigo-700',
  analgesic:    'bg-sky-100 text-sky-700',
}

export default function AdminRulesPage() {
  const [tab, setTab] = useState<'medications' | 'interactions'>('medications')
  const [medications, setMedications] = useState<Medication[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMed, setShowAddMed] = useState(false)
  const [showAddInt, setShowAddInt] = useState(false)
  const [expandedMed, setExpandedMed] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [medSearch, setMedSearch] = useState('')
  const [intSearch, setIntSearch] = useState('')

  const [newMed, setNewMed] = useState({
    name: '', genericName: '', category: '', dosageForm: '', defaultDosage: '',
    warnings: '', maxDailyDoseAdult: '', maxDailyDoseChild: '', overdoseManagement: '',
  })
  const [newInt, setNewInt] = useState({
    medicationId1: '', medicationId2: '', interactionType: '',
    severity: 'moderate', description: '', recommendation: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [medsRes, intsRes] = await Promise.all([
      fetch('/api/admin/medications'),
      fetch('/api/admin/interactions'),
    ])
    if (medsRes.ok) setMedications(await medsRes.json())
    if (intsRes.ok) setInteractions(await intsRes.json())
    setLoading(false)
  }

  async function handleAddMedication(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/admin/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newMed.name, genericName: newMed.genericName,
        category: newMed.category, dosageForm: newMed.dosageForm,
        defaultDosage: newMed.defaultDosage, warnings: newMed.warnings,
        maxDailyDoseAdult: newMed.maxDailyDoseAdult ? parseFloat(newMed.maxDailyDoseAdult) : null,
        maxDailyDoseChild: newMed.maxDailyDoseChild ? parseFloat(newMed.maxDailyDoseChild) : null,
        overdoseManagement: newMed.overdoseManagement,
        contraindications: [],
      }),
    })
    if (res.ok) {
      setNewMed({ name: '', genericName: '', category: '', dosageForm: '', defaultDosage: '', warnings: '', maxDailyDoseAdult: '', maxDailyDoseChild: '', overdoseManagement: '' })
      setShowAddMed(false)
      await loadData()
    } else { setError((await res.json()).error || 'Failed to add medication') }
    setSaving(false)
  }

  async function handleAddInteraction(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/admin/interactions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInt),
    })
    if (res.ok) {
      setNewInt({ medicationId1: '', medicationId2: '', interactionType: '', severity: 'moderate', description: '', recommendation: '' })
      setShowAddInt(false)
      await loadData()
    } else { setError((await res.json()).error || 'Failed to add rule') }
    setSaving(false)
  }

  async function handleDeleteMedication(id: string) {
    if (!confirm('Delete this medication? All related interaction rules and case data will also be removed.')) return
    await fetch(`/api/admin/medications/${id}`, { method: 'DELETE' })
    await loadData()
  }

  async function handleDeleteInteraction(id: string) {
    if (!confirm('Delete this interaction rule?')) return
    await fetch('/api/admin/interactions', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
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

  const criticalCount = interactions.filter(i => i.severity === 'critical').length
  const severeCount = interactions.filter(i => i.severity === 'severe').length
  const accentTextCls = 'text-[#2CB1BC]'
  const accentButtonCls = 'bg-[#2CB1BC] hover:bg-[#239AA3] text-white'
  const accentPanelCls = 'border-teal-200 bg-teal-50'
  const accentNoteCls = 'text-[#2CB1BC] bg-[#eef1ff] border border-[#cdd4ff]'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#2CB1BC] rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading clinical rules database...</p>
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
            Clinical Rules Engine
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage the medications, contraindications and interaction rules that power the decision engine.
          </p>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              {criticalCount} critical
            </span>
          )}
          {severeCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              {severeCount} severe
            </span>
          )}
        </div>
      </div>

      {/* â”€â”€ STATS ROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Medications', value: medications.length, icon: <Pill className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Interaction Rules', value: interactions.length, icon: <Zap className="h-5 w-5" />, color: 'text-violet-600 bg-violet-50' },
          { label: 'Critical Interactions', value: criticalCount, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-red-600 bg-red-50' },
          { label: 'Contraindication Sets', value: medications.reduce((n, m) => n + (m.contraindications?.length || 0), 0), icon: <FlaskConical className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50' },
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
          <button type="button" aria-label="Dismiss error" title="Dismiss error" onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* â”€â”€ TABS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['medications', 'interactions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'medications'
              ? <span className="flex items-center gap-2"><Pill className="h-4 w-4" />Medications ({medications.length})</span>
              : <span className="flex items-center gap-2"><Zap className="h-4 w-4" />Interactions ({interactions.length})</span>
            }
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
                placeholder="Search by name or category..."
                className="pl-9 h-9"
              />
            </div>
            <Button
              onClick={() => { setShowAddMed(!showAddMed); setError('') }}
              className={`${accentButtonCls} h-9 gap-2`}
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </div>

          {/* add form */}
          {showAddMed && (
            <Card className={`p-6 ${accentPanelCls}`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Plus className={`h-4 w-4 ${accentTextCls}`} /> New Medication
                </h3>
                <button type="button" aria-label="Close add medication form" title="Close add medication form" onClick={() => setShowAddMed(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleAddMedication} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input className={inputCls} value={newMed.name} onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ibuprofen" required />
                </div>
                <div>
                  <label className={labelCls}>Generic Name</label>
                  <input className={inputCls} value={newMed.genericName} onChange={e => setNewMed(p => ({ ...p, genericName: e.target.value }))} placeholder="e.g. Ibuprofen" />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <input className={inputCls} value={newMed.category} onChange={e => setNewMed(p => ({ ...p, category: e.target.value }))} placeholder="e.g. NSAID, Antibiotic" />
                </div>
                <div>
                  <label className={labelCls}>Default Dosage</label>
                  <input className={inputCls} value={newMed.defaultDosage} onChange={e => setNewMed(p => ({ ...p, defaultDosage: e.target.value }))} placeholder="e.g. 400mg" />
                </div>
                <div>
                  <label className={labelCls}>Max Daily Dose â€” Adult (mg)</label>
                  <input type="number" className={inputCls} value={newMed.maxDailyDoseAdult} onChange={e => setNewMed(p => ({ ...p, maxDailyDoseAdult: e.target.value }))} placeholder="e.g. 3200" />
                </div>
                <div>
                  <label className={labelCls}>Max Daily Dose â€” Child (mg/day)</label>
                  <input type="number" className={inputCls} value={newMed.maxDailyDoseChild} onChange={e => setNewMed(p => ({ ...p, maxDailyDoseChild: e.target.value }))} placeholder="e.g. 40" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Warnings</label>
                  <textarea className={inputCls} value={newMed.warnings} onChange={e => setNewMed(p => ({ ...p, warnings: e.target.value }))} rows={2} placeholder="Known clinical risks..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Overdose Management</label>
                  <textarea className={inputCls} value={newMed.overdoseManagement} onChange={e => setNewMed(p => ({ ...p, overdoseManagement: e.target.value }))} rows={2} placeholder="Protocol for managing overdose..." />
                </div>
                <div className="md:col-span-2 flex gap-3 pt-1">
                  <Button type="submit" disabled={saving} className={accentButtonCls}>
                    {saving ? 'Saving...' : 'Save Medication'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddMed(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {/* medication cards */}
          <div className="space-y-2">
            {filteredMeds.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Pill className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No medications found</p>
                <p className="text-sm mt-1">Add one above or adjust your search</p>
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
                        {med.default_dosage && <span>Default: <strong className="text-slate-700">{med.default_dosage}</strong></span>}
                        {med.max_daily_dose_adult != null && <span>Max adult: <strong className="text-slate-700">{med.max_daily_dose_adult} mg/day</strong></span>}
                        {med.max_daily_dose_child != null && <span>Max child: <strong className="text-slate-700">{med.max_daily_dose_child} mg/day</strong></span>}
                      </div>

                      {med.warnings && (
                        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg line-clamp-1">
                          âš  {med.warnings}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(med.contraindications?.length > 0 || med.overdose_management) && (
                        <button
                          type="button"
                          aria-label={isExpanded ? 'Collapse medication details' : 'Expand medication details'}
                          title={isExpanded ? 'Collapse medication details' : 'Expand medication details'}
                          onClick={() => setExpandedMed(isExpanded ? null : med.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Delete medication ${med.name}`}
                        title={`Delete medication ${med.name}`}
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
                      {med.contraindications?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Contraindications</p>
                          <div className="flex flex-wrap gap-2">
                            {med.contraindications.map((ci, i) => (
                              <span key={i} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${ci.severity === 'absolute' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${ci.severity === 'absolute' ? 'bg-red-500' : 'bg-orange-400'}`} />
                                {ci.condition.replace(/_/g, ' ')}
                                <span className="opacity-60">({ci.severity})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {med.overdose_management && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Overdose Protocol</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{med.overdose_management}</p>
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
                placeholder="Search drug name or severity..."
                className="pl-9 h-9"
              />
            </div>
            <Button
              onClick={() => { setShowAddInt(!showAddInt); setError('') }}
              className={`${accentButtonCls} h-9 gap-2`}
            >
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>

          {/* add form */}
          {showAddInt && (
            <Card className={`p-6 ${accentPanelCls}`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${accentTextCls}`} /> New Interaction Rule
                </h3>
                <button type="button" aria-label="Close add interaction form" title="Close add interaction form" onClick={() => setShowAddInt(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleAddInteraction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Drug 1 *</label>
                  <select aria-label="Drug 1" value={newInt.medicationId1} onChange={e => setNewInt(p => ({ ...p, medicationId1: e.target.value }))} required className={inputCls}>
                    <option value="">Select medication...</option>
                    {medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Drug 2 *</label>
                  <select aria-label="Drug 2" value={newInt.medicationId2} onChange={e => setNewInt(p => ({ ...p, medicationId2: e.target.value }))} required className={inputCls}>
                    <option value="">Select medication...</option>
                    {medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Interaction Type</label>
                  <input className={inputCls} value={newInt.interactionType} onChange={e => setNewInt(p => ({ ...p, interactionType: e.target.value }))} placeholder="e.g. Hemorrhage risk" />
                </div>
                <div>
                  <label className={labelCls}>Severity *</label>
                  <select aria-label="Severity" value={newInt.severity} onChange={e => setNewInt(p => ({ ...p, severity: e.target.value }))} className={inputCls}>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea className={inputCls} value={newInt.description} onChange={e => setNewInt(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Mechanism of interaction..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Clinical Recommendation</label>
                  <textarea className={inputCls} value={newInt.recommendation} onChange={e => setNewInt(p => ({ ...p, recommendation: e.target.value }))} rows={2} placeholder="What the clinician should do..." />
                </div>
                <div className="md:col-span-2 flex gap-3 pt-1">
                  <Button type="submit" disabled={saving} className={accentButtonCls}>
                    {saving ? 'Saving...' : 'Save Rule'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddInt(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {/* interaction list */}
          <div className="space-y-2">
            {filteredInts.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No interaction rules found</p>
                <p className="text-sm mt-1">Add one above or adjust your search</p>
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
                        {int.severity}
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
                    aria-label={`Delete interaction ${int.drug1} and ${int.drug2}`}
                    title={`Delete interaction ${int.drug1} and ${int.drug2}`}
                    onClick={() => handleDeleteInteraction(int.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

