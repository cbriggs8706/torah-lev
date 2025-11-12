import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
	interface Session extends DefaultSession {
		user: {
			id: string
			name: string
			email: string
			image?: string | null
			role: string
		}
	}

	interface User {
		id: string
		name: string
		email: string
		image?: string | null
		role: string
	}
}
