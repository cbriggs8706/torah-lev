import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
// import { Promo } from '@/components/promo'
import { Quests } from '@/components/quests'
import { FeedWrapper } from '@/components/feed-wrapper'
import { UserProgress } from '@/components/user-progress'
import { StickyWrapper } from '@/components/sticky-wrapper'
import { lessons, units as unitsSchema } from '@/db/schema'
import {
	getCourseProgress,
	getLessonPercentage,
	getUnits,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'

import { Unit } from './unit'
import { Header } from './header'
import { Calendar } from '@/components/ui/calendar'
import { GoalWrapper } from '@/components/goal-wrapper'
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
	let units: Awaited<ReturnType<typeof getUnits>> = []
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
			unitsData,
			courseProgressData,
			lessonPercentageData,
			userSubscriptionData,
		] = await Promise.all([
			getUserProgress(),
			getUnits(),
			getCourseProgress(),
			getLessonPercentage(),
			getUserSubscription(),
		])

		userProgress = userProgressData
		units = unitsData
		courseProgress = courseProgressData
		lessonPercentage = lessonPercentageData
		userSubscription = userSubscriptionData
	} else {
		// ✅ Guest path: still load real content, but no DB writes
		const [unitsData, courseProgressData, lessonPercentageData] =
			await Promise.all([
				getUnits(), // guests can safely read units
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

		units = unitsData
		courseProgress = courseProgressData
		lessonPercentage = lessonPercentageData
		userSubscription = null
	}

	const isPro = !!userSubscription?.isActive

	function getLessonSchedule(
		lessons: { id: number }[],
		goalLesson: number,
		goalDate: Date
	) {
		const goalIndex = lessons.findIndex((l) => l.id === goalLesson)
		if (goalIndex === -1) return {}

		const totalDays = Math.max(
			1,
			Math.floor((goalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
		)

		const daysPerLesson = totalDays / (goalIndex + 1)

		return lessons.reduce((acc, lesson, index) => {
			const date = new Date()
			date.setDate(date.getDate() + Math.round(daysPerLesson * (index + 1)))
			acc[lesson.id] = date
			return acc
		}, {} as Record<number, Date>)
	}

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			{/* <StickyWrapper>
				<UserProgress
					activeCourse={userProgress.activeCourse}
					hearts={userProgress.hearts}
					points={userProgress.points}
					hasActiveSubscription={isPro}
				/>
				{!isPro && (
          <Promo />
        )}
				<Calendar />
				<Quests
					points={userProgress.points}
					userChallengeData={userChallengeData}
				/>
			</StickyWrapper> */}
			<FirstVisitModal />

			<FeedWrapper>
				{/* TODO fix */}
				{/* <Header title={userProgress.activeCourse.title} /> */}
				<DismissibleAlert storageKey="learnpage-main-alert" className="mb-4">
					Click on the x in the upper right hand corner of this box to dismiss
					any of these notices across the site.
				</DismissibleAlert>

				<DismissibleAlert storageKey="learnpage-lessons-alert" className="mb-4">
					Each lesson in this main &apos;Learn&apos; section will have 1-3
					videos and quick quizzes. For additional learning activities and games
					tap the menu button in the upper left corner.
				</DismissibleAlert>
				<GoalWrapper
					units={units}
					courseProgress={courseProgress ?? undefined}
					lessonPercentage={lessonPercentage}
				/>

				{/* {units.map((unit) => (
					<div key={unit.id} className="mb-10">
						<Unit
							id={unit.id}
							order={unit.order}
							description={unit.description}
							title={unit.title}
							lessons={unit.lessons}
							activeLesson={
								courseProgress.activeLesson as
									| (typeof lessons.$inferSelect & {
											unit: typeof unitsSchema.$inferSelect
									  })
									| undefined
							}
							activeLessonPercentage={lessonPercentage}
						/>
					</div>
				))} */}
			</FeedWrapper>
		</div>
	)
}

export default GreekLearnPage
