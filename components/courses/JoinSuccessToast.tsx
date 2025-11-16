'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function JoinSuccessToast() {
	const search = useSearchParams()
	const router = useRouter()

	useEffect(() => {
		if (search.get('joined') === '1') {
			toast.success('Successfully joined course!')

			// Remove the query param from URL so it doesn’t toast again on refresh
			const cleanUrl = window.location.pathname
			router.replace(cleanUrl)
		}
	}, [search])

	return null
}
