import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
// import awaGreekVocab from '@/lib/data/vocab/greek-vocab.json'

import HebrewDictionary from '@/components/hebrew/hebrew-dictionary'
import { DismissibleAlert } from '@/components/dismissible-alert'

const HebrewDictionaryPage = async () => {
	const userProgressData = getUserProgress()
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
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Dictionary
					</h1>
					<DismissibleAlert storageKey="dictionary" className="mb-4">
						Make sure to look up words that you don&apos;t recognize in any
						lesson. Filter alphabetically or by Lesson #. Click on any entry to
						view more info.
					</DismissibleAlert>
					<HebrewDictionary data={filteredWords} />
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewDictionaryPage
