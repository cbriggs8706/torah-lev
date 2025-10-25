import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import {
	getCourseProgress,
	getLesson,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'

import { Quiz } from './quiz'

const LessonPage = async () => {
	const session = await getServerSession(options)
	if (!session?.user) redirect('/') // or your landing page
	const lessonData = getLesson()
	const userProgressData = getUserProgress()
	const userSubscriptionData = getUserSubscription()

	const [lesson, userProgress, userSubscription] = await Promise.all([
		lessonData,
		userProgressData,
		userSubscriptionData,
	])

	if (!lesson || !userProgress) {
		return <div>Protected content</div>
	}

	const initialPercentage =
		(lesson.challenges.filter((challenge) => challenge.completed).length /
			lesson.challenges.length) *
		100

	const courseProgress = await getCourseProgress()
	const allLessons =
		courseProgress?.unitsInActiveCourse.flatMap((u) => u.lessons) || []
	const currentIndex = allLessons.findIndex((l) => l.id === lesson.id)
	const nextLesson = allLessons[currentIndex - 1]
	// const nextLesson = allLessons[currentIndex + 1]
	console.log('activeCourseId', userProgress?.activeCourseId)
	return (
		<Quiz
			initialLessonId={lesson.id}
			initialLessonChallenges={lesson.challenges}
			initialHearts={userProgress.hearts}
			initialPercentage={initialPercentage}
			userSubscription={userSubscription}
			nextLessonId={nextLesson?.id ?? null}
			activeCourseId={userProgress?.activeCourseId}
		/>
	)
}

export default LessonPage
