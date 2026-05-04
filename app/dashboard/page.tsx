import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

async function getDashboardStats(userId: string) {
  try {
    const patients = await sql`
      SELECT COUNT(*) as count FROM patients WHERE user_id = ${userId}
    `
    const cases = await sql`
      SELECT COUNT(*) as count FROM cases WHERE user_id = ${userId}
    `
    const recentCases = await sql`
      SELECT c.id, c.case_type, p.first_name, p.last_name, c.created_at, c.status
      FROM cases c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.user_id = ${userId}
      ORDER BY c.created_at DESC
      LIMIT 5
    `

    return {
      patientCount: patients[0]?.count || 0,
      caseCount: cases[0]?.count || 0,
      recentCases: recentCases || [],
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      patientCount: 0,
      caseCount: 0,
      recentCases: [],
    }
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const stats = await getDashboardStats(session?.user?.id || '')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome back, {session?.user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Total Patients</h3>
          <p className="text-4xl font-bold text-slate-900">{stats.patientCount}</p>
          <Link href="/dashboard/patients">
            <Button className="mt-4 w-full" variant="outline">
              View Patients
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Total Cases</h3>
          <p className="text-4xl font-bold text-slate-900">{stats.caseCount}</p>
          <Link href="/dashboard/cases">
            <Button className="mt-4 w-full" variant="outline">
              View Cases
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Cases</h2>

        {stats.recentCases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No cases yet</p>
            <Link href="/dashboard/cases/new">
              <Button className="mt-4">Create First Case</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCases.map((caseItem: any) => (
                  <tr key={caseItem.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-900">
                      {caseItem.first_name} {caseItem.last_name}
                    </td>
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

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/patients/new">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Add New Patient
            </Button>
          </Link>
          <Link href="/dashboard/cases/new">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Create New Case
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
