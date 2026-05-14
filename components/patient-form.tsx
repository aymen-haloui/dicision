'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientFormProps {
  patientId?: string
  initialData?: Record<string, any>
  mode?: 'create' | 'edit'
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

function CheckField({
  label, name, value, onChange, disabled,
}: {
  label: string; name: string; value: boolean
  onChange: (name: string, v: boolean) => void; disabled?: boolean
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700">
      <input
        type="checkbox"
        className="w-4 h-4 accent-[#2CB1BC]"
        checked={value}
        onChange={e => onChange(name, e.target.checked)}
        disabled={disabled}
      />
      {label}
    </label>
  )
}

function RadioField({
  label, name, value, options, onChange, disabled,
}: {
  label: string; name: string; value: string
  options: { value: string; label: string }[]
  onChange: (name: string, v: string) => void; disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="flex flex-wrap gap-4">
        {options.map(option => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={e => onChange(name, e.target.value)}
              disabled={disabled}
              className="w-4 h-4 accent-[#2CB1BC]"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PatientForm({ patientId, initialData, mode = 'create' }: PatientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const initialExtended = (initialData?.extended_profile ?? initialData?.extendedProfile ?? {}) as Record<string, any>

  const [f, setF] = useState<Record<string, any>>({
    // Basic demographics
    firstName: initialData?.first_name ?? initialData?.firstName ?? '',
    lastName: initialData?.last_name ?? initialData?.lastName ?? '',
    dateOfBirth: initialData?.date_of_birth ?? initialData?.dateOfBirth ?? '',
    gender: initialData?.gender ?? '',
    medicalRecordNumber: initialData?.medical_record_number ?? initialData?.medicalRecordNumber ?? '',

    // Anthropometric
    weight: initialData?.weight ?? '',
    height: initialData?.height ?? '',

    // Pregnancy/Breastfeeding
    pregnancyStatus: initialData?.pregnancy_status ?? initialData?.pregnancyStatus ?? '',
    pregnancyTrimester: initialExtended?.pregnancyTrimester ?? '',
    pregnancyWeeks: initialExtended?.pregnancyWeeks ?? '',
    breastfeedingStatus: initialExtended?.breastfeedingStatus ?? '',
    infantAge: initialExtended?.infantAge ?? '',
    breastfeedingType: initialExtended?.breastfeedingType ?? '',

    // Clinical vitals
    bloodPressure: initialExtended?.bloodPressure ?? '',
    heartRate: initialExtended?.heartRate ?? '',
    heartRateSymptoms: initialExtended?.heartRateSymptoms ?? '',
    temperature: initialExtended?.temperature ?? '',
    temperatureSensation: initialExtended?.temperatureSensation ?? '',
    respiratoryRate: initialExtended?.respiratoryRate ?? '',
    oxygenSaturation: initialExtended?.oxygenSaturation ?? '',
    consciousnessState: initialExtended?.consciousnessState ?? '',

    // Medical history
    cardiovascularDisease: initialExtended?.cardiovascularDisease ?? false,
    cardiovascularDetails: initialExtended?.cardiovascularDetails ?? '',
    diabetes: initialExtended?.diabetes ?? false,
    diabetesType: initialExtended?.diabetesType ?? '',
    diabetesDuration: initialExtended?.diabetesDuration ?? '',
    diabetesTreatment: initialExtended?.diabetesTreatment ?? '',
    asthmaCOPD: initialExtended?.asthmaCOPD ?? false,
    asthmaCOPDDetails: initialExtended?.asthmaCOPDDetails ?? '',
    neurologicalDisease: initialExtended?.neurologicalDisease ?? false,
    neurologicalDetails: initialExtended?.neurologicalDetails ?? '',
    allergies: initialExtended?.allergies ?? false,
    allergyDetails: initialExtended?.allergyDetails ?? '',
    intoxication: initialExtended?.intoxication ?? false,
    intoxicationDetails: initialExtended?.intoxicationDetails ?? '',
    specialConditions: initialExtended?.specialConditions ?? false,
    specialConditionsDetails: initialExtended?.specialConditionsDetails ?? '',
    cancer: initialExtended?.cancer ?? false,
    cancerDetails: initialExtended?.cancerDetails ?? '',

    // Biological functions
    creatinine: initialExtended?.creatinine ?? '',
    creatinineClearance: initialExtended?.creatinineClearance ?? '',
    renalInsufficiency: initialExtended?.renalInsufficiency ?? false,
    renalDetails: initialExtended?.renalDetails ?? '',
    asatAlat: initialExtended?.asatAlat ?? '',
    bilirubin: initialExtended?.bilirubin ?? '',
    hepaticInsufficiency: initialExtended?.hepaticInsufficiency ?? false,
    hepaticDetails: initialExtended?.hepaticDetails ?? '',

    // Current treatments
    currentMedications: initialExtended?.currentMedications ?? [],
    automedication: initialExtended?.automedication ?? false,
    automedicationDetails: initialExtended?.automedicationDetails ?? '',
    phytotherapy: initialExtended?.phytotherapy ?? false,
    phytotherapyDetails: initialExtended?.phytotherapyDetails ?? '',
    allergiesIntolerances: initialExtended?.allergiesIntolerances ?? '',

    // Lifestyle habits
    smokingStatus: initialExtended?.smokingStatus ?? '',
    smokingDetails: initialExtended?.smokingDetails ?? '',
    passiveSmoking: initialExtended?.passiveSmoking ?? false,
    alcoholUse: initialExtended?.alcoholUse ?? '',
    alcoholDetails: initialExtended?.alcoholDetails ?? '',
    substanceUse: initialExtended?.substanceUse ?? false,
    substanceDetails: initialExtended?.substanceDetails ?? '',
    toxicExposure: initialExtended?.toxicExposure ?? false,
    toxicExposureDetails: initialExtended?.toxicExposureDetails ?? '',
    physicalActivity: initialExtended?.physicalActivity ?? '',
    physicalActivityDetails: initialExtended?.physicalActivityDetails ?? '',
    dietType: initialExtended?.dietType ?? '',
    dietDetails: initialExtended?.dietDetails ?? '',
    stressLevel: initialExtended?.stressLevel ?? '',
    stressDetails: initialExtended?.stressDetails ?? '',
    sleepQuality: initialExtended?.sleepQuality ?? '',
    sleepHours: initialExtended?.sleepHours ?? '',
    insomnia: initialExtended?.insomnia ?? false,
    fragmentedSleep: initialExtended?.fragmentedSleep ?? false,
    daytimeSleepiness: initialExtended?.daytimeSleepiness ?? false,
    nightWork: initialExtended?.nightWork ?? false,
    nightWorkDetails: initialExtended?.nightWorkDetails ?? '',
    sunExposure: initialExtended?.sunExposure ?? '',
    vitaminD: initialExtended?.vitaminD ?? '',
    outdoorWork: initialExtended?.outdoorWork ?? false,
    sunProtection: initialExtended?.sunProtection ?? false,
    medicationWithdrawal: initialExtended?.medicationWithdrawal ?? false,
    withdrawalDetails: initialExtended?.withdrawalDetails ?? '',

    // Medical interactions
    cyp450Inhibitors: initialExtended?.cyp450Inhibitors ?? '',
    qtLongRisk: initialExtended?.qtLongRisk ?? false,
    qtLongDetails: initialExtended?.qtLongDetails ?? '',
    serotoninRisk: initialExtended?.serotoninRisk ?? false,
    serotoninDetails: initialExtended?.serotoninDetails ?? '',
    hiddenAutomedication: initialExtended?.hiddenAutomedication ?? false,
    hiddenMeds: initialExtended?.hiddenMeds ?? '',

    // Phytotherapy
    phytotherapyScientificName: initialExtended?.phytotherapyScientificName ?? '',
    phytotherapyPartUsed: initialExtended?.phytotherapyPartUsed ?? '',
    phytotherapyConcentration: initialExtended?.phytotherapyConcentration ?? '',
    phytotherapyOrigin: initialExtended?.phytotherapyOrigin ?? '',
    phytotherapyCypInteraction: initialExtended?.phytotherapyCypInteraction ?? false,

    // Clinical indication
    consultationReason: initialExtended?.consultationReason ?? '',
    mainSymptoms: initialExtended?.mainSymptoms ?? '',

    // Toxicological data
    suspectedSubstance: initialExtended?.suspectedSubstance ?? '',
    exposureType: initialExtended?.exposureType ?? '',
    estimatedDose: initialExtended?.estimatedDose ?? '',
    exposureTime: initialExtended?.exposureTime ?? '',
    exposureRoute: initialExtended?.exposureRoute ?? '',
    toxicSymptoms: initialExtended?.toxicSymptoms ?? [],
    symptomOnset: initialExtended?.symptomOnset ?? '',
    symptomDelay: initialExtended?.symptomDelay ?? '',
    clinicalEvolution: initialExtended?.clinicalEvolution ?? '',

    // Biological data
    biologicalData: initialExtended?.biologicalData ?? '',
  })

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
                  <option value="Femme">Femme</option>
                  <option value="Homme">Homme</option>
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
                    options={[
                      { value: 'non', label: 'Non enceinte' },
                      { value: 'oui', label: 'Enceinte' },
                    ]}
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
                          <option value="1">1er trimestre</option>
                          <option value="2">2e trimestre</option>
                          <option value="3">3e trimestre</option>
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
                    options={[
                      { value: 'non', label: 'Non' },
                      { value: 'oui', label: 'Oui' },
                    ]}
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
                          <option value="exclusif">Exclusif</option>
                          <option value="mixte">Mixte</option>
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
                  <option value="aucune">Aucune</option>
                  <option value="fièvre">Fièvre ressentie</option>
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
                  <option value="normale">Normale</option>
                  <option value="difficile">Difficile</option>
                  <option value="rapide">Rapide</option>
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
                  <option value="normal">Normal</option>
                  <option value="confusion">Confusion</option>
                  <option value="perte">Perte de connaissance</option>
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
                        <option value="type1">Type 1</option>
                        <option value="type2">Type 2</option>
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
                    <option value="non">Non</option>
                    <option value="oui">Oui</option>
                    <option value="ex">Ex-fumeur</option>
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
                    <option value="non">Non</option>
                    <option value="oui">Oui</option>
                    <option value="occasionnel">Occasionnel</option>
                    <option value="ex">Ex-consommateur</option>
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
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
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
