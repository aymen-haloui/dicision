import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ProfileForm from '@/components/profile-form'
import { prisma } from '@/lib/prisma'

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

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  // fetch fresh user record to pass initial data for the client form
  const dbUser = session?.user?.id
    ? await prisma.users.findUnique({
        where: { id: session.user.id as string },
        select: { id: true, email: true, full_name: true, specialization: true, profile_image: true },
      })
    : null

  const displayUser = {
    name: dbUser?.full_name ?? user?.name,
    email: dbUser?.email ?? user?.email,
    specialization: dbUser?.specialization ?? user?.specialization,
    profile_image: dbUser?.profile_image,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profil</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos informations de compte et vos préférences.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#2CB1BC] text-2xl font-bold text-white overflow-hidden">
              {displayUser.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayUser.profile_image} alt={displayUser.name ?? 'avatar'} className="h-16 w-16 object-cover" />
              ) : (
                <span>{getInitials(displayUser.name)}</span>
              )}
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-900">{displayUser.name ?? 'Utilisateur'}</p>
              <p className="text-sm text-slate-500">{displayUser.specialization ?? 'Rôle non défini'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Détails du compte</h2>
          <div className="mt-6 grid gap-4 text-sm text-slate-600">
            <div className="grid gap-1">
              <span className="font-semibold text-slate-900">Email</span>
              <span>{displayUser.email ?? 'Aucun email associé'}</span>
            </div>
            <div className="grid gap-1">
              <span className="font-semibold text-slate-900">Nom complet</span>
              <span>{displayUser.name ?? 'N/A'}</span>
            </div>
            <div className="grid gap-1">
              <span className="font-semibold text-slate-900">Spécialisation</span>
              <span>{displayUser.specialization ?? 'N/A'}</span>
            </div>
          </div>
          <div className="mt-6">
            <ProfileForm initialUser={dbUser ?? undefined} />
          </div>
        </section>
      </div>
    </div>
  )
}
