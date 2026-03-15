import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import App from './app'

export default async function AdminPage() {
	if (!(await isAdmin())) {
		redirect('/')
	}

	return <App />
}
