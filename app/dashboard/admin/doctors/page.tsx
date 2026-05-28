'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Trash2, Search, MoreHorizontal } from 'lucide-react'

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
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Utilisateurs</h1>
            <p className="text-sm text-slate-600">Gérez les accès et les permissions de votre équipe</p>
          </div>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder="Rechercher par nom, email ou spécialisation..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="font-medium">{total}</span>
            <span>utilisateur{total !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
          <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center text-xs">!</div>
          <div>{error}</div>
        </div>
      )}

      {/* User List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-lg bg-slate-50 p-12 text-center">
            <div className="inline-block animate-pulse">
              <div className="h-8 w-32 rounded-lg bg-slate-200" />
            </div>
            <p className="mt-3 text-sm text-slate-500">Chargement des utilisateurs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/50 mb-3">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Aucun utilisateur trouvé</p>
            <p className="mt-1 text-xs text-slate-500">Essayez une autre recherche</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((d, idx) => {
              const role = getRole(d.specialization)
              const initials = d.full_name?.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'
              const bgClass = (() => {
                const palette = [
                  'bg-rose-100', 'bg-amber-100', 'bg-lime-100', 'bg-teal-100', 'bg-cyan-100', 'bg-violet-100', 'bg-pink-100', 'bg-sky-100'
                ]
                const str = String(d.id || d.email || initials)
                let h = 0
                for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
                const idx = Math.abs(h) % palette.length
                return palette[idx]
              })()

              return (
                <div key={d.id} className="group flex items-center justify-between gap-4 rounded-lg bg-white border border-slate-200 p-4 transition-all duration-150 hover:border-slate-300 hover:shadow-md hover:bg-slate-50">
                  {/* Left: Avatar + Name + Email */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      {(d.profile_image || d.profileImage || d.avatar_url || d.avatar) ? (
                        <img
                          src={d.profile_image || d.profileImage || d.avatar_url || d.avatar}
                          alt={d.full_name || d.email}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 shadow-sm"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className={`${bgClass} flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold text-slate-700 ring-2 ring-slate-100`}>
                          {initials}
                        </div>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-teal-500 ring-2 ring-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{d.full_name || 'Sans nom'}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{d.email}</p>
                    </div>
                  </div>

                  {/* Right: Role Badge + Delete */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${role.className}`}>
                      {role.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
                      disabled={saving}
                      title="Supprimer cet utilisateur"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-all duration-150 hover:text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(total / limit) > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-6">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Page {page}</span> sur <span className="font-medium text-slate-900">{Math.max(1, Math.ceil(total / limit))}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              type="button" 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page <= 1} 
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Précédent
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, Math.ceil(total / limit)))].map((_, i) => {
                const pageNum = Math.max(1, page - 2 + i)
                if (pageNum > Math.ceil(total / limit)) return null
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-all duration-150 ${
                      page === pageNum
                        ? 'bg-teal-500 text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button 
              type="button" 
              onClick={() => setPage(p => p + 1)} 
              disabled={page >= Math.ceil(total / limit)} 
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Suivant →
            </button>
            <select
              aria-label="Lignes par page"
              title="Lignes par page"
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-150 hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            >
              {[10,20,50,100].map(n => <option key={n} value={n}>{n} par page</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
