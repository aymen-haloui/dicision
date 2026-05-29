import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const nextAuthSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'local-development-only-secret'

if (!process.env.NEXTAUTH_SECRET) {
  console.warn('NEXTAUTH_SECRET is not set; using a fallback secret. Set NEXTAUTH_SECRET in production.')
}

if (!process.env.NEXTAUTH_URL) {
  console.warn('NEXTAUTH_URL is not set; callback URLs may be incomplete in some environments.')
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        const normalizedEmail = credentials.email.trim().toLowerCase()

        try {
          const user = await prisma.users.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              password_hash: true,
              full_name: true,
              specialization: true,
            },
          })

          if (!user) {
            throw new Error('User not found')
          }

          const passwordMatch = await bcryptjs.compare(
            credentials.password,
            user.password_hash
          )

          if (!passwordMatch) {
            throw new Error('Invalid password')
          }

          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            specialization: user.specialization,
            profile_image: user.profile_image ?? undefined,
          }
        } catch (error) {
          console.error('Credentials authorize error:', error)
          if (error instanceof Error) {
            throw new Error(error.message)
          }
          throw new Error('Authentication failed')
        }
      },
    }),
  ],
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV !== 'production',
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.specialization = user.specialization
        token.profile_image = (user as any).profile_image ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.specialization = token.specialization as string
        if (token.profile_image) {
          session.user.profile_image = token.profile_image as string
        }
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}
