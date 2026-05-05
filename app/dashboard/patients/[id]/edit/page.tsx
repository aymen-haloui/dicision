import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPatientById } from '@/lib/db'
import { notFound } from 'next/navigation'
import PatientForm from '@/components/patient-form'
import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Edit Patient - Medical Decision Support',
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
        <h1 className="text-4xl font-bold text-slate-900">Edit Patient</h1>
        <p className="text-slate-600 mt-2">Update patient information</p>
      </div>

      <Card className="p-8">
        <PatientForm
          patientId={id}
          mode="edit"
          initialData={{
            firstName: patient.first_name,
            lastName: patient.last_name,
            dateOfBirth: patient.date_of_birth || '',
            gender: patient.gender || '',
            medicalRecordNumber: patient.medical_record_number || '',
            allergies: patient.allergies || '',
            comorbidities: patient.comorbidities || '',
          }}
        />
      </Card>
    </div>
  )
}
