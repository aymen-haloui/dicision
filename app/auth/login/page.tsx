'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthShell } from '@/components/auth/auth-shell'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        setError(result?.error || 'Identifiants invalides')
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Une erreur est survenue. Veuillez reessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="La plateforme d'aide a la decision pour les professionnels de sante."
      subtitle="Detectez les interactions, evaluez les risques toxicologiques et ajustez la posologie en quelques secondes."
      imageSrc="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1400&h=1800&q=80"
      imageAlt="Medecin en environnement hospitalier"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold leading-tight text-[#0F172A] sm:text-4xl">Bon retour</h2>
        <p className="mt-2 text-base leading-relaxed text-slate-600 sm:mt-3 sm:text-xl">
          Connectez-vous pour continuer vers votre espace clinique
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-7">
        <div>
          <Label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 sm:mb-3 sm:text-lg">
            Adresse de messagerie
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="medecin@hopital.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition focus-visible:border-pink-400 focus-visible:ring-4 focus-visible:ring-pink-100 sm:h-14 sm:text-lg"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between sm:mb-3">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-700 sm:text-lg">
              Mot de passe
            </Label>
            <button type="button" className="text-sm font-semibold text-pink-600 transition hover:text-pink-700 sm:text-lg">
              Mot de passe oublié ?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Entrez votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition focus-visible:border-pink-400 focus-visible:ring-4 focus-visible:ring-pink-100 sm:h-14 sm:text-lg"
          />
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-base font-semibold text-white shadow-[0_10px_24px_rgba(219,39,119,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(219,39,119,0.38)] sm:h-14 sm:text-xl"
          disabled={isLoading}
        >
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </Button>
      </form>

      <p className="mt-6 text-center text-base text-slate-500 sm:mt-8 sm:text-xl">
        Vous n'avez pas de compte ?{' '}
        <Link href="/auth/register" className="font-semibold text-[#BE185D] transition hover:text-[#9f1239]">
          Créez votre espace
        </Link>
      </p>
    </AuthShell>
  )
}
