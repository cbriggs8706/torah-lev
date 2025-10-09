'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'

type SlideDeck = {
	id: number | string
	lessonId: string
	googleUrl: string
	lessonNumber: string
	lessonTitle: string
}

export default function SlideDeckList({
	slideDecks,
	isFriend,
	currentLesson,
}: {
	slideDecks: SlideDeck[]
	isFriend: boolean
	currentLesson: number | null
}) {
	// Sort the lesson scripts by lessonId
	const sortedSlideDecks = useMemo(() => {
		return [...slideDecks].sort((a, b) =>
			a.lessonNumber.localeCompare(b.lessonNumber, undefined, { numeric: true })
		)
	}, [slideDecks])

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{/* Displaying the sorted list */}
			{sortedSlideDecks.map((script) => {
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
							href={`/en/slides/${script.id}`}
							className={`inline-block mt-3 px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition ${
								isLocked ? 'pointer-events-none' : ''
							}`}
						>
							View Slides
						</Link>
					</div>
				)
			})}
		</div>
	)
}
