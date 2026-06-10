'use client'

import { useEffect, useRef } from 'react'

import { updateLastSeen } from '@/actions/update-last-seen'
import { useSession } from '@/components/providers/session-provider'

const LAST_SEEN_TRACKED_AT_KEY = 'idiom-go:last-seen-tracked-at'
const LAST_SEEN_TRACKING_WINDOW_MS = 2 * 60 * 1000

export function LastSeenTracker() {
	const { data: session, status } = useSession()
	const hasTrackedRef = useRef(false)

	useEffect(() => {
		if (status !== 'authenticated' || !session?.user?.id) return
		if (hasTrackedRef.current) return

		const now = Date.now()
		try {
			const lastTrackedAt = Number(localStorage.getItem(LAST_SEEN_TRACKED_AT_KEY))
			if (
				Number.isFinite(lastTrackedAt) &&
				now - lastTrackedAt < LAST_SEEN_TRACKING_WINDOW_MS
			) {
				hasTrackedRef.current = true
				return
			}
		} catch {
			// If storage is unavailable, fall through and try the update normally.
		}

		hasTrackedRef.current = true

		void updateLastSeen({
			id: session.user.id,
			email: session.user.email,
			name: session.user.name,
			image: session.user.image,
		})
			.then(() => {
				try {
					localStorage.setItem(LAST_SEEN_TRACKED_AT_KEY, String(now))
				} catch {
					// Ignore storage failures; the update already succeeded.
				}
			})
			.catch((error) => {
				hasTrackedRef.current = false
				console.error('Failed to update last seen in LastSeenTracker:', error)
		})
	}, [session, status])

	return null
}
