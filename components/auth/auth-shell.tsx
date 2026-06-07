import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type AuthShellProps = {
  title: string
  subtitle: string
  imageSrc: string
  imageAlt: string
  children: React.ReactNode
}

export function AuthShell({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="relative grid min-h-screen lg:grid-cols-2">

        {/* Left â€” full-bleed image with overlay and text (hidden on mobile) */}
        <section className="relative hidden overflow-hidden lg:block">
          {/* Background image */}
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            className="object-cover object-center"
          />
          {/* Premium medical overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F]/70 via-[#0f2744]/65 to-[#0f172a]/75" />

          {/* Content */}
          <div className="relative flex h-full flex-col justify-between p-10 lg:p-14">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/lurexis-logo.png" alt="Lurexis" width={160} height={36} className="object-contain" />
              <span className="sr-only">Lurexis</span>
            </Link>

            <div className="max-w-lg animate-rise">
              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-white/85">
                {subtitle}
              </p>
            </div>

            <p className="text-sm text-white/60">© 2026 Lurexis</p>
          </div>
        </section>

        {/* Right â€” form */}
        <section className="flex min-h-screen items-center justify-center bg-[#F7FAFC] px-4 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-[500px] animate-rise">
            {/* Mobile logo â€” shown only when left panel is hidden */}
            <Link href="/" className="mb-8 block text-center lg:hidden">
              <img src="/lurexis-logo.png" alt="Lurexis" className="mx-auto h-8 w-auto" />
            </Link>

            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour a l'accueil
            </Link>

            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
