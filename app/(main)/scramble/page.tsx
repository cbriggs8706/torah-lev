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

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
// import awaGreekVocab from '@/lib/data/vocab/greek-vocab.json'
import { DismissibleAlert } from '@/components/dismissible-alert'

const HebrewScramble = dynamic(
	() => import('@/components/hebrew/hebrew-scramble'),
	{
		ssr: false,
	}
)

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
						src="/cooking-svgrepo-com.svg"
						alt="Scramble"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Scramble
					</h1>
					<DismissibleAlert storageKey="scramble" className="mb-4">
						{' '}
						Much more coming soon to this activity! Below is a scrambled up
						sentence of 2-10 words. Click on them in order to unscramble. To
						take a word out, tap on the corresponding green word again to
						remove. Don&apos;t forget to go right to left!
					</DismissibleAlert>

					<HebrewScramble
						data={awbHebrewVocab}
						currentLesson={currentLesson ?? ''}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewScramblePage
