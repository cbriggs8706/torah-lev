import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getAllHebrewStories, getUserProgress } from '@/db/queries'
import StoryList from '@/components/hebrew/hebrew-story-list'

export default async function HebrewStoriesPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// ✅ Only query when logged in
	const userProgress = userId ? await getUserProgress() : null

	// ✅ Fallback defaults for guests
	const isHebrewFriend = !!userProgress?.isHebrewFriend
	const currentLesson = userProgress?.activeLessonId ?? 1
	const currentCourse = userProgress?.activeCourse?.id ?? 6 // Default to AwB (Alef with Bet)

	// ✅ Fetch stories (always available)
	const stories = await getAllHebrewStories(currentCourse)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconStories.png"
						alt="Stories"
						height={48}
						width={48}
					/>

					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						סִפּוּרִים
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Stories</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}
				</div>

				<div className="space-y-4">
					<StoryList
						stories={stories}
						isFriend={isHebrewFriend}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
