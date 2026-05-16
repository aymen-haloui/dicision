"use client"

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

type User = {
  id: string
  email: string
  full_name?: string | null
  specialization?: string | null
  profile_image?: string | null
}

export default function ProfileForm({ initialUser }: { initialUser?: User }) {
  const [fullName, setFullName] = useState(initialUser?.full_name ?? '')
  const [specialization, setSpecialization] = useState(initialUser?.specialization ?? '')
  const [imagePreview, setImagePreview] = useState<string | null>(initialUser?.profile_image ?? null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setFullName(initialUser?.full_name ?? '')
    setSpecialization(initialUser?.specialization ?? '')
    setImagePreview(initialUser?.profile_image ?? null)
  }, [initialUser])

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(String(reader.result))
    }
    reader.readAsDataURL(file)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, specialization, profile_image: imagePreview }),
      })
      if (!res.ok) throw new Error('Save failed')
      // refresh server components (header/layout) and show toast
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' })
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Avatar" className="h-16 w-16 object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center text-lg font-bold text-slate-600">?
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Changer l'image de profil</label>
          <input type="file" accept="image/*" onChange={handleFile} className="mt-1 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Nom complet</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border py-2 px-3" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Spécialisation</label>
        <input value={specialization} onChange={e => setSpecialization(e.target.value)} className="mt-1 block w-full rounded-md border py-2 px-3" />
      </div>

      <div>
        <button type="submit" disabled={saving} className="inline-flex items-center rounded-md bg-[#2CB1BC] px-4 py-2 text-white">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
