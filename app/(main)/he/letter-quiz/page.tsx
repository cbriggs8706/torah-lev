import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import dynamic from 'next/dynamic'
import { hebrewLetters } from '@/lib/hebrew-letters'
import { hebrewNiqqud } from '@/lib/hebrew-niqqud'
import { DismissibleAlert } from '@/components/dismissible-alert'

const LetterQuiz = dynamic(
	() => import('@/components/hebrew/hebrew-letter-quiz'),
	{
		ssr: false,
	}
)

const HebrewLetterQuizPage = async () => {
	const userProgressData = getUserProgress()
	const userSubscriptionData = getUserSubscription()

	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourseId) {
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
						src="/icons/iconLetter.png"
						// src="/a-button-blood-type-svgrepo-com.svg"
						alt="Letter Quiz"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						חִידוֹן אוֹתִיּוֹת
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Letter Quiz
					</p>
					<DismissibleAlert storageKey="letter1" className="mb-4">
						Quiz yourself on letter names, letter sounds or syllable sounds.
						Play around with different fonts. New Study Alphabet button! More
						fonts coming soon.
					</DismissibleAlert>
					<DismissibleAlert storageKey="letter2" className="mb-4">
						{' '}
						The goal is to say the correct answer in under 3 seconds with no
						more than 2 mistakes per round in order to pass it off in class.
					</DismissibleAlert>
					<LetterQuiz
						letters={hebrewLetters}
						niqqud={hebrewNiqqud}
						userId={userProgress.userId}
						courseId={userProgress.activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewLetterQuizPage
