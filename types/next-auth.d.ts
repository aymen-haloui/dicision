import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      specialization: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    specialization: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    specialization: string
  }
}
