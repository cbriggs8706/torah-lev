'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, LockKeyhole, Star } from 'lucide-react'
import { CircularProgressbarWithChildren } from 'react-circular-progressbar'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
	getSidebarLabel,
	normalizeSidebarLocale,
} from '@/lib/sidebar-translations'
import type { SidebarLocale } from '@/types/sidebar'

import 'react-circular-progressbar/dist/styles.css'

type LessonScript = {
	id: number | string
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

function getPartSuffix(script: LessonScript) {
	if (script.part === 2) return ' - Part B'
	if (script.part === 3) return ' - Review'
	return ''
}

export default function LessonScriptList({
	lessonScripts,
	isFriend,
	currentLesson,
	lessonPercentage,
}: {
	lessonScripts: LessonScript[]
	isFriend: boolean
	currentLesson: number | null
	lessonPercentage: number
}) {
	const pathname = usePathname()
	const router = useRouter()
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
		en: 'View Video',
		es: 'Ver video',
		he: 'צפה בסרטון',
		el: 'Προβολή βίντεο',
	}

	const startLabelByLocale: Record<SidebarLocale, string> = {
		en: 'Start',
		es: 'Empezar',
		he: 'החל',
		el: 'Έναρξη',
	}

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

	const getLessonRangeLabel = useCallback(
		(lessonId: number) => {
			const start = Math.floor((lessonId - 1) / 10) * 10 + 1
			const end = start + 9
			const lessonScriptsLabel = getSidebarLabel(
				resolvedLocale,
				'nav.introduction'
			)
			return `${lessonScriptsLabel} ${start}-${end}`
		},
		[resolvedLocale]
	)

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

	// Sort by the visible lesson number rather than the database lesson id.
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
			if (existing) existing.push(script)
			else groupedMap.set(label, [script])
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
		const currentScript = lessonScripts.find(
			(script) => script.lessonId === currentLesson
		)
		return currentScript ? getDisplayedLessonNumber(currentScript) : null
	}, [currentLesson, lessonScripts])

	const openLessonVideo = useCallback(
		(scriptId: number | string) => {
			router.push(
				`/he/videos/${scriptId}?returnTo=${encodeURIComponent('/he/videos')}`
			)
		},
		[router]
	)

	return (
		<div className="space-y-6" dir="rtl">
			{groupedLessonScripts.map((group) => (
				<section key={group.label}>
					<h2 className="my-6 rounded-md bg-sky-600 pr-4 text-right text-3xl font-bold text-white">
						{group.label}
					</h2>

					<div className="my-12 flex flex-wrap items-stretch justify-center gap-4">
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
									onClick={() => {
										if (!locked) openLessonVideo(script.id)
									}}
									className={cn(
										'cursor-pointer relative flex flex-col items-center transition-transform active:scale-95',
										locked && 'cursor-not-allowed opacity-50'
									)}
								>
									{isCurrent && (
										<div
											className={cn(
												'absolute -top-6 inset-x-0 mx-auto w-fit rounded-xl border-2 bg-white px-3 py-2.5 text-sky-600 animate-bounce z-20',
												resolvedLocale === 'he'
													? 'font-cardo text-3xl uppercase tracking-wide'
													: 'font-nunito text-md font-bold uppercase tracking-wide'
											)}
										>
											{startLabelByLocale[resolvedLocale]}
											<div className="absolute left-1/2 -bottom-2 h-0 w-0 -translate-x-1/2 transform border-x-8 border-x-transparent border-t-8" />
										</div>
									)}

									<div
										className={cn(
											'flex flex-col rounded-xl border border-gray-00 w-[120px] min-h-[220px] transition hover:shadow-md text-center overflow-hidden',
											isCurrent ? 'bg-sky-100' : 'bg-white'
										)}
									>
										<div className="flex flex-col items-center flex-grow p-4">
											<div className="flex flex-col items-center">
												{isCurrent ? (
													<CircularProgressbarWithChildren
														value={Number.isNaN(lessonPercentage) ? 0 : lessonPercentage}
														styles={{
															path: { stroke: '#16a34a' },
															trail: { stroke: '#e5e7eb' },
														}}
													>
														<Button
															size="rounded"
															variant="secondary"
															className="h-[70px] w-[70px] border-b-8"
														>
															<Icon className="h-10 w-10 text-primary-foreground fill-white" />
														</Button>
													</CircularProgressbarWithChildren>
												) : (
													<Button
														size="rounded"
														variant={isCompleted ? 'secondary' : 'locked'}
														className="h-[70px] w-[70px] border-b-8"
													>
														<Icon
															className={cn(
																'h-10 w-10',
																!isCurrent && !isCompleted
																	? 'stroke-neutral-400 stroke-[2.5]'
																	: 'fill-primary-foreground text-primary-foreground',
																isCompleted && 'fill-none stroke-[4]'
															)}
														/>
													</Button>
												)}
											</div>

											<div
												dir="rtl"
												className="mt-1 flex items-baseline gap-1 text-gray-800"
											>
												<span className="text-xl font-cardo">
													שיעור
												</span>
												<span className="text-md font-nunito font-semibold">
													{displayedLessonNumber ?? '—'}
												</span>
											</div>

											<span
												className="text-xs font-nunito font-semibold mt-1 leading-tight"
												dir="ltr"
											>
												{getDisplayTitle(script)}
												{getPartSuffix(script)}
											</span>
										</div>

										<div
											className={cn(
												'w-full text-white text-xs font-semibold text-center py-2 rounded-b-xl',
												isCurrent
													? 'bg-sky-600'
													: isCompleted
														? 'bg-emerald-600'
														: 'bg-gray-400'
											)}
										>
											{isCompleted
												? reviewLabelByLocale[resolvedLocale]
												: isCurrent
													? actionLabelByLocale[resolvedLocale]
													: upcomingLabelByLocale[resolvedLocale]}
										</div>
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
