import Image from 'next/image'
import { requireAuth } from '@/lib/require-auth'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'

import HebrewMonthCalendar from '@/components/hebrew/hebrew-month-calendar'
import { redirect } from 'next/navigation'

const HebrewCalendarPage = async () => {
	const session = await getServerSession(options)

	// Get user progress (returns a valid guest object if not signed in)
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	// Logged-in users only: still allow personalized info
	const userName = session?.user?.name ?? 'Guest'

	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			{/* <StickyWrapper>
				<UserProgress
					activeCourse={userProgress.activeCourse}
					hearts={userProgress.hearts}
					points={userProgress.points}
					hasActiveSubscription={isPro}
				/>
				{!isPro && <Promo />}
			</StickyWrapper> */}
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/card-file-box.svg"
						alt="Calendar"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Calendar
					</h1>
					{/* <DismissibleAlert storageKey="calendar" className="mb-4"></DismissibleAlert> */}
					<HebrewMonthCalendar />
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewCalendarPage
