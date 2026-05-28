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
import { LearnLessonList } from '@/components/learn-lesson-list'
import { DismissibleAlert } from '@/components/dismissible-alert'
import FirstVisitModal from '@/components/first-visit-modal'
import { cookies } from 'next/headers'

interface GuestUserProgress {
	userId: string
	userName: string
	userImageSrc: string
	activeCourseId: number
	activeCourse: {
		id: number
		title: string
	}
	hearts: number
	points: number
}

const GreekLearnPage = async () => {
	const session = await getSession()
	const cookieStore = await cookies()

	// ✅ Guest cookie support
	const guestId = cookieStore.get('guestId')?.value ?? null
	const guestCourseId = Number(
		cookieStore.get('guestActiveCourseId')?.value ?? 6
	)

	// 🚫 If no user or guest at all, redirect home
	if (!session?.user && !guestId) {
		redirect('/')
	}

	// 🧠 Prepare shared vars
	let userProgress:
		| Awaited<ReturnType<typeof getUserProgress>>
		| GuestUserProgress
		| null = null
	let courseLessons: Awaited<ReturnType<typeof getCourseLessons>> = []
	let courseProgress: Awaited<ReturnType<typeof getCourseProgress>> | null =
		null
	let lessonPercentage: Awaited<ReturnType<typeof getLessonPercentage>> | null =
		null
	let userSubscription: Awaited<ReturnType<typeof getUserSubscription>> | null =
		null

	if (session?.user) {
		// ✅ Authenticated user
		const [
			userProgressData,
			courseLessonsData,
			courseProgressData,
			lessonPercentageData,
			userSubscriptionData,
		] = await Promise.all([
			getUserProgress(),
			getCourseLessons(),
			getCourseProgress(),
			getLessonPercentage(),
			getUserSubscription(),
		])

		userProgress = userProgressData
		courseLessons = courseLessonsData
		courseProgress = courseProgressData
		lessonPercentage = lessonPercentageData
		userSubscription = userSubscriptionData
	} else {
		// ✅ Guest path: still load real content, but no DB writes
		const [courseLessonsData, courseProgressData, lessonPercentageData] =
			await Promise.all([
				getCourseLessons(),
				getCourseProgress(), // shows lessons for the active course
				getLessonPercentage(), // harmless read
			])

		userProgress = {
			userId: guestId || 'guest',
			userName: 'Guest',
			userImageSrc: '/mascot.svg',
			activeCourseId: guestCourseId,
			activeCourse: {
				id: guestCourseId,
				title: 'Guest Hebrew Course',
			},
			hearts: 0,
			points: 0,
		}

		courseLessons = courseLessonsData
		courseProgress = courseProgressData
		lessonPercentage = lessonPercentageData
		userSubscription = null
	}

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FirstVisitModal />

			<FeedWrapper>
				{/* TODO fix */}
				{/* <Header title={userProgress.activeCourse.title} /> */}
				<DismissibleAlert storageKey="learnpage-main-alert" className="mb-4">
					Click on the x in the upper right hand corner of this box to dismiss
					any of these notices across the site.
				</DismissibleAlert>

				<LearnLessonList
					lessons={courseLessons}
					courseProgress={courseProgress ?? undefined}
					lessonPercentage={lessonPercentage ?? 0}
					lang="el"
				/>
			</FeedWrapper>
		</div>
	)
}

export default GreekLearnPage
