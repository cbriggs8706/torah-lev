'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const AdminApp = dynamic(() => import('./app'), { ssr: false })

export default function AdminAppClient() {
	useEffect(() => {
		if (typeof window === 'undefined') return

		const hashPath = window.location.hash.startsWith('#/')
			? window.location.hash.slice(1)
			: null

		if (!hashPath) return

		const targetUrl = `/admin${hashPath}${window.location.search}`
		window.history.replaceState(window.history.state, '', targetUrl)
	}, [])

	return <AdminApp />
}
