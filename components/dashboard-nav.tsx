'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface User {
  name?: string | null
  email?: string | null
  specialization?: string
}

export default function DashboardNav({ user }: { user: User }) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">
            MedDecision
          </Link>
          <div className="flex gap-6">
            <Link
              href="/dashboard"
              className="text-slate-600 hover:text-slate-900 font-medium transition"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/patients"
              className="text-slate-600 hover:text-slate-900 font-medium transition"
            >
              Patients
            </Link>
            <Link
              href="/dashboard/cases"
              className="text-slate-600 hover:text-slate-900 font-medium transition"
            >
              Cases
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.specialization}</p>
          </div>
          <Button
            onClick={() => signOut({ redirect: true, callbackUrl: '/auth/login' })}
            variant="outline"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}
