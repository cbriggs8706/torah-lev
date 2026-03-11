import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import {
	getCourseProgress,
	getLesson,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { Quiz } from './quiz'

const LessonPage = async () => {
	// 🔹 Check both session and guest cookies
	const session = await getSession()
	const cookieStore = await cookies()
	const guestId = cookieStore.get('guestId')?.value ?? null
	const guestCourseId = cookieStore.get('guestActiveCourseId')?.value ?? null

	// 🚫 If neither logged in nor guest, kick them home
	if (!session?.user && !guestId) {
		redirect('/')
	}

	// ✅ Load data (for guests, it’s safe — read-only)
	const [lesson, userProgress, userSubscription] = await Promise.all([
		getLesson(),
		getUserProgress(),
		getUserSubscription(),
	])

	// 🧩 Graceful fallback for guests (no subscription table)
	const effectiveUserSub = !session?.user && guestId ? null : userSubscription

	if (!lesson || !userProgress) {
		return <div>Protected content</div>
	}

	const initialPercentage =
		(lesson.challenges.filter((c) => c.completed).length /
			lesson.challenges.length) *
		100

	const courseProgress = await getCourseProgress()
	const allLessons =
		courseProgress?.unitsInActiveCourse.flatMap((u) => u.lessons) || []
	const currentIndex = allLessons.findIndex((l) => l.id === lesson.id)
	const nextLesson = allLessons[currentIndex + 1] ?? null

	return (
		<Quiz
			initialLessonId={lesson.id}
			initialLessonChallenges={lesson.challenges}
			initialHearts={userProgress.hearts}
			initialPercentage={initialPercentage}
			userSubscription={effectiveUserSub}
			nextLessonId={nextLesson?.id ?? null}
			activeCourseId={userProgress?.activeCourseId ?? Number(guestCourseId)}
		/>
	)
}

export default LessonPage
