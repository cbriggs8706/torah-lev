'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'

const hebrewFonts = [
	{ label: 'Arial', value: 'font-arial' },
	{ label: 'Times', value: 'font-serif' },
	{ label: 'Nunito', value: 'font-nunito' },
]

type LessonScript = {
	id: number
	content: string | null
	contentPlain: string | null
	audioSrc: string | null
	lessonId: number | null
	courseId: number[] | null
}

type Lesson = {
	lessonScript: LessonScript
}

export default function LessonScriptViewer({
	lessonScript,
}: {
	lessonScript: LessonScript
}) {
	const [fontClass, setFontClass] = useState('font-serif')
	const [fontSize, setFontSize] = useState(36)
	const router = useRouter()

	// Handle font change from dropdown
	const handleFontChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setFontClass(event.target.value)
	}

	// Increment font size
	const handleIncreaseFontSize = () => {
		setFontSize((prevSize) => prevSize + 2)
	}

	// Decrement font size with minimum limit of 12px
	const handleDecreaseFontSize = () => {
		setFontSize((prevSize) => Math.max(12, prevSize - 2))
	}

	return (
		<div className="w-full space-y-4">
			{/* Toggle Buttons */}
			<div className="flex flex-wrap gap-4 mb-4 justify-center">
				<Button
					variant={'default'}
					onClick={() => {
						router.push('/he/lesson-scripts')
						router.refresh() // revalidate the next route after the push
					}}
				>
					Back to Lesson Script List
				</Button>
			</div>

			{/* Audio Embed */}
			{lessonScript.audioSrc && (
				<iframe
					data-testid="embed-iframe"
					style={{ borderRadius: 12 }}
					src={lessonScript.audioSrc}
					width="100%"
					height="152"
					frameBorder="0"
					allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
					loading="lazy"
				></iframe>
			)}
			{/* Font Selector and Size Controls */}
			<div className="flex gap-4 mb-4 justify-center">
				{/* Font Selector */}
				<select
					value={fontClass}
					onChange={handleFontChange}
					className="border p-1 rounded"
				>
					{hebrewFonts.map((font) => (
						<option key={font.value} value={font.value}>
							{font.label}
						</option>
					))}
				</select>

				{/* Font Size Control */}
				<button
					onClick={handleIncreaseFontSize}
					className="px-2 py-1 border rounded"
				>
					A+
				</button>
				<button
					onClick={handleDecreaseFontSize}
					className="px-2 py-1 border rounded"
				>
					A-
				</button>
			</div>
			{/* Lesson Content with Dynamic Font and Size */}
			<div
				dir="rtl"
				className={`whitespace-pre-wrap bg-gray-50 p-4 border rounded shadow leading-loose ${fontClass}`}
				style={{ fontSize: `${fontSize}px` }} // Apply dynamic font size here
			>
				<div
					dangerouslySetInnerHTML={{
						__html: lessonScript.content ?? 'No content for this lesson.',
					}}
				/>
			</div>
		</div>
	)
}
