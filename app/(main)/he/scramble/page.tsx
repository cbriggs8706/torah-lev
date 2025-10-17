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

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewScramble from '@/components/hebrew/hebrew-scramble'

const HebrewScramblePage = async () => {
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
	const currentLesson = userChallengeData?.activeLesson?.lessonNumber

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
						src="/icons/iconScrambled.png"
						// src="/cooking-svgrepo-com.svg"
						alt="Scramble"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						עִרְבּוּב
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Scramble
					</p>
					{/* <DismissibleAlert storageKey="scramble" className="mb-4">
						{' '}
						Much more coming soon to this activity! Below is a scrambled up
						sentence of 2-10 words. Click on them in order to unscramble. To
						take a word out, tap on the corresponding green word again to
						remove. Don&apos;t forget to go right to left!
					</DismissibleAlert> */}

					<HebrewScramble
						data={awbHebrewVocab}
						currentLesson={currentLesson ?? ''}
						userId={userProgress.userId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewScramblePage
