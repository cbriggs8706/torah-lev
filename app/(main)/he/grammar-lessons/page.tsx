import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import {
	getCourseProgress,
	getGrammarLessons,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import GrammarLessonViewer from '@/components/hebrew/hebrew-grammar-lessons'
import { DismissibleAlert } from '@/components/dismissible-alert'

const HebrewGrammarLessonsPage = async () => {
	const lessons = await getGrammarLessons()
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
						src="/bookmark-tabs-svgrepo-com (1).svg"
						alt="Grammar Lessons"
						height={90}
						width={90}
					/>
					<h1 className="text-center text-neutral-800 text-6xl font-cardo my-4">
						שִׁעוּרֵי דִּקְדּוּק{' '}
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Grammar Lessons
					</p>
					{/* <DismissibleAlert storageKey="scripts" className="mb-4">
            Lessons 1-100 are loaded. Most have audio where you can click the
            play button to listen while you read. Some browsers are having
            trouble displaying images nicely.
          </DismissibleAlert> */}

					<GrammarLessonViewer
						lessons={lessons}
						currentLesson={currentLesson ?? ''}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewGrammarLessonsPage
