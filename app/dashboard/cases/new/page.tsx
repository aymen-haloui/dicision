import CaseForm from '@/components/case-form'
import { Card } from '@/components/ui/card'

export const metadata = {
  title: 'Create Case - Medical Decision Support',
}

export default function NewCasePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Create New Case</h1>
        <p className="text-slate-600 mt-2">Enter patient information and medications</p>
      </div>

      <CaseForm />
    </div>
  )
}
