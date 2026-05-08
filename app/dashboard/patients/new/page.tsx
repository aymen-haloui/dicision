import PatientForm from '@/components/patient-form'
import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Nouveau patient - Aide a la decision medicale',
}

export default function NewPatientPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Nouveau patient</h1>
        <p className="text-slate-600 mt-2">Creer un nouveau dossier patient</p>
      </div>

      <Card className="p-8">
        <PatientForm mode="create" />
      </Card>
    </div>
  )
}
