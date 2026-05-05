import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Users, FolderOpen, AlertTriangle, Activity, ArrowRight, Plus } from 'lucide-react'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

async function getDashboardStats(userId: string) {
  try {
    const [patients, cases, emergencies, assessments, recentCases] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM patients WHERE user_id = ${userId}`,
      sql`SELECT COUNT(*) as count FROM cases WHERE user_id = ${userId}`,
      sql`SELECT COUNT(*) as count FROM cases WHERE user_id = ${userId} AND case_type = 'emergency'`,
      sql`SELECT COUNT(*) as count FROM risk_assessments ra JOIN cases c ON ra.case_id = c.id WHERE c.user_id = ${userId}`,
      sql`
        SELECT c.id, c.case_type, c.chief_complaint, c.status, c.created_at,
               p.first_name, p.last_name
        FROM cases c
        JOIN patients p ON c.patient_id = p.id
        WHERE c.user_id = ${userId}
        ORDER BY c.created_at DESC
        LIMIT 6
      `,
    ])
    return {
      patientCount: Number(patients[0]?.count ?? 0),
      caseCount: Number(cases[0]?.count ?? 0),
      emergencyCount: Number(emergencies[0]?.count ?? 0),
      assessmentCount: Number(assessments[0]?.count ?? 0),
      recentCases: recentCases || [],
    }
  } catch {
    return { patientCount: 0, caseCount: 0, emergencyCount: 0, assessmentCount: 0, recentCases: [] }
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const stats = await getDashboardStats(session?.user?.id || '')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const lastName = session?.user?.name?.split(' ').pop() ?? session?.user?.name

  return (
    <div className="space-y-8">

      {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-slate-500 text-sm">{greeting},</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-0.5">Dr. {lastName}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/patients/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition">
              <Plus className="h-4 w-4" /> New Patient
            </button>
          </Link>
          <Link href="/dashboard/cases/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#2CB1BC] hover:bg-[#239AA3] text-white text-sm font-medium rounded-lg transition">
              <Plus className="h-4 w-4" /> New Case
            </button>
          </Link>
        </div>
      </div>

      {/* â”€â”€ STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { label: 'Total Patients',    value: stats.patientCount,    icon: Users,          color: 'text-blue-600 bg-blue-50',    href: '/dashboard/patients' },
          { label: 'Total Cases',       value: stats.caseCount,       icon: FolderOpen,     color: 'text-violet-600 bg-violet-50', href: '/dashboard/cases' },
          { label: 'Emergency Cases',   value: stats.emergencyCount,  icon: AlertTriangle,  color: 'text-red-600 bg-red-50',      href: '/dashboard/cases' },
          { label: 'Risk Assessments',  value: stats.assessmentCount, icon: Activity,       color: 'text-emerald-600 bg-emerald-50', href: '/dashboard/cases' },
        ] as const).map(s => (
          <Link key={s.label} href={s.href}>
            <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* â”€â”€ RECENT CASES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Cases</h2>
          <Link
            href="/dashboard/cases"
            className="text-sm text-[#2CB1BC] hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {stats.recentCases.length === 0 ? (
          <Card className="p-14 text-center">
            <FolderOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No cases yet</p>
            <Link href="/dashboard/cases/new">
              <button className="mt-4 px-4 py-2 bg-[#2CB1BC] text-white text-sm font-medium rounded-lg hover:bg-[#239AA3] transition">
                Create First Case
              </button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-2">
            {stats.recentCases.map((c: any) => (
              <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      c.case_type === 'emergency' ? 'bg-red-100' : 'bg-violet-100'
                    }`}>
                      <FolderOpen className={`h-4 w-4 ${
                        c.case_type === 'emergency' ? 'text-red-600' : 'text-violet-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {c.first_name} {c.last_name}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {c.chief_complaint || 'No complaint recorded'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        c.case_type === 'emergency'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-violet-50 text-violet-700'
                      }`}>
                        {c.case_type}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#2CB1BC] transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
