"use client"

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Upload, Check } from 'lucide-react'

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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
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
    
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(String(reader.result))
    }
    reader.readAsDataURL(file)
  }

  async function uploadImage() {
    if (!imageFile) return
    
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        body: formData,
      })
      
      if (!res.ok) throw new Error('Upload failed')
      
      toast({ title: 'Photo mise à jour', description: 'Votre image de profil a été changée.' })
      setImageFile(null)
      setSuccessMessage('Photo mise à jour')
      setTimeout(() => setSuccessMessage(''), 2000)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la photo.' })
    } finally {
      setUploadingImage(false)
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          full_name: fullName, 
          specialization,
          profile_image: imageFile ? null : imagePreview,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' })
      setSuccessMessage('Profil mis à jour')
      setTimeout(() => setSuccessMessage(''), 2000)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      {/* Avatar Upload Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-4">Photo de profil</label>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-xl bg-slate-200 overflow-hidden ring-2 ring-slate-100">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Avatar" className="h-20 w-20 object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">
                    {fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer transition hover:bg-slate-50 hover:border-slate-400">
                <Upload className="h-4 w-4" />
                <span>Changer l'image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFile} 
                  className="hidden" 
                />
              </label>
              {imageFile && (
                <button
                  type="button"
                  onClick={uploadImage}
                  disabled={uploadingImage}
                  className="ml-2 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {uploadingImage ? 'Envoi...' : successMessage ? (<><Check className="h-4 w-4" /> {successMessage}</>) : 'Confirmer'}
                </button>
              )}
              <p className="mt-2 text-xs text-slate-500">JPG, PNG ou GIF. Max 5 MB.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Name Section */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Nom complet</label>
        <input 
          value={fullName} 
          onChange={e => setFullName(e.target.value)} 
          className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none" 
          placeholder="Votre nom complet"
        />
      </div>

      {/* Specialization Section */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-900">Spécialisation</label>
        <input 
          value={specialization} 
          onChange={e => setSpecialization(e.target.value)} 
          className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:outline-none" 
          placeholder="Ex: Médecin, Pharmacien..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
        <button 
          type="submit" 
          disabled={saving} 
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : successMessage ? (<><Check className="h-4 w-4" /> {successMessage}</>) : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
