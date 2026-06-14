'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'Valeur clinique', href: '#valeur' },
  { label: 'Fonctionnement', href: '#fonctionnement' },
  { label: 'Apercu produit', href: '#apercu' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = navLinks
      .map((l) => l.href.replace('#', ''))
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveHash('#' + visible[0].target.id)
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [pathname])

  return (
    <header
      className={[
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-slate-200/80 bg-white/92 shadow-[0_2px_20px_rgba(15,23,42,0.10)] backdrop-blur-xl'
          : 'border-b border-slate-900/8 bg-white/60 shadow-[0_1px_8px_rgba(15,23,42,0.04)] backdrop-blur-lg',
      ].join(' ')}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-80">
          <img
            src="/lurexis-logo.png"
            alt="Lurexis"
            className="h-5 md:h-5 lg:h-6 w-auto"
          />
          <span className="sr-only">Lurexis</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = activeHash === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                className={[
                  'group relative px-3 py-2 text-sm font-[550] transition-colors duration-200',
                  isActive ? 'text-[#2CB1BC]' : 'text-slate-500 hover:text-[#2CB1BC]',
                ].join(' ')}
              >
                {link.label}
                {/* Animated underline */}
                <span
                  className={[
                    'absolute bottom-0.5 left-3 right-3 h-[1.5px] origin-left rounded-full bg-[#2CB1BC] transition-all duration-250',
                    isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100',
                  ].join(' ')}
                />
              </a>
            )
          })}

          {/* CTA */}
          <Link href="/auth/login" className="ml-4">
            <Button
              size="sm"
              className={[
                'rounded-xl bg-[#2CB1BC] px-5 text-white',
                'shadow-[0_4px_14px_rgba(44,177,188,0.25)]',
                'transition-all duration-200',
                'hover:-translate-y-[2px] hover:bg-[#239AA3] hover:shadow-[0_8px_22px_rgba(44,177,188,0.38)]',
                'active:translate-y-0 active:shadow-[0_4px_10px_rgba(44,177,188,0.22)]',
              ].join(' ')}
            >
              Acceder a la plateforme
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
