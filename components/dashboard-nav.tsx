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
      ? [...BASE_NAV, { href: '/dashboard/admin', label: 'Moteur de regles', icon: ShieldAlert }]
      : BASE_NAV

  return (
    <nav className="sticky top-0 z-50 border-b border-[#dce8e6] bg-[#f6f8f7]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 lg:px-6">

        {/* brand + links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#18a8a2] to-[#0f8f89] shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
              <span className="text-white font-black text-xs leading-none">Hx</span>
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">HEXA</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/dashboard' ? path === href : path.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-[#dff7f5] text-[#0f8f89]'
                      : 'text-slate-500 hover:bg-white hover:text-slate-900'
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
          <div className="flex items-center gap-3 border-r border-[#dae7e5] pr-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2CB1BC] to-[#239AA3] text-xs font-bold text-white overflow-hidden">
              {user?.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profile_image} alt={user?.name || 'avatar'} className="h-9 w-9 object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.specialization}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/auth/login' })}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Se deconnecter</span>
          </button>
        </div>

      </div>
    </nav>
  )
}
