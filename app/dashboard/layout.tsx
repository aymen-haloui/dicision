import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard-nav'
import { prisma } from '@/lib/prisma'

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

  const dbUser = await prisma.users.findUnique({
    where: { id: session.user.id as string },
    select: { full_name: true, specialization: true },
  })

  const user = {
    name: dbUser?.full_name ?? session.user.name,
    specialization: dbUser?.specialization ?? session.user.specialization,
    profile_image: session.user.profile_image,
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <DashboardNav user={user} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        {children}
      </main>
    </div>
  )
}
