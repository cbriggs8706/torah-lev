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

import { Calendar } from '@/components/ui/calendar'
import { GoalWrapper } from '@/components/goal-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import FirstVisitModal from '@/components/first-visit-modal'
import { EnglishHeader } from './header'

const EnglishLearnPage = async () => {
	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()
	const courseProgressData = getCourseProgress()
	const lessonPercentageData = getLessonPercentage()
	const unitsData = getUnits()
	const userSubscriptionData = getUserSubscription()
	console.log('activeLessonId>>>>>>', userChallengeData)
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
			<FirstVisitModal />

			<FeedWrapper>
				<EnglishHeader title={userProgress.activeCourse.title} />
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
					courseProgress={userChallengeData}
					lessonPercentage={lessonPercentage}
					lang="en"
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

export default EnglishLearnPage
