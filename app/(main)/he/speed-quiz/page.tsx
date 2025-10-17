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
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewSpeedQuiz from '@/components/hebrew/hebrew-speed-quiz'

const HebrewSpeedQuizPage = async () => {
	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()
	const userSubscriptionData = getUserSubscription()

	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourseId) {
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
						src="/icons/iconRunning.png"
						// src="/man-juggling-medium-skin-tone-svgrepo-com.svg"
						alt="Speed Quiz"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						חִידוֹן מָהִיר
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Speed Quiz
					</p>
					<DismissibleAlert storageKey="letter1" className="mb-4">
						Takes a second to load even though it appears blank at first. Click
						filter to select a different lesson.
					</DismissibleAlert>
					{/*<DismissibleAlert storageKey="letter2" className="mb-4">
						{' '}
						The goal is to say the correct answer in under 3 seconds with no
						more than 2 mistakes per round in order to pass it off in class.
					</DismissibleAlert> */}
					<HebrewSpeedQuiz
						// data={awbHebrewVocab}
						userId={userProgress.userId}
						currentLesson={currentLesson}
						courseId={userProgress.activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewSpeedQuizPage
