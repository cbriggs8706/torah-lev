'use client'
import { useEffect, useMemo, useState } from 'react'
import { UnitBanner } from './unit-banner'
import { LessonButton } from './lesson-button'
import { lessons as lessonsTbl, units } from '@/db/schema'

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
}

type ReviewRange = {
	startLessonNumber: number
	endLessonNumber: number
	date: string
} | null

const REVIEW_RANGE_MAP_KEY = 'reviewRangeDatesByLessonNumber'
const REVIEW_RANGE_KEY = 'reviewGoalRange'
const NEW_GOAL_MAP_KEY = 'newGoalDatesByLessonNumber'
const GOALS_EVENT = 'goals-updated'

export const Unit = (props: Props) => {
	const {
		title,
		description,
		lessons,
		activeLesson,
		activeLessonPercentage,
		schedule,
	} = props

	const [reviewRange, setReviewRange] = useState<ReviewRange>(null)
	const [reviewMap, setReviewMap] = useState<Record<number, string>>({})
	const [newMap, setNewMap] = useState<Record<number, string>>({})

	useEffect(() => {
		function load() {
			try {
				const rawRange = localStorage.getItem(REVIEW_RANGE_KEY)
				setReviewRange(rawRange ? JSON.parse(rawRange) : null)
			} catch {
				setReviewRange(null)
			}

			try {
				const rawMap = localStorage.getItem(REVIEW_RANGE_MAP_KEY)
				setReviewMap(rawMap ? JSON.parse(rawMap) : {})
			} catch {
				setReviewMap({})
			}
		}
		load()
		const h = () => load()
		window.addEventListener('review-goals-updated', h)
		return () => window.removeEventListener('review-goals-updated', h)
	}, [])

	const getTargetDate = (lessonId: number) => {
		const raw = schedule?.[lessonId]
		if (!raw) return null
		const d = typeof raw === 'string' ? new Date(raw) : raw
		return isNaN(+d) ? null : d
	}

	useEffect(() => {
		function load() {
			try {
				const rawRange = localStorage.getItem(REVIEW_RANGE_KEY)
				setReviewRange(rawRange ? JSON.parse(rawRange) : null)
			} catch {
				setReviewRange(null)
			}

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

	return (
		<>
			<UnitBanner title={title} description={description} />
			<div className="flex items-center flex-col relative mb-12">
				{lessons.map((lesson, index) => {
					const isCurrent = lesson.id === activeLesson?.id
					const isLocked = !lesson.completed && !isCurrent

					// 👇 per-lesson review date (if any) from the map

					const reviewIso = reviewMap[Number(lesson.lessonNumber)]
					const reviewDateFromMap = reviewIso ? new Date(reviewIso) : null

					// NEW: per-lesson new goal target date
					const newIso = newMap[Number(lesson.lessonNumber)]
					const targetDateFromNew = newIso ? new Date(newIso) : null

					// server-provided fallback
					const targetDateFromSchedule = (() => {
						const raw = schedule?.[lesson.id]
						if (!raw) return null
						const d = typeof raw === 'string' ? new Date(raw) : raw
						return isNaN(+d) ? null : d
					})()

					// choose targetDate: new-map first, then schedule
					const targetDate = targetDateFromNew ?? targetDateFromSchedule

					return (
						<LessonButton
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
						/>
					)
				})}
			</div>
		</>
	)
}
