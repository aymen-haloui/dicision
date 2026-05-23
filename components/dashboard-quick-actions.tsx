'use client'

import Link from 'next/link'
import { Plus, Users, AlertCircle } from 'lucide-react'

export function DashboardQuickActions() {
  return (
    <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0">
      <div className="sticky top-20 space-y-6">
        <div className="space-y-3">
          <Link
            href="/dashboard/cases/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-slate-800 active:scale-[0.98] w-full"
          >
            <Plus className="h-4 w-4" />
            Nouveau cas
          </Link>
          <Link
            href="/dashboard/patients/new"
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition duration-200 hover:bg-slate-50 active:scale-[0.98] w-full"
          >
            <Users className="h-4 w-4" />
            Ajouter patient
          </Link>
          <Link
            href="/dashboard/cases"
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition duration-200 hover:bg-slate-200 active:scale-[0.98] w-full"
          >
            <AlertCircle className="h-4 w-4" />
            Urgences actives
          </Link>
        </div>

        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">Conseil</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Créez un cas pour activez les recommandations en temps réel et les alertes.
          </p>
        </div>
      </div>
    </aside>
  )
}
