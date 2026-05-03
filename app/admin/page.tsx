import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import AdminAppClient from './admin-app-client'

export default async function AdminPage() {
	if (!(await isAdmin())) {
		redirect('/')
	}

	return <AdminAppClient />
}
