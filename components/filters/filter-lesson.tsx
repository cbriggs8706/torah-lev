'use client'

import { EnglishVocab, HebrewVocab } from '@/lib/vocab'
import { useMemo } from 'react'

interface LessonFilterProps {
	data: HebrewVocab[] | EnglishVocab[]
	selectedLessons: string[]
	setSelectedLessons: React.Dispatch<React.SetStateAction<string[]>>
	showRanges?: boolean
}

export default function LessonFilter({
	data,
	selectedLessons,
	setSelectedLessons,
	showRanges = true,
}: LessonFilterProps) {
	function parseLessonKey(key: string) {
		const match = key.match(/^(\d+)?([a-zA-Z]*)$/)
		if (!match) return { num: NaN, text: key }
		return {
			num: match[1] ? parseInt(match[1], 10) : NaN,
			text: match[2] || (match[1] ? '' : key),
		}
	}

	const lessonOptions = useMemo(() => {
		const allLessons = data.flatMap((card) => card.lessons)
		const uniqueLessons = Array.from(new Set(allLessons))

		return uniqueLessons.sort((a, b) => {
			const A = parseLessonKey(a)
			const B = parseLessonKey(b)

			if (!isNaN(A.num) && !isNaN(B.num)) {
				if (A.num !== B.num) return A.num - B.num
				return A.text.localeCompare(B.text)
			}
			if (!isNaN(A.num) && isNaN(B.num)) return -1
			if (isNaN(A.num) && !isNaN(B.num)) return 1
			return a.localeCompare(b)
		})
	}, [data])

	const lessonRanges = useMemo(() => {
		if (!showRanges) return []

		const numericLessons = lessonOptions
			.map((lesson: string) => ({ lesson, ...parseLessonKey(lesson) }))
			.filter((l) => !isNaN(l.num))

		if (numericLessons.length === 0) return []

		const maxNum = Math.max(...numericLessons.map((l) => l.num))
		const ranges = []

		for (let i = 1; i <= maxNum; i += 10) {
			const start = i
			const end = i + 9
			const lessonsInRange = numericLessons
				.filter((l) => l.num >= start && l.num <= end)
				.map((l) => l.lesson)

			if (lessonsInRange.length > 0) {
				ranges.push({ label: `${start}-${end}`, lessons: lessonsInRange })
			}
		}

		return ranges
	}, [lessonOptions, showRanges])

	function toggleLesson(lesson: string) {
		setSelectedLessons((prev) =>
			prev.includes(lesson)
				? prev.filter((l: string) => l !== lesson)
				: [...prev, lesson]
		)
	}

	return (
		<div className="space-y-3 mb-4">
			<h2 className="text-xl font-semibold mb-2">Select Lessons</h2>
			<div className="flex flex-wrap justify-center gap-2">
				{/* Clear All */}
				<button
					onClick={() => setSelectedLessons([])}
					className="px-3 py-1 border rounded-full text-xs bg-red-100 hover:bg-red-200"
				>
					Clear All
				</button>

				{/* All */}
				<button
					onClick={() => setSelectedLessons([...lessonOptions])}
					className={`px-3 py-1 border rounded-full text-xs ${
						selectedLessons.length === lessonOptions.length
							? 'bg-sky-600 text-white'
							: 'bg-gray-200'
					}`}
				>
					All
				</button>

				{/* Range Buttons */}
				{lessonRanges.map((range) => (
					<button
						key={range.label}
						onClick={() =>
							setSelectedLessons((prev) => {
								const allSelected = range.lessons.every((l) => prev.includes(l))
								if (allSelected) {
									return prev.filter((l) => !range.lessons.includes(l))
								} else {
									return Array.from(new Set([...prev, ...range.lessons]))
								}
							})
						}
						className={`px-3 py-1 border rounded-full text-xs ${
							range.lessons.every((l) => selectedLessons.includes(l))
								? 'bg-sky-600 text-white'
								: 'bg-gray-200'
						}`}
					>
						{range.label}
					</button>
				))}

				{/* Individual Lessons */}
				{lessonOptions.map((lesson) => (
					<button
						key={lesson}
						onClick={() => toggleLesson(lesson)}
						className={`px-3 py-1 border rounded-full text-xs ${
							selectedLessons.includes(lesson)
								? 'bg-sky-600 text-white'
								: 'bg-gray-200'
						}`}
					>
						{lesson}
					</button>
				))}
			</div>
		</div>
	)
}
