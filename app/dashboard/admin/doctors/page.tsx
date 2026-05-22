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
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Gestion des utilisateurs</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">Parcourez les comptes, recherchez rapidement les médecins et gérez les accès depuis une interface claire et compacte.</p>
        </div>
        <div className="rounded-[16px] border border-slate-200 bg-[#f7fcfb] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recherche</p>
              <p className="mt-1 text-sm text-slate-600">Filtrer par nom, email ou spécialisation</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f8f89]/10 text-[#0f8f89]">
              <Search className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-12 rounded-[16px] border border-slate-200 bg-white pl-11 pr-4 text-sm shadow-sm transition duration-200 focus:border-[#0f8f89] focus:ring-2 focus:ring-[#0f8f89]/10"
                placeholder="Rechercher par nom, email ou spécialisation"
              />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-[16px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <Card className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-[1.8fr_0.9fr_0.9fr_0.7fr_0.5fr] bg-[#f7fdfa] text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:px-6">
          <div>Utilisateur</div>
          <div>Rôle</div>
          <div>Email</div>
          <div className="hidden sm:block">Inscrit</div>
          <div className="text-right">Actions</div>
        </div>
        {loading ? (
          <div className="p-8 text-sm text-slate-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">Aucun utilisateur trouvé</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filtered.map(d => {
              const role = getRole(d.specialization)
              const initials = d.full_name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U'
              return (
                <div key={d.id} className="group flex flex-col gap-4 px-4 py-4 transition hover:bg-[#f7fcfb] sm:flex-row sm:items-center sm:gap-0 sm:px-6">
                  <div className="flex items-center gap-4 min-w-0 sm:flex-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f8f89]/10 text-sm font-semibold text-[#0f8f89] shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">{d.full_name}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">{d.specialization || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-start">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${role.className}`}>{role.label}</span>
                  </div>

                  <div className="min-w-0 sm:flex-1">
                    <p className="truncate text-sm text-slate-700">{d.email}</p>
                  </div>

                  <div className="hidden min-w-0 sm:block sm:flex-1">
                    <p className="text-sm text-slate-400">{d.created_at ? new Date(d.created_at).toLocaleString() : '—'}</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 sm:w-28">
                    <button type="button" onClick={() => handleDelete(d.id)} disabled={saving} className="inline-flex h-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white px-3 text-sm font-medium text-red-600 transition duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500">Total: {total}</div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            Précédent
          </button>
          <span className="rounded-[14px] border border-slate-200 bg-[#f7fcfb] px-3 py-2 text-sm font-semibold text-slate-700">Page {page} / {Math.max(1, Math.ceil(total / limit))}</span>
          <button type="button" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            Suivant
          </button>
          <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} className="rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            {[10,20,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
