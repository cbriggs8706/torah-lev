'use client'

import { useState } from 'react'

interface Lesson {
	id: number
	title: string
	content: string | null
}

interface LessonScriptViewerProps {
	lessons: Lesson[]
	lessonPrefix: string
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
]

export default function LessonScriptViewer({
	lessons,
	lessonPrefix,
	currentLesson,
}: LessonScriptViewerProps) {
	const initial = lessons.find((l) =>
		currentLesson ? l.title.includes(`${lessonPrefix} ${currentLesson}`) : false
	)

	const [selectedId, setSelectedId] = useState<number | null>(
		initial?.id ?? null
	)
	const [fontClass, setFontClass] = useState('font-times')
	const [sizeClass, setSizeClass] = useState('text-2xl')

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
					{[
						...lessons
							.filter((l) => l.title.startsWith(lessonPrefix))
							.filter((l) => /\d+/.test(l.title)) // Numeric lessons only
							.sort((a, b) => {
								const aNum = Number(a.title.match(/\d+/)?.[0] ?? 0)
								const bNum = Number(b.title.match(/\d+/)?.[0] ?? 0)
								return aNum - bNum
							}),
						...lessons
							.filter((l) => l.title.startsWith(lessonPrefix))
							.filter((l) => !/\d+/.test(l.title)) // Non-numeric lessons go last
							.sort((a, b) => a.title.localeCompare(b.title)),
					].map((lesson) => (
						<option key={lesson.id} value={lesson.id}>
							{lesson.title}
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
				<div
					dir="rtl"
					className={`whitespace-pre-wrap bg-gray-50 p-4 border rounded shadow leading-loose ${fontClass} ${sizeClass}`}
				>
					{selected.content ?? 'No content for this lesson.'}
				</div>
			)}
		</div>
	)
}
