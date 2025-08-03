'use client'

import { useState } from 'react'

interface Lesson {
	id: number
	content: string | null
	contentPlain: string | null
	audioSrc: string | null
	lessonId: string // ✅ This is the string like "12a"
}

interface LessonScriptViewerProps {
	lessons: Lesson[]
	currentLesson: string
}

export default function LessonScriptViewer({
	lessons,
	currentLesson,
}: LessonScriptViewerProps) {
	// ✅ Track by lessonId (string), not numeric id
	const [selectedLessonId, setSelectedLessonId] =
		useState<string>(currentLesson)
	const [fontClass, setFontClass] = useState('font-times')
	const [sizeClass, setSizeClass] = useState('text-4xl')

	// ✅ Find lesson by lessonId
	const selected = lessons.find((l) => l.lessonId === selectedLessonId)

	return (
		<div className="w-full space-y-4">
			<div>
				<label className="block text-lg font-semibold mb-1">
					Select Lesson
				</label>
				<select
					value={selectedLessonId}
					onChange={(e) => setSelectedLessonId(e.target.value)}
					className="border rounded px-3 py-2 w-full"
				>
					<option value="">-- Choose a lesson --</option>
					{[...lessons]
						.sort((a, b) => a.id - b.id) // ✅ still sort numerically by id
						.map((lesson) => (
							<option key={lesson.id} value={lesson.lessonId}>
								Lesson {lesson.lessonId}
							</option>
						))}
				</select>
			</div>

			{/* Font + Size selectors remain unchanged */}
			<div className="flex flex-wrap gap-4">
				{/* ... font and size selectors ... */}
			</div>

			{selected && (
				<>
					{selected.audioSrc && (
						<iframe
							data-testid="embed-iframe"
							style={{ borderRadius: 12 }}
							src={selected.audioSrc}
							width="100%"
							height="152"
							frameBorder="0"
							allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
							loading="lazy"
						></iframe>
					)}

					<div
						dir="rtl"
						className={`whitespace-pre-wrap bg-gray-50 p-4 border rounded shadow leading-loose ${fontClass} ${sizeClass}`}
					>
						<div
							dangerouslySetInnerHTML={{
								__html: selected.content ?? 'No content for this lesson.',
							}}
						/>
					</div>
				</>
			)}
		</div>
	)
}
