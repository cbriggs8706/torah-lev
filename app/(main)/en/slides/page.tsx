import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import {
	getCourseProgress,
	getEnglishSlideDecks,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import SlideDeckList from '@/components/english/english-slide-deck-list'

const EnglishSlideDecksPage = async () => {
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

	const coursePrefixes: Record<number, string> = {
		17: 'LR',
		13: 'EwB',
		16: 'EfW',
		3: 'EC1',
		4: 'EC2',
	}

	const prefix = coursePrefixes[userProgress.activeCourse.id] // may be undefined

	// Get everything, then conditionally filter in memory
	const slideDecks = await getEnglishSlideDecks()
	const filteredSlideDecks = prefix
		? slideDecks.filter((script) => script.lessonTitle?.startsWith(prefix))
		: slideDecks

	const isPro = !!userSubscription?.isActive
	const isEnglishFriend = !!userProgress?.isEnglishFriend
	const currentLesson = userProgress.activeLessonId

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
						src="/framed-picture-svgrepo-com.svg"
						alt="Slide Decks"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Slide Decks
					</h1>
					{/* <DismissibleAlert storageKey="scripts" className="mb-4">
						Lessons 1-100 are loaded. Most have audio where you can click the
						play button to listen while you read. Some browsers are having
						trouble displaying images nicely.
					</DismissibleAlert> */}

					<SlideDeckList
						slideDecks={filteredSlideDecks}
						isFriend={isEnglishFriend}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default EnglishSlideDecksPage
