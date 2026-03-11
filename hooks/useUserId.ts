'use client'

import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useSession } from '@/components/providers/session-provider'

/**
 * Unified user identification hook.
 * - Returns a stable ID for either a signed-in user or a guest.
 * - Tracks if the current visitor is a guest.
 * - Ensures guest data (id, points, etc.) persists in localStorage.
 */
export function useUserId() {
	const { data: session, status } = useSession()
	const [guestId, setGuestId] = useState<string | null>(null)
	const [isGuest, setIsGuest] = useState(false)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		// 🧩 If user is authenticated, clear any guest state
		if (session?.user?.id) {
			setGuestId(null)
			setIsGuest(false)
			setReady(true)
			return
		}

		// 🧭 Guest logic
		try {
			let stored = localStorage.getItem('guestId')
			if (!stored) {
				stored = uuidv4()
				localStorage.setItem('guestId', stored)
				localStorage.setItem('guestPoints', '0')
				localStorage.setItem('guestActive', 'true')
			} else {
				localStorage.setItem('guestActive', 'true')
			}
			setGuestId(stored)
			setIsGuest(true)
		} catch (err) {
			console.warn('⚠️ Failed to access localStorage:', err)
		} finally {
			setReady(true)
		}
	}, [session])

	const userId = session?.user?.id ?? guestId
	const isAuthenticated = !!session?.user?.id

	return {
		userId, // string | null
		isGuest, // boolean
		isAuthenticated, // boolean
		guestId, // string | null (for debugging or guest logic)
		session,
		status, // "loading" | "authenticated" | "unauthenticated"
		ready, // boolean – hook initialization complete
	}
}
