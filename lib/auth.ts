import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/lib/prisma'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set for NextAuth')
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL must be set for NextAuth')
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
              profile_image: true,
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
  secret: process.env.NEXTAUTH_SECRET,
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
