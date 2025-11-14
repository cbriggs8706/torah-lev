// app/[locale]/(app)/dashboard/page.tsx

import { SignOutButton } from '@/components/auth/signout'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params

	const session = await getServerSession(authOptions)

	if (!session) {
		redirect(`/${locale}`)
	}

	console.log('Session in dashboard page:', session)
	console.log('Dashboard → Session:', JSON.stringify(session, null, 2))
	console.log('Dashboard → Role:', session?.user?.role)

	const role = session?.user?.role ?? 'user'

	const title = role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'

	return (
		<div className="space-y-4">
			<h1 className="text-3xl font-bold">{title}</h1>

			<p className="text-gray-600">Choose a course to begin learning.</p>

			<a
				href={`/${locale}/courses`}
				className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
			>
				View Courses
			</a>
			<SignOutButton />
		</div>
	)
}
