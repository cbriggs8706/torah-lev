import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getAllEnglishStories, getUserProgress } from '@/db/queries'
import StoryList from '@/components/english/english-story-list'

export default async function EnglishStoriesPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// Fetch user data only if signed in
	const [stories, userProgress] = userId
		? await Promise.all([getAllEnglishStories(), getUserProgress()])
		: [await getAllEnglishStories(), null]

	// Guest fallback values
	const currentLesson = userProgress?.activeLessonId ?? null
	const isEnglishFriend = !!userProgress?.isEnglishFriend

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/books-svgrepo-com.svg"
						alt="Stories"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Stories
					</h1>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress won’t be saved.
						</p>
					)}
				</div>

				<div className="space-y-4">
					<StoryList
						stories={stories}
						isFriend={isEnglishFriend}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
