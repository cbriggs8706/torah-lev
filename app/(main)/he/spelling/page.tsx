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

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import hsHebrewVocab from '@/lib/data/vocab/hsVocab.json'
import abcHebrewVocab from '@/lib/data/vocab/abcVocab.json'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { HebrewVocab } from '@/lib/vocab'
import HebrewSpelling from '@/components/hebrew/hebrew-spelling'

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

	const currentLesson = userChallengeData?.activeLesson?.lessonNumber
	const activeCourseId = userProgress.activeCourseId

	const hebrewData: HebrewVocab[] = (() => {
		const baseData: HebrewVocab[] =
			activeCourseId === 6
				? (awbHebrewVocab as HebrewVocab[])
				: activeCourseId === 11
				? (hsHebrewVocab as HebrewVocab[])
				: activeCourseId === 14
				? (abcHebrewVocab as HebrewVocab[])
				: []

		return baseData.filter((w) => w.type?.toLowerCase() === 'word')
	})()
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
						src="/icons/iconSpelling.png"
						// src="/input-latin-letters-svgrepo-com.svg"
						alt="Spelling"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						אִיּוּת
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Spelling
					</p>
					<DismissibleAlert storageKey="spelling" className="mb-4">
						Customize your prompt type. My favorite is letter-by-letter. For
						sofit ending letters tap the Alt/Opt button. For additional vowels
						and dagesh, tap the shift button. For the backspace to work properly
						you need to have your cursor at the end/left of the word.
					</DismissibleAlert>

					<HebrewSpelling
						data={hebrewData}
						currentLesson={currentLesson ?? ''}
						userId={userProgress.userId}
						courseId={activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewSpellingPage
