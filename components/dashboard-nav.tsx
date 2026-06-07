'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Users, FolderOpen, ShieldAlert, LogOut, UserRound, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

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
  { href: '/dashboard/admin', label: 'Moteur de Règles', icon: ShieldAlert },
  { href: '/dashboard/admin/doctors', label: 'Utilisateurs', icon: UserRound },
]

export default function DashboardNav({ user }: { user: User }) {
  const path = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen])

  return (
    <nav className="sticky top-0 z-50">
      <div className="border-b border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.03)]">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 lg:px-6 xl:px-8">
          
          {/* LEFT: Logo + Brand */}
          <Link href="/dashboard" className="shrink-0 group inline-flex items-center gap-3">
            <img src="/lurexis-logo.png" alt="Lurexis" className="h-8 md:h-10 lg:h-12 w-auto" />
            <span className="sr-only">Lurexis</span>
          </Link>

          {/* CENTER: Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/dashboard' ? path === href : path.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition duration-150 ${
                    active ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0f8f89]/0 via-[#0f8f89] to-[#0f8f89]/0" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* RIGHT: Profile + Actions */}
          <div className="flex items-center gap-2">
            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition duration-150"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0f8f89] to-[#0a6d66] text-xs font-bold text-white overflow-hidden shrink-0">
                  {user?.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.profile_image} alt={user?.name || 'avatar'} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start gap-0.5 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-slate-500 capitalize truncate">{user?.specialization}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#0f8f89] to-[#0a6d66] text-sm font-bold text-white">
                        {user?.profile_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.profile_image} alt={user?.name || 'avatar'} className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition duration-150"
                      onClick={() => setProfileOpen(false)}
                    >
                      <UserRound className="h-4 w-4" />
                      <span>Paramètres du profil</span>
                    </Link>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100" />

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      signOut({ redirect: true, callbackUrl: '/auth/login' })
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50/50 transition duration-150"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </nav>
  )
}
