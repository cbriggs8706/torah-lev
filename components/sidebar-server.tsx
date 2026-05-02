import { getUserProgress, getUserSubscription } from '@/db/queries'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import AppSidebar from './app-sidebar'

export default async function SidebarServer({
}: {
	className?: string
	onItemClick?: () => void
}) {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const cookieStore = await cookies()
	const guestCourseId = cookieStore.get('guestActiveCourseId')?.value
	const guestId = cookieStore.get('guestId')?.value
	const sidebarLocale = cookieStore.get('sidebarLocale')?.value

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
		<AppSidebar
			userProgress={displayProgress}
			isPro={!!userSubscription?.isActive}
			isHebrewFriend={isHebrewFriend}
			isSpanishFriend={isSpanishFriend}
			isEnglishFriend={isEnglishFriend}
			isTester={isTester}
			initialSidebarLocale={sidebarLocale}
		/>
	)
}
