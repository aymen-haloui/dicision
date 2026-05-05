import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { getPatientById, getCasesByPatientId } from '@/lib/db'
import { notFound } from 'next/navigation'
import {
  User, Calendar, Hash, Heart, AlertCircle,
  FolderOpen, Plus, AlertTriangle, ArrowRight, Pencil, ChevronLeft,
} from 'lucide-react'

export const metadata = {
  title: 'Patient — HEXA',
}

function getInitials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

const STATUS_STYLE: Record<string, string> = {
  open:     'bg-emerald-50 text-emerald-700',
  closed:   'bg-slate-100 text-slate-600',
  pending:  'bg-amber-50 text-amber-700',
  resolved: 'bg-blue-50 text-blue-700',
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const patient = await getPatientById(id, session?.user?.id || '')
  const cases = await getCasesByPatientId(id, session?.user?.id || '')

  if (!patient) {
    notFound()
  }

  return (
    <div className="space-y-6">

      {/* ── BACK ─────────────────────────────────────────────── */}
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Patients
      </Link>

      {/* ── PATIENT HEADER ───────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#BE185D] to-[#9f1239] flex items-center justify-center text-white text-xl font-bold shrink-0">
              {getInitials(patient.first_name, patient.last_name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                {patient.medical_record_number && (
                  <span className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    MRN: {patient.medical_record_number}
                  </span>
                )}
                {patient.date_of_birth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(patient.date_of_birth).toLocaleDateString()}
                  </span>
                )}
                {patient.gender && (
                  <span className="flex items-center gap-1 capitalize">
                    <User className="h-3.5 w-3.5" />
                    {patient.gender}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link href={`/dashboard/patients/${patient.id}/edit`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition">
              <Pencil className="h-4 w-4" /> Edit Patient
            </button>
          </Link>
        </div>
      </Card>

      {/* ── CLINICAL DETAILS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allergies */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Allergies</h2>
          </div>
          {patient.allergies ? (
            <p className="text-slate-700 text-sm leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {patient.allergies}
            </p>
          ) : (
            <p className="text-slate-400 text-sm">No allergies recorded</p>
          )}
        </Card>

        {/* Comorbidities */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-rose-500" />
            <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Medical History</h2>
          </div>
          {patient.comorbidities ? (
            <p className="text-slate-700 text-sm leading-relaxed">{patient.comorbidities}</p>
          ) : (
            <p className="text-slate-400 text-sm">No medical history recorded</p>
          )}
        </Card>
      </div>

      {/* ── PATIENT CASES ────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-[#BE185D]" />
            Cases ({cases.length})
          </h2>
          <Link href={`/dashboard/cases/new?patientId=${patient.id}`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#BE185D] hover:bg-[#9f1239] text-white text-sm font-medium rounded-lg transition">
              <Plus className="h-4 w-4" /> New Case
            </button>
          </Link>
        </div>

        {cases.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No cases for this patient</p>
            <Link href={`/dashboard/cases/new?patientId=${patient.id}`}>
              <button className="mt-4 px-4 py-2 bg-[#BE185D] text-white text-sm font-medium rounded-lg hover:bg-[#9f1239] transition">
                Create First Case
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
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          c.case_type === 'emergency'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-violet-50 text-violet-700'
                        }`}>
                          {c.case_type}
                        </span>
                        {c.chief_complaint && (
                          <span className="text-sm font-medium text-slate-900 truncate">
                            {c.chief_complaint.substring(0, 60)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                        STATUS_STYLE[c.status] ?? 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#BE185D] transition-colors" />
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
