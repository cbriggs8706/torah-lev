import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import App from './app'

export default function AdminPage() {
	if (!isAdmin()) {
		redirect('/')
	}

	return <App />
}
