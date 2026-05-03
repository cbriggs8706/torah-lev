'use client'
import { useEffect, useMemo, useState } from 'react'
import { EnglishVocab, GreekVocab, HebrewVocab } from '@/lib/vocab'

export function parseLessonKey(key: string) {
	if (typeof key !== 'string') return { num: NaN, text: '' }

	// Match only lesson keys that are entirely numeric with an optional letter suffix,
	// such as "41" or "41b". Labels like "Classroom1" should not be auto-selected.
	const match = key.match(/^(\d+)([a-zA-Z]*)$/)
	if (!match) return { num: NaN, text: key }

	return {
		num: parseInt(match[1], 10),
		text: match[2] || '',
	}
}

export function useLessonCards(
	data: HebrewVocab[] | EnglishVocab[] | GreekVocab[],
	currentLesson: string
) {
	const [selectedLessons, setSelectedLessons] = useState<string[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)

	const lessonOptions = useMemo(() => {
		const allLessons = data.flatMap(
			(c) => (c.lessons ?? []).map((l) => String(l)) // ✅ ensure strings
		)
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

	// auto-select lessons up to currentLesson
	useEffect(() => {
		if (!currentLesson) return

		const currentParsed = parseLessonKey(currentLesson)

		// 🔹 Use only lessons present in data
		const dataLessons = Array.from(
			new Set(data.flatMap((c) => c.lessons ?? []).map((l) => String(l)))
		).sort((a, b) => {
			const A = parseLessonKey(a)
			const B = parseLessonKey(b)
			if (A.num !== B.num) return A.num - B.num
			return A.text.localeCompare(B.text)
		})

		const availableLessons = dataLessons.filter((lesson) => {
			const parsed = parseLessonKey(lesson)

			if (parsed.num < currentParsed.num) return true
			if (parsed.num > currentParsed.num) return false

			return parsed.text.localeCompare(currentParsed.text) <= 0
		})

		setSelectedLessons(availableLessons)
	}, [currentLesson, data])

	return {
		selectedLessons,
		setSelectedLessons,
		currentIndex,
		setCurrentIndex,
		lessonOptions,
	}
}
