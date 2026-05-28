import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import {
	getCourseProgress,
	getLesson,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { Quiz } from '../quiz'

type Props = {
	params: Promise<{
		lessonId: string
	}>
}

const LessonIdPage = async ({ params }: Props) => {
	const { lessonId } = await params
	// 🔹 Allow both signed-in users and guests
	const session = await getSession()
	const cookieStore = await cookies()
	const guestId = cookieStore.get('guestId')?.value ?? null

	// 🚫 Block only if no session AND no guest cookie
	if (!session?.user && !guestId) {
		redirect('/')
	}

	// ✅ Fetch data (works for guests too)
	const [lesson, userProgress, userSubscription] = await Promise.all([
		getLesson(Number(lessonId)),
		getUserProgress(),
		getUserSubscription(),
	])

	if (!lesson || !userProgress) {
		return <div>Protected content</div>
	}

	// 🧮 Compute completion %
	const initialPercentage =
		(lesson.challenges.filter((c) => c.completed).length /
			lesson.challenges.length) *
		100

	const courseProgress = await getCourseProgress()
	const allLessons = courseProgress?.lessonsInActiveCourse || []
	const currentIndex = allLessons.findIndex((l) => l.id === lesson.id)
	const nextLesson = allLessons[currentIndex + 1]

	return (
		<Quiz
			initialLessonId={lesson.id}
			initialLessonChallenges={lesson.challenges}
			initialHearts={userProgress.hearts}
			initialPercentage={initialPercentage}
			userSubscription={session?.user ? userSubscription : null} // guests don't have subs
			nextLessonId={nextLesson?.id ?? null}
			activeCourseId={userProgress?.activeCourseId ?? null}
		/>
	)
}

export default LessonIdPage
