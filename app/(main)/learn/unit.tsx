import { lessons, units } from '@/db/schema'

import { UnitBanner } from './unit-banner'
import { LessonButton } from './lesson-button'

type Props = {
	id: number
	order: number
	title: string
	description: string
	lessons: (typeof lessons.$inferSelect & {
		completed: boolean
	})[]
	activeLesson:
		| (typeof lessons.$inferSelect & {
				unit: typeof units.$inferSelect
		  })
		| undefined
	activeLessonPercentage: number
}

export const Unit = ({
	id,
	order,
	title,
	description,
	lessons,
	activeLesson,
	activeLessonPercentage,
}: Props) => {
	const manuallyUnlockedIds = [
		7, 39, 49, 59, 69, 79, 89, 99, 109, 119, 129, 139, 149, 159,
	]
	return (
		<>
			<UnitBanner title={title} description={description} />
			<div className="flex items-center flex-col relative">
				{lessons.map((lesson, index) => {
					const isCurrent = lesson.id === activeLesson?.id
					// const isUnlockedManually = manuallyUnlockedIds.includes(lesson.id)
					const isLocked = !lesson.completed && !isCurrent
					// const isLocked = !lesson.completed && !isCurrent && !isUnlockedManually

					return (
						<LessonButton
							key={lesson.id}
							id={lesson.id}
							title={lesson.title}
							completed={lesson.completed}
							index={index}
							totalCount={lessons.length - 1}
							current={isCurrent}
							locked={false}
							percentage={activeLessonPercentage}
						/>
					)
				})}
			</div>
		</>
	)
}
