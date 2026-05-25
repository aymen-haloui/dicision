import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Activity, FlaskConical, HeartPulse, Pencil, ShieldAlert, User } from 'lucide-react'

import { authOptions } from '@/lib/auth'
import { getCasesByPatientId } from '@/lib/db'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Details du patient - Aide a la decision medicale',
}

function formatDate(value?: string | Date | null) {
  if (!value) return 'Non renseigne'
  return new Date(value).toLocaleDateString()
}

function formatValue(value: unknown, fallback = 'Non renseigne') {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  return String(value)
}

function Section({
  title,
  icon,
  fields,
}: {
  title: string
  icon: React.ReactNode
  fields: Array<{ label: string; value: unknown }>
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[#2CB1BC]">{icon}</span>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{field.label}</p>
            <p className="mt-1 text-sm text-slate-900">{formatValue(field.value)}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || ''

  const patient = await prisma.patients.findFirst({
    where: { id, user_id: userId },
    include: { patient_lifestyle: true, patient_allergies: true },
  })
  if (!patient) notFound()

  const lifestyle = (patient.patient_lifestyle && patient.patient_lifestyle[0]) || {}
  const ep = (patient.extended_profile || {}) as Record<string, any>

  const cases = await getCasesByPatientId(id, userId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dossier : {formatValue(patient.medical_record_number)}
          </p>
        </div>

        <Link
          href={`/dashboard/patients/${id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2CB1BC] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#239AA3]"
        >
          <Pencil className="h-4 w-4" />
          Modifier le patient
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section
          title="Identite"
          icon={<User className="h-5 w-5" />}
          fields={[
            { label: 'Prenom', value: patient.first_name },
            { label: 'Nom', value: patient.last_name },
            { label: 'Date de naissance', value: formatDate(patient.date_of_birth) },
            { label: 'Sexe', value: patient.gender },
            { label: 'Grossesse / allaitement', value: patient.pregnancy_status },
            { label: 'Poids (kg)', value: patient.weight },
            { label: 'Taille (cm)', value: patient.height },
          ]}
        />

        <Section
          title="Mode de vie"
          icon={<HeartPulse className="h-5 w-5" />}
          fields={[
            { label: 'Tabagisme', value: patient.smoking_status },
            { label: 'Consommation d\'alcool', value: patient.alcohol_use },
            { label: 'Usage de substances', value: patient.substance_use ?? lifestyle.substance_use },
            { label: 'Exposition professionnelle', value: patient.professional_exposure ?? lifestyle.professional_exposure },
            { label: 'Activite physique', value: patient.physical_activity ?? lifestyle.physical_activity },
            { label: 'Regime alimentaire', value: patient.diet_type ?? lifestyle.diet_type },
            { label: 'Niveau de stress', value: patient.stress_level ?? lifestyle.stress_level },
            { label: 'Qualite du sommeil', value: patient.sleep_quality ?? lifestyle.sleep_quality },
            { label: 'Heures de sommeil', value: patient.sleep_hours ?? lifestyle.sleep_hours },
            { label: 'Travail de nuit', value: patient.night_shift ?? lifestyle.night_shift },
            { label: 'Exposition au soleil', value: patient.sun_exposure ?? lifestyle.sun_exposure },
            { label: 'Jeune prolonge', value: patient.prolonged_fasting ?? lifestyle.prolonged_fasting },
            { label: 'Regime restrictif', value: patient.restrictive_diet ?? lifestyle.restrictive_diet },
            { label: 'Produits naturels non controles', value: patient.uncontrolled_natural_products ?? lifestyle.uncontrolled_natural_products },
          ]}
        />

        <Section
          title="Facteurs medicaux"
          icon={<ShieldAlert className="h-5 w-5" />}
          fields={[
            { label: 'Allergies', value: patient.allergies || (patient.patient_allergies?.length ? patient.patient_allergies.map((a:any)=>a.allergen_name).join(', ') : null) },
            { label: 'Type de reaction allergique', value: patient.allergy_reaction_types },
            { label: 'Comorbidites', value: patient.comorbidities },
            { label: 'Immunodepression', value: patient.immunodepression ?? lifestyle.immunodepression },
            { label: 'Donneur de sang', value: patient.blood_donor ?? lifestyle.blood_donor },
            { label: 'Arret brutal de traitement', value: patient.sudden_medication_stop ?? lifestyle.sudden_medication_stop },
            { label: 'Suivi medical regulier', value: patient.regular_checkup ?? lifestyle.regular_checkup },
            { label: 'Autodiagnostic', value: patient.self_diagnosis ?? lifestyle.self_diagnosis },
            { label: 'Conditions de logement', value: patient.housing_conditions ?? lifestyle.housing_conditions },
            { label: 'Antecedent d\'intoxication', value: patient.previous_intoxication ?? lifestyle.previous_intoxication },
          ]}
        />

        <Section
          title="Biologie"
          icon={<FlaskConical className="h-5 w-5" />}
          fields={[
            { label: 'Creatinine', value: patient.creatinine },
            { label: 'Clairance de la creatinine', value: patient.renal_creatinine_clearance },
            { label: 'Stade renal', value: patient.renal_stage },
            { label: 'Statut hepatique', value: patient.hepatic_status },
            { label: 'ASAT', value: patient.asat },
            { label: 'ALAT', value: patient.alat },
            { label: 'Bilirubin', value: patient.bilirubin },
            { label: 'Glycemie', value: patient.glycemia },
            { label: 'Sodium', value: patient.sodium },
            { label: 'Potassium', value: patient.potassium },
            { label: 'CRP', value: patient.crp },
            { label: 'Lactates', value: patient.lactates },
          ]}
        />

        <Section
          title="Clinique et toxicologie"
          icon={<Activity className="h-5 w-5" />}
          fields={[
            { label: 'Tension arterielle', value: ep.bloodPressure },
            { label: 'Frequence cardiaque', value: ep.heartRate },
            { label: 'SpO2', value: ep.spo2Value },
            { label: 'Etat de conscience', value: ep.consciousnessState },
            { label: 'Motif de consultation', value: ep.consultationReason },
            { label: 'Substance suspectee', value: ep.suspectedSubstanceType },
            { label: 'Voie d\'exposition', value: ep.exposureRoute },
            { label: 'Evolution clinique', value: ep.clinicalEvolution },
          ]}
        />
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#2CB1BC]" />
          <h2 className="text-lg font-semibold text-slate-900">Cas</h2>
        </div>

        {cases.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun cas enregistre pour ce patient pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {cases.map((patientCase: any) => (
              <Link key={patientCase.id} href={`/dashboard/cases/${patientCase.id}`}>
                <div className="rounded-lg border border-slate-200 p-4 transition hover:border-[#2CB1BC] hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {formatValue(patientCase.chief_complaint, 'Aucun motif principal')}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatValue(patientCase.case_type)} · {formatValue(patientCase.status)} · {formatDate(patientCase.created_at)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[#2CB1BC]">Ouvert</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

