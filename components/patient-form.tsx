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

    // Special risks (from patient_lifestyle)
    diet_type: initialData?.patient_lifestyle?.[0]?.diet_type ?? '',
    sleep_hours: initialData?.patient_lifestyle?.[0]?.sleep_hours ?? '',
    night_shift: initialData?.patient_lifestyle?.[0]?.night_shift ?? false,
    sun_exposure: initialData?.patient_lifestyle?.[0]?.sun_exposure ?? '',
    prolonged_fasting: initialData?.patient_lifestyle?.[0]?.prolonged_fasting ?? false,
    restrictive_diet: initialData?.patient_lifestyle?.[0]?.restrictive_diet ?? false,
    uncontrolled_natural_products: initialData?.patient_lifestyle?.[0]?.uncontrolled_natural_products ?? false,
    blood_donor: initialData?.patient_lifestyle?.[0]?.blood_donor ?? false,
    immunodepression: initialData?.patient_lifestyle?.[0]?.immunodepression ?? 'none',
    sudden_medication_stop: initialData?.patient_lifestyle?.[0]?.sudden_medication_stop ?? false,
    regular_checkup: initialData?.patient_lifestyle?.[0]?.regular_checkup ?? true,
    self_diagnosis: initialData?.patient_lifestyle?.[0]?.self_diagnosis ?? false,
    housing_conditions: initialData?.patient_lifestyle?.[0]?.housing_conditions ?? '',
    previous_intoxication: initialData?.patient_lifestyle?.[0]?.previous_intoxication ?? false,
  })

  // Load options
  const genderOptions = useOptions('gender')
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
  const dietTypeOptions = useOptions('diet_type')
  const conditionTypeOptions = useOptions('condition_type')
  const treatmentTypeOptions = useOptions('treatment_type')

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
      conditions: prev.conditions.map((cond, i) =>
        i === index ? { ...cond, [field]: value } : cond
      )
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
      allergies: prev.allergies.map((allergy, i) =>
        i === index ? { ...allergy, [field]: value } : allergy
      )
    }))
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

    try {
      const payload = {
        ...formData,
        // Convert boolean strings to booleans
        pregnancy_status: formData.pregnancy_status === 'true' || formData.pregnancy_status === true,
        breastfeeding_status: formData.breastfeeding_status === 'true' || formData.breastfeeding_status === true,
        night_shift: formData.night_shift === 'true' || formData.night_shift === true,
        prolonged_fasting: formData.prolonged_fasting === 'true' || formData.prolonged_fasting === true,
        restrictive_diet: formData.restrictive_diet === 'true' || formData.restrictive_diet === true,
        uncontrolled_natural_products: formData.uncontrolled_natural_products === 'true' || formData.uncontrolled_natural_products === true,
        blood_donor: formData.blood_donor === 'true' || formData.blood_donor === true,
        sudden_medication_stop: formData.sudden_medication_stop === 'true' || formData.sudden_medication_stop === true,
        regular_checkup: formData.regular_checkup === 'true' || formData.regular_checkup === true,
        self_diagnosis: formData.self_diagnosis === 'true' || formData.self_diagnosis === true,
        previous_intoxication: formData.previous_intoxication === 'true' || formData.previous_intoxication === true,
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
          Formulaire de profil permanent pour le système CDSS
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
                    required
                  />
                </Field>

                <Field label="Nom" controlId="last_name" required>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={e => updateFormData('last_name', e.target.value)}
                    className={inputClass}
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

                <Field label="Genre" controlId="gender">
                  <Select value={formData.gender} onValueChange={value => updateFormData('gender', value)}>
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
                    value={formData.height}
                    onChange={e => updateFormData('height', e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <div className="md:col-span-2">
                  <SectionTitle>États physiologiques spéciaux</SectionTitle>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pregnancy_status"
                    checked={formData.pregnancy_status}
                    onChange={e => updateFormData('pregnancy_status', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                  />
                  <Label htmlFor="pregnancy_status">Enceinte</Label>
                </div>

                {formData.pregnancy_status && (
                  <Field label="Trimestre de grossesse" controlId="pregnancy_trimester">
                    <Select value={formData.pregnancy_trimester} onValueChange={value => updateFormData('pregnancy_trimester', value)}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1er trimestre</SelectItem>
                        <SelectItem value="2">2e trimestre</SelectItem>
                        <SelectItem value="3">3e trimestre</SelectItem>
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
                  />
                  <Label htmlFor="breastfeeding_status">Allaitement</Label>
                </div>
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
                      <Field label="Nom de la condition" controlId={`condition_name_${index}`} required>
                        <Input
                          id={`condition_name_${index}`}
                          value={condition.condition_name}
                          onChange={e => updateCondition(index, 'condition_name', e.target.value)}
                          className={inputClass}
                          required
                        />
                      </Field>

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
                      <Field label="Nom de l'allergène" controlId={`allergen_name_${index}`} required>
                        <Input
                          id={`allergen_name_${index}`}
                          value={allergy.allergen_name}
                          onChange={e => updateAllergy(index, 'allergen_name', e.target.value)}
                          className={inputClass}
                          required
                        />
                      </Field>

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
                      <Field label="Nom du médicament" controlId={`medication_name_${index}`} required>
                        <Input
                          id={`medication_name_${index}`}
                          value={medication.medication_name}
                          onChange={e => updateMedication(index, 'medication_name', e.target.value)}
                          className={inputClass}
                          required
                        />
                      </Field>

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

                <Field label="Type d'alimentation" controlId="diet_type">
                  <Select value={formData.diet_type} onValueChange={value => updateFormData('diet_type', value)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dietTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="night_shift"
                    checked={formData.night_shift}
                    onChange={e => updateFormData('night_shift', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
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
                <CardTitle className="text-lg">Facteurs de risque spéciaux et conditions particulières</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <SectionTitle>Conditions médicales spéciales</SectionTitle>
                </div>

                <Field label="Immunodépression" controlId="immunodepression">
                  <Select value={formData.immunodepression} onValueChange={value => updateFormData('immunodepression', value)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {conditionTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="md:col-span-2">
                  <SectionTitle>Habitudes et comportements à risque</SectionTitle>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="prolonged_fasting"
                    checked={formData.prolonged_fasting}
                    onChange={e => updateFormData('prolonged_fasting', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                  />
                  <Label htmlFor="prolonged_fasting">Jeûne prolongé régulier</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="restrictive_diet"
                    checked={formData.restrictive_diet}
                    onChange={e => updateFormData('restrictive_diet', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                  />
                  <Label htmlFor="restrictive_diet">Régime restrictif</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="uncontrolled_natural_products"
                    checked={formData.uncontrolled_natural_products}
                    onChange={e => updateFormData('uncontrolled_natural_products', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                  />
                  <Label htmlFor="uncontrolled_natural_products">Produits naturels non contrôlés</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="blood_donor"
                    checked={formData.blood_donor}
                    onChange={e => updateFormData('blood_donor', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                  />
                  <Label htmlFor="blood_donor">Donneur de sang régulier</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sudden_medication_stop"
                    checked={formData.sudden_medication_stop}
                    onChange={e => updateFormData('sudden_medication_stop', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                  />
                  <Label htmlFor="sudden_medication_stop">Arrêt brutal de médicaments</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="self_diagnosis"
                    checked={formData.self_diagnosis}
                    onChange={e => updateFormData('self_diagnosis', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                  />
                  <Label htmlFor="self_diagnosis">Auto-diagnostic fréquent</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="previous_intoxication"
                    checked={formData.previous_intoxication}
                    onChange={e => updateFormData('previous_intoxication', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                  />
                  <Label htmlFor="previous_intoxication">Antécédent d'intoxication</Label>
                </div>

                <div className="md:col-span-2">
                  <SectionTitle>Conditions environnementales</SectionTitle>
                </div>

                <Field label="Conditions de logement" controlId="housing_conditions">
                  <Input
                    id="housing_conditions"
                    value={formData.housing_conditions}
                    onChange={e => updateFormData('housing_conditions', e.target.value)}
                    className={inputClass}
                    placeholder="ex: Humidité, moisissures, animaux..."
                  />
                </Field>

                <Field label="Exposition solaire" controlId="sun_exposure">
                  <Select value={formData.sun_exposure} onValueChange={value => updateFormData('sun_exposure', value)}>
                    <SelectTrigger className={selectClass}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="moderate">Modérée</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="extreme">Extrême</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="md:col-span-2">
                  <SectionTitle>Suivi médical</SectionTitle>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="regular_checkup"
                    checked={formData.regular_checkup}
                    onChange={e => updateFormData('regular_checkup', e.target.checked)}
                    className="w-4 h-4 accent-[#2CB1BC]"
                  />
                  <Label htmlFor="regular_checkup">Consultations médicales régulières</Label>
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

  // Options hooks
  const genderOptions = useOptions('gender')
  const pregnancyStatusOptions = useOptions('pregnancy_status')
  const breastfeedingStatusOptions = useOptions('breastfeeding_status')
  const smokingStatusOptions = useOptions('smoking_status')
  const pregnancyTrimesterOptions = useOptions('pregnancy_trimester')
  const breastfeedingTypeOptions = useOptions('breastfeeding_type')
  const feverStatusOptions = useOptions('fever_status')
  const consciousnessOptions = useOptions('consciousness')
  const orientationOptions = useOptions('orientation')
  const diabetesTypeOptions = useOptions('diabetes_type')
  const alcoholUseOptions = useOptions('alcohol_use')
  const physicalActivityOptions = useOptions('physical_activity')
  const dietTypeOptions = useOptions('diet_type')

  const updateField = (name: string, value: any) => {
    setF(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const extendedProfile = {
        // Pregnancy/Breastfeeding
        pregnancyTrimester: f.pregnancyTrimester,
        pregnancyWeeks: f.pregnancyWeeks,
        breastfeedingStatus: f.breastfeedingStatus,
        infantAge: f.infantAge,
        breastfeedingType: f.breastfeedingType,

        // Clinical vitals
        bloodPressure: f.bloodPressure,
        heartRate: f.heartRate,
        heartRateSymptoms: f.heartRateSymptoms,
        temperature: f.temperature,
        temperatureSensation: f.temperatureSensation,
        respiratoryRate: f.respiratoryRate,
        oxygenSaturation: f.oxygenSaturation,
        consciousnessState: f.consciousnessState,

        // Medical history
        cardiovascularDisease: f.cardiovascularDisease,
        cardiovascularDetails: f.cardiovascularDetails,
        diabetes: f.diabetes,
        diabetesType: f.diabetesType,
        diabetesDuration: f.diabetesDuration,
        diabetesTreatment: f.diabetesTreatment,
        asthmaCOPD: f.asthmaCOPD,
        asthmaCOPDDetails: f.asthmaCOPDDetails,
        neurologicalDisease: f.neurologicalDisease,
        neurologicalDetails: f.neurologicalDetails,
        allergies: f.allergies,
        allergyDetails: f.allergyDetails,
        intoxication: f.intoxication,
        intoxicationDetails: f.intoxicationDetails,
        specialConditions: f.specialConditions,
        specialConditionsDetails: f.specialConditionsDetails,
        cancer: f.cancer,
        cancerDetails: f.cancerDetails,

        // Biological functions
        creatinine: f.creatinine,
        creatinineClearance: f.creatinineClearance,
        renalInsufficiency: f.renalInsufficiency,
        renalDetails: f.renalDetails,
        asatAlat: f.asatAlat,
        bilirubin: f.bilirubin,
        hepaticInsufficiency: f.hepaticInsufficiency,
        hepaticDetails: f.hepaticDetails,

        // Current treatments
        currentMedications: f.currentMedications,
        automedication: f.automedication,
        automedicationDetails: f.automedicationDetails,
        phytotherapy: f.phytotherapy,
        phytotherapyDetails: f.phytotherapyDetails,
        allergiesIntolerances: f.allergiesIntolerances,

        // Lifestyle habits
        smokingStatus: f.smokingStatus,
        smokingDetails: f.smokingDetails,
        passiveSmoking: f.passiveSmoking,
        alcoholUse: f.alcoholUse,
        alcoholDetails: f.alcoholDetails,
        substanceUse: f.substanceUse,
        substanceDetails: f.substanceDetails,
        toxicExposure: f.toxicExposure,
        toxicExposureDetails: f.toxicExposureDetails,
        physicalActivity: f.physicalActivity,
        physicalActivityDetails: f.physicalActivityDetails,
        dietType: f.dietType,
        dietDetails: f.dietDetails,
        stressLevel: f.stressLevel,
        stressDetails: f.stressDetails,
        sleepQuality: f.sleepQuality,
        sleepHours: f.sleepHours,
        insomnia: f.insomnia,
        fragmentedSleep: f.fragmentedSleep,
        daytimeSleepiness: f.daytimeSleepiness,
        nightWork: f.nightWork,
        nightWorkDetails: f.nightWorkDetails,
        sunExposure: f.sunExposure,
        vitaminD: f.vitaminD,
        outdoorWork: f.outdoorWork,
        sunProtection: f.sunProtection,
        medicationWithdrawal: f.medicationWithdrawal,
        withdrawalDetails: f.withdrawalDetails,

        // Medical interactions
        cyp450Inhibitors: f.cyp450Inhibitors,
        qtLongRisk: f.qtLongRisk,
        qtLongDetails: f.qtLongDetails,
        serotoninRisk: f.serotoninRisk,
        serotoninDetails: f.serotoninDetails,
        hiddenAutomedication: f.hiddenAutomedication,
        hiddenMeds: f.hiddenMeds,

        // Phytotherapy
        phytotherapyScientificName: f.phytotherapyScientificName,
        phytotherapyPartUsed: f.phytotherapyPartUsed,
        phytotherapyConcentration: f.phytotherapyConcentration,
        phytotherapyOrigin: f.phytotherapyOrigin,
        phytotherapyCypInteraction: f.phytotherapyCypInteraction,

        // Clinical indication
        consultationReason: f.consultationReason,
        mainSymptoms: f.mainSymptoms,

        // Toxicological data
        suspectedSubstance: f.suspectedSubstance,
        exposureType: f.exposureType,
        estimatedDose: f.estimatedDose,
        exposureTime: f.exposureTime,
        exposureRoute: f.exposureRoute,
        toxicSymptoms: f.toxicSymptoms,
        symptomOnset: f.symptomOnset,
        symptomDelay: f.symptomDelay,
        clinicalEvolution: f.clinicalEvolution,

        // Biological data
        biologicalData: f.biologicalData,
      }

      const payload = {
        first_name: f.firstName,
        last_name: f.lastName,
        date_of_birth: f.dateOfBirth,
        gender: f.gender,
        medical_record_number: f.medicalRecordNumber,
        weight: f.weight ? parseFloat(f.weight) : null,
        height: f.height ? parseFloat(f.height) : null,
        pregnancy_status: f.pregnancyStatus,
        extended_profile: extendedProfile,
      }

      const url = patientId ? `/api/patients/${patientId}` : '/api/patients'
      const method = patientId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save patient')
      }

      router.push('/dashboard/patients')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const age = useMemo(() => {
    if (!f.dateOfBirth) return null
    const birth = new Date(f.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }, [f.dateOfBirth])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="demographics" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="demographics">Démographiques</TabsTrigger>
          <TabsTrigger value="clinical">Clinique</TabsTrigger>
          <TabsTrigger value="history">Antécédents</TabsTrigger>
          <TabsTrigger value="lifestyle">Habitudes</TabsTrigger>
          <TabsTrigger value="treatments">Traitements</TabsTrigger>
          <TabsTrigger value="biological">Biologiques</TabsTrigger>
          <TabsTrigger value="toxicology">Toxicologie</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations démographiques</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Prénom" controlId="firstName" required>
                <input
                  id="firstName"
                  type="text"
                  className={inputClass}
                  value={f.firstName}
                  onChange={e => updateField('firstName', e.target.value)}
                  required
                />
              </Field>

              <Field label="Nom" controlId="lastName" required>
                <input
                  id="lastName"
                  type="text"
                  className={inputClass}
                  value={f.lastName}
                  onChange={e => updateField('lastName', e.target.value)}
                  required
                />
              </Field>

              <Field label="Date de naissance" controlId="dateOfBirth" required>
                <input
                  id="dateOfBirth"
                  type="date"
                  className={inputClass}
                  value={f.dateOfBirth}
                  onChange={e => updateField('dateOfBirth', e.target.value)}
                  required
                />
              </Field>

              <Field label="Âge calculé" controlId="age">
                <input
                  id="age"
                  type="text"
                  className={`${inputClass} bg-slate-50`}
                  value={age ? `${age} ans` : ''}
                  disabled
                />
              </Field>

              <Field label="Sexe" controlId="gender" required>
                <select
                  id="gender"
                  className={selectClass}
                  value={f.gender}
                  onChange={e => updateField('gender', e.target.value)}
                  required
                >
                  <option value="">Sélectionner</option>
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Numéro de dossier médical" controlId="medicalRecordNumber">
                <input
                  id="medicalRecordNumber"
                  type="text"
                  className={inputClass}
                  value={f.medicalRecordNumber}
                  onChange={e => updateField('medicalRecordNumber', e.target.value)}
                />
              </Field>

              <Field label="Poids" controlId="weight" unit="kg">
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={f.weight}
                  onChange={e => updateField('weight', e.target.value)}
                />
              </Field>

              <Field label="Taille" controlId="height" unit="cm">
                <input
                  id="height"
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={f.height}
                  onChange={e => updateField('height', e.target.value)}
                />
              </Field>

              {f.gender === 'Femme' && (
                <>
                  <RadioField
                    label="Statut de grossesse"
                    name="pregnancyStatus"
                    value={f.pregnancyStatus}
                    options={pregnancyStatusOptions}
                    onChange={updateField}
                  />

                  {f.pregnancyStatus === 'oui' && (
                    <>
                      <Field label="Trimestre" controlId="pregnancyTrimester">
                        <select
                          id="pregnancyTrimester"
                          className={selectClass}
                          value={f.pregnancyTrimester}
                          onChange={e => updateField('pregnancyTrimester', e.target.value)}
                        >
                          <option value="">Sélectionner</option>
                          {pregnancyTrimesterOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Durée de grossesse" controlId="pregnancyWeeks" unit="semaines">
                        <input
                          id="pregnancyWeeks"
                          type="number"
                          className={inputClass}
                          value={f.pregnancyWeeks}
                          onChange={e => updateField('pregnancyWeeks', e.target.value)}
                        />
                      </Field>
                    </>
                  )}

                  <RadioField
                    label="Allaitement"
                    name="breastfeedingStatus"
                    value={f.breastfeedingStatus}
                    options={breastfeedingStatusOptions}
                    onChange={updateField}
                  />

                  {f.breastfeedingStatus === 'oui' && (
                    <>
                      <Field label="Âge du nourrisson" controlId="infantAge" unit="mois">
                        <input
                          id="infantAge"
                          type="number"
                          className={inputClass}
                          value={f.infantAge}
                          onChange={e => updateField('infantAge', e.target.value)}
                        />
                      </Field>

                      <Field label="Type d'allaitement" controlId="breastfeedingType">
                        <select
                          id="breastfeedingType"
                          className={selectClass}
                          value={f.breastfeedingType}
                          onChange={e => updateField('breastfeedingType', e.target.value)}
                        >
                          <option value="">Sélectionner</option>
                          {breastfeedingTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paramètres cliniques généraux</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Tension artérielle" controlId="bloodPressure" unit="ex: 13/8">
                <input
                  id="bloodPressure"
                  type="text"
                  className={inputClass}
                  value={f.bloodPressure}
                  onChange={e => updateField('bloodPressure', e.target.value)}
                  placeholder="13/8"
                />
              </Field>

              <Field label="Fréquence cardiaque" controlId="heartRate" unit="bpm">
                <input
                  id="heartRate"
                  type="number"
                  className={inputClass}
                  value={f.heartRate}
                  onChange={e => updateField('heartRate', e.target.value)}
                />
              </Field>

              <Field label="Symptômes cardiaques" controlId="heartRateSymptoms">
                <input
                  id="heartRateSymptoms"
                  type="text"
                  className={inputClass}
                  value={f.heartRateSymptoms}
                  onChange={e => updateField('heartRateSymptoms', e.target.value)}
                  placeholder="palpitations, tachycardie..."
                />
              </Field>

              <Field label="Température" controlId="temperature" unit="°C">
                <input
                  id="temperature"
                  type="number"
                  step="0.1"
                  className={inputClass}
                  value={f.temperature}
                  onChange={e => updateField('temperature', e.target.value)}
                />
              </Field>

              <Field label="Sensation de fièvre" controlId="temperatureSensation">
                <select
                  id="temperatureSensation"
                  className={selectClass}
                  value={f.temperatureSensation}
                  onChange={e => updateField('temperatureSensation', e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  {feverStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fréquence respiratoire" controlId="respiratoryRate">
                <select
                  id="respiratoryRate"
                  className={selectClass}
                  value={f.respiratoryRate}
                  onChange={e => updateField('respiratoryRate', e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  {consciousnessOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="SpO₂ - Saturation O₂" controlId="oxygenSaturation" unit="%">
                <input
                  id="oxygenSaturation"
                  type="number"
                  className={inputClass}
                  value={f.oxygenSaturation}
                  onChange={e => updateField('oxygenSaturation', e.target.value)}
                />
              </Field>

              <Field label="État de conscience" controlId="consciousnessState">
                <select
                  id="consciousnessState"
                  className={selectClass}
                  value={f.consciousnessState}
                  onChange={e => updateField('consciousnessState', e.target.value)}
                >
                  <option value="">Sélectionner</option>
                  {orientationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Antécédents médicaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CheckField
                  label="Maladies cardiovasculaires"
                  name="cardiovascularDisease"
                  value={f.cardiovascularDisease}
                  onChange={updateField}
                />
                {f.cardiovascularDisease && (
                  <Field label="Détails cardiovasculaires" controlId="cardiovascularDetails">
                    <textarea
                      id="cardiovascularDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.cardiovascularDetails}
                      onChange={e => updateField('cardiovascularDetails', e.target.value)}
                      placeholder="Type de maladie, date, traitement, évolution..."
                    />
                  </Field>
                )}

                <CheckField
                  label="Diabète"
                  name="diabetes"
                  value={f.diabetes}
                  onChange={updateField}
                />
                {f.diabetes && (
                  <>
                    <Field label="Type de diabète" controlId="diabetesType">
                      <select
                        id="diabetesType"
                        className={selectClass}
                        value={f.diabetesType}
                        onChange={e => updateField('diabetesType', e.target.value)}
                      >
                        <option value="">Sélectionner</option>
                        {diabetesTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Ancienneté" controlId="diabetesDuration">
                      <input
                        id="diabetesDuration"
                        type="text"
                        className={inputClass}
                        value={f.diabetesDuration}
                        onChange={e => updateField('diabetesDuration', e.target.value)}
                        placeholder="ex: 5 ans"
                      />
                    </Field>
                    <Field label="Traitement" controlId="diabetesTreatment">
                      <input
                        id="diabetesTreatment"
                        type="text"
                        className={inputClass}
                        value={f.diabetesTreatment}
                        onChange={e => updateField('diabetesTreatment', e.target.value)}
                        placeholder="régime, insuline, metformine..."
                      />
                    </Field>
                  </>
                )}

                <CheckField
                  label="Asthme/BPCO"
                  name="asthmaCOPD"
                  value={f.asthmaCOPD}
                  onChange={updateField}
                />
                {f.asthmaCOPD && (
                  <Field label="Détails Asthme/BPCO" controlId="asthmaCOPDDetails">
                    <textarea
                      id="asthmaCOPDDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.asthmaCOPDDetails}
                      onChange={e => updateField('asthmaCOPDDetails', e.target.value)}
                      placeholder="Fréquence, traitement, dernière crise..."
                    />
                  </Field>
                )}

                <CheckField
                  label="Maladies neurologiques"
                  name="neurologicalDisease"
                  value={f.neurologicalDisease}
                  onChange={updateField}
                />
                {f.neurologicalDisease && (
                  <Field label="Détails neurologiques" controlId="neurologicalDetails">
                    <textarea
                      id="neurologicalDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.neurologicalDetails}
                      onChange={e => updateField('neurologicalDetails', e.target.value)}
                      placeholder="Type de maladie, date, séquelles..."
                    />
                  </Field>
                )}

                <CheckField
                  label="Allergies"
                  name="allergies"
                  value={f.allergies}
                  onChange={updateField}
                />
                {f.allergies && (
                  <Field label="Détails allergies" controlId="allergyDetails">
                    <textarea
                      id="allergyDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.allergyDetails}
                      onChange={e => updateField('allergyDetails', e.target.value)}
                      placeholder="Substance, type de réaction, durée..."
                    />
                  </Field>
                )}

                <CheckField
                  label="Intoxication/surdosage"
                  name="intoxication"
                  value={f.intoxication}
                  onChange={updateField}
                />
                {f.intoxication && (
                  <Field label="Détails intoxication" controlId="intoxicationDetails">
                    <textarea
                      id="intoxicationDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.intoxicationDetails}
                      onChange={e => updateField('intoxicationDetails', e.target.value)}
                      placeholder="Substance, dose, circonstances, prise en charge..."
                    />
                  </Field>
                )}

                <CheckField
                  label="Terrain particulier (immunodépression, cancer)"
                  name="specialConditions"
                  value={f.specialConditions}
                  onChange={updateField}
                />
                {f.specialConditions && (
                  <Field label="Détails terrain particulier" controlId="specialConditionsDetails">
                    <textarea
                      id="specialConditionsDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.specialConditionsDetails}
                      onChange={e => updateField('specialConditionsDetails', e.target.value)}
                      placeholder="Type, date, durée, traitement..."
                    />
                  </Field>
                )}

                <CheckField
                  label="Cancers/Tumeurs"
                  name="cancer"
                  value={f.cancer}
                  onChange={updateField}
                />
                {f.cancer && (
                  <Field label="Détails cancer/tumeur" controlId="cancerDetails">
                    <textarea
                      id="cancerDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.cancerDetails}
                      onChange={e => updateField('cancerDetails', e.target.value)}
                      placeholder="Type, classification TNM, traitement, évolution..."
                    />
                  </Field>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Habitudes personnelles et mode de vie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Tabagisme" controlId="smokingStatus">
                  <select
                    id="smokingStatus"
                    className={selectClass}
                    value={f.smokingStatus}
                    onChange={e => updateField('smokingStatus', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    {smokingStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {(f.smokingStatus === 'oui' || f.smokingStatus === 'ex') && (
                  <Field label="Détails tabagisme" controlId="smokingDetails">
                    <textarea
                      id="smokingDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.smokingDetails}
                      onChange={e => updateField('smokingDetails', e.target.value)}
                      placeholder="Type, quantité, durée, âge de début..."
                    />
                  </Field>
                )}

                <CheckField
                  label="Tabagisme passif"
                  name="passiveSmoking"
                  value={f.passiveSmoking}
                  onChange={updateField}
                />

                <Field label="Consommation d'alcool" controlId="alcoholUse">
                  <select
                    id="alcoholUse"
                    className={selectClass}
                    value={f.alcoholUse}
                    onChange={e => updateField('alcoholUse', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    {alcoholUseOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {(f.alcoholUse === 'oui' || f.alcoholUse === 'occasionnel' || f.alcoholUse === 'ex') && (
                  <Field label="Détails alcool" controlId="alcoholDetails">
                    <textarea
                      id="alcoholDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.alcoholDetails}
                      onChange={e => updateField('alcoholDetails', e.target.value)}
                      placeholder="Fréquence, quantité, durée..."
                    />
                  </Field>
                )}

                <CheckField
                  label="Usage de substances psychoactives"
                  name="substanceUse"
                  value={f.substanceUse}
                  onChange={updateField}
                />

                {f.substanceUse && (
                  <Field label="Détails substances" controlId="substanceDetails">
                    <textarea
                      id="substanceDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.substanceDetails}
                      onChange={e => updateField('substanceDetails', e.target.value)}
                      placeholder="Substance, mode d'administration, fréquence, durée..."
                    />
                  </Field>
                )}

                <CheckField
                  label="Exposition aux toxiques/métaux lourds"
                  name="toxicExposure"
                  value={f.toxicExposure}
                  onChange={updateField}
                />

                {f.toxicExposure && (
                  <Field label="Détails exposition toxique" controlId="toxicExposureDetails">
                    <textarea
                      id="toxicExposureDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.toxicExposureDetails}
                      onChange={e => updateField('toxicExposureDetails', e.target.value)}
                      placeholder="Lieu, durée, produit, symptômes associés..."
                    />
                  </Field>
                )}

                <Field label="Activité physique" controlId="physicalActivity">
                  <select
                    id="physicalActivity"
                    className={selectClass}
                    value={f.physicalActivity}
                    onChange={e => updateField('physicalActivity', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    {physicalActivityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {f.physicalActivity === 'oui' && (
                  <Field label="Détails activité physique" controlId="physicalActivityDetails">
                    <textarea
                      id="physicalActivityDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.physicalActivityDetails}
                      onChange={e => updateField('physicalActivityDetails', e.target.value)}
                      placeholder="Type, fréquence, durée, intensité..."
                    />
                  </Field>
                )}

                <Field label="Régime alimentaire" controlId="dietType">
                  <select
                    id="dietType"
                    className={selectClass}
                    value={f.dietType}
                    onChange={e => updateField('dietType', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    <option value="normal">Normal</option>
                    <option value="particulier">Particulier</option>
                  </select>
                </Field>

                {f.dietType === 'particulier' && (
                  <Field label="Détails régime" controlId="dietDetails">
                    <textarea
                      id="dietDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.dietDetails}
                      onChange={e => updateField('dietDetails', e.target.value)}
                      placeholder="Type de régime, depuis quand..."
                    />
                  </Field>
                )}

                <Field label="Niveau de stress chronique" controlId="stressLevel">
                  <select
                    id="stressLevel"
                    className={selectClass}
                    value={f.stressLevel}
                    onChange={e => updateField('stressLevel', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    <option value="faible">Faible</option>
                    <option value="modere">Modéré</option>
                    <option value="eleve">Élevé</option>
                  </select>
                </Field>

                {f.stressLevel && f.stressLevel !== '' && (
                  <Field label="Détails stress" controlId="stressDetails">
                    <textarea
                      id="stressDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.stressDetails}
                      onChange={e => updateField('stressDetails', e.target.value)}
                      placeholder="Depuis quand, cause, impact..."
                    />
                  </Field>
                )}

                <Field label="Qualité du sommeil" controlId="sleepQuality">
                  <select
                    id="sleepQuality"
                    className={selectClass}
                    value={f.sleepQuality}
                    onChange={e => updateField('sleepQuality', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    <option value="bonne">Bonne</option>
                    <option value="mauvaise">Mauvaise</option>
                  </select>
                </Field>

                <Field label="Heures de sommeil par nuit" controlId="sleepHours">
                  <input
                    id="sleepHours"
                    type="number"
                    step="0.5"
                    className={inputClass}
                    value={f.sleepHours}
                    onChange={e => updateField('sleepHours', e.target.value)}
                  />
                </Field>

                <CheckField
                  label="Insomnie"
                  name="insomnia"
                  value={f.insomnia}
                  onChange={updateField}
                />

                <CheckField
                  label="Sommeil fragmenté"
                  name="fragmentedSleep"
                  value={f.fragmentedSleep}
                  onChange={updateField}
                />

                <CheckField
                  label="Somnolence diurne"
                  name="daytimeSleepiness"
                  value={f.daytimeSleepiness}
                  onChange={updateField}
                />

                <CheckField
                  label="Travail de nuit/horaires irréguliers"
                  name="nightWork"
                  value={f.nightWork}
                  onChange={updateField}
                />

                {f.nightWork && (
                  <Field label="Détails travail de nuit" controlId="nightWorkDetails">
                    <textarea
                      id="nightWorkDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.nightWorkDetails}
                      onChange={e => updateField('nightWorkDetails', e.target.value)}
                      placeholder="Depuis quand, impact..."
                    />
                  </Field>
                )}

                <Field label="Exposition au soleil" controlId="sunExposure">
                  <select
                    id="sunExposure"
                    className={selectClass}
                    value={f.sunExposure}
                    onChange={e => updateField('sunExposure', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    <option value="faible">Faible</option>
                    <option value="moderee">Modérée</option>
                    <option value="forte">Forte</option>
                  </select>
                </Field>

                <Field label="Vitamine D" controlId="vitaminD" unit="ng/mL">
                  <input
                    id="vitaminD"
                    type="number"
                    step="0.1"
                    className={inputClass}
                    value={f.vitaminD}
                    onChange={e => updateField('vitaminD', e.target.value)}
                  />
                </Field>

                <CheckField
                  label="Travail extérieur"
                  name="outdoorWork"
                  value={f.outdoorWork}
                  onChange={updateField}
                />

                <CheckField
                  label="Protection solaire"
                  name="sunProtection"
                  value={f.sunProtection}
                  onChange={updateField}
                />

                <CheckField
                  label="Arrêt brutal de médicaments"
                  name="medicationWithdrawal"
                  value={f.medicationWithdrawal}
                  onChange={updateField}
                />

                {f.medicationWithdrawal && (
                  <Field label="Détails arrêt médicamenteux" controlId="withdrawalDetails">
                    <textarea
                      id="withdrawalDetails"
                      className={`${inputClass} min-h-[80px]`}
                      value={f.withdrawalDetails}
                      onChange={e => updateField('withdrawalDetails', e.target.value)}
                      placeholder="Médicament, date d'arrêt, raison, symptômes..."
                    />
                  </Field>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Traitements en cours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field label="Médicaments en cours" controlId="currentMedications">
                <textarea
                  id="currentMedications"
                  className={`${inputClass} min-h-[100px]`}
                  value={f.currentMedications}
                  onChange={e => updateField('currentMedications', e.target.value)}
                  placeholder="Liste complète des médicaments: nom, dose, fréquence, voie, durée..."
                />
              </Field>

              <CheckField
                label="Automédication"
                name="automedication"
                value={f.automedication}
                onChange={updateField}
              />

              {f.automedication && (
                <Field label="Détails automédication" controlId="automedicationDetails">
                  <textarea
                    id="automedicationDetails"
                    className={`${inputClass} min-h-[80px]`}
                    value={f.automedicationDetails}
                    onChange={e => updateField('automedicationDetails', e.target.value)}
                    placeholder="Médicaments pris sans prescription..."
                  />
                </Field>
              )}

              <CheckField
                label="Phytothérapie"
                name="phytotherapy"
                value={f.phytotherapy}
                onChange={updateField}
              />

              {f.phytotherapy && (
                <Field label="Détails phytothérapie" controlId="phytotherapyDetails">
                  <textarea
                    id="phytotherapyDetails"
                    className={`${inputClass} min-h-[80px]`}
                    value={f.phytotherapyDetails}
                    onChange={e => updateField('phytotherapyDetails', e.target.value)}
                    placeholder="Plantes utilisées, forme, fréquence..."
                  />
                </Field>
              )}

              <Field label="Allergies et intolérances" controlId="allergiesIntolerances">
                <textarea
                  id="allergiesIntolerances"
                  className={`${inputClass} min-h-[80px]`}
                  value={f.allergiesIntolerances}
                  onChange={e => updateField('allergiesIntolerances', e.target.value)}
                  placeholder="Temps d'apparition, degré de gravité..."
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biological" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fonctions biologiques essentielles</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionTitle>Fonction rénale</SectionTitle>

              <Field label="Créatinine" controlId="creatinine" unit="µmol/L ou mg/dL">
                <input
                  id="creatinine"
                  type="text"
                  className={inputClass}
                  value={f.creatinine}
                  onChange={e => updateField('creatinine', e.target.value)}
                  placeholder="Résultats d'analyse"
                />
              </Field>

              <Field label="Clairance de la créatinine" controlId="creatinineClearance" unit="mL/min">
                <input
                  id="creatinineClearance"
                  type="text"
                  className={inputClass}
                  value={f.creatinineClearance}
                  onChange={e => updateField('creatinineClearance', e.target.value)}
                  placeholder="Calculée"
                />
              </Field>

              <CheckField
                label="Insuffisance rénale"
                name="renalInsufficiency"
                value={f.renalInsufficiency}
                onChange={updateField}
              />

              {f.renalInsufficiency && (
                <Field label="Détails insuffisance rénale" controlId="renalDetails">
                  <textarea
                    id="renalDetails"
                    className={`${inputClass} min-h-[80px]`}
                    value={f.renalDetails}
                    onChange={e => updateField('renalDetails', e.target.value)}
                    placeholder="Stade, date, cause, traitement, dialyse..."
                  />
                </Field>
              )}

              <SectionTitle>Fonction hépatique</SectionTitle>

              <Field label="ASAT/ALAT" controlId="asatAlat" unit="UI/L">
                <input
                  id="asatAlat"
                  type="text"
                  className={inputClass}
                  value={f.asatAlat}
                  onChange={e => updateField('asatAlat', e.target.value)}
                  placeholder="Résultats d'analyse"
                />
              </Field>

              <Field label="Bilirubine" controlId="bilirubin" unit="µmol/L ou mg/dL">
                <input
                  id="bilirubin"
                  type="text"
                  className={inputClass}
                  value={f.bilirubin}
                  onChange={e => updateField('bilirubin', e.target.value)}
                  placeholder="Résultats d'analyse"
                />
              </Field>

              <CheckField
                label="Insuffisance hépatique"
                name="hepaticInsufficiency"
                value={f.hepaticInsufficiency}
                onChange={updateField}
              />

              {f.hepaticInsufficiency && (
                <Field label="Détails insuffisance hépatique" controlId="hepaticDetails">
                  <textarea
                    id="hepaticDetails"
                    className={`${inputClass} min-h-[80px]`}
                    value={f.hepaticDetails}
                    onChange={e => updateField('hepaticDetails', e.target.value)}
                    placeholder="Cause, ancienneté, sévérité, évolution..."
                  />
                </Field>
              )}

              <SectionTitle>Données biologiques complémentaires</SectionTitle>

              <div className="col-span-full">
                <Field label="Valeurs biologiques" controlId="biologicalData">
                  <textarea
                    id="biologicalData"
                    className={`${inputClass} min-h-[100px]`}
                    value={f.biologicalData}
                    onChange={e => updateField('biologicalData', e.target.value)}
                    placeholder="Valeurs disponibles + date (plus récente possible)..."
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="toxicology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Données toxicologiques actuelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Substance suspectée" controlId="suspectedSubstance">
                  <input
                    id="suspectedSubstance"
                    type="text"
                    className={inputClass}
                    value={f.suspectedSubstance}
                    onChange={e => updateField('suspectedSubstance', e.target.value)}
                    placeholder="Médicament, produit chimique, plante, drogue..."
                  />
                </Field>

                <Field label="Type d'exposition" controlId="exposureType">
                  <select
                    id="exposureType"
                    className={selectClass}
                    value={f.exposureType}
                    onChange={e => updateField('exposureType', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    <option value="aigue">Aiguë</option>
                    <option value="chronique">Chronique</option>
                  </select>
                </Field>

                <Field label="Dose estimée" controlId="estimatedDose">
                  <input
                    id="estimatedDose"
                    type="text"
                    className={inputClass}
                    value={f.estimatedDose}
                    onChange={e => updateField('estimatedDose', e.target.value)}
                    placeholder="µg, mg, g..."
                  />
                </Field>

                <Field label="Heure de prise" controlId="exposureTime">
                  <input
                    id="exposureTime"
                    type="datetime-local"
                    className={inputClass}
                    value={f.exposureTime}
                    onChange={e => updateField('exposureTime', e.target.value)}
                  />
                </Field>

                <Field label="Voie d'exposition" controlId="exposureRoute">
                  <select
                    id="exposureRoute"
                    className={selectClass}
                    value={f.exposureRoute}
                    onChange={e => updateField('exposureRoute', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    <option value="orale">Orale</option>
                    <option value="injectable">Injectable</option>
                    <option value="inhalation">Inhalation</option>
                    <option value="cutanee">Cutanée</option>
                  </select>
                </Field>

                <Field label="Symptômes observés" controlId="toxicSymptoms">
                  <textarea
                    id="toxicSymptoms"
                    className={`${inputClass} min-h-[100px]`}
                    value={f.toxicSymptoms}
                    onChange={e => updateField('toxicSymptoms', e.target.value)}
                    placeholder="Liste des symptômes digestifs, neurologiques, respiratoires..."
                  />
                </Field>

                <Field label="Heure de début des symptômes" controlId="symptomOnset">
                  <input
                    id="symptomOnset"
                    type="datetime-local"
                    className={inputClass}
                    value={f.symptomOnset}
                    onChange={e => updateField('symptomOnset', e.target.value)}
                  />
                </Field>

                <Field label="Délai depuis exposition" controlId="symptomDelay">
                  <input
                    id="symptomDelay"
                    type="text"
                    className={inputClass}
                    value={f.symptomDelay}
                    onChange={e => updateField('symptomDelay', e.target.value)}
                    placeholder="Minutes, heures, jours..."
                  />
                </Field>

                <Field label="Évolution clinique" controlId="clinicalEvolution">
                  <select
                    id="clinicalEvolution"
                    className={selectClass}
                    value={f.clinicalEvolution}
                    onChange={e => updateField('clinicalEvolution', e.target.value)}
                  >
                    <option value="">Sélectionner</option>
                    <option value="stable">Stable</option>
                    <option value="amelioration">Amélioration</option>
                    <option value="aggravation">Aggravation</option>
                  </select>
                </Field>
              </div>

              <SectionTitle>Motif de consultation actuel</SectionTitle>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Raison principale de consultation" controlId="consultationReason">
                  <textarea
                    id="consultationReason"
                    className={`${inputClass} min-h-[80px]`}
                    value={f.consultationReason}
                    onChange={e => updateField('consultationReason', e.target.value)}
                    placeholder="Douleur, fièvre, intoxication, difficulté respiratoire..."
                  />
                </Field>

                <Field label="Symptômes principaux" controlId="mainSymptoms">
                  <textarea
                    id="mainSymptoms"
                    className={`${inputClass} min-h-[80px]`}
                    value={f.mainSymptoms}
                    onChange={e => updateField('mainSymptoms', e.target.value)}
                    placeholder="Description des symptômes, intensité, localisation..."
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : mode === 'edit' ? 'Mettre à jour' : 'Créer le patient'}
        </Button>
      </div>
    </form>
  )
}
