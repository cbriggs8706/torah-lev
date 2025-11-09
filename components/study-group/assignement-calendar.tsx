'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase-client'
import { HDate, HebrewCalendar } from '@hebcal/core'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'

const daysOfWeekHebrew = [
	'יוֹם רִאשׁוֹן',
	'יוֹם שֵׁנִי',
	'יוֹם שְׁלִישִׁי',
	'יוֹם רְבִיעִי',
	'יוֹם חֲמִישִׁי',
	'יוֹם שִׁשִּׁי',
	'שַׁבָּת',
]

// Hebrew month names (can use HDate.hebrewMonthName() but we’ll localize here for safety)
const hebrewMonths = [
	'נִיסָן', // 1
	'אִיָּר', // 2
	'סִיוָן', // 3
	'תַּמּוּז', // 4
	'אָב', // 5
	'אֱלוּל', // 6
	'תִּשְׁרֵי', // 7
	'חֶשְׁוָן', // 8
	'כִּסְלֵו', // 9
	'טֵבֵת', // 10
	'שְׁבָט', // 11
	'אֲדָר א׳', // 12 (Adar I, used in leap years)
	'אֲדָר ב׳', // 13 (Adar II)
]

// Pastel color palette for group consistency
const colorPalette = [
	'bg-sky-200 text-sky-900',
	'bg-amber-200 text-amber-900',
	'bg-green-200 text-green-900',
	'bg-pink-200 text-pink-900',
	'bg-indigo-200 text-indigo-900',
	'bg-rose-200 text-rose-900',
]

const hebrewNumeralsMap: Record<number, string> = {
	400: 'ת',
	300: 'ש',
	200: 'ר',
	100: 'ק',
	90: 'צ',
	80: 'פ',
	70: 'ע',
	// … and so on
}

function toHebrewYearLetters(year: number): string {
	// subtract 5000 if you want the thousands omitted (common modern style)
	const y = year - 5000
	let remaining = y
	let result = ''
	const values = Object.keys(hebrewNumeralsMap)
		.map((n) => parseInt(n))
		.sort((a, b) => b - a)
	for (const val of values) {
		while (remaining >= val) {
			result += hebrewNumeralsMap[val]
			remaining -= val
		}
	}
	// add gershayim (״) before the last letter
	if (result.length > 1) {
		result = result.slice(0, -1) + '״' + result.slice(-1)
	}
	return result
}

// usage example:
const hebYearLetters = toHebrewYearLetters(5786) // e.g., "תשפ״ו"

function Portal({ children }: { children: React.ReactNode }) {
	if (typeof document === 'undefined') return null
	const portalRoot =
		document.getElementById('portal-root') ||
		(() => {
			const el = document.createElement('div')
			el.id = 'portal-root'
			document.body.appendChild(el)
			return el
		})()
	return createPortal(children, portalRoot)
}

export default function StudyGroupAssignmentsCalendarHebrew({
	studyGroups,
}: {
	studyGroups: any[]
}) {
	const [assignments, setAssignments] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [hebrewMonth, setHebrewMonth] = useState<number>(new HDate().getMonth())
	const [hebrewYear, setHebrewYear] = useState<number>(
		new HDate().getFullYear()
	)
	const [groupColors, setGroupColors] = useState<Record<string, string>>(() => {
		if (typeof window !== 'undefined') {
			return JSON.parse(localStorage.getItem('groupColors') || '{}')
		}
		return {}
	})
	const [openColorPicker, setOpenColorPicker] = useState<string | null>(null)
	const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
	const [currentWeekStart, setCurrentWeekStart] = useState<HDate | null>(null)

	const todayHebrew = new HDate()
	const activeStudyGroups = studyGroups.filter((g) => g.current)
	const router = useRouter()

	// ✅ Preload missing group colors with defaults and persist them
	useEffect(() => {
		if (!activeStudyGroups?.length) return

		const updatedColors = { ...groupColors }
		let hasNew = false

		activeStudyGroups.forEach((g, i) => {
			if (!updatedColors[g.id]) {
				updatedColors[g.id] = colorPalette[i % colorPalette.length]
				hasNew = true
			}
		})

		if (hasNew) {
			setGroupColors(updatedColors)
			localStorage.setItem('groupColors', JSON.stringify(updatedColors))
		}
	}, [activeStudyGroups])

	// Load study group data
	useEffect(() => {
		async function loadAssignments() {
			const allAssignments: any[] = []

			for (const group of studyGroups) {
				const { data, error } = await supabase
					.from('study_group_schedule')
					.select('*, study_group_schedule_lessons(lesson_id, lesson_title)')
					.eq('study_group_id', group.id)

				if (error) {
					console.error('Error fetching group schedule:', error)
					continue
				}

				if (data) {
					data.forEach((session) => {
						allAssignments.push({
							groupId: group.id,
							groupName: group.name,
							date: new Date(session.class_date),
							lessons: session.study_group_schedule_lessons || [],
							homeworkCount: (session.homework_links_json || []).length, // ✅ add this line
						})
					})
				}
			}

			setAssignments(allAssignments)
			setLoading(false)
		}

		loadAssignments()
	}, [studyGroups])

	// Build Hebrew month days
	const start = new HDate(1, hebrewMonth, hebrewYear)
	const end = new HDate(start.daysInMonth(), hebrewMonth, hebrewYear)

	const monthDays: any[] = []
	for (let d = 1; d <= end.getDate(); d++) {
		const hDate = new HDate(d, hebrewMonth, hebrewYear)
		const gDate = hDate.greg()
		const weekday = hDate.getDay()
		const dayAssignments = assignments.filter((a) => {
			const aHebrew = new HDate(a.date)
			return (
				aHebrew.getDate() === d &&
				aHebrew.getMonth() === hebrewMonth &&
				aHebrew.getFullYear() === hebrewYear
			)
		})
		monthDays.push({
			d,
			hDate,
			gDate,
			weekday,
			assignments: dayAssignments,
			isToday:
				hDate.getDate() === todayHebrew.getDate() &&
				hDate.getMonth() === todayHebrew.getMonth() &&
				hDate.getFullYear() === todayHebrew.getFullYear(),
		})
	}

	// Prepare grid (weeks)
	const weeks: any[][] = []
	let week: any[] = []
	const firstWeekday = monthDays[0].weekday

	for (let i = 0; i < firstWeekday; i++) week.push(null)
	for (const day of monthDays) {
		week.push(day)
		if (week.length === 7) {
			weeks.push(week)
			week = []
		}
	}
	if (week.length > 0) {
		while (week.length < 7) week.push(null)
		weeks.push(week)
	}

	// Assign group colors
	const groupColorMap = activeStudyGroups.reduce((acc, g, i) => {
		acc[g.id] = groupColors[g.id] || colorPalette[i % colorPalette.length]
		return acc
	}, {} as Record<number, string>)

	// 🔹 Go to previous Hebrew month
	const goToPreviousMonth = () => {
		const current = new HDate(1, hebrewMonth, hebrewYear)
		const prev = new HDate(current.abs() - 1) // move one day back
		setHebrewMonth(prev.getMonth())
		setHebrewYear(prev.getFullYear())
	}

	// 🔹 Go to next Hebrew month
	const goToNextMonth = () => {
		const current = new HDate(1, hebrewMonth, hebrewYear)
		const next = new HDate(current.abs() + current.daysInMonth()) // jump to next month’s 1st day
		setHebrewMonth(next.getMonth())
		setHebrewYear(next.getFullYear())
	}

	if (loading)
		return (
			<div className="p-6 text-center text-gray-500 font-serif">
				Loading Hebrew month calendar…
			</div>
		)

	return (
		<div className="mt-8 bg-white rounded-2xl shadow overflow-hidden font-serif">
			{/* Header */}
			<div className="bg-gradient-to-r from-sky-700 to-sky-500 text-white text-center pt-4 pb-6 relative">
				{/* ← / → Buttons */}
				{viewMode === 'month' ? (
					<>
						<button
							onClick={goToPreviousMonth}
							className="absolute left-4 top-1/2 -translate-y-1/2 bg-sky-600 hover:bg-sky-700 rounded-full w-8 h-8 flex items-center justify-center text-white shadow-md transition"
						>
							←
						</button>
						<button
							onClick={goToNextMonth}
							className="absolute right-4 top-1/2 -translate-y-1/2 bg-sky-600 hover:bg-sky-700 rounded-full w-8 h-8 flex items-center justify-center text-white shadow-md transition"
						>
							→
						</button>
					</>
				) : (
					<>
						<button
							onClick={() =>
								setCurrentWeekStart(new HDate(currentWeekStart!.abs() - 7))
							}
							className="absolute left-4 top-1/2 -translate-y-1/2 bg-sky-600 hover:bg-sky-700 rounded-full w-8 h-8 flex items-center justify-center text-white shadow-md transition"
						>
							←
						</button>
						<button
							onClick={() =>
								setCurrentWeekStart(new HDate(currentWeekStart!.abs() + 7))
							}
							className="absolute right-4 top-1/2 -translate-y-1/2 bg-sky-600 hover:bg-sky-700 rounded-full w-8 h-8 flex items-center justify-center text-white shadow-md transition"
						>
							→
						</button>
					</>
				)}

				{/* Title */}
				<h2 className="text-4xl font-serif mb-3">
					לּוּחַ הַמַּשִׁימוֹת — {hebrewMonths[hebrewMonth - 1]}{' '}
					{/* {toHebrewYearLetters(hebrewYear)} */}
				</h2>

				{/* View toggle row — moved below header */}
				<div className="flex justify-center gap-3 mt-2">
					<button
						onClick={() => setViewMode('month')}
						className={clsx(
							'px-4 py-1 rounded-full text-2xl font-serif transition',
							viewMode === 'month'
								? 'bg-white text-sky-700 shadow'
								: 'bg-sky-600 text-white hover:bg-sky-500'
						)}
					>
						חודש
					</button>
					<button
						onClick={() => {
							setViewMode('week')
							setCurrentWeekStart(
								new HDate(todayHebrew.abs() - todayHebrew.getDay())
							)
						}}
						className={clsx(
							'px-4 py-1 rounded-full text-2xl font-serif transition',
							viewMode === 'week'
								? 'bg-white text-sky-700 shadow'
								: 'bg-sky-600 text-white hover:bg-sky-500'
						)}
					>
						שבוע
					</button>
				</div>
			</div>

			{/* Weekday headers */}
			<div dir="rtl" className="grid grid-cols-7 border-b border-gray-200">
				{daysOfWeekHebrew.map((name, i) => (
					<div
						key={i}
						className="p-2 text-center text-lg font-cardo font-bold bg-sky-50 border-l border-gray-200"
					>
						{name}
					</div>
				))}
			</div>

			{/* Calendar grid */}
			{viewMode === 'month' ? (
				<div dir="rtl" className="grid grid-cols-7">
					{weeks.map((week, wi) =>
						week.map((day, di) => (
							<div
								key={`${wi}-${di}`}
								className={clsx(
									'border-l border-b border-gray-200 h-36 p-1 flex flex-col justify-between relative',
									!day && 'bg-gray-50',
									day?.isToday && 'bg-yellow-100 border-yellow-400'
								)}
							>
								{day && (
									<>
										{/* Hebrew + Gregorian dates */}
										<div className="flex justify-between items-center mb-1">
											<span className="text-sm font-bold">
												{day.d.toString()}
											</span>
											<span className="text-[10px] italic text-gray-500">
												{day.gDate.toLocaleDateString('en-US', {
													month: 'short',
													day: 'numeric',
												})}
											</span>
										</div>

										{/* Assignments */}
										{day.assignments.length > 0 ? (
											<div className="flex flex-col gap-1 overflow-y-auto">
												{day.assignments.map((a, i) => (
													<div
														key={i}
														className={clsx(
															'rounded px-1 py-[2px] text-[11px] font-semibold text-center border border-gray-300 shadow-sm cursor-pointer hover:opacity-80 transition',
															groupColorMap[a.groupId]
														)}
														onClick={() =>
															router.push(`/study-group/${a.groupId}`)
														}
													>
														<span dir="ltr">
															{a.homeworkCount}{' '}
															{a.homeworkCount === 1 ? 'task' : 'tasks'}
														</span>
													</div>
												))}
											</div>
										) : (
											<div className="flex-1 flex items-center justify-center text-gray-300 text-xs">
												—
											</div>
										)}
									</>
								)}
							</div>
						))
					)}
				</div>
			) : (
				// -------------------
				// WEEK VIEW
				// -------------------
				<div dir="rtl" className="grid grid-cols-7 border-t border-gray-200">
					{Array.from({ length: 7 }).map((_, i) => {
						const day = new HDate(currentWeekStart!.abs() + i)
						const gDate = day.greg()
						const dayAssignments = assignments.filter((a) => {
							const aHebrew = new HDate(a.date)
							return (
								aHebrew.getDate() === day.getDate() &&
								aHebrew.getMonth() === day.getMonth() &&
								aHebrew.getFullYear() === day.getFullYear()
							)
						})
						return (
							<div
								key={i}
								className={clsx(
									'border-l border-b border-gray-200 h-48 p-2 flex flex-col justify-between relative',
									day.getDate() === todayHebrew.getDate() &&
										day.getMonth() === todayHebrew.getMonth() &&
										day.getFullYear() === todayHebrew.getFullYear() &&
										'bg-yellow-100 border-yellow-400'
								)}
							>
								<div className="flex justify-between items-center mb-1">
									<span className="text-lg font-bold">{day.getDate()}</span>
									<span className="text-xs italic text-gray-500">
										{gDate.toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
										})}
									</span>
								</div>
								{dayAssignments.length > 0 ? (
									<div className="flex flex-col gap-1 overflow-y-auto">
										{dayAssignments.map((a, i) => (
											<div
												key={i}
												className={clsx(
													'rounded px-1 py-[3px] text-[12px] font-semibold text-center border border-gray-300 shadow-sm cursor-pointer hover:opacity-80 transition',
													groupColorMap[a.groupId]
												)}
												onClick={() => router.push(`/study-group/${a.groupId}`)}
											>
												<span dir="ltr">
													{a.homeworkCount}{' '}
													{a.homeworkCount === 1 ? 'task' : 'tasks'}
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="flex-1 flex items-center justify-center text-gray-300 text-xs">
										—
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}

			{/* Legend */}
			<div className="border-t p-3 bg-gray-50 text-sm flex flex-wrap justify-center gap-3 relative">
				{activeStudyGroups.map((g) => (
					<div
						key={g.id}
						data-group-id={g.id}
						className={clsx(
							'relative flex items-center gap-2 px-2 py-1 rounded-full border bg-white shadow-sm cursor-pointer hover:bg-gray-100 transition'
						)}
					>
						{/* Group name — click to open palette */}
						<span
							onClick={() =>
								setOpenColorPicker((prev) => (prev === g.id ? null : g.id))
							}
							className="font-medium select-none"
						>
							{g.name}
						</span>

						{/* Current color preview */}
						<div
							className={clsx(
								'w-4 h-4 rounded-full border border-gray-300',
								groupColors[g.id]
							)}
						/>

						{/* Mini color picker popup */}
						{openColorPicker === g.id && (
							<Portal>
								<div
									className="fixed inset-0 z-40"
									onClick={() => setOpenColorPicker(null)}
								/>
								<div
									className="absolute z-[9999] bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex gap-1"
									style={(() => {
										const el = document.querySelector(
											`[data-group-id="${g.id}"]`
										) as HTMLElement | null
										if (!el) return { top: 0, left: 0 }

										const rect = el.getBoundingClientRect()
										return {
											top: rect.bottom + window.scrollY + 6,
											left: rect.left + window.scrollX,
										}
									})()}
									onMouseLeave={() => setOpenColorPicker(null)}
								>
									{colorPalette.map((paletteClass) => (
										<button
											key={paletteClass}
											onClick={() => {
												const newColors = {
													...groupColors,
													[g.id]: paletteClass,
												}
												setGroupColors(newColors)
												localStorage.setItem(
													'groupColors',
													JSON.stringify(newColors)
												)
												setOpenColorPicker(null)
											}}
											className={clsx(
												'w-5 h-5 rounded-full border border-gray-300 hover:scale-110 transition',
												paletteClass,
												groupColors[g.id] === paletteClass &&
													'ring-2 ring-offset-1 ring-sky-500'
											)}
										/>
									))}
								</div>
							</Portal>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
