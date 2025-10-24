import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
})

export { handler as GET, handler as POST }
