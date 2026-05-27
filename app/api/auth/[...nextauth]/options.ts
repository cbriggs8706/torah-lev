import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { decode, encode } from 'next-auth/jwt'
import { compare } from 'bcryptjs'
import db from '@/db/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { syncUserRecords } from '@/actions/sync-user-records'

export const options: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			allowDangerousEmailAccountLinking: true,
		}),
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				username: { label: 'Username', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) return null

				const user = await db.query.users.findFirst({
					where: (u, { or, eq }) =>
						or(
							eq(u.username, credentials.username),
							eq(u.email, credentials.username)
						),
				})
				if (!user?.passwordHash) return null
				const isValid = await compare(credentials.password, user.passwordHash)
				if (!isValid) return null

				return { id: user.id, name: user.username, email: user.email }
			},
		}),
	],

	session: { strategy: 'jwt' },
	secret: process.env.NEXTAUTH_SECRET,
	jwt: {
		async encode(params) {
			return encode(params)
		},
		async decode(params) {
			try {
				return await decode(params)
			} catch (error) {
				// Old or invalid dev cookies should behave like a signed-out session.
				if (process.env.NODE_ENV !== 'production') {
					console.warn(
						'[auth] Ignoring unreadable JWT session cookie. Clear cookies or sign in again if needed.',
						error
					)
				}
				return null
			}
		},
	},

	callbacks: {
		async jwt({ token, user, account }) {
			if (account?.provider === 'google' && user?.email) {
				let dbUser = await db.query.users.findFirst({
					where: eq(users.email, user.email),
				})

				if (!dbUser) {
					await syncUserRecords({
						newUserId: crypto.randomUUID(),
						email: user.email,
						userName: user.name || undefined,
						image: user.image || undefined,
					})

					dbUser = await db.query.users.findFirst({
						where: eq(users.email, user.email),
					})
				}

				token.id = dbUser?.id
			}

			if (user?.id) token.id = user.id

			return token
		},

		async session({ session, token }) {
			if (!session.user) session.user = {} as any
			session.user.id = token.id as string
			return session
		},

		async signIn({ user }) {
			if (!user?.email) return true
			try {
				await syncUserRecords({
					newUserId: user.id ?? crypto.randomUUID(),
					email: user.email,
					userName: user.name || undefined,
					image: user.image || undefined,
				})
			} catch (err) {
				console.error('Error syncing user records:', err)
			}
			return true
		},

		async redirect({ url, baseUrl }) {
			if (url.startsWith('/')) return `${baseUrl}${url}`
			if (url.startsWith(baseUrl)) return url
			return `${baseUrl}/curriculum`
		},
	},

	pages: { signIn: '/auth/signin' },
}
