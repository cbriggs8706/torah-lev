import Image from 'next/image'
import { redirect } from 'next/navigation'

// import { Promo } from '@/components/promo'
import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'

import { Quests } from '@/components/quests'
import { Items } from '../market/items'

const ProgressPage = async () => {
	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()
	const userSubscriptionData = getUserSubscription()

	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<StickyWrapper>
				<UserProgress
					activeCourse={userProgress.activeCourse}
					hearts={userProgress.hearts}
					points={userProgress.points}
					hasActiveSubscription={isPro}
				/>
				{/* {!isPro && <Promo />} */}
				<Quests
					points={userProgress.points}
					userChallengeData={userChallengeData}
				/>
			</StickyWrapper>
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image src="/shop.svg" alt="Donate" height={90} width={90} />
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Progress
					</h1>
					<p className="text-muted-foreground text-center text-lg mb-6">
						Set high goals and reach them!
					</p>
					<Items
						hearts={userProgress.hearts}
						points={userProgress.points}
						hasActiveSubscription={isPro}
						hasTribe={!!userProgress.tribeId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default ProgressPage
