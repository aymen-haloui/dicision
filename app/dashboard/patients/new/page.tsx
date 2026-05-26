import PatientForm from '@/components/patient-form'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'

export const metadata = {
  title: 'Nouveau patient - Aide a la decision medicale',
}

export default function NewPatientPage() {
  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/dashboard/patients" className="inline-flex items-center gap-1.5 transition hover:text-[#2CB1BC]">
              <ArrowLeft className="h-4 w-4" />
              Patients
            </Link>
            <span>/</span>
            <span className="text-slate-600">Nouveau patient</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2CB1BC]/10 text-[#2CB1BC]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Nouveau patient</h1>
              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                Créez un dossier patient clair, structuré et prêt pour le suivi clinique.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <PatientForm mode="create" />
      </Card>
    </div>
  )
}
