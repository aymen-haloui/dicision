'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthShell } from '@/components/auth/auth-shell'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    specialization: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validate form
      if (!formData.email || !formData.password || !formData.fullName) {
        setError('Veuillez renseigner tous les champs obligatoires')
        setIsLoading(false)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        setIsLoading(false)
        return
      }

      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          specialization: formData.specialization || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "L'inscription a echoue")
        setIsLoading(false)
        return
      }

      // Sign in
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (!signInResult?.ok) {
        setError('Connexion automatique impossible. Veuillez vous connecter manuellement.')
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Une erreur est survenue. Veuillez reessayer.')
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Rejoignez les cliniciens qui font confiance a HEXA."
      subtitle="Creez votre espace en quelques secondes et accedez a une aide a la decision toxicologique alimentee par l'IA."
      imageSrc="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1400&h=1800&q=80"
      imageAlt="Equipe clinique analysant un dossier patient"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold leading-tight text-[#0F172A] sm:text-4xl">Créer un compte</h2>
        <p className="mt-2 text-base leading-relaxed text-slate-600 sm:mt-3 sm:text-xl">
          Rejoignez notre communaute medicale exclusive
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <div>
            <Label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-700 sm:mb-3 sm:text-lg">
              Nom complet
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Dr Martin Dubois"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition focus-visible:border-[#5B6CFF] focus-visible:ring-4 focus-visible:ring-[#5B6CFF]/15 sm:h-14 sm:text-lg"
            />
          </div>

          <div>
            <Label htmlFor="specialization" className="mb-2 block text-sm font-semibold text-slate-700 sm:mb-3 sm:text-lg">
              Spécialité médicale
            </Label>
            <select
              id="specialization"
              name="specialization"
              title="Spécialité médicale"
              value={formData.specialization}
              onChange={handleChange}
              disabled={isLoading}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition focus:border-[#5B6CFF] focus:outline-none focus:ring-4 focus:ring-[#5B6CFF]/15 sm:h-14 sm:text-lg"
            >
              <option value="">Sélectionner</option>
              <option value="toxicology">Toxicologie</option>
              <option value="emergency-medicine">Médecine d'urgence</option>
              <option value="clinical-pharmacy">Pharmacie clinique</option>
              <option value="internal-medicine">Médecine interne</option>
              <option value="general-medicine">Médecine générale</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 sm:mb-3 sm:text-lg">
            Adresse de messagerie
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="medecin@hopital.fr"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition focus-visible:border-[#5B6CFF] focus-visible:ring-4 focus-visible:ring-[#5B6CFF]/15 sm:h-14 sm:text-lg"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <div>
            <Label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700 sm:mb-3 sm:text-lg">
              Mot de passe
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition focus-visible:border-[#5B6CFF] focus-visible:ring-4 focus-visible:ring-[#5B6CFF]/15 sm:h-14 sm:text-lg"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-700 sm:mb-3 sm:text-lg">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition focus-visible:border-[#5B6CFF] focus-visible:ring-4 focus-visible:ring-[#5B6CFF]/15 sm:h-14 sm:text-lg"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-[#5B6CFF] text-base font-semibold text-white shadow-[0_10px_24px_rgba(91,108,255,0.30)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#4a5ae0] active:bg-[#3f4ecc] sm:h-14 sm:text-xl"
          disabled={isLoading}
        >
          {isLoading ? "Inscription en cours..." : "Créer un compte"}
        </Button>
      </form>

      <p className="mt-6 text-center text-base text-slate-500 sm:mt-8 sm:text-xl">
        Vous avez déjà un compte ?{' '}
        <Link href="/auth/login" className="font-semibold text-[#5B6CFF] transition hover:text-[#4a5ae0] hover:underline">
          Connectez-vous ici
        </Link>
      </p>
    </AuthShell>
  )
}
