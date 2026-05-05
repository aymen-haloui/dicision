import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { FolderOpen, Plus, AlertTriangle, ArrowRight } from 'lucide-react'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

export const metadata = {
  title: 'Cases â€” HEXA',
}

async function getCasesWithPatients(userId: string) {
  try {
    return await sql`
      SELECT c.id, c.case_type, c.chief_complaint, c.status, c.created_at,
             p.first_name, p.last_name
      FROM cases c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.user_id = ${userId}
      ORDER BY c.created_at DESC
    `
  } catch {
    return []
  }
}

const STATUS_STYLE: Record<string, string> = {
  open:     'bg-emerald-50 text-emerald-700',
  closed:   'bg-slate-100 text-slate-600',
  pending:  'bg-amber-50 text-amber-700',
  resolved: 'bg-blue-50 text-blue-700',
}

export default async function CasesPage() {
  const session = await getServerSession(authOptions)
  const cases = await getCasesWithPatients(session?.user?.id || '')
  const emergencies = cases.filter((c: any) => c.case_type === 'emergency').length

  return (
    <div className="space-y-6">

      {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-[#2CB1BC]" />
            Cases
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {cases.length} total case{cases.length !== 1 ? 's' : ''}
            {emergencies > 0 && (
              <span className="ml-2 text-red-600 font-medium">Â· {emergencies} emergency</span>
            )}
          </p>
        </div>
        <Link href="/dashboard/cases/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2CB1BC] hover:bg-[#239AA3] text-white text-sm font-medium rounded-lg transition">
            <Plus className="h-4 w-4" /> New Case
          </button>
        </Link>
      </div>

      {/* â”€â”€ CASE LIST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {cases.length === 0 ? (
        <Card className="p-16 text-center">
          <FolderOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No cases yet</p>
          <Link href="/dashboard/cases/new">
            <button className="mt-4 px-4 py-2 bg-[#2CB1BC] text-white text-sm font-medium rounded-lg hover:bg-[#239AA3] transition">
              Create Case
            </button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {cases.map((c: any) => (
            <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    c.case_type === 'emergency' ? 'bg-red-100' : 'bg-violet-100'
                  }`}>
                    {c.case_type === 'emergency'
                      ? <AlertTriangle className="h-4 w-4 text-red-600" />
                      : <FolderOpen className="h-4 w-4 text-violet-600" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">
                        {c.first_name} {c.last_name}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        c.case_type === 'emergency'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-violet-50 text-violet-700'
                      }`}>
                        {c.case_type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate mt-0.5">
                      {c.chief_complaint
                        ? c.chief_complaint.substring(0, 90)
                        : 'No complaint recorded'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                      STATUS_STYLE[c.status] ?? 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.status}
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
  )
}
