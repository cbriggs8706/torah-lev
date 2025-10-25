import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { syncUserRecords } from '@/actions/sync-user-records'
import db from '@/db/drizzle'
import { eq } from 'drizzle-orm'
import { users } from '@/db/schema'
import { compare } from 'bcryptjs'

export const options: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),

		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				username: {
					label: 'Username',
					type: 'text',
					placeholder: 'your-cool-username',
				},
				password: {
					label: 'Password',
					type: 'password',
					placeholder: 'your-awesome-password',
				},
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) return null

				// Look up user in the users table (primary auth source)
				const user = await db.query.users.findFirst({
					where: (u, { or, eq }) =>
						or(
							eq(u.username, credentials.username),
							eq(u.email, credentials.username)
						),
				})

				if (!user) return null
				if (!user?.passwordHash) return null

				// Compare hashed password
				const isValid = await compare(credentials.password, user.passwordHash)
				if (!isValid) return null

				// Return user object for session
				return {
					id: user.id,
					name: user.username,
					email: user.email ?? null,
				}
			},
		}),
	],

	session: { strategy: 'jwt' },
	secret: process.env.NEXTAUTH_SECRET,

	callbacks: {
		// 🧠 Attach user.id to the JWT
		async jwt({ token, user }) {
			if (user?.id) token.id = user.id
			return token
		},

		// 💾 Attach user.id to the session
		async session({ session, token }) {
			if (token?.id) session.user.id = token.id as string
			return session
		},

		// 🔄 Sync user records to your Drizzle DB after any sign-in (Google or Credentials)
		async signIn({ user }) {
			if (!user?.email || !user?.id) return true

			try {
				await syncUserRecords({
					newUserId: user.id,
					email: user.email,
					userName: user.name || undefined,
					image: user.image || undefined,
				})
			} catch (err) {
				console.error('❌ Error syncing user records:', err)
			}

			return true
		},
	},

	pages: {
		signIn: '/auth/signin',
	},
}
