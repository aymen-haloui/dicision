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
            className="flex items-center justify-center gap-2 rounded-lg bg-[#2CB1BC] px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#239AA3] active:scale-[0.98] w-full"
          >
            <Plus className="h-4 w-4" />
            Nouveau cas
          </Link>
          <Link
            href="/dashboard/patients/new"
            className="flex items-center justify-center gap-2 rounded-lg border border-[#2CB1BC]/20 bg-white px-4 py-3 text-sm font-semibold text-[#0F8F89] transition duration-200 hover:bg-[#E6F9F7] active:scale-[0.98] w-full"
          >
            <Users className="h-4 w-4 text-[#0F8F89]" />
            Ajouter patient
          </Link>
          <Link
            href="/dashboard/cases"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#F1FAF9] px-4 py-3 text-sm font-semibold text-[#0F8F89] transition duration-200 hover:bg-[#E6F9F7] active:scale-[0.98] w-full"
          >
            <AlertCircle className="h-4 w-4 text-[#0F8F89]" />
            Urgences actives
          </Link>
        </div>

        <div className="rounded-lg bg-[#F7FAFC] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0F8F89]">Conseil</p>
          <p className="mt-3 text-sm leading-6 text-[#0F8F89]">
            Créez un cas pour activez les recommandations en temps réel et les alertes.
          </p>
        </div>
      </div>
    </aside>
  )
}
