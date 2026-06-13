'use client'

import { HebrewLessonButton } from '@/app/(main)/he/learn/lesson-button'
import { lessons } from '@/db/schema'
import type { SidebarLocale } from '@/types/sidebar'

type LessonRecord = typeof lessons.$inferSelect & { completed?: boolean }

export function LearnLessonList({
	lessons: lessonList,
	activeLessonId,
	lessonPercentage,
	startLabel,
	startLocale,
}: {
	lessons: LessonRecord[]
	activeLessonId?: number | null
	lessonPercentage: number
	startLabel?: string
	startLocale?: SidebarLocale
}) {
	return (
		<div
			className="my-12 flex flex-wrap items-stretch justify-center gap-4"
			dir="rtl"
		>
			{lessonList.map((lesson, index) => {
				const commonProps = {
					id: lesson.id,
					title: lesson.title,
					index,
					totalCount: lessonList.length - 1,
					current: lesson.id === activeLessonId,
					locked: false,
					completed: !!lesson.completed,
					percentage: lessonPercentage,
					lessonNumber: String(lesson.lessonNumber),
				}

				return (
					<HebrewLessonButton
						key={lesson.id}
						{...commonProps}
						startLabel={startLabel}
						startLocale={startLocale}
					/>
				)
			})}
		</div>
	)
}
