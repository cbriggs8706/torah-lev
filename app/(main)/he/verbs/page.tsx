import Image from 'next/image'
import { redirect } from 'next/navigation'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress } from '@/db/queries'
import HebrewVerbList from '@/components/hebrew/hebrew-verb-list'
import allVerbs from '@/lib/data/hebrew/verbs/index.json'

const HebrewVerbsPage = async () => {
	const userProgress = await getUserProgress()

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	const isHebrewFriend = !!userProgress?.isHebrewFriend
	const currentLessonNumber = userProgress.activeLessonNumber
	const currentCourse = userProgress.activeCourse.id
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconStories.png"
						// TODO swap out
						// src="/books-svgrepo-com.svg"
						alt="Verbs"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						פְּעָלִים
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Verbs</p>
					{/* <DismissibleAlert storageKey="matchup" className="mb-4">
            {' '}
            Musics
          </DismissibleAlert> */}
				</div>
				<div className="space-y-4">
					<HebrewVerbList
						allVerbs={allVerbs}
						currentLesson={
							userProgress.activeLessonNumber
								? Number(userProgress.activeLessonNumber)
								: null
						}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewVerbsPage
