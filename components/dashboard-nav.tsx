'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Users, FolderOpen, ShieldAlert, LogOut } from 'lucide-react'

interface User {
  name?: string | null
  email?: string | null
  specialization?: string
}

const BASE_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/cases', label: 'Cases', icon: FolderOpen },
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
      ? [...BASE_NAV, { href: '/dashboard/admin', label: 'Rules Engine', icon: ShieldAlert }]
      : BASE_NAV

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* brand + links */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="w-7 h-7 rounded-lg bg-[#BE185D] flex items-center justify-center">
              <span className="text-white font-black text-xs leading-none">Hx</span>
            </span>
            <span className="font-bold text-slate-900 text-lg tracking-tight">HEXA</span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/dashboard' ? path === href : path.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#BE185D]/10 text-[#BE185D]'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
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
          <div className="flex items-center gap-3 pr-3 border-r border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BE185D] to-[#9f1239] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.specialization}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/auth/login' })}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

      </div>
    </nav>
  )
}
