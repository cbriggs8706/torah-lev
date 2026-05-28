import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseLessons,
	getCourseProgress,
	getLessonPercentage,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { Header } from './header'
import { LearnLessonList } from '@/components/learn-lesson-list'
import { DismissibleAlert } from '@/components/dismissible-alert'
import FirstVisitModal from '@/components/first-visit-modal'

const LearnPage = async () => {
	const session = await getSession()
	if (!session?.user) redirect('/') // or your landing page
	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()
	const courseProgressData = getCourseProgress()
	const lessonPercentageData = getLessonPercentage()
	const lessonsData = getCourseLessons()
	const userSubscriptionData = getUserSubscription()

	const [
		userProgress,
		courseLessons,
		courseProgress,
		lessonPercentage,
		userSubscription,
	] = await Promise.all([
		userProgressData,
		lessonsData,
		courseProgressData,
		lessonPercentageData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		return <div>Protected content</div>
	}

	if (!courseProgress) {
		return <div>Protected content</div>
	}

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FirstVisitModal />

			<FeedWrapper>
				<Header title={userProgress.activeCourse.title} />
				<DismissibleAlert storageKey="learnpage-main-alert" className="mb-4">
					Click on the x in the upper right hand corner of this box to dismiss
					any of these notices across the site.
				</DismissibleAlert>

				<LearnLessonList
					lessons={courseLessons}
					courseProgress={userChallengeData}
					lessonPercentage={lessonPercentage ?? 0}
				/>
			</FeedWrapper>
		</div>
	)
}

export default LearnPage
