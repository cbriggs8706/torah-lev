import { MobileSidebar } from './mobile-sidebar'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { redirect } from 'next/navigation'

export default async function MobileHeader() {
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	const isHebrewFriend = userProgress?.isHebrewFriend ?? false
	const isSpanishFriend = userProgress?.isSpanishFriend ?? false
	const isEnglishFriend = userProgress?.isEnglishFriend ?? false
	const isTester = userProgress?.isTester ?? false

	return (
		<nav className="lg:hidden px-6 h-[50px] flex items-center bg-sky-600 border-b fixed top-0 w-full z-50">
			<MobileSidebar
				userProgress={userProgress}
				isPro={!!userSubscription?.isActive}
				isHebrewFriend={isHebrewFriend}
				isSpanishFriend={isSpanishFriend}
				isEnglishFriend={isEnglishFriend}
				isTester={isTester}
			/>
		</nav>
	)
}
