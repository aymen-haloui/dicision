import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getPatientsByUserId } from '@/lib/db'

export const metadata = {
  title: 'Patients - Medical Decision Support',
  description: 'Manage your patients',
}

export default async function PatientsPage() {
  const session = await getServerSession(authOptions)
  const patients = await getPatientsByUserId(session?.user?.id || '')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-600 mt-2">Manage your patient records</p>
        </div>
        <Link href="/dashboard/patients/new">
          <Button className="bg-blue-600 hover:bg-blue-700">Add New Patient</Button>
        </Link>
      </div>

      {patients.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500 mb-6">No patients yet. Create your first patient record.</p>
          <Link href="/dashboard/patients/new">
            <Button className="bg-blue-600 hover:bg-blue-700">Create Patient</Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Date of Birth</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Gender</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">MRN</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Allergies</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient: any) => (
                  <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {patient.first_name} {patient.last_name}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {patient.date_of_birth
                        ? new Date(patient.date_of_birth).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-600">{patient.gender || '-'}</td>
                    <td className="py-4 px-6 text-slate-600">
                      {patient.medical_record_number || '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {patient.allergies ? patient.allergies.substring(0, 30) + '...' : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/patients/${patient.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
