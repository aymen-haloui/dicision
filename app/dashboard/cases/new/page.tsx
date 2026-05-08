import CaseForm from '@/components/case-form'
import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Nouveau cas - Aide a la decision medicale',
}

export default function NewCasePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Nouveau cas</h1>
        <p className="text-slate-600 mt-2">Saisissez les informations patient et les medicaments</p>
      </div>

      <CaseForm />
    </div>
  )
}
