import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const metadata = {
  title: 'Cases - Medical Decision Support',
  description: 'Manage your cases',
}

async function getCasesWithPatients(userId: string) {
  try {
    const result = await sql`
      SELECT c.id, c.case_type, c.chief_complaint, c.status, c.created_at,
             p.first_name, p.last_name
      FROM cases c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.user_id = ${userId}
      ORDER BY c.created_at DESC
    `
    return result
  } catch (error) {
    console.error('Error fetching cases:', error)
    return []
  }
}

export default async function CasesPage() {
  const session = await getServerSession(authOptions)
  const cases = await getCasesWithPatients(session?.user?.id || '')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Cases</h1>
          <p className="text-slate-600 mt-2">Manage your medical cases</p>
        </div>
        <Link href="/dashboard/cases/new">
          <Button className="bg-green-600 hover:bg-green-700">Create New Case</Button>
        </Link>
      </div>

      {cases.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500 mb-6">No cases yet. Create your first case.</p>
          <Link href="/dashboard/cases/new">
            <Button className="bg-green-600 hover:bg-green-700">Create Case</Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Patient</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Type</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Chief Complaint</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((caseItem: any) => (
                  <tr key={caseItem.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {caseItem.first_name} {caseItem.last_name}
                    </td>
                    <td className="py-4 px-6">
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
                    <td className="py-4 px-6 text-slate-600">
                      {caseItem.chief_complaint
                        ? caseItem.chief_complaint.substring(0, 40) + '...'
                        : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {new Date(caseItem.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
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
        </Card>
      )}
    </div>
  )
}
