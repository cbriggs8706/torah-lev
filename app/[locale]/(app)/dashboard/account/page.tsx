// app/[locale]/(app)/dashboard/account/page.tsx

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import UserDetails from '@/components/auth/user-details'

interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	const session = await getServerSession(authOptions)
	// const userId = session?.user.id
	if (!session) redirect(`/${locale}`)

	//TODO investigate why i have to logout and back in to see a refresh of this if the user changes their info in the UI
	return (
		<div className="space-y-6">
			<UserDetails
				currentImage={session?.user?.image}
				currentName={session?.user?.name}
				currentUsername={session?.user?.username}
			/>
		</div>
	)
}
