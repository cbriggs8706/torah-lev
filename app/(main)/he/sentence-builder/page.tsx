import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import dynamic from 'next/dynamic'
import { DismissibleAlert } from '@/components/dismissible-alert'

const SentenceBuilder = dynamic(
	() => import('@/components/hebrew/hebrew-sentence-builder'),
	{
		ssr: false,
	}
)

const HebrewSentenceBuilderPage = async () => {
	const userProgressData = getUserProgress()
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
						src="/icons/iconBuilding.png"
						// src="/building-construction-svgrepo-com.svg"
						alt="Sentence Builder"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						בּוֹנֵה מִשְׁפָּטִים
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Sentence Builder
					</p>
					{/* <DismissibleAlert storageKey="sentenceBuilder" className="mb-4">
						Known issues. This activity will be merged into the Scramble
						activity and enhanced. Coming soon! For now when you drag words into
						the bar in a correct order, the english equivalent will appear.
					</DismissibleAlert> */}
					<SentenceBuilder userId={userProgress.userId} />
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewSentenceBuilderPage
