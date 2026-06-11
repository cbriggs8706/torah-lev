import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

import {
	getCourseLessons,
	getLessonPercentage,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'

import { FeedWrapper } from '@/components/feed-wrapper'
import { LearnLessonList } from '@/components/learn-lesson-list'
import { DismissibleAlert } from '@/components/dismissible-alert'
import FirstVisitModal from '@/components/first-visit-modal'
import { normalizeSidebarLocale } from '@/lib/sidebar-translations'
import { HebrewHeader } from './header'

// 🧩 Minimal guest type fallback
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
	activeLessonId?: number | null
}

const HebrewLearnPage = async () => {
	const session = await getSession()
	const cookieStore = await cookies()

	// ✅ Guest cookie support
	const guestId = cookieStore.get('guestId')?.value ?? null
	const guestCourseId = Number(
		cookieStore.get('guestActiveCourseId')?.value ?? 6
	)
	const sidebarLocale = normalizeSidebarLocale(
		cookieStore.get('sidebarLocale')?.value
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
	let lessonPercentage: Awaited<ReturnType<typeof getLessonPercentage>> | null =
		null
	let userSubscription: Awaited<ReturnType<typeof getUserSubscription>> | null =
		null

	if (session?.user) {
		// ✅ Authenticated user
		const [
			userProgressData,
			courseLessonsData,
			lessonPercentageData,
			userSubscriptionData,
		] = await Promise.all([
			getUserProgress(),
			getCourseLessons(),
			getLessonPercentage(),
			getUserSubscription(),
		])

		userProgress = userProgressData
		courseLessons = courseLessonsData
		lessonPercentage = lessonPercentageData
		userSubscription = userSubscriptionData
	} else {
		// ✅ Guest path: still load real content, but no DB writes
		const [courseLessonsData, lessonPercentageData] = await Promise.all([
			getCourseLessons(),
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
			activeLessonId: courseLessonsData[0]?.id ?? null,
		}

		courseLessons = courseLessonsData
		lessonPercentage = lessonPercentageData
		userSubscription = null
	}

	// ✅ Guard: if no course selected
	if (!userProgress?.activeCourse) {
		return <div>Protected content</div>
	}

	const activeLessonId = userProgress.activeLessonId ?? courseLessons[0]?.id ?? null

	const startLabelByLocale = {
		en: 'Start',
		es: 'Empezar',
		he: 'החל',
		el: 'Έναρξη',
	} as const

	return (
		<div className="flex flex-row-reverse gap-6 px-2 sm:px-4 lg:gap-[48px] lg:px-6">
			<FirstVisitModal />

			<FeedWrapper>
				<HebrewHeader title={userProgress.activeCourse.title} />

				<DismissibleAlert storageKey="learnpage-main-alert" className="mb-4">
					Click on the x in the upper right hand corner of this box to dismiss
					any of these notices across the site.
				</DismissibleAlert>

				<DismissibleAlert storageKey="learnpage-lessons-alert" className="mb-4">
					Each lesson in this main &apos;Learn&apos; section will have 1-3
					videos and quick quizzes. For additional learning activities and games
					tap the menu button in the upper left corner.
				</DismissibleAlert>

				<LearnLessonList
					lessons={courseLessons ?? []}
					activeLessonId={activeLessonId}
					lessonPercentage={lessonPercentage ?? 0}
					lang="he"
					startLabel={startLabelByLocale[sidebarLocale]}
					startLocale={sidebarLocale}
				/>
			</FeedWrapper>
		</div>
	)
}

export default HebrewLearnPage
