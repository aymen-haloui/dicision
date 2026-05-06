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
    smokingStatus: initialData?.smoking_status ?? initialData?.smokingStatus ?? 'non-smoker',
    alcoholUse: initialData?.alcohol_use ?? initialData?.alcoholUse ?? 'none',
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
    immunodepression: initialData?.immunodepression ?? 'none',
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

  function set(name: string, value: any) {
    setF(prev => ({ ...prev, [name]: value }))
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    set(e.target.name, e.target.value)
  }
  function handleCheck(name: string, value: boolean) { set(name, value) }

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
                <option value="male">Masculin</option>
                <option value="female">Feminin</option>
                <option value="other">Autre</option>
              </select>
            </Field>
            <Field label="Numero de dossier medical" controlId="medicalRecordNumber">
              <input id="medicalRecordNumber" title="Numero de dossier medical" placeholder="Numero de dossier"
                name="medicalRecordNumber" value={f.medicalRecordNumber}
                onChange={handleChange} className={inputClass} disabled={isLoading} />
            </Field>
            <Field label="Statut reproductif" controlId="pregnancyStatus">
              <select id="pregnancyStatus" title="Statut reproductif" name="pregnancyStatus" value={f.pregnancyStatus}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="not_applicable">Non applicable</option>
                <option value="not_pregnant">Non enceinte</option>
                <option value="trimester_1">Grossesse T1 (0-3 mois)</option>
                <option value="trimester_2">Grossesse T2 (3-6 mois)</option>
                <option value="trimester_3">Grossesse T3 (6-9 mois)</option>
                <option value="breastfeeding">Allaitement</option>
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

            <Field label="Tabac" controlId="smokingStatus">
              <select id="smokingStatus" title="Tabac" name="smokingStatus" value={f.smokingStatus}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="non-smoker">Non-fumeur</option>
                <option value="smoker">Fumeur actif</option>
                <option value="e-cigarette">Cigarette electronique</option>
                <option value="hookah">Nargile / chicha</option>
                <option value="former">Ancien fumeur</option>
              </select>
            </Field>
            <Field label="Alcool" controlId="alcoholUse">
              <select id="alcoholUse" title="Alcool" name="alcoholUse" value={f.alcoholUse}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="none">Aucun</option>
                <option value="occasional">Occasionnel</option>
                <option value="moderate">Modere (1-2 verres/j)</option>
                <option value="heavy">Excessif (&gt;3 verres/j)</option>
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

            <Field label="Activite physique" controlId="physicalActivity">
              <select id="physicalActivity" title="Activite physique" name="physicalActivity" value={f.physicalActivity}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="sedentary">Sedentaire</option>
                <option value="light">Legere (1-2x/sem)</option>
                <option value="moderate">Moderee (3-4x/sem)</option>
                <option value="intense">Intense (&gt;4x/sem)</option>
                <option value="athlete">Athlete de haut niveau</option>
              </select>
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
                <option value="low">Faible</option>
                <option value="moderate">Modere</option>
                <option value="high">Eleve</option>
              </select>
            </Field>
            <Field label="Qualite du sommeil" controlId="sleepQuality">
              <select id="sleepQuality" title="Qualite du sommeil" name="sleepQuality" value={f.sleepQuality}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="good">Bonne</option>
                <option value="fragmented">Fragmentee</option>
                <option value="insomnia">Insomnie</option>
              </select>
            </Field>
            <Field label="Heures de sommeil / nuit" unit="h" controlId="sleepHours">
              <input type="number" step="0.5" min="0" max="24" name="sleepHours"
                value={f.sleepHours} onChange={handleChange} className={inputClass}
                disabled={isLoading} placeholder="ex. 6.5" />
            </Field>
            <Field label="Exposition solaire" controlId="sunExposure">
              <select id="sunExposure" title="Exposition solaire" name="sunExposure" value={f.sunExposure}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="low">Faible</option>
                <option value="moderate">Moderee</option>
                <option value="high">Forte</option>
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
              <select id="immunodepression" title="Immunodepression" name="immunodepression" value={f.immunodepression}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="none">Aucune</option>
                <option value="disease">Liee a une maladie (VIH, cancer, etc.)</option>
                <option value="treatment">Liee a un traitement (corticoides, chimio)</option>
              </select>
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
              <Field label="Stade insuffisance renale (CKD-KDIGO)" controlId="renalStage">
                <select id="renalStage" title="Stade insuffisance renale" name="renalStage" value={f.renalStage}
                  onChange={handleChange} className={selectClass} disabled={isLoading}>
                  <option value="">-- Selectionnez --</option>
                  <option value="none">Aucune (G1/G2 normal)</option>
                  <option value="G2">G2 — Legere (CrCl 60-89)</option>
                  <option value="G3a">G3a — Moderee (CrCl 45-59)</option>
                  <option value="G3b">G3b — Moderee-severe (CrCl 30-44)</option>
                  <option value="G4">G4 — Severe (CrCl 15-29)</option>
                  <option value="G5">G5 — Terminale (CrCl &lt;15)</option>
                </select>
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
              <select id="hepaticStatus" title="Insuffisance hepatique" name="hepaticStatus" value={f.hepaticStatus}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">Normale</option>
                <option value="mild">Legere (Child-Pugh A)</option>
                <option value="moderate">Moderee (Child-Pugh B)</option>
                <option value="severe">Severe (Child-Pugh C)</option>
              </select>
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
              <select id="allergyReactionTypes" title="Type de reaction allergique" name="allergyReactionTypes" value={f.allergyReactionTypes}
                onChange={handleChange} className={selectClass} disabled={isLoading}>
                <option value="">-- Selectionnez --</option>
                <option value="cutaneous">Cutanee (urticaire, rash, eczema)</option>
                <option value="respiratory">Respiratoire (bronchospasme, rhinite)</option>
                <option value="anaphylaxis">Anaphylaxie / choc anaphylactique</option>
                <option value="digestive">Digestive (nausees, vomissements)</option>
                <option value="mixed">Mixte (plusieurs types)</option>
              </select>
            </Field>

            <SectionTitle>Antecedents medicaux</SectionTitle>

            <Field label="Comorbidites / Antecedents (maladies chroniques, chirurgies, hospitalisations)" controlId="comorbidities">
              <textarea name="comorbidities" value={f.comorbidities} onChange={handleChange}
                rows={4} className={inputClass} disabled={isLoading}
                placeholder="ex. Diabete type 2, HTA, insuffisance renale chronique, asthme..." />
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
