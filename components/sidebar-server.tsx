// Server Component
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { redirect } from 'next/navigation'
import SidebarClient from './sidebar-client'
import { headers } from 'next/headers'

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

	const pathname = (await headers()).get('x-pathname') || ''
	if (
		(!userProgress || !userProgress.activeCourse) &&
		!pathname.startsWith('/courses')
	) {
		redirect('/courses')
	}

	// Optional dev-only safeguard
	if (typeof window !== 'undefined') {
		console.error('❌ SidebarServer is being run on the client!')
	}

	const isHebrewFriend = userProgress?.isHebrewFriend ?? false
	const isSpanishFriend = userProgress?.isSpanishFriend ?? false
	const isEnglishFriend = userProgress?.isEnglishFriend ?? false
	const isTester = userProgress?.isTester ?? false

	return (
		<SidebarClient
			className={className}
			onItemClick={onItemClick}
			userProgress={
				userProgress ?? {
					userId: '',
					userName: '',
					userImageSrc: '',
					activeCourseId: null,
					activeCourse: null,
					hearts: 0,
					points: 0,
				}
			}
			isPro={!!userSubscription?.isActive}
			isHebrewFriend={isHebrewFriend}
			isSpanishFriend={isSpanishFriend}
			isEnglishFriend={isEnglishFriend}
			isTester={isTester}
		/>
	)
}
