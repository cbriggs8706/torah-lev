'use client'

import { useSession } from 'next-auth/react'

export function useUserId() {
	const { data: session } = useSession()

	// If the session and user are defined, return the user ID
	if (session?.user?.id) {
		return session.user.id
	}

	// If no session, use a guest ID from localStorage
	if (typeof window !== 'undefined') {
		let guestId = localStorage.getItem('guestId')
		if (!guestId) {
			// Generate a new guest ID (UUID)
			guestId = crypto.randomUUID()
			localStorage.setItem('guestId', guestId)
		}
		return guestId
	}

	return null
}
