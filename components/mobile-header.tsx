import { MobileSidebar } from './mobile-sidebar'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

export default async function MobileHeader() {
	const session = await getServerSession(options)
	const userId = session?.user?.id ?? null

	let userProgress = null
	let userSubscription = null

	if (userId) {
		;[userProgress, userSubscription] = await Promise.all([
			getUserProgress(),
			getUserSubscription(),
		])
	}

	const fallbackProgress = {
		userId: 'guest',
		userName: 'Guest',
		userImageSrc: '/mascot.svg',
		activeCourseId: null,
		activeCourse: null,
		hearts: 0,
		points: 0,
	}

	const displayProgress = userProgress ?? fallbackProgress

	const isHebrewFriend = userProgress?.isHebrewFriend ?? false
	const isSpanishFriend = userProgress?.isSpanishFriend ?? false
	const isEnglishFriend = userProgress?.isEnglishFriend ?? false
	const isTester = userProgress?.isTester ?? false

	return (
		<nav className="lg:hidden px-6 h-[50px] flex items-center bg-sky-600 border-b fixed top-0 w-full z-50">
			<MobileSidebar
				userProgress={displayProgress}
				isPro={!!userSubscription?.isActive}
				isHebrewFriend={isHebrewFriend}
				isSpanishFriend={isSpanishFriend}
				isEnglishFriend={isEnglishFriend}
				isTester={isTester}
			/>
		</nav>
	)
}
