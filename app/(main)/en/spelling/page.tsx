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

import efwEnglishVocab from '@/lib/data/vocab/efwVocab.json'
import ewbEnglishVocab from '@/lib/data/vocab/ewbVocab.json'
import lrEnglishVocab from '@/lib/data/vocab/lrVocab.json'
import ec1EnglishVocab from '@/lib/data/vocab/ec1Vocab.json'
import ec2EnglishVocab from '@/lib/data/vocab/ec2Vocab.json'

import { DismissibleAlert } from '@/components/dismissible-alert'
import { EnglishVocab } from '@/lib/vocab'

const SpellingPractice = dynamic(
	() => import('@/components/english/english-spelling'),
	{
		ssr: false,
	}
)

const EnglishSpellingPage = async () => {
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

	const englishData: EnglishVocab[] =
		userProgress.activeCourseId === 16
			? (efwEnglishVocab as EnglishVocab[])
			: userProgress.activeCourseId === 13
			? (ewbEnglishVocab as EnglishVocab[])
			: userProgress.activeCourseId === 17
			? (lrEnglishVocab as EnglishVocab[])
			: userProgress.activeCourseId === 3
			? (ec1EnglishVocab as EnglishVocab[])
			: userProgress.activeCourseId === 4
			? (ec2EnglishVocab as EnglishVocab[])
			: []
	const filteredData = englishData.filter((entry) => entry.type === 'word')

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
						src="/input-latin-letters-svgrepo-com.svg"
						alt="Spelling"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Spelling
					</h1>
					<DismissibleAlert storageKey="spelling" className="mb-4">
						Customize your prompt type. My favorite is letter-by-letter. For
						sofit ending letters tap the Alt/Opt button. For additional vowels
						and dagesh, tap the shift button. For the backspace to work properly
						you need to have your cursor at the end/left of the word.
					</DismissibleAlert>

					<SpellingPractice
						data={filteredData}
						currentLesson={currentLesson ?? ''}
						userId={userProgress.userId}
						courseId={userProgress.activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default EnglishSpellingPage
