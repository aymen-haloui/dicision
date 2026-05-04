import PatientForm from '@/components/patient-form'
import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Create Patient - Medical Decision Support',
}

export default function NewPatientPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Add New Patient</h1>
        <p className="text-slate-600 mt-2">Create a new patient record</p>
      </div>

      <Card className="p-8">
        <PatientForm mode="create" />
      </Card>
    </div>
  )
}
