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
    <main className="relative min-h-screen overflow-hidden bg-[#fff1f2] text-slate-900">
      <div className="relative grid min-h-screen lg:grid-cols-2">

        {/* Left — full-bleed image with overlay and text */}
        <section className="relative overflow-hidden">
          {/* Background image */}
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            className="object-cover object-center"
          />
          {/* Premium medical overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#19070e]/58 via-[#3d1027]/44 to-[#0f172a]/36" />

          {/* Content */}
          <div className="relative flex h-full flex-col justify-between p-10 lg:p-14">
            <Link href="/" className="text-base font-extrabold tracking-[0.22em] text-white">
              HEXA
            </Link>

            <div className="max-w-lg animate-rise">
              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-white/85">
                {subtitle}
              </p>
            </div>

            <p className="text-sm text-white/60">© 2026 HEXA</p>
          </div>
        </section>

        {/* Right — form */}
        <section className="flex items-center justify-center bg-[#fff8f9] p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-[500px] animate-rise">
            <Link
              href="/"
              className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
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
