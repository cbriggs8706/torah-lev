'use server'
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

import rawVocab from '@/lib/data/vocab/flashcards.json'
import { DismissibleAlert } from '@/components/dismissible-alert'

const SpellingPractice = dynamic(() => import('@/components/spelling'), {
	ssr: false,
})

const HebrewSpellingPage = async () => {
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
						src="/pencil-svgrepo-com.svg"
						alt="Calendar"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Spelling
					</h1>
					<DismissibleAlert className="mb-4">
						Customize your prompt type. My favorite is letter-by-letter. For
						sofit ending letters tap the Alt/Opt button. For additional vowels
						and dagesh, tap the shift button. For the backspace to work properly
						you need to have your cursor at the end/left of the word.
					</DismissibleAlert>

					<SpellingPractice
						data={rawVocab}
						lessonPrefix="awb"
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewSpellingPage
