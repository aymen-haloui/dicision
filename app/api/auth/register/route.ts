import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const fullName = String(body.fullName ?? '')
    const specialization = body.specialization

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(email, password, fullName, specialization)

    return NextResponse.json(
      { user: { id: user.id, email: user.email, fullName: user.full_name } },
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
