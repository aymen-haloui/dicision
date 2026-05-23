'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Trash2, Search } from 'lucide-react'

export default function DoctorsAdminPage() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [page, limit, search])

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      params.set('page', String(page))
      params.set('limit', String(limit))
      const res = await fetch('/api/admin/doctors?' + params.toString())
      if (res.ok) {
        const json = await res.json()
        setDoctors(json.data || [])
        setTotal(json.total || 0)
      } else {
        setError('Erreur de chargement')
      }
    } catch (e) { setError('Erreur de chargement') }
    setLoading(false)
  }
  const filtered = doctors

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet utilisateur definitivement ?')) return
    setSaving(true)
    const res = await fetch(`/api/admin/doctors/${id}`, { method: 'DELETE' })
    if (!res.ok) setError((await res.json()).error || 'Echec')
    // refresh current page
    await load()
    setSaving(false)
  }

  const getRole = (specialization?: string) => {
    if (!specialization) return { label: 'Utilisateur', className: 'bg-slate-100 text-slate-700' }
    const value = specialization.toLowerCase()
    if (value.includes('admin')) return { label: 'Admin', className: 'bg-[#e6f8f4] text-[#0f8f89]' }
    if (value.includes('doctor') || value.includes('docteur') || value.includes('medecin')) return { label: 'Médecin', className: 'bg-[#def5f5] text-[#0f8f89]' }
    return { label: specialization, className: 'bg-slate-100 text-slate-700' }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">Utilisateurs</h1>
        <p className="max-w-2xl text-base text-slate-600">Gérez les accès et les permissions</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 mb-2">Rechercher</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              placeholder="Nom, email ou spécialisation..."
            />
          </div>
        </div>
        <div className="text-sm text-slate-500">
          {total} utilisateur{total !== 1 ? 's' : ''}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-12 text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200">
              <Search className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Aucun utilisateur trouvé</p>
            <p className="mt-1 text-xs text-slate-500">Essayez une autre recherche</p>
          </div>
        ) : (
          filtered.map(d => {
            const role = getRole(d.specialization)
            const initials = d.full_name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U'
            return (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-white p-4 transition duration-200 hover:bg-slate-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-sm font-semibold text-slate-700 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{d.full_name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{d.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${role.className}`}>
                    {role.label}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => handleDelete(d.id)} 
                    disabled={saving} 
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-slate-200">
        <div className="text-sm text-slate-500">
          Page {page} de {Math.max(1, Math.ceil(total / limit))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button" 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page <= 1} 
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Précédent
          </button>
          <button 
            type="button" 
            onClick={() => setPage(p => p + 1)} 
            disabled={page >= Math.ceil(total / limit)} 
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant
          </button>
          <select 
            value={limit} 
            onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} 
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {[10,20,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
