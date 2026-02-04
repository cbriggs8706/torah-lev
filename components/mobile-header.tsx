import { MobileSidebar } from './mobile-sidebar'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { cookies } from 'next/headers'

export default async function MobileHeader() {
	const session = await getServerSession(options)
	const userId = session?.user?.id ?? null
	const cookieStore = await cookies()
	const guestCourseId = cookieStore.get('guestActiveCourseId')?.value
	const guestId = cookieStore.get('guestId')?.value

	let userProgress = null
	let userSubscription = null

	if (userId) {
		// Signed-in user
		;[userProgress, userSubscription] = await Promise.all([
			getUserProgress(),
			getUserSubscription(),
		])
	}

	// 🧩 Build fallback for guest users
	const fallbackProgress = {
		userId: guestId || 'guest',
		userName: 'Guest',
		userImageSrc: '/mascot.svg',
		activeCourseId: guestCourseId ? Number(guestCourseId) : 6, // default Hebrew
		activeCourse: {
			id: guestCourseId ? Number(guestCourseId) : 6,
			title: 'Guest Course',
			imageSrc: '/mascot.svg', // ✅ <-- add this line
		},
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
