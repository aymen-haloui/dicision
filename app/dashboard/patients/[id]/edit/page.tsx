import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
  const patient = await prisma.patients.findFirst({
    where: { id, user_id: session?.user?.id || '' },
    include: {
      patient_conditions: true,
      patient_allergies: true,
      patient_medications: {
        include: { medications: true },
      },
      patient_lifestyle: true,
    },
  })

  if (!patient) {
    notFound()
  }

  const initialConditions = patient.patient_conditions.map((condition: any) => ({
    id: condition.id,
    condition_name: condition.condition_name,
    category: condition.category || '',
    severity: condition.severity || '',
    status: condition.status || '',
    diagnosed_at: formatDateInput(condition.diagnosed_at),
    notes: condition.notes || '',
  }))

  const initialAllergies = patient.patient_allergies.map((allergy: any) => ({
    id: allergy.id,
    allergen_name: allergy.allergen_name,
    allergen_category: allergy.allergen_category || '',
    reaction_type: allergy.reaction_type || '',
    severity: allergy.severity || '',
    onset_delay: allergy.onset_delay || '',
  }))

  const initialMedications = patient.patient_medications.map((medication: any) => ({
    id: medication.id,
    medication_name: medication.medications.name,
    dosage: medication.dosage || '',
    frequency: medication.frequency || '',
    route: medication.route || '',
    started_at: formatDateInput(medication.started_at),
    ongoing: medication.ongoing ?? true,
  }))

  const initialLifestyle = patient.patient_lifestyle.map(({ created_at, sleep_hours, ...lifestyle }: any) => ({
    ...lifestyle,
    sleep_hours: sleep_hours?.toString() || '',
  }))

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
            first_name: patient.first_name,
            last_name: patient.last_name,
            date_of_birth: formatDateInput(patient.date_of_birth),
            gender: patient.gender || '',
            medical_record_number: patient.medical_record_number || '',
            weight: patient.weight?.toString() || '',
            height: patient.height?.toString() || '',
            pregnancy_status: Boolean(patient.pregnancy_status),
            pregnancy_trimester: patient.pregnancy_trimester || '',
            pregnancy_duration_weeks: patient.pregnancy_duration_weeks?.toString() || '',
            breastfeeding_status: Boolean(patient.breastfeeding_status),
            breastfeeding_infant_age: patient.breastfeeding_infant_age || '',
            breastfeeding_type: patient.breastfeeding_type || '',
            smoking_status: patient.smoking_status || '',
            alcohol_use: patient.alcohol_use || '',
            physical_activity: patient.physical_activity || '',
            stress_level: patient.stress_level || '',
            sleep_quality: patient.sleep_quality || '',
            patient_conditions: initialConditions,
            patient_allergies: initialAllergies,
            patient_medications: initialMedications,
            patient_lifestyle: initialLifestyle,
          }}
        />
      </Card>
    </div>
  )
}
