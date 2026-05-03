'use client'

import dynamic from 'next/dynamic'

const AdminApp = dynamic(() => import('./app'), { ssr: false })

export default function AdminAppClient() {
	return <AdminApp />
}
