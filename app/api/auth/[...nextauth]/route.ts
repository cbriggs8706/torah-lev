import NextAuth, { type NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { supabaseDb } from '@/db/client'
import { users } from '@/db/schema/tables/users'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// ✅ Give authOptions a type
export const authOptions: NextAuthOptions = {
	adapter: DrizzleAdapter(supabaseDb),
	providers: [
		Credentials({
			name: 'Credentials',
			credentials: {
				username: { label: 'Username', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) return null

				const user = await supabaseDb.query.users.findFirst({
					where: eq(users.username, credentials.username),
				})
				if (!user) return null

				const valid = await bcrypt.compare(
					credentials.password,
					user.passwordHash
				)
				if (!valid) return null

				return {
					id: user.id,
					name: user.username,
					email: user.email,
					role: user.role,
				}
			},
		}),
	],
	callbacks: {
		// ✅ Use correct callback param types
		async session({ session, token, user }) {
			if (user) {
				session.user = {
					...session.user,
					id: user.id,
					role: (user as any).role ?? 'user', // or extend Session type below
				}
			}
			return session
		},
	},
	pages: {
		signIn: '/auth/signin',
	},
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
