import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getPatientById, getCasesByPatientId } from '@/lib/db'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Patient Details - Medical Decision Support',
}

export default async function PatientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  const patient = await getPatientById(params.id, session?.user?.id || '')
  const cases = await getCasesByPatientId(params.id, session?.user?.id || '')

  if (!patient) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-slate-600 mt-2">Patient Details</p>
        </div>
        <Link href={`/dashboard/patients/${patient.id}/edit`}>
          <Button className="bg-blue-600 hover:bg-blue-700">Edit Patient</Button>
        </Link>
      </div>

      {/* Patient Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Demographics</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-1">Date of Birth</p>
            <p className="text-lg font-medium text-slate-900">
              {patient.date_of_birth
                ? new Date(patient.date_of_birth).toLocaleDateString()
                : 'Not provided'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Gender</p>
            <p className="text-lg font-medium text-slate-900">
              {patient.gender || 'Not provided'}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Medical Record Number</p>
            <p className="text-lg font-medium text-slate-900">
              {patient.medical_record_number || 'Not provided'}
            </p>
          </div>
        </div>
      </Card>

      {/* Allergies */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Allergies</h2>
        {patient.allergies ? (
          <p className="text-slate-700 whitespace-pre-wrap">{patient.allergies}</p>
        ) : (
          <p className="text-slate-500">No allergies recorded</p>
        )}
      </Card>

      {/* Comorbidities */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Medical History</h2>
        {patient.comorbidities ? (
          <p className="text-slate-700 whitespace-pre-wrap">{patient.comorbidities}</p>
        ) : (
          <p className="text-slate-500">No medical history recorded</p>
        )}
      </Card>

      {/* Patient Cases */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Patient Cases</h2>
          <Link href={`/dashboard/cases/new?patientId=${patient.id}`}>
            <Button className="bg-green-600 hover:bg-green-700">Create Case</Button>
          </Link>
        </div>

        {cases.length === 0 ? (
          <p className="text-slate-500">No cases for this patient</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">
                    Chief Complaint
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((caseItem: any) => (
                  <tr key={caseItem.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          caseItem.case_type === 'emergency'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {caseItem.case_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {caseItem.chief_complaint
                        ? caseItem.chief_complaint.substring(0, 40)
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(caseItem.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/cases/${caseItem.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
