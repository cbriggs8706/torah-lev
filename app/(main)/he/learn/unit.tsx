'use client'
import { useEffect, useState } from 'react'
import { lessons as lessonsTbl, units } from '@/db/schema'
import { HebrewLessonButton } from './lesson-button'
import { HebrewUnitBanner } from './unit-banner'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import type { SidebarLocale } from '@/types/sidebar'

type Props = {
	id: number
	order: number
	title: string
	description: string
	lessons: (typeof lessonsTbl.$inferSelect & { completed: boolean })[]
	activeLesson:
		| (typeof lessonsTbl.$inferSelect & { unit: typeof units.$inferSelect })
		| undefined
	activeLessonPercentage: number
	schedule?: Record<number, Date | string>
	startLabel?: string
	startLocale?: SidebarLocale
}

const REVIEW_RANGE_MAP_KEY = 'reviewRangeDatesByLessonNumber'
const NEW_GOAL_MAP_KEY = 'newGoalDatesByLessonNumber'
const GOALS_EVENT = 'goals-updated'

export const HebrewUnit = (props: Props) => {
	const {
		title,
		description,
		lessons,
		activeLesson,
		activeLessonPercentage,
		schedule,
		startLabel,
		startLocale,
	} = props

	const [reviewMap, setReviewMap] = useState<Record<number, string>>({})
	const [newMap, setNewMap] = useState<Record<number, string>>({})
	const [manualOpen, setManualOpen] = useState<boolean | null>(null)

	const allLessonsCompleted =
		lessons.length > 0 && lessons.every((lesson) => lesson.completed)
	const isOpen = manualOpen ?? !allLessonsCompleted

	useEffect(() => {
		function load() {
			try {
				const rawReview = localStorage.getItem(REVIEW_RANGE_MAP_KEY)
				setReviewMap(rawReview ? JSON.parse(rawReview) : {})
			} catch {
				setReviewMap({})
			}

			try {
				const rawNew = localStorage.getItem(NEW_GOAL_MAP_KEY)
				setNewMap(rawNew ? JSON.parse(rawNew) : {})
			} catch {
				setNewMap({})
			}
		}
		load()
		const h = () => load()
		// listen to both, for backwards compatibility
		window.addEventListener('review-goals-updated', h)
		window.addEventListener(GOALS_EVENT, h)
		return () => {
			window.removeEventListener('review-goals-updated', h)
			window.removeEventListener(GOALS_EVENT, h)
		}
	}, [])

	useEffect(() => {
		setManualOpen(null)
	}, [allLessonsCompleted])

	return (
		<Collapsible open={isOpen} onOpenChange={setManualOpen}>
			<HebrewUnitBanner
				title={title}
				description={description}
				isCollapsed={!isOpen}
				isCompleted={allLessonsCompleted}
				onToggle={() => setManualOpen(!isOpen)}
			/>
			<CollapsibleContent>
				<div
					className="my-12 flex flex-wrap items-stretch justify-center gap-4"
					dir="rtl"
				>
					{lessons.map((lesson, index) => {
						const isCurrent = lesson.id === activeLesson?.id
						const isLocked = false

						const reviewIso = reviewMap[Number(lesson.lessonNumber)]
						const reviewDateFromMap = reviewIso ? new Date(reviewIso) : null

						const newIso = newMap[Number(lesson.lessonNumber)]
						const targetDateFromNew = newIso ? new Date(newIso) : null

						const targetDateFromSchedule = (() => {
							const raw = schedule?.[lesson.id]
							if (!raw) return null
							const d = typeof raw === 'string' ? new Date(raw) : raw
							return isNaN(+d) ? null : d
						})()

						const targetDate = targetDateFromNew ?? targetDateFromSchedule

						return (
							<HebrewLessonButton
								key={lesson.id}
								id={lesson.id}
								title={lesson.title}
								completed={lesson.completed}
								index={index}
								totalCount={lessons.length - 1}
								current={isCurrent}
								locked={isLocked}
								percentage={activeLessonPercentage}
								targetDate={targetDate}
								reviewDate={reviewDateFromMap}
								lessonNumber={String(lesson.lessonNumber)}
								startLabel={startLabel}
								startLocale={startLocale}
							/>
						)
					})}
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}
