'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Search, Trash2, Leaf } from 'lucide-react'

const MESSAGES = {
  fr: {
    pageTitle: 'Plantes medicinales',
    pageSubtitle: 'Catalogue botanique et interactions plante-medicament',
    loadError: 'Erreur de chargement',
    saveError: 'Erreur de sauvegarde',
    deleteError: 'Erreur de suppression',
    saveInteractionError: 'Erreur de sauvegarde interaction',
    deleteInteractionError: 'Erreur de suppression interaction',
    incompleteLoad: 'Chargement incomplet des donnees',
    plantSaveFailed: 'Echec de sauvegarde de la plante',
    plantDeleteFailed: 'Echec de suppression',
    interactionSaveFailed: 'Echec de sauvegarde de l interaction',
    interactionDeleteFailed: 'Echec de suppression interaction',
    deletePlantConfirm: 'Supprimer cette plante ?',
    deleteInteractionConfirm: 'Supprimer cette interaction ?',
    addEditPlant: 'Ajouter / Modifier une plante',
    addEditInteraction: 'Ajouter / Modifier une interaction',
    scientificName: 'Nom scientifique',
    commonName: 'Nom commun',
    toxicParts: 'Parties toxiques',
    toxicCompounds: 'Composes toxiques',
    synonyms: 'Synonymes (1 par ligne)',
    majorRisks: 'Risques majeurs (1 par ligne)',
    overdoseManagement: 'Conduite en cas de surdosage',
    update: 'Mettre a jour',
    addPlant: 'Ajouter plante',
    cancel: 'Annuler',
    plant: 'Plante',
    medication: 'Medicament',
    severity: 'Gravite',
    description: 'Description',
    recommendation: 'Recommandation',
    addInteraction: 'Ajouter interaction',
    selectPlant: 'Selectionner une plante',
    selectMedication: 'Selectionner un medicament',
    loading: 'Chargement...',
    noPlant: 'Aucune plante',
    noInteraction: 'Aucune interaction',
    noCommonName: 'Nom commun non precise',
    catalog: 'Catalogue plantes',
    interactions: 'Interactions',
    searchPlant: 'Rechercher plante',
    searchInteraction: 'Rechercher interaction',
    edit: 'Editer',
    deletePlantTitle: 'Supprimer la plante',
    deleteInteractionTitle: 'Supprimer l interaction',
    critical: 'Critique',
    high: 'Elevee',
    moderate: 'Moderee',
    low: 'Faible',
  },
  en: {
    pageTitle: 'Medicinal plants',
    pageSubtitle: 'Botanical catalog and plant-drug interactions',
    loadError: 'Loading error',
    saveError: 'Save error',
    deleteError: 'Delete error',
    saveInteractionError: 'Interaction save error',
    deleteInteractionError: 'Interaction delete error',
    incompleteLoad: 'Incomplete data loading',
    plantSaveFailed: 'Failed to save plant',
    plantDeleteFailed: 'Failed to delete plant',
    interactionSaveFailed: 'Failed to save interaction',
    interactionDeleteFailed: 'Failed to delete interaction',
    deletePlantConfirm: 'Delete this plant?',
    deleteInteractionConfirm: 'Delete this interaction?',
    addEditPlant: 'Add / Edit plant',
    addEditInteraction: 'Add / Edit interaction',
    scientificName: 'Scientific name',
    commonName: 'Common name',
    toxicParts: 'Toxic parts',
    toxicCompounds: 'Toxic compounds',
    synonyms: 'Synonyms (1 per line)',
    majorRisks: 'Major risks (1 per line)',
    overdoseManagement: 'Overdose management',
    update: 'Update',
    addPlant: 'Add plant',
    cancel: 'Cancel',
    plant: 'Plant',
    medication: 'Medication',
    severity: 'Severity',
    description: 'Description',
    recommendation: 'Recommendation',
    addInteraction: 'Add interaction',
    selectPlant: 'Select a plant',
    selectMedication: 'Select a medication',
    loading: 'Loading...',
    noPlant: 'No plants',
    noInteraction: 'No interactions',
    noCommonName: 'Common name not specified',
    catalog: 'Plant catalog',
    interactions: 'Interactions',
    searchPlant: 'Search plant',
    searchInteraction: 'Search interaction',
    edit: 'Edit',
    deletePlantTitle: 'Delete plant',
    deleteInteractionTitle: 'Delete interaction',
    critical: 'Critical',
    high: 'High',
    moderate: 'Moderate',
    low: 'Low',
  },
} as const

type Plant = {
  id: string
  name: string
  common_name: string | null
  toxic_parts: string | null
  toxic_compounds: string | null
  toxicity_data: Record<string, any>
  overdose_management: string | null
}

type MedicationOption = {
  id: string
  name: string
}

type PlantInteraction = {
  id: string
  plant_id: string
  medication_id: string
  plant_name: string
  medication_name: string
  severity: 'critical' | 'high' | 'moderate' | 'low' | string
  description: string
  recommendation: string
}

function emptyPlantForm() {
  return {
    name: '',
    commonName: '',
    toxicParts: '',
    toxicCompounds: '',
    overdoseManagement: '',
    synonyms: '',
    majorRisks: '',
  }
}

function parseLines(value: string) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export default function AdminPlantsPage() {
  const [locale, setLocale] = useState<'fr' | 'en'>('fr')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [plants, setPlants] = useState<Plant[]>([])
  const [interactions, setInteractions] = useState<PlantInteraction[]>([])
  const [medications, setMedications] = useState<MedicationOption[]>([])

  const [plantSearch, setPlantSearch] = useState('')
  const [intSearch, setIntSearch] = useState('')

  const [newPlant, setNewPlant] = useState(emptyPlantForm())
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null)

  const [newInteraction, setNewInteraction] = useState({
    plantId: '',
    medicationId: '',
    severity: 'moderate',
    description: '',
    recommendation: '',
  })
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null)

  const t = MESSAGES[locale]

  useEffect(() => {
    const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'fr'
    if (lang.toLowerCase().startsWith('en')) setLocale('en')
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [plantsRes, intRes, medsRes] = await Promise.all([
        fetch('/api/admin/plants'),
        fetch('/api/admin/plant-interactions'),
        fetch('/api/admin/medications'),
      ])

      if (!plantsRes.ok || !intRes.ok || !medsRes.ok) {
        throw new Error(t.incompleteLoad)
      }

      setPlants(await plantsRes.json())
      setInteractions(await intRes.json())
      const meds = await medsRes.json()
      setMedications((meds || []).map((m: any) => ({ id: m.id, name: m.name })))
    } catch (e: any) {
      setError(e?.message || t.loadError)
    } finally {
      setLoading(false)
    }
  }

  function resetPlantForm() {
    setNewPlant(emptyPlantForm())
    setEditingPlantId(null)
  }

  async function savePlant(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const toxicityData = {
        synonyms: parseLines(newPlant.synonyms),
        major_risks: parseLines(newPlant.majorRisks),
      }

      const endpoint = editingPlantId ? `/api/admin/plants/${editingPlantId}` : '/api/admin/plants'
      const method = editingPlantId ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlant.name,
          commonName: newPlant.commonName,
          toxicParts: newPlant.toxicParts,
          toxicCompounds: newPlant.toxicCompounds,
          overdoseManagement: newPlant.overdoseManagement,
          toxicityData,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t.plantSaveFailed)
      }

      resetPlantForm()
      await loadData()
    } catch (e: any) {
      setError(e?.message || t.saveError)
    } finally {
      setSaving(false)
    }
  }

  function editPlant(plant: Plant) {
    setEditingPlantId(plant.id)
    setNewPlant({
      name: plant.name || '',
      commonName: plant.common_name || '',
      toxicParts: plant.toxic_parts || '',
      toxicCompounds: plant.toxic_compounds || '',
      overdoseManagement: plant.overdose_management || '',
      synonyms: Array.isArray(plant.toxicity_data?.synonyms) ? plant.toxicity_data.synonyms.join('\n') : '',
      majorRisks: Array.isArray(plant.toxicity_data?.major_risks) ? plant.toxicity_data.major_risks.join('\n') : '',
    })
  }

  async function deletePlant(id: string) {
    if (!confirm(t.deletePlantConfirm)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/plants/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t.plantDeleteFailed)
      }
      await loadData()
    } catch (e: any) {
      setError(e?.message || t.deleteError)
    } finally {
      setSaving(false)
    }
  }

  async function saveInteraction(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const endpoint = editingInteractionId
        ? `/api/admin/plant-interactions/${editingInteractionId}`
        : '/api/admin/plant-interactions'
      const method = editingInteractionId ? 'PUT' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInteraction),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t.interactionSaveFailed)
      }

      setEditingInteractionId(null)
      setNewInteraction({
        plantId: '',
        medicationId: '',
        severity: 'moderate',
        description: '',
        recommendation: '',
      })
      await loadData()
    } catch (e: any) {
      setError(e?.message || t.saveInteractionError)
    } finally {
      setSaving(false)
    }
  }

  function editInteraction(item: PlantInteraction) {
    setEditingInteractionId(item.id)
    setNewInteraction({
      plantId: item.plant_id,
      medicationId: item.medication_id,
      severity: item.severity || 'moderate',
      description: item.description || '',
      recommendation: item.recommendation || '',
    })
  }

  async function deleteInteraction(id: string) {
    if (!confirm(t.deleteInteractionConfirm)) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/plant-interactions/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t.deleteInteractionError)
      }
      await loadData()
    } catch (e: any) {
      setError(e?.message || t.deleteInteractionError)
    } finally {
      setSaving(false)
    }
  }

  const filteredPlants = useMemo(() => {
    const q = plantSearch.trim().toLowerCase()
    if (!q) return plants
    return plants.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.common_name || '').toLowerCase().includes(q)
    )
  }, [plants, plantSearch])

  const filteredInteractions = useMemo(() => {
    const q = intSearch.trim().toLowerCase()
    if (!q) return interactions
    return interactions.filter(item =>
      (item.plant_name || '').toLowerCase().includes(q) ||
      (item.medication_name || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    )
  }, [interactions, intSearch])

  return (
    <div className="max-w-[1500px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">{t.pageTitle}</h1>
          <p className="text-sm text-slate-600">{t.pageSubtitle}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Leaf className="h-4 w-4" />
            {t.addEditPlant}
          </div>

          <form className="space-y-3" onSubmit={savePlant}>
            <div>
              <Label htmlFor="plant-name">{t.scientificName}</Label>
              <Input
                id="plant-name"
                value={newPlant.name}
                onChange={e => setNewPlant({ ...newPlant, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="plant-common-name">{t.commonName}</Label>
              <Input
                id="plant-common-name"
                value={newPlant.commonName}
                onChange={e => setNewPlant({ ...newPlant, commonName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="plant-toxic-parts">{t.toxicParts}</Label>
              <Input
                id="plant-toxic-parts"
                value={newPlant.toxicParts}
                onChange={e => setNewPlant({ ...newPlant, toxicParts: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="plant-toxic-compounds">{t.toxicCompounds}</Label>
              <Input
                id="plant-toxic-compounds"
                value={newPlant.toxicCompounds}
                onChange={e => setNewPlant({ ...newPlant, toxicCompounds: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="plant-overdose-management">{t.overdoseManagement}</Label>
              <Input
                id="plant-overdose-management"
                value={newPlant.overdoseManagement}
                onChange={e => setNewPlant({ ...newPlant, overdoseManagement: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{editingPlantId ? t.update : t.addPlant}</Button>
              <Button type="button" variant="secondary" onClick={resetPlantForm}>{t.cancel}</Button>
            </div>
          </form>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Leaf className="h-4 w-4" />
            {t.catalog}
          </div>

          <Input
            placeholder={t.searchPlant}
            value={plantSearch}
            onChange={e => setPlantSearch(e.target.value)}
          />

          <div className="space-y-3">
            {filteredPlants.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{t.noPlant}</div>
            ) : (
              filteredPlants.map(plant => (
                <div key={plant.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{plant.common_name || t.noCommonName}</p>
                      <p className="text-sm text-slate-500">{plant.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => editPlant(plant)}>{t.edit}</Button>
                      <Button size="sm" variant="destructive" onClick={() => deletePlant(plant.id)}>{t.deletePlantTitle}</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
          <Leaf className="h-4 w-4" />
          {t.interactions}
        </div>

        <form className="grid gap-4 lg:grid-cols-2" onSubmit={saveInteraction}>
          <div>
            <Label htmlFor="plant-select">{t.plant}</Label>
            <select
              id="plant-select"
              title={t.plant}
              aria-label={t.plant}
              value={newInteraction.plantId}
              onChange={e => setNewInteraction({ ...newInteraction, plantId: e.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              required
            >
              <option value="">{t.selectPlant}</option>
              {plants.map(plant => (
                <option key={plant.id} value={plant.id}>{plant.common_name || plant.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="medication-select">{t.medication}</Label>
            <select
              id="medication-select"
              title={t.medication}
              aria-label={t.medication}
              value={newInteraction.medicationId}
              onChange={e => setNewInteraction({ ...newInteraction, medicationId: e.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              required
            >
              <option value="">{t.selectMedication}</option>
              {medications.map(med => (
                <option key={med.id} value={med.id}>{med.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="interaction-severity">{t.severity}</Label>
            <select
              id="interaction-severity"
              title={t.severity}
              aria-label={t.severity}
              value={newInteraction.severity}
              onChange={e => setNewInteraction({ ...newInteraction, severity: e.target.value })}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="critical">{t.critical}</option>
              <option value="high">{t.high}</option>
              <option value="moderate">{t.moderate}</option>
              <option value="low">{t.low}</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="interaction-description">{t.description}</Label>
            <textarea
              id="interaction-description"
              title={t.description}
              placeholder={t.description}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={newInteraction.description}
              onChange={e => setNewInteraction({ ...newInteraction, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="interaction-recommendation">{t.recommendation}</Label>
            <textarea
              id="interaction-recommendation"
              title={t.recommendation}
              placeholder={t.recommendation}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={newInteraction.recommendation}
              onChange={e => setNewInteraction({ ...newInteraction, recommendation: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{editingInteractionId ? t.update : t.addInteraction}</Button>
            <Button type="button" variant="secondary" onClick={() => {
              setEditingInteractionId(null)
              setNewInteraction({ plantId: '', medicationId: '', severity: 'moderate', description: '', recommendation: '' })
            }}>{t.cancel}</Button>
          </div>
        </form>

        <div className="space-y-3">
          <Input
            placeholder={t.searchInteraction}
            value={intSearch}
            onChange={e => setIntSearch(e.target.value)}
          />

          {filteredInteractions.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{t.noInteraction}</div>
          ) : (
            filteredInteractions.map(item => (
              <Card key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.plant_name} → {item.medication_name}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => editInteraction(item)}>{t.edit}</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteInteraction(item.id)}>{t.deleteInteractionTitle}</Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
