'use client'

import { GreekLessonButton } from '@/app/(main)/el/learn/lesson-button'
import { HebrewLessonButton } from '@/app/(main)/he/learn/lesson-button'
import { lessons } from '@/db/schema'
import type { SidebarLocale } from '@/types/sidebar'

type LessonRecord = typeof lessons.$inferSelect & { completed?: boolean }

export function LearnLessonList({
	lessons: lessonList,
	activeLessonId,
	lessonPercentage,
	lang = 'en',
	startLabel,
	startLocale,
}: {
	lessons: LessonRecord[]
	activeLessonId?: number | null
	lessonPercentage: number
	lang?: 'en' | 'he' | 'es' | 'el'
	startLabel?: string
	startLocale?: SidebarLocale
}) {
	return (
		<div
			className={
				lang === 'he'
					? 'my-12 flex flex-wrap items-stretch justify-center gap-4'
					: 'my-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
			}
			dir={lang === 'he' ? 'rtl' : undefined}
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

				return lang === 'he' ? (
					<HebrewLessonButton
						key={lesson.id}
						{...commonProps}
						startLabel={startLabel}
						startLocale={startLocale}
					/>
				) : (
					<GreekLessonButton key={lesson.id} {...commonProps} />
				)
			})}
		</div>
	)
}
