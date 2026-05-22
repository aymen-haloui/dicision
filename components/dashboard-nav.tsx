'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Users, FolderOpen, ShieldAlert, LogOut, UserRound } from 'lucide-react'

interface User {
  name?: string | null
  email?: string | null
  specialization?: string
  profile_image?: string | null
}

const BASE_NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/cases', label: 'Cas', icon: FolderOpen },
  { href: '/dashboard/profile', label: 'Profil', icon: UserRound },
]

const ADMIN_NAV = [
  { href: '/dashboard/admin', label: 'Moteur de regles', icon: ShieldAlert },
  { href: '/dashboard/admin/doctors', label: 'Utilisateurs', icon: UserRound },
]

export default function DashboardNav({ user }: { user: User }) {
  const path = usePathname()

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  const links =
    user?.specialization === 'admin'
      ? [...BASE_NAV, ...ADMIN_NAV]
      : BASE_NAV

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-lg shadow-sm">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 lg:px-6">

        {/* brand + links */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18a8a2] to-[#0f8f89] shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
              <span className="text-white font-black text-xs leading-none">Hx</span>
            </span>
            <span className="text-base font-semibold tracking-tight text-slate-900">HEXA</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/dashboard' ? path === href : path.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${
                    active
                      ? 'bg-[#defff9] text-[#0f8f89] shadow-sm ring-1 ring-[#bfe9e1]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* user */}
        <div className="flex items-center gap-3">
          <div className="group flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2CB1BC] to-[#239AA3] text-xs font-bold text-white overflow-hidden">
              {user?.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profile_image} alt={user?.name || 'avatar'} className="h-10 w-10 object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.specialization}</p>
            </div>
            <span className="hidden items-center gap-1 text-slate-400 transition group-hover:text-slate-600 sm:flex">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true"><path d="M8.59 9.17 12 12.59l3.41-3.42 1.41 1.41L12 15.41 7.17 10.59z" /></svg>
            </span>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/auth/login' })}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition duration-200 hover:bg-[#f8faf9] hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Se deconnecter</span>
          </button>
        </div>

      </div>
    </nav>
  )
}
