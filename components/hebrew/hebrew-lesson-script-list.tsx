'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, LockKeyhole, NotebookText, Star } from 'lucide-react'
import {
	getSidebarLabel,
	normalizeSidebarLocale,
} from '@/lib/sidebar-translations'
import type { SidebarLocale } from '@/types/sidebar'

type LessonScript = {
	id: number | string
	// lessonScriptId: number | null
	content: string | null
	contentPlain: string | null
	category?: string | null
	audioSrc?: string | null
	title: string
	lessonId: number | null
	lessonNumber?: string | number | null
	courseId: number[] | null
	part: number | null
}

function getDisplayedLessonNumber(script: LessonScript): number | null {
	const lessonNumber = Number(script.lessonNumber)
	if (Number.isFinite(lessonNumber)) return lessonNumber
	return typeof script.lessonId === 'number' ? script.lessonId : null
}

function getDisplayTitle(script: LessonScript): string {
	return script.title
}

export default function LessonScriptList({
	lessonScripts,
	isFriend,
	currentLesson,
}: {
	lessonScripts: LessonScript[]
	isFriend: boolean
	currentLesson: number | null
}) {
	const pathname = usePathname()
	const [manualLocale, setManualLocale] = useState<SidebarLocale | null>(null)
	const lessonNum = (n?: number | null) =>
		typeof n === 'number' ? n : Number.POSITIVE_INFINITY

	const inferredLocale: SidebarLocale = pathname.startsWith('/es/')
		? 'es'
		: pathname.startsWith('/el/')
			? 'el'
			: pathname.startsWith('/he/')
				? 'he'
				: 'en'

	const resolvedLocale = manualLocale ?? inferredLocale
	const actionLabelByLocale: Record<SidebarLocale, string> = {
		en: 'View Lesson Script',
		es: 'Ver guion de lección',
		he: 'קרא',
		el: 'Προβολή σεναρίου μαθήματος',
	}

	const getLessonRangeLabel = useCallback((lessonId: number) => {
		const start = Math.floor((lessonId - 1) / 10) * 10 + 1
		const end = start + 9
		const lessonScriptsLabel = getSidebarLabel(resolvedLocale, 'nav.lessonScripts')
		return `${lessonScriptsLabel} ${start}-${end}`
	}, [resolvedLocale])

	const lessonLabelByLocale: Record<SidebarLocale, string> = {
		en: 'Lesson',
		es: 'Leccion',
		he: 'שיעור',
		el: 'Μαθημα',
	}

	const reviewLabelByLocale: Record<SidebarLocale, string> = {
		en: 'Review Lesson',
		es: 'Repasar leccion',
		he: 'חזור על השיעור',
		el: 'Επαναληψη μαθηματος',
	}

	const upcomingLabelByLocale: Record<SidebarLocale, string> = {
		en: 'Upcoming Lesson',
		es: 'Proxima leccion',
		he: 'שיעור בהמשך',
		el: 'Επομενο μαθημα',
	}

	useEffect(() => {
		const syncLocale = (nextLocale?: string | null) => {
			setManualLocale(nextLocale ? normalizeSidebarLocale(nextLocale) : null)
		}

		syncLocale(localStorage.getItem('sidebarLocale'))

		const handleLocaleChange = (event: Event) => {
			const locale = (event as CustomEvent<{ locale?: string }>).detail?.locale
			syncLocale(locale)
		}

		window.addEventListener('sidebar-locale-changed', handleLocaleChange)
		return () =>
			window.removeEventListener('sidebar-locale-changed', handleLocaleChange)
	}, [])

	// Sort by the visible AwB lesson number rather than the database lesson id.
	const sortedLessonScripts = useMemo(
		() =>
			[...lessonScripts].sort(
				(a, b) =>
					lessonNum(getDisplayedLessonNumber(a)) -
						lessonNum(getDisplayedLessonNumber(b)) ||
					(a.part ?? 1) - (b.part ?? 1)
			),
		[lessonScripts]
	)

	const groupedLessonScripts = useMemo(() => {
		const groups: Array<{
			label: string
			scripts: LessonScript[]
		}> = []
		const groupedMap = new Map<string, LessonScript[]>()
		const ungrouped: LessonScript[] = []

		for (const script of sortedLessonScripts) {
			const displayedLessonNumber = getDisplayedLessonNumber(script)
			if (typeof displayedLessonNumber !== 'number') {
				ungrouped.push(script)
				continue
			}

			const label = getLessonRangeLabel(displayedLessonNumber)
			const existing = groupedMap.get(label)
			if (existing) {
				existing.push(script)
			} else {
				groupedMap.set(label, [script])
			}
		}

		for (const [label, scripts] of groupedMap) {
			groups.push({ label, scripts })
		}

		if (ungrouped.length > 0) {
			groups.push({
				label:
					resolvedLocale === 'he'
						? 'שיעורים אחרים'
						: resolvedLocale === 'es'
							? 'Otras lecciones'
							: resolvedLocale === 'el'
								? 'Άλλα μαθήματα'
								: 'Other Lessons',
				scripts: ungrouped,
			})
		}

		return groups
	}, [getLessonRangeLabel, resolvedLocale, sortedLessonScripts])

	const currentDisplayedLessonNumber = useMemo(() => {
		const currentScript = lessonScripts.find((script) => script.lessonId === currentLesson)
		return currentScript ? getDisplayedLessonNumber(currentScript) : null
	}, [currentLesson, lessonScripts])

	return (
		<div className="space-y-6" dir="rtl">
			{groupedLessonScripts.map((group) => (
				<section key={group.label}>
					<h2 className="my-6 rounded-md bg-sky-600 pr-4 text-right text-3xl font-bold text-white">
						{group.label}
					</h2>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
						{group.scripts.map((script) => {
							const displayedLessonNumber = getDisplayedLessonNumber(script)
							const isCurrent =
								currentDisplayedLessonNumber !== null &&
								displayedLessonNumber === currentDisplayedLessonNumber
							const isCompleted =
								currentDisplayedLessonNumber !== null &&
								typeof displayedLessonNumber === 'number' &&
								displayedLessonNumber < currentDisplayedLessonNumber
							const locked =
								!isFriend &&
								currentDisplayedLessonNumber !== null &&
								typeof displayedLessonNumber === 'number' &&
								displayedLessonNumber > currentDisplayedLessonNumber
							const Icon = isCurrent ? Star : isCompleted ? Check : LockKeyhole

							return (
								<div
									key={script.id}
									className={`flex min-h-[236px] flex-col overflow-hidden rounded-xl border text-center transition hover:shadow-md ${
										isCurrent
											? 'border-sky-200 bg-sky-100'
											: isCompleted
												? 'border-sky-100 bg-white'
												: 'border-gray-200 bg-white'
									} ${
										locked ? 'cursor-not-allowed opacity-50' : ''
									}`}
								>
									<div className="flex flex-1 flex-col items-center p-4">
										<div
											className={`flex h-[70px] w-[70px] items-center justify-center rounded-full border-b-8 ${
												isCurrent
													? 'bg-sky-600 text-white'
													: isCompleted
														? 'bg-emerald-500 text-white'
														: 'bg-gray-200 text-gray-400'
											}`}
										>
											<Icon
												className={`h-9 w-9 ${
													isCompleted && !isCurrent
														? 'fill-none stroke-[3.5]'
														: isCurrent
															? 'fill-white'
															: 'stroke-[2.5]'
												}`}
											/>
										</div>

										<div className="mt-3 flex items-baseline gap-1 text-gray-800">
											<span
												className={
													resolvedLocale === 'he'
														? 'text-xl font-cardo'
														: 'text-lg font-semibold'
												}
											>
												{lessonLabelByLocale[resolvedLocale]}
											</span>
											<span className="text-base font-semibold">
												{displayedLessonNumber ?? '—'}
											</span>
										</div>

										<h3
											className="mt-2 flex-1 text-xs font-semibold leading-tight"
											dir="ltr"
										>
											{getDisplayTitle(script)}
											{script.part === 2 ? ' - Part B' : ''}
										</h3>
									</div>

									<div
										className={`px-3 py-3 text-center text-xs font-semibold text-white ${
											isCurrent
												? 'bg-sky-600'
												: isCompleted
													? 'bg-emerald-600'
													: 'bg-gray-400'
										}`}
									>
										<Link
											href={`/he/lesson-scripts/${script.id}`}
											scroll
											className={`${locked ? 'pointer-events-none' : ''} inline-flex items-center gap-2`}
										>
											<NotebookText className="h-4 w-4" />
											<span>
												{isCompleted
													? reviewLabelByLocale[resolvedLocale]
													: isCurrent
														? actionLabelByLocale[resolvedLocale]
														: upcomingLabelByLocale[resolvedLocale]}
											</span>
										</Link>
									</div>
								</div>
							)
						})}
					</div>
				</section>
			))}
		</div>
	)
}
