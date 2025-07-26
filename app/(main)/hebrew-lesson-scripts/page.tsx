import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import {
	getLessonScripts,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import LessonScriptViewer from '@/components/hebrew-lesson-scripts'
import { DismissibleAlert } from '@/components/dismissible-alert'

const HebrewLessonScriptsPage = async () => {
	const lessons = await getLessonScripts()
	const userProgressData = getUserProgress()
	const userSubscriptionData = getUserSubscription()

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
						src="/spiral-notepad-svgrepo-com.svg"
						alt="Lesson Scripts"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Lesson Scripts
					</h1>
					<DismissibleAlert className="mb-4">
						Lessons 1-100 are loaded. Most have audio where you can click the
						play button to listen while you read. Some browsers are having
						trouble displaying images nicely.
					</DismissibleAlert>

					<LessonScriptViewer lessons={lessons} />
				</div>
			</FeedWrapper>
		</div>
	)
}

export default HebrewLessonScriptsPage
