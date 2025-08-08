'use client'
import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { Button } from './ui/button'

type Mode = 'new' | 'review'
const REVIEW_RANGE_KEY = 'reviewGoalRange' // { startLessonNumber, endLessonNumber, date }
const GOAL_KEY = 'goal' // { lessonNumber, date, mode }
const REVIEW_RANGE_MAP_KEY = 'reviewRangeDatesByLessonNumber'
const NEW_GOAL_MAP_KEY = 'newGoalDatesByLessonNumber' // { [lessonNumber]: ISOString }
const GOALS_EVENT = 'goals-updated'

function buildPerLessonSchedule(
	lessonsInRange: number[],
	goalDate: Date
): Record<number, string> {
	const today = new Date()
	// clamp "today" to midnight for stable diffs
	today.setHours(0, 0, 0, 0)

	const msPerDay = 1000 * 60 * 60 * 24
	// ensure at least 1 day so we don't divide by zero
	const days = Math.max(1, Math.floor((+goalDate - +today) / msPerDay))
	const n = lessonsInRange.length
	const map: Record<number, string> = {}

	// Spread lessons across the days window
	// Example: if n=10, days=20, offsets ~ 0,2,4,...,18
	for (let i = 0; i < n; i++) {
		const dayOffset = Math.floor((i * days) / Math.max(1, n - 1))
		const d = new Date(today)
		d.setDate(d.getDate() + dayOffset)
		map[lessonsInRange[i]] = d.toISOString()
	}

	return map
}

function clearAllGoals() {
	try {
		localStorage.removeItem(GOAL_KEY)
		localStorage.removeItem(REVIEW_RANGE_KEY)
		localStorage.removeItem(REVIEW_RANGE_MAP_KEY)
		localStorage.removeItem(NEW_GOAL_MAP_KEY)
	} finally {
		// ping listeners so Unit reloads empty state
		window.dispatchEvent(new CustomEvent(GOALS_EVENT))
	}
}

export function GoalSetter({
	lessons,
	onGoalSet,
}: {
	lessons: {
		id: number
		title: string
		lessonNumber: number
		completed?: boolean
	}[]
	onGoalSet?: () => void
}) {
	const [goalDate, setGoalDate] = useState<Date | null>(null)
	const [mode, setMode] = useState<Mode>('new')
	const [goalLessonNumber, setGoalLessonNumber] = useState<number | null>(null)

	// review range
	const [startLessonNumber, setStartLessonNumber] = useState<number | null>(
		null
	)
	const [endLessonNumber, setEndLessonNumber] = useState<number | null>(null)

	// load saved single-goal + range
	useEffect(() => {
		try {
			const saved = localStorage.getItem(GOAL_KEY)
			if (saved) {
				const g = JSON.parse(saved)
				setMode(g.mode === 'review' ? 'review' : 'new')
				if (g.date) setGoalDate(new Date(g.date))
				if (g.lessonNumber) setGoalLessonNumber(Number(g.lessonNumber))
			}
			const rawRange = localStorage.getItem(REVIEW_RANGE_KEY)
			if (rawRange) {
				const r = JSON.parse(rawRange)
				if (r.date) setGoalDate(new Date(r.date))
				if (r.startLessonNumber)
					setStartLessonNumber(Number(r.startLessonNumber))
				if (r.endLessonNumber) setEndLessonNumber(Number(r.endLessonNumber))
			}
		} catch {}
	}, [])

	// averages for NEW mode only
	const stats = useMemo(() => {
		if (mode !== 'new' || !goalDate || goalLessonNumber == null) return null
		const today = new Date()
		const daysRemaining = Math.max(
			1,
			Math.floor((+goalDate - +today) / (1000 * 60 * 60 * 24))
		)

		const lessonsToDo = lessons.filter(
			(l) => !l.completed && l.lessonNumber <= goalLessonNumber
		).length
		if (!lessonsToDo)
			return { lessonsToCount: 0, perDay: '0.0', perWeek: '0.0' }

		const perDay = (lessonsToDo / daysRemaining).toFixed(1)
		const perWeek = (lessonsToDo / (daysRemaining / 7)).toFixed(1)
		return { lessonsToCount: lessonsToDo, perDay, perWeek }
	}, [mode, goalDate, goalLessonNumber, lessons])

	function saveReviewRange(startNum: number, endNum: number, date: Date) {
		localStorage.setItem(
			REVIEW_RANGE_KEY,
			JSON.stringify({
				startLessonNumber: startNum,
				endLessonNumber: endNum,
				date: date.toISOString(),
			})
		)
		window.dispatchEvent(new CustomEvent('review-goals-updated'))
	}

	return (
		<div className="flex flex-col lg:flex-row lg:justify-center lg:items-start gap-8 p-6 border rounded-lg">
			<div className="flex flex-col items-center text-center gap-4 lg:w-1/2">
				<h2 className="text-xl font-semibold">Set Your Goal</h2>

				<div className="flex gap-2">
					<Button
						variant={mode === 'new' ? 'primary' : 'primaryOutline'}
						size="sm"
						onClick={() => setMode('new')}
					>
						New Lessons
					</Button>
					<Button
						variant={mode === 'review' ? 'primary' : 'primaryOutline'}
						size="sm"
						onClick={() => setMode('review')}
					>
						Review Lessons
					</Button>
				</div>

				{mode === 'review' ? (
					<div className="flex flex-col items-center gap-2">
						<Select
							value={startLessonNumber?.toString() ?? ''}
							onValueChange={(v) => setStartLessonNumber(Number(v))}
						>
							<SelectTrigger className="w-60">
								Start lesson (review)
							</SelectTrigger>
							<SelectContent>
								{lessons
									.filter((l) => !!l.completed)
									.map((l) => (
										<SelectItem key={l.id} value={String(l.lessonNumber)}>
											{l.title} (#{l.lessonNumber}) ✓
										</SelectItem>
									))}
							</SelectContent>
						</Select>

						<Select
							value={endLessonNumber?.toString() ?? ''}
							onValueChange={(v) => setEndLessonNumber(Number(v))}
						>
							<SelectTrigger className="w-60">
								End lesson (review)
							</SelectTrigger>
							<SelectContent>
								{lessons
									.filter((l) => !!l.completed)
									.map((l) => (
										<SelectItem key={l.id} value={String(l.lessonNumber)}>
											{l.title} (#{l.lessonNumber}) ✓
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>
				) : (
					<Select
						value={goalLessonNumber?.toString() ?? ''}
						onValueChange={(v) => setGoalLessonNumber(Number(v))}
					>
						<SelectTrigger className="w-60">
							Select goal lesson (new)
						</SelectTrigger>
						<SelectContent>
							{lessons.map((l) => (
								<SelectItem key={l.id} value={String(l.lessonNumber)}>
									{l.title} (#{l.lessonNumber}) {l.completed ? '✓' : ''}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				{/* Summaries */}
				{goalDate && mode === 'new' && goalLessonNumber != null && (
					<>
						<p className="text-lg text-muted-foreground">
							Goal: Complete lesson #{goalLessonNumber} by{' '}
							{format(goalDate, 'PPP')}
						</p>
						{stats && (
							<p className="text-md text-muted-foreground">
								{stats.lessonsToCount} new lessons total • avg{' '}
								<strong>{stats.perDay}</strong> /day (
								<strong>{stats.perWeek}</strong> /week)
							</p>
						)}
					</>
				)}

				{goalDate &&
					mode === 'review' &&
					startLessonNumber != null &&
					endLessonNumber != null && (
						<p className="text-lg text-muted-foreground">
							Goal: Review lessons #
							{Math.min(startLessonNumber, endLessonNumber)}–#
							{Math.max(startLessonNumber, endLessonNumber)} by{' '}
							{format(goalDate, 'PPP')}
						</p>
					)}

				<div className="flex gap-3 mt-2">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => {
							if (!goalDate) return
							if (mode === 'review') {
								if (startLessonNumber != null && endLessonNumber != null) {
									const lo = Math.min(startLessonNumber, endLessonNumber)
									const hi = Math.max(startLessonNumber, endLessonNumber)

									// collect completed lessons in that lessonNumber range, in order
									const lessonsInRange = lessons
										.filter(
											(l) =>
												l.completed &&
												l.lessonNumber >= lo &&
												l.lessonNumber <= hi
										)
										.sort((a, b) => a.lessonNumber - b.lessonNumber)
										.map((l) => l.lessonNumber)

									// build and save the per-lesson schedule
									const perLesson = buildPerLessonSchedule(
										lessonsInRange,
										goalDate
									)
									localStorage.setItem(
										REVIEW_RANGE_MAP_KEY,
										JSON.stringify(perLesson)
									)

									// keep the raw range too (nice for summaries)
									localStorage.setItem(
										REVIEW_RANGE_KEY,
										JSON.stringify({
											startLessonNumber: lo,
											endLessonNumber: hi,
											date: goalDate.toISOString(),
										})
									)

									window.dispatchEvent(new CustomEvent('review-goals-updated'))
								}
							} else {
								if (goalLessonNumber != null) {
									// 1) persist the summary object (optional but fine)
									localStorage.setItem(
										GOAL_KEY,
										JSON.stringify({
											lessonNumber: goalLessonNumber,
											date: goalDate.toISOString(),
											mode,
										})
									)

									// 2) compute per-lesson dates for NEW lessons (incomplete up to the goal)
									const lessonsInRange = lessons
										.filter(
											(l) => !l.completed && l.lessonNumber <= goalLessonNumber
										)
										.sort((a, b) => a.lessonNumber - b.lessonNumber)
										.map((l) => l.lessonNumber)

									const perLesson = buildPerLessonSchedule(
										lessonsInRange,
										goalDate
									)
									localStorage.setItem(
										NEW_GOAL_MAP_KEY,
										JSON.stringify(perLesson)
									)

									// 3) notify UI to refresh
									window.dispatchEvent(new CustomEvent(GOALS_EVENT))
								}
							}
							onGoalSet?.()
						}}
					>
						Set Goal
					</Button>

					<Button
						variant="danger"
						size="sm"
						onClick={() => {
							clearAllGoals()
							// reset local UI state
							setGoalDate(null)
							setGoalLessonNumber(null)
							setStartLessonNumber(null)
							setEndLessonNumber(null)
							setMode('new')
						}}
					>
						Clear Goal
					</Button>
				</div>
			</div>

			<div className="flex justify-center lg:justify-start lg:w-1/2">
				<Calendar
					mode="single"
					selected={goalDate ?? undefined}
					onSelect={(date) => setGoalDate(date ?? null)}
					className="shadow-md rounded-lg"
				/>
			</div>
		</div>
	)
}
