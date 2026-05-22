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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-sm text-slate-500">Liste des docteurs et comptes</p>
        </div>
        <div className="w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" placeholder="Rechercher par nom, email ou specialisation" />
          </div>
        </div>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <Card className="p-4">
        {loading ? (
          <div className="text-sm text-slate-500">Chargement...</div>
        ) : (
          <div className="space-y-2">
            {filtered.length === 0 && <div className="text-sm text-slate-500">Aucun utilisateur trouve</div>}
            {filtered.map(d => (
              <div key={d.id} className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{d.full_name}</div>
                  <div className="text-xs text-slate-500">{d.specialization || '—'} • {d.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-400">{d.created_at ? new Date(d.created_at).toLocaleString() : ''}</div>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition" onClick={() => handleDelete(d.id)} disabled={saving}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* pagination controls */}
            <div className="flex items-center justify-between pt-3">
              <div className="text-sm text-slate-500">Total: {total}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
                <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total / limit))}</div>
                <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}>Next</Button>
                <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} className="ml-2">
                  {[10,20,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
