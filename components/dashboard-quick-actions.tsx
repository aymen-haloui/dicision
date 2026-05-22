'use client'

import Link from 'next/link'
import { Plus, Users, AlertCircle } from 'lucide-react'

export function DashboardQuickActions() {
  return (
    <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
      <div className="sticky top-20 space-y-4">
        <div className="rounded-[16px] border border-slate-200 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,25,35,0.08)] backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions rapides</p>
              <p className="mt-1 text-sm text-slate-500">Points de départ pour l'IA clinique</p>
            </div>
          </div>
          <div className="space-y-3">
            <Link
              href="/dashboard/cases/new"
              className="flex items-center justify-center gap-2 rounded-[16px] bg-[#0f8f89] px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#0c7a74] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Nouveau cas
            </Link>
            <Link
              href="/dashboard/patients/new"
              className="flex items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
            >
              <Users className="h-4 w-4" />
              Ajouter patient
            </Link>
            <Link
              href="/dashboard/cases"
              className="flex items-center justify-center gap-2 rounded-[16px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-[#0f8f89] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 active:scale-[0.98]"
            >
              <AlertCircle className="h-4 w-4 text-[#0f8f89]" />
              Urgences actives
            </Link>
          </div>
        </div>

        <div className="rounded-[16px] border border-slate-200 bg-[#f7fdfb] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conseil IA</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Lancez un flux clinique pour afficher les recommandations en temps réel et les alertes de risque de manière centralisée.
          </p>
        </div>
      </div>
    </aside>
  )
}
