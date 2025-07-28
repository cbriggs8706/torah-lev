'use client'

import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { Button } from './ui/button'

function getLessonNumber(title: string): string {
	const match = title.match(/(\d+)/)
	return match ? match[1] : title
}

export function GoalSetter({
	lessons,
}: {
	lessons: { id: number; title: string; completed?: boolean }[]
}) {
	const [goalDate, setGoalDate] = useState<Date | null>(null)
	const [goalLesson, setGoalLesson] = useState<string>('')

	// Load saved goal
	useEffect(() => {
		const saved = localStorage.getItem('goal')
		if (saved) {
			const parsed = JSON.parse(saved)
			setGoalDate(parsed.date ? new Date(parsed.date) : null)
			setGoalLesson(parsed.lesson || '')
		}
	}, [])

	// Save goal to localStorage whenever it changes
	useEffect(() => {
		if (goalLesson && goalDate) {
			localStorage.setItem(
				'goal',
				JSON.stringify({ lesson: goalLesson, date: goalDate.toISOString() })
			)
			window.dispatchEvent(new Event('storage'))
		}
	}, [goalLesson, goalDate])

	// ✅ Calculate average lessons per day/week
	const averages = useMemo(() => {
		if (!goalLesson || !goalDate) return null

		const goalNum = Number(getLessonNumber(goalLesson))
		if (isNaN(goalNum)) return null

		const today = new Date()
		const daysRemaining = Math.max(
			1,
			Math.floor((goalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
		)

		// Only count incomplete lessons up to the goal
		const lessonsToDo = lessons.filter(
			(l) => !l.completed && Number(getLessonNumber(l.title)) <= goalNum
		).length

		if (lessonsToDo === 0) return null

		const perDay = (lessonsToDo / daysRemaining).toFixed(1)
		const perWeek = (lessonsToDo / (daysRemaining / 7)).toFixed(1)

		return { perDay, perWeek }
	}, [goalLesson, goalDate, lessons])

	// ✅ Clear goal
	function clearGoal() {
		localStorage.removeItem('goal')
		setGoalDate(null)
		setGoalLesson('')
		window.dispatchEvent(new Event('storage'))
	}

	return (
		<div className="flex flex-col lg:flex-row lg:justify-center lg:items-start gap-8 p-6 border rounded-lg">
			{/* Left Side - Goal Settings */}
			<div className="flex flex-col items-center text-center gap-4 lg:w-1/2">
				<h2 className="text-xl font-semibold">Set Your Goal</h2>

				<Select value={goalLesson} onValueChange={setGoalLesson}>
					<SelectTrigger className="w-60">Select goal lesson</SelectTrigger>
					<SelectContent>
						{lessons.map((l) => (
							<SelectItem key={l.id} value={l.title}>
								{l.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{goalDate && goalLesson && (
					<>
						<p className="text-lg text-muted-foreground">
							Goal: Complete Lesson {getLessonNumber(goalLesson)} by{' '}
							{format(goalDate, 'PPP')}
						</p>

						{averages && (
							<p className="text-md text-muted-foreground">
								This goal will average <strong>{averages.perDay}</strong>{' '}
								lessons per day (<strong>{averages.perWeek}</strong> per week).
							</p>
						)}
						<p className="text-md text-muted-foreground">
							This goal will be set on this device only. If you login with a
							different browser, you will need to set it again.
						</p>
					</>
				)}
				<div className="flex gap-3 mt-2">
					<Button
						variant="secondary"
						size="sm"
						onClick={() => {
							if (goalLesson && goalDate) {
								localStorage.setItem(
									'goal',
									JSON.stringify({
										lesson: goalLesson,
										date: goalDate.toISOString(),
									})
								)
								window.dispatchEvent(new Event('storage'))
							}
						}}
					>
						Set Goal
					</Button>

					<Button variant="danger" size="sm" onClick={clearGoal}>
						Clear Goal
					</Button>
				</div>
			</div>

			{/* Right Side - Calendar */}
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
