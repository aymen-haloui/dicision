import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard-nav'

export const metadata = {
  title: 'Tableau de bord - Aide a la decision medicale',
  description: 'Gerer les cas et les patients',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <DashboardNav user={session.user} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        {children}
      </main>
    </div>
  )
}
