import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getEnglishSlideDecks,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import SlideDeckList from '@/components/english/english-slide-deck-list'

export default async function EnglishSlideDecksPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// Only query DB if user is logged in
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// Fallback for guests
	const activeCourseId = userProgress?.activeCourseId ?? 3 // default EC1
	const currentLesson = userProgress?.activeLessonId ?? null
	const isPro = !!userSubscription?.isActive
	const isEnglishFriend = !!userProgress?.isEnglishFriend

	// Identify prefix for course type
	const coursePrefixes: Record<number, string> = {
		17: 'LR',
		13: 'EwB',
		16: 'EfW',
		3: 'EC1',
		4: 'EC2',
	}
	const prefix = coursePrefixes[activeCourseId]

	// Get all decks then filter by prefix
	const slideDecks = await getEnglishSlideDecks()
	const filteredSlideDecks = prefix
		? slideDecks.filter((deck) => deck.lessonTitle?.startsWith(prefix))
		: slideDecks

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
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

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress won’t be saved.
						</p>
					)}

					<SlideDeckList
						slideDecks={filteredSlideDecks}
						isFriend={isEnglishFriend ?? false}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
