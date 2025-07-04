// Server Component
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { redirect } from 'next/navigation'
import SidebarClient from './sidebar-client'

export default async function SidebarServer({
	className,
	onItemClick,
}: {
	className?: string
	onItemClick?: () => void
}) {
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	// Optional dev-only safeguard
	if (typeof window !== 'undefined') {
		console.error('❌ SidebarServer is being run on the client!')
	}

	return (
		<SidebarClient
			className={className}
			onItemClick={onItemClick}
			userProgress={userProgress}
			isPro={!!userSubscription?.isActive}
		/>
	)
}
