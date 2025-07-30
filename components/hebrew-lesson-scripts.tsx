'use client'

import { useState } from 'react'

interface Lesson {
	id: number
	content: string | null
	contentPlain: string | null
	audioSrc: string | null
	lessonId: string
}

interface LessonScriptViewerProps {
	lessons: Lesson[]
	currentLesson?: number
}

const fontOptions = [
	{ label: 'Times', className: 'font-serif' },
	{
		label: 'Frank',
		className: 'font-frank',
	},
	{
		label: 'Tinos',
		className: 'font-tinos',
	},
	{
		label: 'Cardo',
		className: 'font-cardo',
	},
	{
		label: 'Rashi',
		className: 'font-rashi',
	},
	{
		label: 'Suez',
		className: 'font-suez',
	},
	{ label: 'Arial', className: 'font-arial' },
	{
		label: 'Sans',
		className: 'font-sans',
	},

	{
		label: 'Nunito',
		className: 'font-nunito',
	},
]

const sizeOptions = [
	{ label: 'Small', className: 'text-xl' },
	{ label: 'Medium', className: 'text-2xl' },
	{ label: 'Large', className: 'text-3xl' },
	{ label: 'Extra Large', className: 'text-4xl' },
	{ label: '2X Large', className: 'text-5xl' },
	{ label: '3X Large', className: 'text-6xl' },
	{ label: '4X Large', className: 'text-7xl' },
	{ label: '5X Large', className: 'text-8xl' },
	{ label: '6X Large', className: 'text-9xl' },
]

export default function LessonScriptViewer({
	lessons,
	currentLesson,
}: LessonScriptViewerProps) {
	const [selectedId, setSelectedId] = useState<number | null>(
		currentLesson || null
	)
	const [fontClass, setFontClass] = useState('font-times')
	const [sizeClass, setSizeClass] = useState('text-4xl')

	const selected = lessons.find((l) => l.id === selectedId)

	return (
		<div className="w-full space-y-4">
			<div>
				<label className="block text-lg font-semibold mb-1">
					Select Lesson
				</label>
				<select
					value={selectedId ?? ''}
					onChange={(e) => setSelectedId(Number(e.target.value))}
					className="border rounded px-3 py-2 w-full"
				>
					<option value="">-- Choose a lesson --</option>
					{[...lessons]
						.sort((a, b) => a.id - b.id) // ✅ numeric sort
						.map((lesson) => (
							<option key={lesson.id} value={lesson.id}>
								Lesson {lesson.lessonId}
							</option>
						))}
				</select>
			</div>

			<div className="flex flex-wrap gap-4">
				<div>
					<label className="block text-sm font-medium">Font</label>
					<select
						className="border rounded px-2 py-1"
						value={fontClass}
						onChange={(e) => setFontClass(e.target.value)}
					>
						{fontOptions.map((f) => (
							<option key={f.className} value={f.className}>
								{f.label}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="block text-sm font-medium">Size</label>
					<select
						className="border rounded px-2 py-1"
						value={sizeClass}
						onChange={(e) => setSizeClass(e.target.value)}
					>
						{sizeOptions.map((s) => (
							<option key={s.className} value={s.className}>
								{s.label}
							</option>
						))}
					</select>
				</div>
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
