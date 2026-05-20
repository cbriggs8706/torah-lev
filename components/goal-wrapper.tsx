'use client'

import { useEffect, useState } from 'react'
import { lessons, units as unitsSchema } from '@/db/schema'
import { Unit } from '@/app/(main)/learnssss/unit'
import { HebrewUnit } from '@/app/(main)/he/learn/unit'
import { GoalSetter } from './goal-setter'
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { normalizeSidebarLocale } from '@/lib/sidebar-translations'
import type { SidebarLocale } from '@/types/sidebar'

const START_LABEL_BY_LOCALE: Record<SidebarLocale, string> = {
	en: 'Start',
	es: 'Empezar',
	he: 'החל',
	el: 'Έναρξη',
}

/* -----------------------------------------------------------
   Helper: compute schedule based on goal date and lesson number
----------------------------------------------------------- */
function getLessonSchedule(
	lessons: {
		id: number
		title: string
		lessonNumber?: number | null
		completed?: boolean
	}[],
	goalLessonNumber: number,
	goalDate: Date
) {
	if (!Number.isFinite(goalLessonNumber)) return {}

	const filteredLessons = lessons
		.filter((l) => Number(l.lessonNumber) <= goalLessonNumber)
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
	startLabel,
	startLocale,
}: {
	units: any[]
	courseProgress: any
	lessonPercentage: any
	lang?: 'en' | 'he' | 'es' | 'el'
	startLabel?: string
	startLocale?: SidebarLocale
}) {
	const [schedule, setSchedule] = useState<Record<number, Date>>({})
	const [open, setOpen] = useState(false)
	const [liveStartLabel, setLiveStartLabel] = useState(startLabel)
	const [liveStartLocale, setLiveStartLocale] = useState<SidebarLocale>(
		startLocale ?? 'en'
	)

	useEffect(() => {
		setLiveStartLabel(startLabel)
		if (startLocale) {
			setLiveStartLocale(startLocale)
		}
	}, [startLabel, startLocale])

	useEffect(() => {
		if (lang !== 'he') return

		const syncStartLabel = (nextLocale?: string | null) => {
			const resolvedLocale = normalizeSidebarLocale(nextLocale)
			setLiveStartLabel(START_LABEL_BY_LOCALE[resolvedLocale])
			setLiveStartLocale(resolvedLocale)
		}

		syncStartLabel(localStorage.getItem('sidebarLocale'))

		const handleLocaleChange = (event: Event) => {
			const locale = (event as CustomEvent<{ locale?: string }>).detail?.locale
			syncStartLabel(locale)
		}

		window.addEventListener('sidebar-locale-changed', handleLocaleChange)
		return () =>
			window.removeEventListener('sidebar-locale-changed', handleLocaleChange)
	}, [lang])

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
				const savedGoalLessonNumber = Number(
					parsed.lessonNumber ?? parsed.lesson ?? NaN
				)

				if (!parsed.date || !Number.isFinite(savedGoalLessonNumber)) {
					setSchedule({})
					return
				}

				const goalDate = new Date(parsed.date)
				const allLessons = units.flatMap((u) => u.lessons)
				const newSchedule = getLessonSchedule(
					allLessons,
					savedGoalLessonNumber,
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
			: Unit

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
							startLabel={liveStartLabel}
							startLocale={liveStartLocale}
						/>
					))}
		</>
	)
}
