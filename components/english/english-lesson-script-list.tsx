'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'

type LessonScript = {
	id: number | string
	lessonId: string | null
	content: string | null
	category?: string | null
	audioSrc?: string | null
	lessonTitle: string
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
	// Sort the lesson scripts by lessonId
	const sortedLessonScripts = useMemo(() => {
		return lessonScripts.sort((a, b) => {
			const lessonIdA = a.lessonTitle.toString()
			const lessonIdB = b.lessonTitle.toString()

			// Sort by lessonId, considering the alphanumeric nature (e.g., 1, 1a, 1b, 2, 2a, 3...)
			return lessonIdA.localeCompare(lessonIdB, undefined, { numeric: true })
		})
	}, [lessonScripts])

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{/* Displaying the sorted list */}
			{sortedLessonScripts.map((script) => {
				// Check if the lesson should be locked (after currentLesson)
				const isLocked = false
				// const isLocked =
				// 	currentLesson !== null && script.lessonId > currentLesson

				return (
					<div
						key={script.id}
						className={`rounded-lg border p-4 shadow hover:shadow-md transition ${
							isLocked ? 'opacity-50 cursor-not-allowed' : ''
						}`}
					>
						<h3 className="text-xl font-semibold">{script.lessonTitle}</h3>

						{/* Disable the link if the lesson is locked */}
						<Link
							href={`/en/lesson-scripts/${script.id}`}
							className={`inline-block mt-3 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition ${
								isLocked ? 'pointer-events-none' : ''
							}`}
						>
							View Lesson Script
						</Link>
					</div>
				)
			})}
		</div>
	)
}
