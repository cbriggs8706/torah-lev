// lib/auth.ts
import { getServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { supabaseDb } from '@/db/client'

import {
	user,
	account,
	session,
	verificationToken,
} from '@/db/schema/tables/auth'

import { eq, or } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
	session: {
		strategy: 'jwt',
	},

	adapter: DrizzleAdapter(supabaseDb, {
		usersTable: user,
		accountsTable: account,
		sessionsTable: session,
		verificationTokensTable: verificationToken,
	}),

	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),

		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				username: { label: 'Username or Email', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},

			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) return null

				const dbUser = await supabaseDb.query.user.findFirst({
					where: or(
						eq(user.username, credentials.username),
						eq(user.email, credentials.username)
					),
				})

				if (!dbUser || !dbUser.passwordHash) return null

				const valid = await bcrypt.compare(
					credentials.password,
					dbUser.passwordHash
				)
				if (!valid) return null

				return {
					id: dbUser.id,
					email: dbUser.email,
					name: dbUser.name ?? dbUser.username,
					role: dbUser.role ?? 'user',
				}
			},
		}),
	],

	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id
				token.role = user.role
			}
			return token
		},

		async session({ session, token }) {
			if (session.user) {
				if (token.id) {
					session.user.id = token.id
				}
				if (token.role) {
					session.user.role = token.role
				}
			}
			return session
		},
	},
}

// --------------------------
// Utility functions
// --------------------------
export const getSession = () => getServerSession(authOptions)

export const getUserId = async () => {
	const s = await getSession()
	return s?.user?.id ?? null
}

export const getUserRole = async () => {
	const s = await getSession()
	return s?.user?.role ?? 'guest'
}
