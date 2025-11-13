// app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthOptions, type User } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import {
	user,
	account,
	session,
	verificationToken,
} from '@/db/schema/tables/auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { supabaseDb } from '@/db/client'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import type { Adapter } from 'next-auth/adapters'

export const authOptions: NextAuthOptions = {
	//---------------------------------------------------------
	// 🔥 THE ONLY CHANGE: Explicit table mapping for the adapter
	//---------------------------------------------------------
	adapter: DrizzleAdapter(supabaseDb, {
		usersTable: user,
		accountsTable: account,
		sessionsTable: session,
		verificationTokensTable: verificationToken,
	}) as Adapter,
	//---------------------------------------------------------

	providers: [
		//---------------------------------------------------------
		// Google OAuth
		//---------------------------------------------------------
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			profile(profile) {
				return {
					id: profile.sub, // REQUIRED
					name: profile.name,
					email: profile.email, // REQUIRED
					image: profile.picture,
					role: 'user', // default
				}
			},
		}),

		//---------------------------------------------------------
		// Credentials Provider
		//---------------------------------------------------------
		Credentials({
			name: 'Credentials',
			credentials: {
				username: { label: 'Username', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials): Promise<User | null> {
				if (!credentials?.username || !credentials?.password) return null

				const foundUser = await supabaseDb.query.user.findFirst({
					where: eq(user.username, credentials.username),
				})

				if (!foundUser || !foundUser.passwordHash) return null

				const isValid = await bcrypt.compare(
					credentials.password,
					foundUser.passwordHash
				)
				if (!isValid) return null

				return {
					id: foundUser.id,
					name: foundUser.username ?? '',
					email: foundUser.email ?? '',
					image: foundUser.image ?? '',
					role: foundUser.role ?? 'user',
				}
			},
		}),
	],

	//---------------------------------------------------------
	// Callbacks
	//---------------------------------------------------------
	callbacks: {
		//-----------------------------------------------------
		// Redirect (locale-aware)
		//-----------------------------------------------------
		async redirect({ url, baseUrl }) {
			const localeMatch = url.match(/\/([a-z]{2})\//)
			const locale = localeMatch ? localeMatch[1] : 'en'
			return `${baseUrl}/${locale}/dashboard`
		},

		//-----------------------------------------------------
		// JWT — attach id + role from DB
		//-----------------------------------------------------
		async jwt({ token, user: authUser }) {
			// First login (Google or Credentials)
			if (authUser) {
				token.email = authUser.email ?? null
				token.id = authUser.id ?? null
			}

			// Always load latest DB role
			if (token.email) {
				const dbUser = await supabaseDb.query.user.findFirst({
					where: eq(user.email, token.email),
				})

				if (dbUser) {
					token.id = dbUser.id
					token.role = dbUser.role
				} else {
					token.role = token.role ?? 'user'
				}
			}

			return token
		},

		//-----------------------------------------------------
		// Session — expose id + role to frontend
		//-----------------------------------------------------
		async session({ session }) {
			if (!session.user?.email) return session

			// Fetch role from DB on *every* session call
			const dbUser = await supabaseDb.query.user.findFirst({
				where: eq(user.email, session.user.email),
			})

			session.user.id = dbUser?.id ?? ''
			session.user.role = dbUser?.role ?? 'user'

			return session
		},
	},
}

// Route handler
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
