import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ProfileForm from '@/components/profile-form'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Shield, Mail, Calendar } from 'lucide-react'

export const metadata = {
  title: 'Profil - HEXA',
}

function getInitials(name?: string | null) {
  return name
    ?.split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'
}

function getRoleLabel(specialization?: string | null) {
  if (!specialization) return 'Utilisateur'
  const value = specialization.toLowerCase()
  if (value.includes('admin')) return 'Administrateur'
  if (value.includes('doctor') || value.includes('docteur') || value.includes('medecin')) return 'Médecin'
  return specialization
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const user = session.user

  // fetch fresh user record including profile_image
  const dbUser = await prisma.users.findUnique({
    where: { id: session.user.id as string },
    select: { id: true, email: true, full_name: true, specialization: true, profile_image: true, created_at: true },
  })

  const displayUser = {
    id: dbUser?.id,
    name: dbUser?.full_name ?? user?.name,
    email: dbUser?.email ?? user?.email,
    specialization: dbUser?.specialization ?? user?.specialization,
    profile_image: dbUser?.profile_image,
    createdAt: dbUser?.created_at,
  }

  const joinDate = displayUser.createdAt 
    ? new Date(displayUser.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Non disponible'

  return (
    <div className="max-w-4xl">
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">Compte</h1>
        <p className="text-base text-slate-600">Gérez votre profil et vos préférences</p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[320px_1fr]">
        {/* Sticky Sidebar Profile Card */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="space-y-6">
            {/* Avatar Card */}
            <div className="rounded-xl bg-white p-6 border border-slate-200">
              <div className="space-y-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-slate-200 overflow-hidden ring-2 ring-slate-100">
                  {displayUser.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayUser.profile_image} alt={displayUser.name ?? 'avatar'} className="h-24 w-24 object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-600">{getInitials(displayUser.name)}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{displayUser.name ?? 'Utilisateur'}</h2>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
                    <Shield className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-xs font-medium text-slate-700">{getRoleLabel(displayUser.specialization)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Card */}
            <div className="rounded-xl bg-white p-6 border border-slate-200 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Email</p>
                <div className="mt-2 flex items-start gap-3">
                  <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-900 break-all">{displayUser.email ?? 'N/A'}</span>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Inscrit</p>
                <div className="mt-2 flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-900">{joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Section */}
        <div className="rounded-xl bg-white p-8 border border-slate-200">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">Paramètres du profil</h2>
            <p className="mt-1 text-sm text-slate-600">Mettez à jour vos informations personnelles</p>
          </div>
          
          <ProfileForm initialUser={dbUser ?? undefined} />
        </div>
      </div>
    </div>
  )
}
