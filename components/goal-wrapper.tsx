'use client'

import { useEffect, useState } from 'react'
import { Unit } from '@/app/(main)/learn/unit'
import { GoalSetter } from './goal-setter'
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

function extractLessonNumber(title: string): number {
	if (title.startsWith('AwB Classroom Lesson')) return NaN // ✅ ignore classroom lessons
	const match = title.match(/AwB (\d+)/)
	return match ? Number(match[1]) : NaN
}

function getLessonSchedule(
	lessons: { id: number; title: string; completed?: boolean }[],
	goalLessonTitle: string,
	goalDate: Date
) {
	const goalLessonNumber = extractLessonNumber(goalLessonTitle)

	if (isNaN(goalLessonNumber)) return {}

	// Only consider lessons up to the goal lesson number
	const filteredLessons = lessons
		.filter((l) => extractLessonNumber(l.title) <= goalLessonNumber)
		.filter((l) => !l.completed) // only incomplete

	if (filteredLessons.length === 0) return {}

	const totalDays = Math.max(
		1,
		Math.floor((goalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
	)

	const daysPerLesson = totalDays / filteredLessons.length

	let acc: Record<number, Date> = {}
	filteredLessons.forEach((lesson, index) => {
		const date = new Date()
		date.setDate(date.getDate() + Math.round(daysPerLesson * (index + 1)))
		acc[lesson.id] = date
	})

	return acc
}

export function GoalWrapper({ units }: { units: any[] }) {
	const [schedule, setSchedule] = useState<Record<number, Date>>({})
	const [open, setOpen] = useState(false)

	useEffect(() => {
		function updateSchedule() {
			const saved = localStorage.getItem('goal')

			if (!saved) {
				setSchedule({}) // ✅ clear all scheduled dates
				return
			}

			const parsed = JSON.parse(saved)
			if (!parsed.date || !parsed.lesson) {
				setSchedule({})
				return
			}

			const goalDate = new Date(parsed.date)
			const goalLessonTitle = parsed.lesson

			const allLessons = units.flatMap((u) => u.lessons)
			const newSchedule = getLessonSchedule(
				allLessons,
				goalLessonTitle,
				goalDate
			)

			setSchedule(newSchedule)
		}

		// Run initially
		updateSchedule()

		// Listen for goal changes
		window.addEventListener('storage', updateSchedule)
		return () => window.removeEventListener('storage', updateSchedule)
	}, [units])

	return (
		<>
			<Collapsible open={open} onOpenChange={setOpen} className="mb-6">
				<CollapsibleTrigger asChild>
					<Button className="w-full flex justify-between items-center">
						{open ? 'Hide Goal Picker' : 'Set Goal for Lessons'}
						{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</Button>
				</CollapsibleTrigger>

				<CollapsibleContent className="mt-4">
					<GoalSetter lessons={units.flatMap((u) => u.lessons)} />
				</CollapsibleContent>
			</Collapsible>

			{units.map((unit) => (
				<Unit
					key={unit.id}
					id={unit.id}
					order={unit.order}
					description={unit.description}
					title={unit.title}
					lessons={unit.lessons}
					activeLesson={unit.activeLesson}
					activeLessonPercentage={unit.activeLessonPercentage}
					schedule={schedule}
				/>
			))}
		</>
	)
}
