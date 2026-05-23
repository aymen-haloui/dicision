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
    select: { id: true, email: true, full_name: true, specialization: true, profile_image: true },
  })

  return NextResponse.json({ user })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    
    let full_name: string | undefined
    let specialization: string | undefined
    let profile_image: string | undefined

    if (contentType.includes('application/json')) {
      // Handle JSON request
      const body = await req.json()
      full_name = body.full_name
      specialization = body.specialization
      profile_image = body.profile_image
    } else if (contentType.includes('multipart/form-data')) {
      // Handle FormData with file upload
      const formData = await req.formData()
      const imageFile = formData.get('image') as File | null
      
      if (imageFile) {
        // Convert image file to base64 data URL
        const buffer = await imageFile.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const mimeType = imageFile.type || 'image/jpeg'
        profile_image = `data:${mimeType};base64,${base64}`
      }
      
      full_name = formData.get('full_name') as string | undefined
      specialization = formData.get('specialization') as string | undefined
    } else {
      // Try parsing as JSON anyway
      const body = await req.json()
      full_name = body.full_name
      specialization = body.specialization
      profile_image = body.profile_image
    }

    const updated = await prisma.users.update({
      where: { id: session.user.id as string },
      data: {
        full_name: typeof full_name === 'string' ? full_name : undefined,
        specialization: typeof specialization === 'string' ? specialization : undefined,
        profile_image: typeof profile_image === 'string' ? profile_image : undefined,
      },
      select: { id: true, email: true, full_name: true, specialization: true, profile_image: true },
    })

    return NextResponse.json({ user: updated })
  } catch (err: any) {
    console.error('PATCH /api/users/me error:', err)
    return NextResponse.json({ error: err?.message || 'Update failed' }, { status: 500 })
  }
}
