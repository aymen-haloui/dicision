'use client'

import Link from 'next/link'
import { Plus, Users, AlertCircle } from 'lucide-react'

export function DashboardQuickActions() {
  return (
    <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
      <div className="sticky top-20 space-y-4">
        {/* Quick Actions Card */}
        <div className="rounded-2xl border border-[#dce8e6] bg-gradient-to-br from-[#e9f8f6] via-[#f4fbfa] to-[#f9fcfb] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Actions rapides</h3>
          <div className="mt-4 space-y-3">
            <Link
              href="/dashboard/cases/new"
              className="flex items-center gap-3 rounded-xl bg-[#0f8f89] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c7a74] hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Nouveau cas
            </Link>
            <Link
              href="/dashboard/patients/new"
              className="flex items-center gap-3 rounded-xl border border-[#b8d9d5] bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur-sm transition hover:bg-white hover:shadow-md"
            >
              <Users className="h-4 w-4" />
              Ajouter patient
            </Link>
            <Link
              href="/dashboard/cases"
              className="flex items-center gap-3 rounded-xl border border-[#ffe8e8] bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 backdrop-blur-sm transition hover:bg-white hover:shadow-md"
            >
              <AlertCircle className="h-4 w-4 text-[#dc3f3f]" />
              Urgences actives
            </Link>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-white/80 bg-white/65 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conseil IA</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Commencez par un nouveau cas pour voir les recommandations d&apos;aide à la décision en temps réel.
          </p>
        </div>
      </div>
    </aside>
  )
}
