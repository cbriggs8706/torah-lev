import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

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
					label: 'Username:',
					type: 'text',
					placeholder: 'your-cool-username',
				},
				password: {
					label: 'Password:',
					type: 'password',
					placeholder: 'your-awesome-password',
				},
			},
			async authorize(credentials) {
				//This is where you would want to pull from a db for user
				const user = { id: '42', name: 'Dave', password: 'nextauth' }
				if (
					credentials?.username === user.name &&
					credentials?.password === user.password
				) {
					return user
				} else {
					return null
				}
			},
		}),
	],
	session: { strategy: 'jwt' },
	secret: process.env.NEXTAUTH_SECRET,

	callbacks: {
		// Attach `user.id` to the JWT token
		async jwt({ token, user }) {
			// Safely assert that the `user` object has the `id` as a string
			if (user && user.id) {
				token.id = user.id // Ensure user.id is added to the token
			}
			return token
		},

		// Attach `user.id` to the session object
		async session({ session, token }) {
			// Ensure the id is available in the session
			if (token.id) {
				session.user.id = token.id as string // Add `id` to session as string
			}
			return session
		},
	},
	// pages: {
	//   signIn: "/signin"
	// }
}
