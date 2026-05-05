import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Users, Plus, ArrowRight, AlertCircle } from 'lucide-react'
import { getPatientsByUserId } from '@/lib/db'

export const metadata = {
  title: 'Patients — HEXA',
}

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

export default async function PatientsPage() {
  const session = await getServerSession(authOptions)
  const patients = await getPatientsByUserId(session?.user?.id || '')

  return (
    <div className="space-y-6">

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-[#BE185D]" />
            Patients
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {patients.length} registered patient{patients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/patients/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#BE185D] hover:bg-[#9f1239] text-white text-sm font-medium rounded-lg transition">
            <Plus className="h-4 w-4" /> New Patient
          </button>
        </Link>
      </div>

      {/* ── PATIENT LIST ─────────────────────────────────────── */}
      {patients.length === 0 ? (
        <Card className="p-16 text-center">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No patients yet</p>
          <Link href="/dashboard/patients/new">
            <button className="mt-4 px-4 py-2 bg-[#BE185D] text-white text-sm font-medium rounded-lg hover:bg-[#9f1239] transition">
              Add Patient
            </button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {patients.map((p: any) => (
            <Link key={p.id} href={`/dashboard/patients/${p.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BE185D] to-[#9f1239] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitials(p.first_name, p.last_name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">
                      {p.first_name} {p.last_name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                      {p.medical_record_number && (
                        <span>MRN: <strong className="text-slate-700">{p.medical_record_number}</strong></span>
                      )}
                      {p.date_of_birth && (
                        <span>DOB: {new Date(p.date_of_birth).toLocaleDateString()}</span>
                      )}
                      {p.gender && (
                        <span className="capitalize">{p.gender}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {p.allergies && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                        <AlertCircle className="h-3 w-3" /> Allergies
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#BE185D] transition-colors" />
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

