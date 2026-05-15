'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useOptions } from '@/hooks/use-options'
import { SearchableCombobox } from '@/components/searchable-combobox'
import {
  ALLERGEN_CATALOG,
  DISEASE_CATALOG,
  getAllergenCategory,
  getDiseaseCategory,
  SPECIAL_DIAGNOSIS_CATALOG,
} from '@/lib/medical-catalogs'
import { computeAge, FEMALE_GENDER, validatePatientProfile } from '@/lib/patient-validation'
import { Plus, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientFormProps {
  patientId?: string
  initialData?: Record<string, any>
  mode?: 'create' | 'edit'
}

interface PatientCondition {
  id?: string
  condition_name: string
  category: string
  severity: string
  status: string
  diagnosed_at: string
  notes: string
}

interface PatientAllergy {
  id?: string
  allergen_name: string
  allergen_category: string
  reaction_type: string
  severity: string
  onset_delay: string
}

interface PatientMedication {
  id?: string
  medication_name: string
  dosage: string
  frequency: string
  route: string
  started_at: string
  ongoing: boolean
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  children,
  unit,
  controlId,
  required = false,
}: {
  label: string
  children: React.ReactNode
  unit?: string
  controlId: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={controlId} className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
        {unit && <span className="ml-1 text-xs text-slate-400">({unit})</span>}
      </Label>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide border-b border-slate-200 pb-1 mb-4 col-span-full">
      {children}
    </h3>
  )
}

const inputClass =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2CB1BC] disabled:opacity-50'
const selectClass =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2CB1BC] disabled:opacity-50'

// ─── Main component ───────────────────────────────────────────────────────────

export default function PatientForm({ patientId, initialData, mode = 'create' }: PatientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('identity')

  // Form state
  const [formData, setFormData] = useState({
    // Identity tab
    first_name: initialData?.first_name ?? '',
    last_name: initialData?.last_name ?? '',
    date_of_birth: initialData?.date_of_birth ?? '',
    gender: initialData?.gender ?? '',
    medical_record_number: initialData?.medical_record_number ?? '',
    weight: initialData?.weight ?? '',
    height: initialData?.height ?? '',
    pregnancy_status: initialData?.pregnancy_status ?? false,
    pregnancy_trimester: initialData?.pregnancy_trimester ?? '',
    breastfeeding_status: initialData?.breastfeeding_status ?? false,

    // Chronic conditions
    conditions: (initialData?.patient_conditions ?? []) as PatientCondition[],

    // Allergies
    allergies: (initialData?.patient_allergies ?? []) as PatientAllergy[],

    // Chronic treatments
    medications: (initialData?.patient_medications ?? []) as PatientMedication[],

    // Lifestyle
    smoking_status: initialData?.smoking_status ?? '',
    alcohol_use: initialData?.alcohol_use ?? '',
    physical_activity: initialData?.physical_activity ?? '',
    stress_level: initialData?.stress_level ?? '',
    sleep_quality: initialData?.sleep_quality ?? '',

    // Lifestyle
    substance_use: initialData?.patient_lifestyle?.[0]?.substance_use ?? false,
    substance_type: initialData?.patient_lifestyle?.[0]?.substance_type ?? '',
    substance_frequency: initialData?.patient_lifestyle?.[0]?.substance_frequency ?? '',
    substance_route: initialData?.patient_lifestyle?.[0]?.substance_route ?? '',
    prolonged_fasting: initialData?.patient_lifestyle?.[0]?.prolonged_fasting ?? false,
    fasting_type: initialData?.patient_lifestyle?.[0]?.fasting_type ?? '',
    fasting_frequency: initialData?.patient_lifestyle?.[0]?.fasting_frequency ?? '',
    night_shift: initialData?.patient_lifestyle?.[0]?.night_shift ?? false,
    sleep_hours: initialData?.patient_lifestyle?.[0]?.sleep_hours ?? '',

    // Special risks
    special_condition_type: initialData?.patient_lifestyle?.[0]?.special_condition_type ?? '',
    special_diagnosis: initialData?.patient_lifestyle?.[0]?.special_diagnosis ?? '',
    special_stage_classification: initialData?.patient_lifestyle?.[0]?.special_stage_classification ?? '',
    special_active_disease: initialData?.patient_lifestyle?.[0]?.special_active_disease ?? false,
    special_treatment_types: (initialData?.patient_lifestyle?.[0]?.special_treatment_types?.split(',') ?? []).filter(Boolean),
    previous_intoxication: initialData?.patient_lifestyle?.[0]?.previous_intoxication ?? false,
  })

  const [medicationCatalog, setMedicationCatalog] = useState<{ value: string; label: string }[]>([])

  // Load options
  const genderOptions = useOptions('gender')
  const pregnancyTrimesterOptions = useOptions('pregnancy_trimester')
  const conditionCategoryOptions = useOptions('condition_category')
  const conditionStatusOptions = useOptions('condition_status')
  const severityOptions = useOptions('severity')
  const allergenCategoryOptions = useOptions('allergen_category')
  const reactionTypeOptions = useOptions('reaction_type')
  const onsetDelayOptions = useOptions('onset_delay')
  const frequencyOptions = useOptions('frequency')
  const routeOptions = useOptions('route')
  const smokingStatusOptions = useOptions('smoking_status')
  const alcoholUseOptions = useOptions('alcohol_use')
  const physicalActivityOptions = useOptions('physical_activity')
  const stressLevelOptions = useOptions('stress_level')
  const sleepQualityOptions = useOptions('sleep_quality')
  const conditionTypeOptions = useOptions('condition_type')
  const treatmentTypeOptions = useOptions('treatment_type')

  const isFemale = formData.gender === FEMALE_GENDER
  const computedAge = useMemo(
    () => computeAge(formData.date_of_birth),
    [formData.date_of_birth]
  )

  useEffect(() => {
    fetch('/api/medications')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setMedicationCatalog(
          list.map((m: { name: string }) => ({ value: m.name, label: m.name }))
        )
      })
      .catch(() => setMedicationCatalog([]))
  }, [])

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, {
        condition_name: '',
        category: '',
        severity: '',
        status: '',
        diagnosed_at: '',
        notes: ''
      }]
    }))
  }

  const updateCondition = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) => {
        if (i !== index) return cond
        const updated = { ...cond, [field]: value }
        if (field === 'condition_name') {
          const autoCategory = getDiseaseCategory(value)
          if (autoCategory) updated.category = autoCategory
        }
        return updated
      }),
    }))
  }

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }))
  }

  const addAllergy = () => {
    setFormData(prev => ({
      ...prev,
      allergies: [...prev.allergies, {
        allergen_name: '',
        allergen_category: '',
        reaction_type: '',
        severity: '',
        onset_delay: ''
      }]
    }))
  }

  const updateAllergy = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.map((allergy, i) => {
        if (i !== index) return allergy
        const updated = { ...allergy, [field]: value }
        if (field === 'allergen_name') {
          const autoCategory = getAllergenCategory(value)
          if (autoCategory) updated.allergen_category = autoCategory
        }
        return updated
      }),
    }))
  }

  const toggleSpecialTreatment = (value: string) => {
    setFormData(prev => {
      const current = prev.special_treatment_types as string[]
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, special_treatment_types: next }
    })
  }

  const removeAllergy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }))
  }

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, {
        medication_name: '',
        dosage: '',
        frequency: '',
        route: '',
        started_at: '',
        ongoing: true
      }]
    }))
  }

  const updateMedication = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      )
    }))
  }

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const validationError = validatePatientProfile(formData)
    if (validationError) {
      setError(validationError)
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        ...formData,
        pregnancy_status: isFemale ? Boolean(formData.pregnancy_status) : false,
        pregnancy_trimester:
          isFemale && formData.pregnancy_status ? formData.pregnancy_trimester || null : null,
        breastfeeding_status: isFemale ? Boolean(formData.breastfeeding_status) : false,
        substance_use: Boolean(formData.substance_use),
        prolonged_fasting: Boolean(formData.prolonged_fasting),
        night_shift: Boolean(formData.night_shift),
        special_active_disease: Boolean(formData.special_active_disease),
        previous_intoxication: Boolean(formData.previous_intoxication),
      }

      const url = mode === 'edit' && patientId
        ? `/api/patients/${patientId}`
        : '/api/patients'

      const response = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde')
      }

      const result = await response.json()
      router.push(`/dashboard/patients/${result.patient.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">
          {mode === 'edit' ? 'Modifier le patient' : 'Nouveau patient'}
        </h1>
        <p className="text-slate-600 mt-1">
          Profil patient permanent — antécédents, risques chroniques et contexte de base (sans données de cas urgentes)
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="identity">Identité</TabsTrigger>
            <TabsTrigger value="history">Antécédents Médicaux Chroniques</TabsTrigger>
            <TabsTrigger value="allergies">Allergies & Intolérances</TabsTrigger>
            <TabsTrigger value="treatments">Traitements Chroniques</TabsTrigger>
            <TabsTrigger value="lifestyle">Habitudes de Vie</TabsTrigger>
            <TabsTrigger value="risks">Risques Spéciaux</TabsTrigger>
          </TabsList>

          {/* Identity Tab */}
          <TabsContent value="identity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations d'identité</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Prénom" controlId="first_name" required>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={e => updateFormData('first_name', e.target.value)}
                    className={inputClass}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </Field>

                <Field label="Nom" controlId="last_name" required>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={e => updateFormData('last_name', e.target.value)}
                    className={inputClass}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </Field>

                <Field label="Date de naissance" controlId="date_of_birth" required>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={e => updateFormData('date_of_birth', e.target.value)}
                    className={inputClass}
                    required
                  />
                </Field>

                <Field label="Âge (calculé)" controlId="computed_age">
                  <Input
                    id="computed_age"
                    value={computedAge != null ? `${computedAge} ans` : ''}
                    className={`${inputClass} bg-slate-50`}
                    disabled
                    readOnly
                  />
                </Field>

                <Field label="Sexe" controlId="gender" required>
                  <Select value={formData.gender} onValueChange={value => updateFormData('gender', value)} required>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Numéro de dossier médical" controlId="medical_record_number">
                  <Input
                    id="medical_record_number"
                    value={formData.medical_record_number}
                    onChange={e => updateFormData('medical_record_number', e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <div className="md:col-span-2">
                  <SectionTitle>Données anthropométriques de base</SectionTitle>
                </div>

                <Field label="Poids" controlId="weight" unit="kg">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min={0}
                    max={500}
                    value={formData.weight}
                    onChange={e => updateFormData('weight', e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Taille" controlId="height" unit="cm">
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min={20}
                    max={300}
                    value={formData.height}
                    onChange={e => updateFormData('height', e.target.value)}
                    className={inputClass}
                  />
                </Field>

                {isFemale && (
                  <>
                <div className="md:col-span-2">
                  <SectionTitle>États physiologiques (femme)</SectionTitle>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pregnancy_status"
                    checked={formData.pregnancy_status}
                    onChange={e => updateFormData('pregnancy_status', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                    title="Grossesse"
                  />
                  <Label htmlFor="pregnancy_status">Grossesse</Label>
                </div>

                {formData.pregnancy_status && (
                  <Field label="Trimestre" controlId="pregnancy_trimester">
                    <Select value={formData.pregnancy_trimester} onValueChange={value => updateFormData('pregnancy_trimester', value)}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pregnancyTrimesterOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="breastfeeding_status"
                    checked={formData.breastfeeding_status}
                    onChange={e => updateFormData('breastfeeding_status', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                    title="Allaitement"
                  />
                  <Label htmlFor="breastfeeding_status">Allaitement</Label>
                </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chronic Medical History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Conditions médicales chroniques</CardTitle>
                <Button type="button" onClick={addCondition} size="sm" className="bg-[#2CB1BC] hover:bg-[#25a5a5]">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une condition
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 relative">
                    <Button
                      type="button"
                      onClick={() => removeCondition(index)}
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SearchableCombobox
                        id={`condition_name_${index}`}
                        label="Nom de la maladie"
                        value={condition.condition_name}
                        options={DISEASE_CATALOG}
                        onChange={v => updateCondition(index, 'condition_name', v)}
                        placeholder="Hypertension, Diabète type 2..."
                        required
                      />

                      <Field label="Catégorie" controlId={`category_${index}`}>
                        <Select value={condition.category} onValueChange={value => updateCondition(index, 'category', value)}>
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionCategoryOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Sévérité" controlId={`severity_${index}`}>
                        <Select value={condition.severity} onValueChange={value => updateCondition(index, 'severity', value)}>
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {severityOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Statut" controlId={`status_${index}`}>
                        <Select value={condition.status} onValueChange={value => updateCondition(index, 'status', value)}>
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionStatusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Date de diagnostic" controlId={`diagnosed_at_${index}`}>
                        <Input
                          id={`diagnosed_at_${index}`}
                          type="date"
                          value={condition.diagnosed_at}
                          onChange={e => updateCondition(index, 'diagnosed_at', e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Notes" controlId={`notes_${index}`}>
                        <Textarea
                          id={`notes_${index}`}
                          value={condition.notes}
                          onChange={e => updateCondition(index, 'notes', e.target.value)}
                          maxLength={500}
                          className={inputClass}
                          rows={2}
                        />
                      </Field>
                    </div>
                  </div>
                ))}

                {formData.conditions.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    Aucune condition chronique ajoutée. Cliquez sur "Ajouter une condition" pour commencer.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allergies & Intolerances Tab */}
          <TabsContent value="allergies" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Allergies et intolérances</CardTitle>
                <Button type="button" onClick={addAllergy} size="sm" className="bg-[#2CB1BC] hover:bg-[#25a5a5]">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une allergie
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.allergies.map((allergy, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 relative">
                    <Button
                      type="button"
                      onClick={() => removeAllergy(index)}
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SearchableCombobox
                        id={`allergen_name_${index}`}
                        label="Nom de l'allergène"
                        value={allergy.allergen_name}
                        options={ALLERGEN_CATALOG}
                        onChange={v => updateAllergy(index, 'allergen_name', v)}
                        placeholder="Pénicilline, Arachide..."
                        required
                      />

                      <Field label="Catégorie d'allergène" controlId={`allergen_category_${index}`}>
                        <Select value={allergy.allergen_category} onValueChange={value => updateAllergy(index, 'allergen_category', value)}>
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allergenCategoryOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Type de réaction" controlId={`reaction_type_${index}`}>
                        <Select value={allergy.reaction_type} onValueChange={value => updateAllergy(index, 'reaction_type', value)}>
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {reactionTypeOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Sévérité" controlId={`allergy_severity_${index}`}>
                        <Select value={allergy.severity} onValueChange={value => updateAllergy(index, 'severity', value)}>
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {severityOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Délai d'apparition" controlId={`onset_delay_${index}`}>
                        <Select value={allergy.onset_delay} onValueChange={value => updateAllergy(index, 'onset_delay', value)}>
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {onsetDelayOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </div>
                ))}

                {formData.allergies.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    Aucune allergie ajoutée. Cliquez sur "Ajouter une allergie" pour commencer.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chronic Treatments Tab */}
          <TabsContent value="treatments" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Traitements chroniques</CardTitle>
                <Button type="button" onClick={addMedication} size="sm" className="bg-[#2CB1BC] hover:bg-[#25a5a5]">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un traitement
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.medications.map((medication, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 relative">
                    <Button
                      type="button"
                      onClick={() => removeMedication(index)}
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SearchableCombobox
                        id={`medication_name_${index}`}
                        label="Médicament"
                        value={medication.medication_name}
                        options={medicationCatalog}
                        onChange={v => updateMedication(index, 'medication_name', v)}
                        placeholder="Rechercher un médicament..."
                        required
                      />

                      <Field label="Dosage" controlId={`dosage_${index}`}>
                        <Input
                          id={`dosage_${index}`}
                          value={medication.dosage}
                          onChange={e => updateMedication(index, 'dosage', e.target.value)}
                          className={inputClass}
                          placeholder="ex: 500mg"
                        />
                      </Field>

                      <Field label="Fréquence" controlId={`frequency_${index}`}>
                        <Select value={medication.frequency} onValueChange={value => updateMedication(index, 'frequency', value)}>
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencyOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Voie d'administration" controlId={`route_${index}`}>
                        <Select value={medication.route} onValueChange={value => updateMedication(index, 'route', value)}>
                          <SelectTrigger className={selectClass}>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {routeOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label="Date de début" controlId={`started_at_${index}`}>
                        <Input
                          id={`started_at_${index}`}
                          type="date"
                          value={medication.started_at}
                          onChange={e => updateMedication(index, 'started_at', e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`ongoing_${index}`}
                          checked={medication.ongoing}
                          onChange={e => updateMedication(index, 'ongoing', e.target.checked)}
                          className="w-4 h-4 accent-[#2CB1BC]"
                          title="Traitement en cours"
                        />
                        <Label htmlFor={`ongoing_${index}`}>Traitement en cours</Label>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.medications.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    Aucun traitement chronique ajouté. Cliquez sur "Ajouter un traitement" pour commencer.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lifestyle & Habits Tab */}
          <TabsContent value="lifestyle" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Habitudes de vie et facteurs de risque de base</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Tabagisme" controlId="smoking_status">
                  <Select value={formData.smoking_status} onValueChange={value => updateFormData('smoking_status', value)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {smokingStatusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Consommation d'alcool" controlId="alcohol_use">
                  <Select value={formData.alcohol_use} onValueChange={value => updateFormData('alcohol_use', value)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {alcoholUseOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Activité physique" controlId="physical_activity">
                  <Select value={formData.physical_activity} onValueChange={value => updateFormData('physical_activity', value)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {physicalActivityOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Niveau de stress" controlId="stress_level">
                  <Select value={formData.stress_level} onValueChange={value => updateFormData('stress_level', value)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stressLevelOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Qualité du sommeil" controlId="sleep_quality">
                  <Select value={formData.sleep_quality} onValueChange={value => updateFormData('sleep_quality', value)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sleepQualityOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Heures de sommeil par nuit" controlId="sleep_hours" unit="heures">
                  <Input
                    id="sleep_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.sleep_hours}
                    onChange={e => updateFormData('sleep_hours', e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <div className="flex items-center space-x-2 md:col-span-2">
                  <input type="checkbox" id="substance_use" checked={formData.substance_use}
                    onChange={e => updateFormData('substance_use', e.target.checked)} className="w-4 h-4 accent-[#2CB1BC]"
                    title="Usage de substances psychoactives" />
                  <Label htmlFor="substance_use">Usage de substances psychoactives</Label>
                </div>
                {formData.substance_use && (
                  <>
                    <Field label="Type de substance" controlId="substance_type">
                      <Input id="substance_type" value={formData.substance_type}
                        onChange={e => updateFormData('substance_type', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Fréquence" controlId="substance_frequency">
                      <Input id="substance_frequency" value={formData.substance_frequency}
                        onChange={e => updateFormData('substance_frequency', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Voie" controlId="substance_route">
                      <Select value={formData.substance_route} onValueChange={v => updateFormData('substance_route', v)}>
                        <SelectTrigger className={selectClass}><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          {routeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </>
                )}
                <div className="flex items-center space-x-2 md:col-span-2">
                  <input type="checkbox" id="prolonged_fasting" checked={formData.prolonged_fasting}
                    onChange={e => updateFormData('prolonged_fasting', e.target.checked)} className="w-4 h-4 accent-[#2CB1BC]"
                    title="Pratique du jeûne" />
                  <Label htmlFor="prolonged_fasting">Pratique du jeûne</Label>
                </div>
                {formData.prolonged_fasting && (
                  <>
                    <Field label="Type de jeûne" controlId="fasting_type">
                      <Input id="fasting_type" value={formData.fasting_type}
                        onChange={e => updateFormData('fasting_type', e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Fréquence du jeûne" controlId="fasting_frequency">
                      <Input id="fasting_frequency" value={formData.fasting_frequency}
                        onChange={e => updateFormData('fasting_frequency', e.target.value)} className={inputClass} />
                    </Field>
                  </>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="night_shift"
                    checked={formData.night_shift}
                    onChange={e => updateFormData('night_shift', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                    title="Travail de nuit/posté"
                  />
                  <Label htmlFor="night_shift">Travail de nuit/posté</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Special Risks Tab */}
          <TabsContent value="risks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cancer / Immunosuppression</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Type de condition" controlId="special_condition_type">
                  <Select value={formData.special_condition_type} onValueChange={value => updateFormData('special_condition_type', value)}>
                    <SelectTrigger className={selectClass}><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {conditionTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <SearchableCombobox id="special_diagnosis" label="Diagnostic" value={formData.special_diagnosis}
                  options={SPECIAL_DIAGNOSIS_CATALOG} onChange={v => updateFormData('special_diagnosis', v)}
                  placeholder="Cancer du sein, Leucémie..." />
                <Field label="Classification / stade" controlId="special_stage_classification">
                  <Input id="special_stage_classification" value={formData.special_stage_classification}
                    onChange={e => updateFormData('special_stage_classification', e.target.value)}
                    className={inputClass} placeholder="TNM, Stade III, M1..." />
                </Field>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="special_active_disease" checked={formData.special_active_disease}
                    onChange={e => updateFormData('special_active_disease', e.target.checked)} className="w-4 h-4 accent-[#2CB1BC]"
                    title="Maladie active" />
                  <Label htmlFor="special_active_disease">Maladie active</Label>
                </div>
                <div className="md:col-span-2">
                  <SectionTitle>Types de traitement</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {treatmentTypeOptions.map(option => (
                      <label key={option.value} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={(formData.special_treatment_types as string[]).includes(option.value)}
                          onChange={() => toggleSpecialTreatment(option.value)} className="w-4 h-4 accent-[#2CB1BC]" />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <SectionTitle>Antécédent toxicologique (profil de base)</SectionTitle>
                </div>
                <div className="flex items-center space-x-2 md:col-span-2">
                  <input type="checkbox" id="previous_intoxication" checked={formData.previous_intoxication}
                    onChange={e => updateFormData('previous_intoxication', e.target.checked)} className="w-4 h-4 accent-[#2CB1BC]"
                    title="Antécédent d'intoxication" />
                  <Label htmlFor="previous_intoxication">Antécédent d&apos;intoxication (historique, pas cas aigu)</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#2CB1BC] hover:bg-[#25a5a5] text-white"
          >
            {isLoading ? 'Sauvegarde...' : (mode === 'edit' ? 'Modifier le patient' : 'Créer le patient')}
          </Button>
        </div>
      </form>
    </div>
  )
}
