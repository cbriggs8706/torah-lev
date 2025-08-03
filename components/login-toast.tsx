'use client'

import { useEffect } from 'react'
import { toast } from 'sonner' // or your toast library
import { updateLastSeen } from '@/actions/update-last-seen' // adjust path

export function LoginToast() {
	useEffect(() => {
		const checkLoginReward = async () => {
			const result = await updateLastSeen()
			if (result.tribePointAwarded) {
				toast.success('🎉 +1 tribe point for logging in today!')
			}
		}
		checkLoginReward()
	}, [])

	return null
}
