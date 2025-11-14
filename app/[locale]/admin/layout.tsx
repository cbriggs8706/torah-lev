import { getUserRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const role = await getUserRole()
	if (role !== 'admin') redirect('/')

	return <>{children}</>
}
