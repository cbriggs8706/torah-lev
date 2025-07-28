import { redirect } from 'next/navigation'

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

const LearnPage = async () => {
	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()
	const courseProgressData = getCourseProgress()
	const lessonPercentageData = getLessonPercentage()
	const unitsData = getUnits()
	const userSubscriptionData = getUserSubscription()

	const [
		userProgress,
		units,
		courseProgress,
		lessonPercentage,
		userSubscription,
	] = await Promise.all([
		userProgressData,
		unitsData,
		courseProgressData,
		lessonPercentageData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	if (!courseProgress) {
		redirect('/courses')
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
			<FeedWrapper>
				<Header title={userProgress.activeCourse.title} />
				<DismissibleAlert storageKey="learnpage-main-alert" className="mb-4">
					This is the main section of the app. You could stay here and never do
					the rest of the activities if you&apos;d like. There may be occasional
					resets to lesson progress/points. Don&apos;t worry about marking off
					all the previous lessons right now. I&apos;ll let you know when it is
					clear. Click on the x in the upper right hand corner to dismiss any of
					these notices across the site.
				</DismissibleAlert>

				<DismissibleAlert storageKey="learnpage-lessons-alert" className="mb-4">
					Each lesson will have 1-3 videos and some quiz questions to check
					comprehension of new vocabulary and principles. For additional
					practice tap the menu button in the upper left corner to view other
					activities.
				</DismissibleAlert>
				<GoalWrapper units={units} />

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

export default LearnPage
