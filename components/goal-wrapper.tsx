'use client'

import { useEffect, useState } from 'react'
import { lessons, units as unitsSchema } from '@/db/schema'
import { Unit } from '@/app/(main)/learn/unit'
import { HebrewUnit } from '@/app/(main)/he/learn/unit'
import { EnglishUnit } from '@/app/(main)/en/learn/unit'
import { GoalSetter } from './goal-setter'
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

/* -----------------------------------------------------------
   Helper: extract numeric lesson number from title
----------------------------------------------------------- */
function extractLessonNumber(title: string): number {
	if (title.startsWith('AwB Classroom Lesson')) return NaN // ignore classroom lessons
	const match = title.match(/AwB (\d+)/)
	return match ? Number(match[1]) : NaN
}

/* -----------------------------------------------------------
   Helper: compute schedule based on goal date and lesson title
----------------------------------------------------------- */
function getLessonSchedule(
	lessons: { id: number; title: string; completed?: boolean }[],
	goalLessonTitle: string,
	goalDate: Date
) {
	const goalLessonNumber = extractLessonNumber(goalLessonTitle)
	if (isNaN(goalLessonNumber)) return {}

	const filteredLessons = lessons
		.filter((l) => extractLessonNumber(l.title) <= goalLessonNumber)
		.filter((l) => !l.completed)

	if (filteredLessons.length === 0) return {}

	const totalDays = Math.max(
		1,
		Math.floor((goalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
	)
	const daysPerLesson = totalDays / filteredLessons.length

	const acc: Record<number, Date> = {}
	filteredLessons.forEach((lesson, index) => {
		const date = new Date()
		date.setDate(date.getDate() + Math.round(daysPerLesson * (index + 1)))
		acc[lesson.id] = date
	})
	return acc
}

/* -----------------------------------------------------------
   Component: GoalWrapper
   Reusable across languages — specify `lang` to change layout
----------------------------------------------------------- */
export function GoalWrapper({
	units,
	courseProgress,
	lessonPercentage,
	lang = 'en', // default
}: {
	units: any[]
	courseProgress: any
	lessonPercentage: any
	lang?: 'en' | 'he' | 'es' | 'el'
}) {
	const [schedule, setSchedule] = useState<Record<number, Date>>({})
	const [open, setOpen] = useState(false)

	/* -----------------------------------------------------------
	   Load and update goal-based lesson schedule from localStorage
	----------------------------------------------------------- */
	useEffect(() => {
		function updateSchedule() {
			const saved = localStorage.getItem('goal')
			if (!saved) {
				setSchedule({})
				return
			}

			try {
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
			} catch {
				setSchedule({})
			}
		}

		updateSchedule()
		window.addEventListener('storage', updateSchedule)
		return () => window.removeEventListener('storage', updateSchedule)
	}, [units])

	/* -----------------------------------------------------------
	   Choose Unit component based on language
	----------------------------------------------------------- */
	const UnitComponent =
		lang === 'he'
			? HebrewUnit
			: lang === 'es'
			? Unit // placeholder: you can create a SpanishUnit later
			: lang === 'el'
			? Unit // placeholder for Greek
			: EnglishUnit // default English layout

	/* -----------------------------------------------------------
	   Render
	----------------------------------------------------------- */
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
					<GoalSetter
						lessons={units.flatMap((u) => u.lessons)}
						onGoalSet={() => setOpen(false)}
					/>
				</CollapsibleContent>
			</Collapsible>

			{courseProgress &&
				units.map((unit) => (
					<UnitComponent
						key={unit.id}
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
						schedule={schedule}
					/>
				))}
		</>
	)
}
