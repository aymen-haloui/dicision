import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.users.findUnique({
    where: { id: session.user.id as string },
    select: { id: true, email: true, full_name: true, specialization: true },
  })

  return NextResponse.json({ user })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { full_name, specialization, profile_image } = body

    const updated = await prisma.users.update({
      where: { id: session.user.id as string },
      data: {
        full_name: typeof full_name === 'string' ? full_name : undefined,
        specialization: typeof specialization === 'string' ? specialization : undefined,
        profile_image: typeof profile_image === 'string' ? profile_image : undefined,
      },
      select: { id: true, email: true, full_name: true, specialization: true },
    })

    return NextResponse.json({ user: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Update failed' }, { status: 500 })
  }
}
