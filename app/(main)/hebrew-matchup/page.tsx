import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import dynamic from 'next/dynamic'
import HebrewMatchup from '@/components/hebrew-matchup'

import rawVocab from '@/lib/data/vocab/flashcards.json'

const LetterQuiz = dynamic(() => import('@/components/letter-quiz'), {
	ssr: false,
})

const HebrewLetterQuizPage = async () => {
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

	const title = userChallengeData?.activeLesson?.title ?? ''
	const match = title.match(/AwB (\d{1,3})/)

	const currentLesson = match ? parseInt(match[1], 10) : undefined

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
						src="/couple-with-heart-man-man-light-skin-tone-svgrepo-com.svg"
						alt="Matchup"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Matchup
					</h1>
					<p className="text-muted-foreground text-center text-lg mb-6">
						It will load up to 12 words from your current lesson by default. You
						can change between text, images and audio in the filters. Known bug:
						drag and drop doesn&apos;t work on android devices.
					</p>
					<HebrewMatchup
						data={rawVocab}
						lessonPrefix="awb"
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewLetterQuizPage
