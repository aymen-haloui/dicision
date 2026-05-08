import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPatientById } from '@/lib/db'
import { notFound } from 'next/navigation'
import PatientForm from '@/components/patient-form'
import { Card } from '@/components/ui/card'

function formatDateInput(value?: string | Date | null) {
  if (!value) return ''
  return new Date(value).toISOString().split('T')[0]
}

export const metadata = {
  title: 'Modifier le patient - Aide a la decision medicale',
}

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const patient = await getPatientById(id, session?.user?.id || '')

  if (!patient) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Modifier le patient</h1>
        <p className="text-slate-600 mt-2">Mettre a jour les informations du patient</p>
      </div>

      <Card className="p-8">
        <PatientForm
          patientId={id}
          mode="edit"
          initialData={{
            firstName: patient.first_name,
            lastName: patient.last_name,
            dateOfBirth: formatDateInput(patient.date_of_birth),
            gender: patient.gender || '',
            medicalRecordNumber: patient.medical_record_number || '',
            allergies: patient.allergies || '',
            comorbidities: patient.comorbidities || '',
            weight: patient.weight?.toString() || '',
            height: patient.height?.toString() || '',
            pregnancyStatus: patient.pregnancy_status || '',
            smokingStatus: patient.smoking_status || '',
            alcoholUse: patient.alcohol_use || '',
            substanceUse: patient.substance_use || '',
            professionalExposure: patient.professional_exposure || '',
            physicalActivity: patient.physical_activity || '',
            dietType: patient.diet_type || '',
            stressLevel: patient.stress_level || '',
            sleepQuality: patient.sleep_quality || '',
            sleepHours: patient.sleep_hours?.toString() || '',
            nightShift: Boolean(patient.night_shift),
            sunExposure: patient.sun_exposure || '',
            prolongedFasting: Boolean(patient.prolonged_fasting),
            restrictiveDiet: Boolean(patient.restrictive_diet),
            uncontrolledNaturalProducts: Boolean(patient.uncontrolled_natural_products),
            bloodDonor: Boolean(patient.blood_donor),
            immunodepression: patient.immunodepression || '',
            suddenMedicationStop: Boolean(patient.sudden_medication_stop),
            regularCheckup: patient.regular_checkup ?? true,
            selfDiagnosis: Boolean(patient.self_diagnosis),
            housingConditions: patient.housing_conditions || '',
            previousIntoxication: Boolean(patient.previous_intoxication),
            allergyReactionTypes: patient.allergy_reaction_types || '',
            creatinine: patient.creatinine?.toString() || '',
            renalCreatinineClearance: patient.renal_creatinine_clearance?.toString() || '',
            renalStage: patient.renal_stage || '',
            hepaticStatus: patient.hepatic_status || '',
            asat: patient.asat?.toString() || '',
            alat: patient.alat?.toString() || '',
            bilirubin: patient.bilirubin?.toString() || '',
            glycemia: patient.glycemia?.toString() || '',
            sodium: patient.sodium?.toString() || '',
            potassium: patient.potassium?.toString() || '',
            crp: patient.crp?.toString() || '',
            lactates: patient.lactates?.toString() || '',
            extendedProfile: patient.extended_profile || {},
          }}
        />
      </Card>
    </div>
  )
}
