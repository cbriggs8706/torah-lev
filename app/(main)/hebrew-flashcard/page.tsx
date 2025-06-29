import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import dynamic from 'next/dynamic'

import { vocab } from '@/lib/vocab'

const FlashcardReview = dynamic(() => import('@/components/flashcards'), {
	ssr: false,
})

const HebrewFlashcardPage = async () => {
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
			<StickyWrapper>
				<UserProgress
					activeCourse={userProgress.activeCourse}
					hearts={userProgress.hearts}
					points={userProgress.points}
					hasActiveSubscription={isPro}
				/>
				{/* {!isPro && (
          <Promo />
        )} */}
			</StickyWrapper>
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/spiral-calendar-pad.svg"
						alt="Calendar"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Flashcards
					</h1>
					<p className="text-muted-foreground text-center text-lg mb-6">
						Customize Your Deck
					</p>
					<FlashcardReview
						data={vocab}
						allFields={[
							'hebNiqqud',
							'heb',
							'eng',
							'genderPerson',
							'partOfSpeech',
							'ipa',
							'engTransliteration',
							'images',
							'hebAudio',
						]}
						lessonPrefix="awb"
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewFlashcardPage
