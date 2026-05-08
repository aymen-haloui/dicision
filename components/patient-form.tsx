'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'

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
}: {
  label: string
  children: React.ReactNode
  unit?: string
  controlId: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={controlId} className="text-sm font-medium text-slate-700">
        {label}{unit && <span className="ml-1 text-xs text-slate-400">({unit})</span>}
      </Label>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide border-b border-slate-200 pb-1 mb-1 col-span-full">
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PatientForm({ patientId, initialData, mode = 'create' }: PatientFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const initialExtended = (initialData?.extended_profile ?? initialData?.extendedProfile ?? {}) as Record<string, any>

  const [f, setF] = useState<Record<string, any>>({
    // Demographics
    firstName: initialData?.first_name ?? initialData?.firstName ?? '',
    lastName: initialData?.last_name ?? initialData?.lastName ?? '',
    dateOfBirth: initialData?.date_of_birth ?? initialData?.dateOfBirth ?? '',
    gender: initialData?.gender ?? '',
    medicalRecordNumber: initialData?.medical_record_number ?? initialData?.medicalRecordNumber ?? '',
    pregnancyStatus: initialData?.pregnancy_status ?? initialData?.pregnancyStatus ?? '',
    // Anthropometric
    weight: initialData?.weight ?? '',
    height: initialData?.height ?? '',
    // Lifestyle
    smokingStatus: initialData?.smoking_status ?? initialData?.smokingStatus ?? '',
    alcoholUse: initialData?.alcohol_use ?? initialData?.alcoholUse ?? '',
    substanceUse: initialData?.substance_use ?? initialData?.substanceUse ?? '',
    professionalExposure: initialData?.professional_exposure ?? initialData?.professionalExposure ?? '',
    physicalActivity: initialData?.physical_activity ?? initialData?.physicalActivity ?? '',
    dietType: initialData?.diet_type ?? initialData?.dietType ?? '',
    stressLevel: initialData?.stress_level ?? initialData?.stressLevel ?? '',
    sleepQuality: initialData?.sleep_quality ?? initialData?.sleepQuality ?? '',
    sleepHours: initialData?.sleep_hours ?? initialData?.sleepHours ?? '',
    nightShift: initialData?.night_shift ?? initialData?.nightShift ?? false,
    sunExposure: initialData?.sun_exposure ?? initialData?.sunExposure ?? '',
    prolongedFasting: initialData?.prolonged_fasting ?? initialData?.prolongedFasting ?? false,
    restrictiveDiet: initialData?.restrictive_diet ?? initialData?.restrictiveDiet ?? false,
    uncontrolledNaturalProducts:
      initialData?.uncontrolled_natural_products ?? initialData?.uncontrolledNaturalProducts ?? false,
    // Medical factors
    immunodepression: initialData?.immunodepression ?? '',
    bloodDonor: initialData?.blood_donor ?? initialData?.bloodDonor ?? false,
    suddenMedicationStop: initialData?.sudden_medication_stop ?? initialData?.suddenMedicationStop ?? false,
    regularCheckup: initialData?.regular_checkup ?? initialData?.regularCheckup ?? true,
    selfDiagnosis: initialData?.self_diagnosis ?? initialData?.selfDiagnosis ?? false,
    housingConditions: initialData?.housing_conditions ?? initialData?.housingConditions ?? '',
    previousIntoxication: initialData?.previous_intoxication ?? initialData?.previousIntoxication ?? false,
    // Allergies & history
    allergies: initialData?.allergies ?? '',
    allergyReactionTypes: initialData?.allergy_reaction_types ?? initialData?.allergyReactionTypes ?? '',
    comorbidities: initialData?.comorbidities ?? '',
    // Renal
    creatinine: initialData?.creatinine ?? '',
    renalCreatinineClearance:
      initialData?.renal_creatinine_clearance ?? initialData?.renalCreatinineClearance ?? '',
    renalStage: initialData?.renal_stage ?? initialData?.renalStage ?? '',
    // Hepatic
    hepaticStatus: initialData?.hepatic_status ?? initialData?.hepaticStatus ?? '',
    asat: initialData?.asat ?? '',
    alat: initialData?.alat ?? '',
    bilirubin: initialData?.bilirubin ?? '',
    // Complementary bio
    glycemia: initialData?.glycemia ?? '',
    sodium: initialData?.sodium ?? '',
    potassium: initialData?.potassium ?? '',
    crp: initialData?.crp ?? '',
    lactates: initialData?.lactates ?? '',
    // Extended validated profile
    extendedProfile: {
      exactAgeYears: initialExtended.exactAgeYears ?? '',
      infantAgeMonths: initialExtended.infantAgeMonths ?? '',
      pregnancyWeeks: initialExtended.pregnancyWeeks ?? '',
      breastfeeding: initialExtended.breastfeeding ?? '',
      breastfeedingInfantAge: initialExtended.breastfeedingInfantAge ?? '',
      breastfeedingMode: initialExtended.breastfeedingMode ?? '',
      bloodPressure: initialExtended.bloodPressure ?? '',
      heartRate: initialExtended.heartRate ?? '',
      heartRhythmSymptoms: initialExtended.heartRhythmSymptoms ?? '',
      temperatureValue: initialExtended.temperatureValue ?? '',
      feverSensation: initialExtended.feverSensation ?? '',
      respiratoryRateStatus: initialExtended.respiratoryRateStatus ?? '',
      spo2Value: initialExtended.spo2Value ?? '',
      consciousnessState: initialExtended.consciousnessState ?? '',
      consciousnessDetails: initialExtended.consciousnessDetails ?? '',
      cardiovascularHistory: initialExtended.cardiovascularHistory ?? '',
      diabetesHistory: initialExtended.diabetesHistory ?? '',
      asthmaCopdHistory: initialExtended.asthmaCopdHistory ?? '',
      neurologicalHistory: initialExtended.neurologicalHistory ?? '',
      intoxicationOverdoseHistory: initialExtended.intoxicationOverdoseHistory ?? '',
      specialConditionHistory: initialExtended.specialConditionHistory ?? '',
      chronicDiseaseHistory: initialExtended.chronicDiseaseHistory ?? '',
      treatmentsCurrentList: initialExtended.treatmentsCurrentList ?? '',
      selfMedicationDetails: initialExtended.selfMedicationDetails ?? '',
      phytotherapyDetails: initialExtended.phytotherapyDetails ?? '',
      therapeuticIndication: initialExtended.therapeuticIndication ?? '',
      consultationReason: initialExtended.consultationReason ?? '',
      mainSymptomsDetails: initialExtended.mainSymptomsDetails ?? '',
      nfsValue: initialExtended.nfsValue ?? '',
      ionogramValue: initialExtended.ionogramValue ?? '',
      bloodGasValue: initialExtended.bloodGasValue ?? '',
      otherAnalyses: initialExtended.otherAnalyses ?? '',
      suspectedSubstanceType: initialExtended.suspectedSubstanceType ?? '',
      estimatedDose: initialExtended.estimatedDose ?? '',
      intakeTime: initialExtended.intakeTime ?? '',
      exposureRoute: initialExtended.exposureRoute ?? '',
      observedSymptomsType: initialExtended.observedSymptomsType ?? '',
      delaySinceExposure: initialExtended.delaySinceExposure ?? '',
      symptomsStartDateTime: initialExtended.symptomsStartDateTime ?? '',
      exposureDelayUnit: initialExtended.exposureDelayUnit ?? '',
      clinicalEvolution: initialExtended.clinicalEvolution ?? '',
      cypInteractions: initialExtended.cypInteractions ?? '',
      qtLongRisk: initialExtended.qtLongRisk ?? '',
      serotonergicRisk: initialExtended.serotonergicRisk ?? '',
      hiddenSelfMedication: initialExtended.hiddenSelfMedication ?? '',
      phytotherapyScientificName: initialExtended.phytotherapyScientificName ?? '',
      phytotherapyUsedPart: initialExtended.phytotherapyUsedPart ?? '',
      phytotherapyConcentration: initialExtended.phytotherapyConcentration ?? '',
      phytotherapyOriginQuality: initialExtended.phytotherapyOriginQuality ?? '',
      phytotherapyCypInteractionKnown: initialExtended.phytotherapyCypInteractionKnown ?? '',
      phytotherapyToxicityReported: initialExtended.phytotherapyToxicityReported ?? '',
      symptomEvolutionNotes: initialExtended.symptomEvolutionNotes ?? '',
      initialTreatmentResponse: initialExtended.initialTreatmentResponse ?? '',
      reboundAfterImprovement: initialExtended.reboundAfterImprovement ?? '',
      convulsionsPresent: initialExtended.convulsionsPresent ?? false,
      respiratoryDistressPresent: initialExtended.respiratoryDistressPresent ?? false,
      shockPresent: initialExtended.shockPresent ?? false,
      consciousnessDisorderPresent: initialExtended.consciousnessDisorderPresent ?? false,
      cardiacArrestPresent: initialExtended.cardiacArrestPresent ?? false,
      arrhythmiaPresent: initialExtended.arrhythmiaPresent ?? false,
      severeAllergicReactionPresent: initialExtended.severeAllergicReactionPresent ?? false,
      severeHemorrhagePresent: initialExtended.severeHemorrhagePresent ?? false,
      severeDehydrationPresent: initialExtended.severeDehydrationPresent ?? false,
      severeNeurologicalDamagePresent: initialExtended.severeNeurologicalDamagePresent ?? false,
    },
  })

  // BMI auto-calculation
  const bmi = useMemo(() => {
    const w = parseFloat(f.weight)
    const h = parseFloat(f.height)
    if (w > 0 && h > 10) return (w / ((h / 100) ** 2)).toFixed(1)
    return null
  }, [f.weight, f.height])

  const bmiCategory = useMemo(() => {
    if (!bmi) return ''
    const v = parseFloat(bmi)
    if (v < 18.5) return 'Insuffisance ponderale'
    if (v < 25)   return 'Normal'
    if (v < 30)   return 'Surpoids'
    if (v < 35)   return 'Obesite classe I'
    return 'Obesite classe II+'
  }, [bmi])

  const isPregnancyActive = ['trimester_1', 'trimester_2', 'trimester_3'].includes(f.pregnancyStatus)
  const isBreastfeedingActive = f.pregnancyStatus === 'allaitement_oui' || f.extendedProfile?.breastfeeding === 'oui'

  function set(name: string, value: any) {
    setF(prev => ({ ...prev, [name]: value }))
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    set(e.target.name, e.target.value)
  }
  function handleCheck(name: string, value: boolean) { set(name, value) }
  function setExtended(name: string, value: any) {
    setF(prev => ({
      ...prev,
      extendedProfile: {
        ...(prev.extendedProfile || {}),
        [name]: value,
      },
    }))
  }
  function handleExtendedCheck(name: string, value: boolean) {
    setExtended(name, value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const url = mode === 'edit' ? `/api/patients/${patientId}` : '/api/patients'
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erreur lors de la sauvegarde')
      }
      const patient = await res.json()
      router.push(`/dashboard/patients/${patient.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="identity" className="w-full">
        {/* Tab bar */}
        <TabsList className="w-full flex flex-wrap gap-1 h-auto mb-6 bg-slate-100 p-1 rounded-xl">
          {[
            { value: 'identity',  label: 'Identite' },
            { value: 'lifestyle', label: 'Mode de vie' },
            { value: 'medical',   label: 'Facteurs medicaux' },
            { value: 'biology',   label: 'Biologie' },
            { value: 'history',   label: 'Allergies & Antecedents' },
            { value: 'clinical',  label: 'Clinique & Toxicologie' },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 text-xs font-medium data-[state=active]:bg-[#2CB1BC] data-[state=active]:text-white rounded-lg py-2"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ══ TAB 1 — IDENTITE ═══════════════════════════════════════════════ */}
        <TabsContent value="identity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionTitle>Etat civil</SectionTitle>

            <Field label="Prenom *" controlId="firstName">
              <input id="firstName" title="Prenom" placeholder="Prenom"
                name="firstName" value={f.firstName} onChange={handleChange}
                className={inputClass} required disabled={isLoading} />
            </Field>
            <Field label="Nom *" controlId="lastName">
              <input id="lastName" title="Nom" placeholder="Nom"
                name="lastName" value={f.lastName} onChange={handleChange}
                className={inputClass} required disabled={isLoading} />
            </Field>
            <Field label="Date de naissance" controlId="dateOfBirth">
              <input id="dateOfBirth" title="Date de naissance" type="date" name="dateOfBirth" value={f.dateOfBirth}
                onChange={handleChange} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Sexe" controlId="gender">
              <select id="gender" title="Sexe" name="gender" value={f.gender} onChange={handleChange}
                className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="femme">Femme</option>
                <option value="homme">Homme</option>
              </select>
            </Field>
            <Field label="Numero de dossier medical" controlId="medicalRecordNumber">
              <input id="medicalRecordNumber" title="Numero de dossier medical" placeholder="Numero de dossier"
                name="medicalRecordNumber" value={f.medicalRecordNumber}
                onChange={handleChange} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Grossesse" controlId="pregnancyStatus">
              <select id="pregnancyStatus" title="Statut reproductif" name="pregnancyStatus" value={f.pregnancyStatus}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="non">Grossesse: Non</option>
                <option value="trimester_1">Grossesse: Oui (1er trimestre)</option>
                <option value="trimester_2">Grossesse: Oui (2e trimestre)</option>
                <option value="trimester_3">Grossesse: Oui (3e trimestre)</option>
                <option value="allaitement_oui">Allaitement: Oui</option>
              </select>
            </Field>

            <SectionTitle>Anthropometrie</SectionTitle>

            <Field label="Poids" unit="kg" controlId="weight">
              <input type="number" step="0.1" min="1" name="weight" value={f.weight}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="ex. 70.5" />
            </Field>
            <Field label="Taille" unit="cm" controlId="height">
              <input type="number" step="0.5" min="50" name="height" value={f.height}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="ex. 175" />
            </Field>

            {bmi && (
              <div className="col-span-full flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                <span className="text-2xl font-bold text-[#2CB1BC]">{bmi}</span>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">IMC calcule</p>
                  <p className="text-sm font-medium text-slate-700">{bmiCategory}</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ══ TAB 2 — MODE DE VIE ════════════════════════════════════════════ */}
        <TabsContent value="lifestyle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionTitle>Consommations</SectionTitle>

            <Field label="Tabagisme / e-cigarette / chicha" controlId="smokingStatus">
              <select id="smokingStatus" title="Tabagisme / e-cigarette / chicha" name="smokingStatus" value={f.smokingStatus}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="non">Non</option>
                <option value="oui">Oui</option>
                <option value="ex-fumeur">Ex-fumeur</option>
              </select>
            </Field>
            <Field label="Consommation d'alcool" controlId="alcoholUse">
              <select id="alcoholUse" title="Consommation d'alcool" name="alcoholUse" value={f.alcoholUse}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="non">Non</option>
                <option value="oui">Oui</option>
                <option value="occasionnel">Occasionnel</option>
                <option value="ex-consommateur">Ex-consommateur</option>
              </select>
            </Field>
            <Field label="Substances psychoactives" controlId="substanceUse">
              <textarea name="substanceUse" value={f.substanceUse}
                onChange={handleChange} rows={2} className={inputClass} disabled={isLoading}
                placeholder="Cannabis, stimulants, opioides, etc." />
            </Field>
            <Field label="Expositions professionnelles / domestiques" controlId="professionalExposure">
              <textarea name="professionalExposure" value={f.professionalExposure}
                onChange={handleChange} rows={2} className={inputClass} disabled={isLoading}
                placeholder="Pesticides, solvants, plomb, arsenic, etc." />
            </Field>

            <SectionTitle>Hygiene de vie</SectionTitle>

            <Field label="Activite physique / sport" controlId="physicalActivity">
              <input id="physicalActivity" title="Activite physique / sport" name="physicalActivity" value={f.physicalActivity}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="Preciser l'activite physique ou sportive" />
            </Field>
            <Field label="Regime alimentaire special" controlId="dietType">
              <input name="dietType" value={f.dietType}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="Vegetarien, vegan, sans gluten, etc." />
            </Field>
            <Field label="Niveau de stress chronique" controlId="stressLevel">
              <select id="stressLevel" title="Niveau de stress chronique" name="stressLevel" value={f.stressLevel}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="faible">Faible</option>
                <option value="modere">Modere</option>
                <option value="eleve">Eleve</option>
              </select>
            </Field>
            <Field label="Qualite du sommeil" controlId="sleepQuality">
              <select id="sleepQuality" title="Qualite du sommeil" name="sleepQuality" value={f.sleepQuality}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="bonne">Bonne</option>
                <option value="mauvaise">Mauvaise</option>
              </select>
            </Field>
            <Field label="Heures de sommeil / nuit" unit="h" controlId="sleepHours">
              <input type="number" step="0.5" min="0" max="24" name="sleepHours"
                value={f.sleepHours} onChange={handleChange} className={inputClass}
                disabled={isLoading} placeholder="ex. 6.5" />
            </Field>
            <Field label="Exposition au soleil" controlId="sunExposure">
              <select id="sunExposure" title="Exposition au soleil" name="sunExposure" value={f.sunExposure}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="faible">Faible</option>
                <option value="moderee">Moderee</option>
                <option value="forte">Forte</option>
              </select>
            </Field>

            <SectionTitle>Facteurs comportementaux</SectionTitle>
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckField label="Travail de nuit / horaires irreguliers"
                name="nightShift" value={f.nightShift} onChange={handleCheck} disabled={isLoading} />
              <CheckField label="Jeune prolonge (religieux ou autre)"
                name="prolongedFasting" value={f.prolongedFasting} onChange={handleCheck} disabled={isLoading} />
              <CheckField label="Regime restrictif extreme"
                name="restrictiveDiet" value={f.restrictiveDiet} onChange={handleCheck} disabled={isLoading} />
              <CheckField label="Produits naturels non controles"
                name="uncontrolledNaturalProducts" value={f.uncontrolledNaturalProducts}
                onChange={handleCheck} disabled={isLoading} />
            </div>
          </div>
        </TabsContent>

        {/* ══ TAB 3 — FACTEURS MEDICAUX ══════════════════════════════════════ */}
        <TabsContent value="medical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionTitle>Terrain immunologique</SectionTitle>

            <Field label="Immunodepression" controlId="immunodepression">
              <input id="immunodepression" title="Immunodepression" name="immunodepression" value={f.immunodepression}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="Due a une maladie ou a un traitement" />
            </Field>
            <Field label="Conditions de logement" controlId="housingConditions">
              <input name="housingConditions" value={f.housingConditions}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="Humidite, moisissures, surpeuplement, etc." />
            </Field>

            <SectionTitle>Comportements a risque</SectionTitle>
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckField label="Donneur de sang regulier"
                name="bloodDonor" value={f.bloodDonor} onChange={handleCheck} disabled={isLoading} />
              <CheckField label="Arret brutal de traitement en cours"
                name="suddenMedicationStop" value={f.suddenMedicationStop}
                onChange={handleCheck} disabled={isLoading} />
              <CheckField label="Suivi medical regulier"
                name="regularCheckup" value={f.regularCheckup} onChange={handleCheck} disabled={isLoading} />
              <CheckField label="Auto-diagnostic via internet"
                name="selfDiagnosis" value={f.selfDiagnosis} onChange={handleCheck} disabled={isLoading} />
              <CheckField label="Antecedent d'intoxication / surdosage"
                name="previousIntoxication" value={f.previousIntoxication}
                onChange={handleCheck} disabled={isLoading} />
            </div>
          </div>
        </TabsContent>

        {/* ══ TAB 4 — BIOLOGIE ═══════════════════════════════════════════════ */}
        <TabsContent value="biology">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionTitle>Fonction renale</SectionTitle>

            <Field label="Creatininemie" unit="mg/dL" controlId="creatinine">
              <input type="number" step="0.01" min="0" name="creatinine"
                value={f.creatinine} onChange={handleChange} className={inputClass}
                disabled={isLoading} placeholder="norme &lt;1.2" />
            </Field>
            <Field label="Clairance creatinine (CrCl)" unit="mL/min" controlId="renalCreatinineClearance">
              <input type="number" step="0.1" min="0" name="renalCreatinineClearance"
                value={f.renalCreatinineClearance} onChange={handleChange}
                className={inputClass} disabled={isLoading} placeholder="ex. 80" />
            </Field>
            <div className="col-span-full">
              <Field label="Insuffisance renale / stade" controlId="renalStage">
                <input id="renalStage" title="Insuffisance renale / stade" name="renalStage" value={f.renalStage}
                  onChange={handleChange} className={inputClass} disabled={isLoading}
                  placeholder="Oui/non, stade si connu" />
              </Field>
            </div>

            <SectionTitle>Fonction hepatique</SectionTitle>

            <Field label="ASAT (TGO)" unit="U/L" controlId="asat">
              <input type="number" step="0.1" min="0" name="asat" value={f.asat}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="norme &lt;40" />
            </Field>
            <Field label="ALAT (TGP)" unit="U/L" controlId="alat">
              <input type="number" step="0.1" min="0" name="alat" value={f.alat}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="norme &lt;40" />
            </Field>
            <Field label="Bilirubine totale" unit="mg/dL" controlId="bilirubin">
              <input type="number" step="0.01" min="0" name="bilirubin" value={f.bilirubin}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="norme &lt;1.2" />
            </Field>
            <Field label="Insuffisance hepatique" controlId="hepaticStatus">
              <input id="hepaticStatus" title="Insuffisance hepatique" name="hepaticStatus" value={f.hepaticStatus}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="Oui/non, severite si connue" />
            </Field>

            <SectionTitle>Bilan complementaire</SectionTitle>

            <Field label="Glycemie" unit="g/L" controlId="glycemia">
              <input type="number" step="0.01" min="0" name="glycemia" value={f.glycemia}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="norme 0.7-1.1" />
            </Field>
            <Field label="Sodium (Na+)" unit="mEq/L" controlId="sodium">
              <input type="number" step="0.1" min="0" name="sodium" value={f.sodium}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="norme 135-145" />
            </Field>
            <Field label="Potassium (K+)" unit="mEq/L" controlId="potassium">
              <input type="number" step="0.01" min="0" name="potassium" value={f.potassium}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="norme 3.5-5.0" />
            </Field>
            <Field label="CRP" unit="mg/L" controlId="crp">
              <input type="number" step="0.1" min="0" name="crp" value={f.crp}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="norme &lt;5" />
            </Field>
            <Field label="Lactates" unit="mmol/L" controlId="lactates">
              <input type="number" step="0.01" min="0" name="lactates" value={f.lactates}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="norme &lt;2" />
            </Field>
          </div>
        </TabsContent>

        {/* ══ TAB 5 — ALLERGIES & ANTECEDENTS ══════════════════════════════ */}
        <TabsContent value="history">
          <div className="grid grid-cols-1 gap-4">
            <SectionTitle>Allergies</SectionTitle>

            <Field label="Allergies connues (medicaments, aliments, latex, etc.)" controlId="allergies">
              <textarea name="allergies" value={f.allergies} onChange={handleChange}
                rows={3} className={inputClass} disabled={isLoading}
                placeholder="ex. Penicilline — eruption cutanee, Arachides — anaphylaxie" />
            </Field>
            <Field label="Type de reaction allergique" controlId="allergyReactionTypes">
              <input id="allergyReactionTypes" title="Type de reaction allergique" name="allergyReactionTypes" value={f.allergyReactionTypes}
                onChange={handleChange} className={inputClass} disabled={isLoading}
                placeholder="Cutanee, respiratoire, choc anaphylactique, etc." />
            </Field>

            <SectionTitle>Antecedents medicaux</SectionTitle>

            <Field label="Comorbidites / Antecedents (maladies chroniques, chirurgies, hospitalisations)" controlId="comorbidities">
              <textarea name="comorbidities" value={f.comorbidities} onChange={handleChange}
                rows={4} className={inputClass} disabled={isLoading}
                placeholder="ex. Diabete type 2, HTA, insuffisance renale chronique, asthme..." />
            </Field>
          </div>
        </TabsContent>

        {/* ══ TAB 6 — CLINIQUE & TOXICOLOGIE ═══════════════════════════════ */}
        <TabsContent value="clinical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionTitle>Donnees demographiques detaillees</SectionTitle>

            <Field label="Age exact (ans)" controlId="exactAgeYears">
              <input id="exactAgeYears" name="exactAgeYears" value={f.extendedProfile?.exactAgeYears ?? ''}
                onChange={(e) => setExtended('exactAgeYears', e.target.value)} className={inputClass} disabled={isLoading}
                placeholder="Ex: 45" />
            </Field>
            <Field label="Age nourrisson (mois)" controlId="infantAgeMonths">
              <input id="infantAgeMonths" name="infantAgeMonths" value={f.extendedProfile?.infantAgeMonths ?? ''}
                onChange={(e) => setExtended('infantAgeMonths', e.target.value)} className={inputClass} disabled={isLoading}
                placeholder="Ex: 8" />
            </Field>
            {isPregnancyActive && (
              <Field label="Duree de grossesse (semaines)" controlId="pregnancyWeeks">
                <input id="pregnancyWeeks" title="Duree de grossesse (semaines)" name="pregnancyWeeks" value={f.extendedProfile?.pregnancyWeeks ?? ''}
                  onChange={(e) => setExtended('pregnancyWeeks', e.target.value)} className={inputClass} disabled={isLoading}
                  placeholder="Si grossesse" />
              </Field>
            )}
            <Field label="Allaitement" controlId="breastfeeding">
              <select id="breastfeeding" title="Allaitement" name="breastfeeding" value={f.extendedProfile?.breastfeeding ?? ''}
                onChange={(e) => setExtended('breastfeeding', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </Field>
            {isBreastfeedingActive && (
              <Field label="Age du nourrisson" controlId="breastfeedingInfantAge">
                <input id="breastfeedingInfantAge" title="Age du nourrisson" name="breastfeedingInfantAge" value={f.extendedProfile?.breastfeedingInfantAge ?? ''}
                  onChange={(e) => setExtended('breastfeedingInfantAge', e.target.value)} className={inputClass} disabled={isLoading}
                  placeholder="Si allaitement" />
              </Field>
            )}
            {isBreastfeedingActive && (
              <Field label="Allaitement exclusif ou mixte" controlId="breastfeedingMode">
                <input id="breastfeedingMode" title="Allaitement exclusif ou mixte" name="breastfeedingMode" value={f.extendedProfile?.breastfeedingMode ?? ''}
                  onChange={(e) => setExtended('breastfeedingMode', e.target.value)} className={inputClass} disabled={isLoading}
                  placeholder="Exclusif / mixte" />
              </Field>
            )}

            <SectionTitle>Donnees cliniques generales</SectionTitle>

            <Field label="Tension arterielle" controlId="bloodPressure">
              <input id="bloodPressure" name="bloodPressure" value={f.extendedProfile?.bloodPressure ?? ''}
                onChange={(e) => setExtended('bloodPressure', e.target.value)} className={inputClass} disabled={isLoading}
                placeholder="Ex: 13/8 ou je ne sais pas" />
            </Field>
            <Field label="Frequence cardiaque" controlId="heartRate">
              <input id="heartRate" title="Frequence cardiaque" name="heartRate" value={f.extendedProfile?.heartRate ?? ''}
                onChange={(e) => setExtended('heartRate', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Palpitations / tachycardie / rythme irregulier" controlId="heartRhythmSymptoms">
              <input id="heartRhythmSymptoms" title="Palpitations / tachycardie / rythme irregulier" name="heartRhythmSymptoms" value={f.extendedProfile?.heartRhythmSymptoms ?? ''}
                onChange={(e) => setExtended('heartRhythmSymptoms', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Temperature" controlId="temperatureValue">
              <input id="temperatureValue" name="temperatureValue" value={f.extendedProfile?.temperatureValue ?? ''}
                onChange={(e) => setExtended('temperatureValue', e.target.value)} className={inputClass} disabled={isLoading}
                placeholder="Ex: 38.5C" />
            </Field>
            <Field label="Sensation de fievre" controlId="feverSensation">
              <select id="feverSensation" title="Sensation de fievre" name="feverSensation" value={f.extendedProfile?.feverSensation ?? ''}
                onChange={(e) => setExtended('feverSensation', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </Field>
            <Field label="Frequence respiratoire" controlId="respiratoryRateStatus">
              <select id="respiratoryRateStatus" title="Frequence respiratoire" name="respiratoryRateStatus" value={f.extendedProfile?.respiratoryRateStatus ?? ''}
                onChange={(e) => setExtended('respiratoryRateStatus', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="normale">Normale</option>
                <option value="difficile">Difficile</option>
                <option value="rapide">Rapide</option>
              </select>
            </Field>
            <Field label="SpO2" controlId="spo2Value">
              <input id="spo2Value" name="spo2Value" value={f.extendedProfile?.spo2Value ?? ''}
                onChange={(e) => setExtended('spo2Value', e.target.value)} className={inputClass} disabled={isLoading}
                placeholder="Valeur ou non connue" />
            </Field>
            <Field label="Etat de conscience" controlId="consciousnessState">
              <select id="consciousnessState" title="Etat de conscience" name="consciousnessState" value={f.extendedProfile?.consciousnessState ?? ''}
                onChange={(e) => setExtended('consciousnessState', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="normal">Normal</option>
                <option value="confusion">Confusion</option>
                <option value="perte">Perte de connaissance</option>
              </select>
            </Field>
            <Field label="Details conscience (duree + contexte)" controlId="consciousnessDetails">
              <textarea id="consciousnessDetails" title="Details conscience (duree + contexte)" name="consciousnessDetails" rows={2} value={f.extendedProfile?.consciousnessDetails ?? ''}
                onChange={(e) => setExtended('consciousnessDetails', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>

            <SectionTitle>Antecedents et traitements</SectionTitle>

            <Field label="Maladies cardiovasculaires" controlId="cardiovascularHistory">
              <textarea id="cardiovascularHistory" title="Maladies cardiovasculaires" rows={2} value={f.extendedProfile?.cardiovascularHistory ?? ''}
                onChange={(e) => setExtended('cardiovascularHistory', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Diabete" controlId="diabetesHistory">
              <textarea id="diabetesHistory" title="Diabete" rows={2} value={f.extendedProfile?.diabetesHistory ?? ''}
                onChange={(e) => setExtended('diabetesHistory', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Asthme / BPCO" controlId="asthmaCopdHistory">
              <textarea id="asthmaCopdHistory" title="Asthme / BPCO" rows={2} value={f.extendedProfile?.asthmaCopdHistory ?? ''}
                onChange={(e) => setExtended('asthmaCopdHistory', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Maladies neurologiques" controlId="neurologicalHistory">
              <textarea id="neurologicalHistory" title="Maladies neurologiques" rows={2} value={f.extendedProfile?.neurologicalHistory ?? ''}
                onChange={(e) => setExtended('neurologicalHistory', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Intoxication / surdosage anterieur" controlId="intoxicationOverdoseHistory">
              <textarea id="intoxicationOverdoseHistory" title="Intoxication / surdosage anterieur" rows={2} value={f.extendedProfile?.intoxicationOverdoseHistory ?? ''}
                onChange={(e) => setExtended('intoxicationOverdoseHistory', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Terrain particulier (immunodepression, cancer...)" controlId="specialConditionHistory">
              <textarea id="specialConditionHistory" title="Terrain particulier (immunodepression, cancer...)" rows={2} value={f.extendedProfile?.specialConditionHistory ?? ''}
                onChange={(e) => setExtended('specialConditionHistory', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Maladie chronique" controlId="chronicDiseaseHistory">
              <textarea id="chronicDiseaseHistory" title="Maladie chronique" rows={2} value={f.extendedProfile?.chronicDiseaseHistory ?? ''}
                onChange={(e) => setExtended('chronicDiseaseHistory', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Traitements en cours" controlId="treatmentsCurrentList">
              <textarea id="treatmentsCurrentList" rows={3} value={f.extendedProfile?.treatmentsCurrentList ?? ''}
                onChange={(e) => setExtended('treatmentsCurrentList', e.target.value)} className={inputClass} disabled={isLoading}
                placeholder="Nom, dose, frequence, voie, duree" />
            </Field>
            <Field label="Automedication (details)" controlId="selfMedicationDetails">
              <textarea id="selfMedicationDetails" title="Automedication (details)" rows={2} value={f.extendedProfile?.selfMedicationDetails ?? ''}
                onChange={(e) => setExtended('selfMedicationDetails', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Phytotherapie (details)" controlId="phytotherapyDetails">
              <textarea id="phytotherapyDetails" title="Phytotherapie (details)" rows={2} value={f.extendedProfile?.phytotherapyDetails ?? ''}
                onChange={(e) => setExtended('phytotherapyDetails', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>

            <SectionTitle>Motif actuel et donnees toxicologiques</SectionTitle>

            <Field label="Motif therapeutique actuel" controlId="therapeuticIndication">
              <textarea id="therapeuticIndication" title="Motif therapeutique actuel" rows={2} value={f.extendedProfile?.therapeuticIndication ?? ''}
                onChange={(e) => setExtended('therapeuticIndication', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Motif de consultation actuel" controlId="consultationReason">
              <select id="consultationReason" title="Motif de consultation actuel" value={f.extendedProfile?.consultationReason ?? ''}
                onChange={(e) => setExtended('consultationReason', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="douleur">Douleur</option>
                <option value="fievre">Fievre</option>
                <option value="intoxication">Intoxication</option>
                <option value="difficulte_respiratoire">Difficulte respiratoire</option>
                <option value="malaise">Malaise</option>
                <option value="autre">Autre</option>
              </select>
            </Field>
            <Field label="Symptomes principaux" controlId="mainSymptomsDetails">
              <textarea id="mainSymptomsDetails" title="Symptomes principaux" rows={2} value={f.extendedProfile?.mainSymptomsDetails ?? ''}
                onChange={(e) => setExtended('mainSymptomsDetails', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Substance suspectee" controlId="suspectedSubstanceType">
              <select id="suspectedSubstanceType" title="Substance suspectee" value={f.extendedProfile?.suspectedSubstanceType ?? ''}
                onChange={(e) => setExtended('suspectedSubstanceType', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="medicament">Medicament</option>
                <option value="produit_chimique">Produit chimique</option>
                <option value="plante">Plante</option>
                <option value="drogue">Drogue</option>
                <option value="metaux_lourds">Metaux lourds</option>
                <option value="inconnue">Inconnue</option>
              </select>
            </Field>
            <Field label="Dose estimee" controlId="estimatedDose">
              <input id="estimatedDose" title="Dose estimee" value={f.extendedProfile?.estimatedDose ?? ''}
                onChange={(e) => setExtended('estimatedDose', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Heure de prise" controlId="intakeTime">
              <input id="intakeTime" title="Heure de prise" value={f.extendedProfile?.intakeTime ?? ''}
                onChange={(e) => setExtended('intakeTime', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Voie d'exposition" controlId="exposureRoute">
              <select id="exposureRoute" title="Voie d'exposition" value={f.extendedProfile?.exposureRoute ?? ''}
                onChange={(e) => setExtended('exposureRoute', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="orale">Orale</option>
                <option value="injectable">Injectable</option>
                <option value="inhalation">Inhalation</option>
                <option value="cutanee">Cutanee</option>
              </select>
            </Field>
            <Field label="Symptomes observes" controlId="observedSymptomsType">
              <input id="observedSymptomsType" value={f.extendedProfile?.observedSymptomsType ?? ''}
                onChange={(e) => setExtended('observedSymptomsType', e.target.value)} className={inputClass} disabled={isLoading}
                placeholder="Digestifs, neurologiques, respiratoires..." />
            </Field>
            <Field label="Delai depuis exposition" controlId="delaySinceExposure">
              <input id="delaySinceExposure" title="Delai depuis exposition" value={f.extendedProfile?.delaySinceExposure ?? ''}
                onChange={(e) => setExtended('delaySinceExposure', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>

            <SectionTitle>Chronologie, gravite et interactions</SectionTitle>

            <Field label="Debut des symptomes (date/heure)" controlId="symptomsStartDateTime">
              <input id="symptomsStartDateTime" title="Debut des symptomes (date/heure)" value={f.extendedProfile?.symptomsStartDateTime ?? ''}
                onChange={(e) => setExtended('symptomsStartDateTime', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Unite delai exposition" controlId="exposureDelayUnit">
              <select id="exposureDelayUnit" title="Unite delai exposition" value={f.extendedProfile?.exposureDelayUnit ?? ''}
                onChange={(e) => setExtended('exposureDelayUnit', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="minutes">Minutes</option>
                <option value="heures">Heures</option>
                <option value="jours">Jours</option>
              </select>
            </Field>
            <Field label="Evolution clinique" controlId="clinicalEvolution">
              <select id="clinicalEvolution" title="Evolution clinique" value={f.extendedProfile?.clinicalEvolution ?? ''}
                onChange={(e) => setExtended('clinicalEvolution', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="stable">Stable</option>
                <option value="amelioration">Amelioration</option>
                <option value="aggravation">Aggravation</option>
              </select>
            </Field>
            <Field label="Inhibiteurs/inducteurs CYP450" controlId="cypInteractions">
              <textarea id="cypInteractions" title="Inhibiteurs/inducteurs CYP450" rows={2} value={f.extendedProfile?.cypInteractions ?? ''}
                onChange={(e) => setExtended('cypInteractions', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Risque QT long" controlId="qtLongRisk">
              <textarea id="qtLongRisk" title="Risque QT long" rows={2} value={f.extendedProfile?.qtLongRisk ?? ''}
                onChange={(e) => setExtended('qtLongRisk', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Risque serotoninergique" controlId="serotonergicRisk">
              <textarea id="serotonergicRisk" title="Risque serotoninergique" rows={2} value={f.extendedProfile?.serotonergicRisk ?? ''}
                onChange={(e) => setExtended('serotonergicRisk', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Automedication cachee" controlId="hiddenSelfMedication">
              <textarea id="hiddenSelfMedication" title="Automedication cachee" rows={2} value={f.extendedProfile?.hiddenSelfMedication ?? ''}
                onChange={(e) => setExtended('hiddenSelfMedication', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>

            <SectionTitle>Phytotherapie specifique</SectionTitle>

            <Field label="Nom scientifique exact" controlId="phytotherapyScientificName">
              <input id="phytotherapyScientificName" title="Nom scientifique exact" value={f.extendedProfile?.phytotherapyScientificName ?? ''}
                onChange={(e) => setExtended('phytotherapyScientificName', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Partie utilisee" controlId="phytotherapyUsedPart">
              <input id="phytotherapyUsedPart" title="Partie utilisee" value={f.extendedProfile?.phytotherapyUsedPart ?? ''}
                onChange={(e) => setExtended('phytotherapyUsedPart', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Concentration / standardisation" controlId="phytotherapyConcentration">
              <input id="phytotherapyConcentration" title="Concentration / standardisation" value={f.extendedProfile?.phytotherapyConcentration ?? ''}
                onChange={(e) => setExtended('phytotherapyConcentration', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Origine / qualite / contamination" controlId="phytotherapyOriginQuality">
              <textarea id="phytotherapyOriginQuality" title="Origine / qualite / contamination" rows={2} value={f.extendedProfile?.phytotherapyOriginQuality ?? ''}
                onChange={(e) => setExtended('phytotherapyOriginQuality', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Interaction CYP connue" controlId="phytotherapyCypInteractionKnown">
              <select id="phytotherapyCypInteractionKnown" title="Interaction CYP connue" value={f.extendedProfile?.phytotherapyCypInteractionKnown ?? ''}
                onChange={(e) => setExtended('phytotherapyCypInteractionKnown', e.target.value)} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </Field>
            <Field label="Donnees de toxicite rapportees" controlId="phytotherapyToxicityReported">
              <textarea id="phytotherapyToxicityReported" title="Donnees de toxicite rapportees" rows={2} value={f.extendedProfile?.phytotherapyToxicityReported ?? ''}
                onChange={(e) => setExtended('phytotherapyToxicityReported', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>

            <SectionTitle>Dynamique temporelle</SectionTitle>

            <Field label="Evolution des symptomes" controlId="symptomEvolutionNotes">
              <textarea id="symptomEvolutionNotes" title="Evolution des symptomes" rows={2} value={f.extendedProfile?.symptomEvolutionNotes ?? ''}
                onChange={(e) => setExtended('symptomEvolutionNotes', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Reponse aux traitements initiaux" controlId="initialTreatmentResponse">
              <textarea id="initialTreatmentResponse" title="Reponse aux traitements initiaux" rows={2} value={f.extendedProfile?.initialTreatmentResponse ?? ''}
                onChange={(e) => setExtended('initialTreatmentResponse', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Reapparition apres amelioration" controlId="reboundAfterImprovement">
              <textarea id="reboundAfterImprovement" title="Reapparition apres amelioration" rows={2} value={f.extendedProfile?.reboundAfterImprovement ?? ''}
                onChange={(e) => setExtended('reboundAfterImprovement', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>

            <SectionTitle>Evaluation rapide de gravite (urgence)</SectionTitle>
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckField label="Convulsions presentes" name="convulsionsPresent"
                value={Boolean(f.extendedProfile?.convulsionsPresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
              <CheckField label="Detresse respiratoire presente" name="respiratoryDistressPresent"
                value={Boolean(f.extendedProfile?.respiratoryDistressPresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
              <CheckField label="Choc / instabilite hemodynamique" name="shockPresent"
                value={Boolean(f.extendedProfile?.shockPresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
              <CheckField label="Trouble de conscience / coma" name="consciousnessDisorderPresent"
                value={Boolean(f.extendedProfile?.consciousnessDisorderPresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
              <CheckField label="Arret cardiaque" name="cardiacArrestPresent"
                value={Boolean(f.extendedProfile?.cardiacArrestPresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
              <CheckField label="Trouble du rythme cardiaque" name="arrhythmiaPresent"
                value={Boolean(f.extendedProfile?.arrhythmiaPresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
              <CheckField label="Reaction allergique severe / anaphylaxie" name="severeAllergicReactionPresent"
                value={Boolean(f.extendedProfile?.severeAllergicReactionPresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
              <CheckField label="Hemorragie importante" name="severeHemorrhagePresent"
                value={Boolean(f.extendedProfile?.severeHemorrhagePresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
              <CheckField label="Deshydratation severe" name="severeDehydrationPresent"
                value={Boolean(f.extendedProfile?.severeDehydrationPresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
              <CheckField label="Atteinte neurologique severe" name="severeNeurologicalDamagePresent"
                value={Boolean(f.extendedProfile?.severeNeurologicalDamagePresent)}
                onChange={(name, v) => handleExtendedCheck(name, v)} disabled={isLoading} />
            </div>

            <SectionTitle>Donnees biologiques complementaires</SectionTitle>
            <Field label="NFS" controlId="nfsValue">
              <input id="nfsValue" title="NFS" value={f.extendedProfile?.nfsValue ?? ''}
                onChange={(e) => setExtended('nfsValue', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Ionogramme" controlId="ionogramValue">
              <input id="ionogramValue" title="Ionogramme" value={f.extendedProfile?.ionogramValue ?? ''}
                onChange={(e) => setExtended('ionogramValue', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Gaz du sang" controlId="bloodGasValue">
              <input id="bloodGasValue" title="Gaz du sang" value={f.extendedProfile?.bloodGasValue ?? ''}
                onChange={(e) => setExtended('bloodGasValue', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Autres analyses" controlId="otherAnalyses">
              <textarea id="otherAnalyses" title="Autres analyses" rows={2} value={f.extendedProfile?.otherAnalyses ?? ''}
                onChange={(e) => setExtended('otherAnalyses', e.target.value)} className={inputClass} disabled={isLoading} />
            </Field>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit */}
      <div className="flex gap-4 mt-8 pt-4 border-t border-slate-200">
        <Button
          type="submit"
          className="bg-[#2CB1BC] hover:bg-[#239AA3] text-white"
          disabled={isLoading}
        >
          {isLoading
            ? (mode === 'create' ? 'Creation...' : 'Sauvegarde...')
            : (mode === 'create' ? 'Creer le patient' : 'Sauvegarder')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
