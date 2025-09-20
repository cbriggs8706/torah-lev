import Image from 'next/image'
import { redirect } from 'next/navigation'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getAllHebrewStories, getUserProgress } from '@/db/queries'
import StoryList from '@/components/hebrew/hebrew-story-list'

const HebrewStoriesPage = async () => {
	const userProgress = await getUserProgress()

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	const isHebrewFriend = !!userProgress?.isHebrewFriend
	const currentLesson = userProgress.activeLessonId
	const currentCourse = userProgress.activeCourse.id

	const stories = await getAllHebrewStories(currentCourse)

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
					{/* <DismissibleAlert storageKey="matchup" className="mb-4">
            {' '}
            Musics
          </DismissibleAlert> */}
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

export default HebrewStoriesPage
