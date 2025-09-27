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

import HebrewDictionary from '@/components/hebrew/hebrew-dictionary'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { HebrewVocab } from '@/lib/vocab'

const HebrewDictionaryPage = async () => {
	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()

	const userSubscriptionData = getUserSubscription()
	// const filteredWords = awbHebrewVocab.filter(
	// 	(word) => word.type?.toLowerCase() === 'word'
	// )
	const filteredWords = awbHebrewVocab.filter(
		(word) =>
			word.type?.toLowerCase() === 'word' &&
			!word.lessons?.some((lesson) =>
				lesson.toLowerCase().includes('classroom')
			)
	)
	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	const isPro = !!userSubscription?.isActive

	const title = userChallengeData?.activeLesson?.title ?? ''
	const coursePrefixes: Record<number, string> = {
		6: 'AwB',
		11: 'HS',
		14: 'ABC',
	}

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
						src="/open-book-svgrepo-com.svg"
						alt="Dictionary"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-4">
						מִלוֹן
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Dictionary
					</p>
					<DismissibleAlert storageKey="dictionary" className="mb-4">
						Make sure to look up words that you don&apos;t recognize in any
						lesson. Filter alphabetically or by Lesson #. Click on any entry to
						view more info.
					</DismissibleAlert>
					<HebrewDictionary data={hebrewData} />
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewDictionaryPage
