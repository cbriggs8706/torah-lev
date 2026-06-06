'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'

type LessonScript = {
	id: number | string
	// lessonScriptId: number | null
	content: string | null
	category?: string | null
	audioSrc?: string | null
	title: string
	lessonId: number | null
	courseId: number[] | null
	part: number | null
}

export default function GreekLessonScriptList({
	lessonScripts,
	// isFriend,
	currentLesson,
}: {
	lessonScripts: LessonScript[]
	// isFriend: boolean
	currentLesson: number | null
}) {
	const lessonNum = (n?: number | null) =>
		typeof n === 'number' ? n : Number.POSITIVE_INFINITY
	// Sort the lesson scripts by lessonId
	const sortedLessonScripts = useMemo(
		() =>
			[...lessonScripts].sort(
				(a, b) => lessonNum(a.lessonId) - lessonNum(b.lessonId)
			),
		[lessonScripts]
	)

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{/* Displaying the sorted list */}
			{sortedLessonScripts.map((script) => {
				// Check if the lesson should be locked (after currentLesson)
				// const locked =
				// 	// !isFriend &&
				// 	currentLesson !== null &&
				// 	lessonNum(script.lessonId) > currentLesson

				const locked = false

				return (
					<div
						key={script.id}
						className={`rounded-lg border p-4 shadow hover:shadow-md transition ${
							locked ? 'opacity-50 cursor-not-allowed' : ''
						}`}
					>
						<h3 className="text-xl font-semibold">
							{script.title} {script.part === 2 && '- Part B'}
						</h3>

						{/* Disable the link if the lesson is locked */}
						<Link
							href={`/el/videos/${script.id}`}
							className={`inline-block mt-3 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition ${
								locked ? 'pointer-events-none' : ''
							}`}
						>
							View Video
						</Link>
					</div>
				)
			})}
		</div>
	)
}
