'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PlantsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/admin/clinical-rules/plants')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg text-center">
        <p className="text-lg font-semibold text-slate-900">Redirection en cours...</p>
        <p className="mt-2 text-sm text-slate-500">Vous êtes redirigé vers la section Plantes du moteur de règles.</p>
      </div>
    </div>
  )
}
