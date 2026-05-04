import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import postgres from 'postgres'
import bcryptjs from 'bcryptjs'

const sql = postgres(process.env.DATABASE_URL!)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        try {
          const result = await sql`
            SELECT id, email, password_hash, full_name, specialization
            FROM users
            WHERE email = ${credentials.email}
          `

          if (result.length === 0) {
            throw new Error('User not found')
          }

          const user = result[0]
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
          }
        } catch (error) {
          throw new Error('Authentication failed')
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.specialization = user.specialization
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.specialization = token.specialization as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}
