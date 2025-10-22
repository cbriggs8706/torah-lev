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
})

export { handler as GET, handler as POST }

// import NextAuth from 'next-auth'
// import GoogleProvider from 'next-auth/providers/google'

// const handler = NextAuth({
// 	providers: [
// 		GoogleProvider({
// 			clientId: process.env.GOOGLE_CLIENT_ID!,
// 			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
// 		}),
// 	],
// 	session: { strategy: 'jwt' },
// 	secret: process.env.NEXTAUTH_SECRET,

// 	callbacks: {
// 		async signIn({ user, account, profile }) {
// 			// You can inspect query params here if using a custom sign-in URL
// 			return true
// 		},
// 		async jwt({ token, user }) {
// 			// Attach extra data (like invite code) if present
// 			if (user?.inviteCode) token.inviteCode = user.inviteCode
// 			return token
// 		},
// 		async session({ session, token }) {
// 			if (token.inviteCode) session.inviteCode = token.inviteCode
// 			return session
// 		},
// 	},
// })

// export { handler as GET, handler as POST }
