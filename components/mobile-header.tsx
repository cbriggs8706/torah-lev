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

	return (
		<nav className="lg:hidden px-6 h-[50px] flex items-center bg-sky-500 border-b fixed top-0 w-full z-50">
			<MobileSidebar
				userProgress={userProgress}
				isPro={!!userSubscription?.isActive}
			/>
		</nav>
	)
}
