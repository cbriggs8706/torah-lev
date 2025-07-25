import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import dynamic from 'next/dynamic'

import rawVocab from '@/lib/data/vocab/flashcards.json'
import HebrewDictionary from '@/components/hebrew-dictionary'
import { DismissibleAlert } from '@/components/dismissible-alert'

const FlashcardReview = dynamic(() => import('@/components/flashcards'), {
	ssr: false,
})

const HebrewFlashcardPage = async () => {
	const userProgressData = getUserProgress()
	const userSubscriptionData = getUserSubscription()
	const filteredWords = rawVocab.filter(
		(word) => word.type?.toLowerCase() === 'word'
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
					<DismissibleAlert className="mb-4">
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

export default HebrewFlashcardPage
