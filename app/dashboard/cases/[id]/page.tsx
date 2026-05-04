import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCaseById, getCaseMedications, getRiskAssessmentByCase, getPatientById } from '@/lib/db'
import { notFound } from 'next/navigation'
import CaseAnalysisButton from '@/components/case-analysis-button'
import RiskAssessmentDisplay from '@/components/risk-assessment-display'

export const metadata = {
  title: 'Case Details - Medical Decision Support',
}

export default async function CaseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  const caseData = await getCaseById(params.id, session?.user?.id || '')

  if (!caseData) {
    notFound()
  }

  const [patient, medications, riskAssessment] = await Promise.all([
    getPatientById(caseData.patient_id, session?.user?.id || ''),
    getCaseMedications(params.id),
    getRiskAssessmentByCase(params.id),
  ])

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Case: {patient?.first_name} {patient?.last_name}
          </h1>
          <p className="text-slate-600 mt-2">
            {caseData.case_type === 'emergency' ? '🚨 Emergency' : 'Clinical'} Case
          </p>
        </div>
        <div className="flex gap-2">
          <CaseAnalysisButton caseId={params.id} />
          <Link href="/dashboard/cases">
            <Button variant="outline">Back to Cases</Button>
          </Link>
        </div>
      </div>

      {/* Risk Assessment */}
      {riskAssessment && (
        <Card className="p-6 border-2 border-slate-200">
          <RiskAssessmentDisplay assessment={riskAssessment} />
        </Card>
      )}

      {/* Case Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Case Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-1">Case Type</p>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                caseData.case_type === 'emergency'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {caseData.case_type}
            </span>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Status</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {caseData.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Date Created</p>
            <p className="text-lg font-medium text-slate-900">
              {new Date(caseData.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Chief Complaint */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Chief Complaint</h2>
        <p className="text-slate-700 text-lg">{caseData.chief_complaint}</p>
      </Card>

      {/* Symptoms */}
      {caseData.symptoms && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Symptoms</h2>
          <p className="text-slate-700 whitespace-pre-wrap">{caseData.symptoms}</p>
        </Card>
      )}

      {/* Vital Signs */}
      {caseData.vital_signs && Object.keys(caseData.vital_signs).length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Vital Signs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(caseData.vital_signs).map(([key, value]) => (
              <div
                key={key}
                className="p-4 bg-slate-50 rounded-lg"
              >
                <p className="text-sm text-slate-600 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-slate-900">{value || '-'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Medications */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Medications</h2>

        {medications.length === 0 ? (
          <p className="text-slate-500">No medications added to this case</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">
                    Medication
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Dosage</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">
                    Frequency
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Duration</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Route</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med: any) => (
                  <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {med.name}
                      {med.generic_name && (
                        <span className="text-sm text-slate-500 block">
                          ({med.generic_name})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{med.dosage || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{med.frequency || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{med.duration || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{med.route || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Patient Information */}
      {patient && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Patient Information</h2>
          <Link href={`/dashboard/patients/${patient.id}`}>
            <Button variant="outline">View Full Patient Record</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
