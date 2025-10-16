'use client'

import { useState } from 'react'
import MemorizeControls from '../memorize-controls'

export default function VerseRevealGame({
	verses,
	onBack,
}: {
	verses: any[]
	onBack: () => void
}) {
	const fullText = verses.map((v) => v.text).join(' ')
	const chunks = fullText
		.split(/\s+/) // 🔹 split only by spaces
		.map((w) => w.trim())
		.filter(Boolean) // remove empty strings

	const [index, setIndex] = useState(0)
	const [fontSize, setFontSize] = useState(36)

	const nextChunk = () => {
		if (index < chunks.length - 1) setIndex(index + 1)
	}

	const isComplete = index >= chunks.length - 1

	return (
		<div
			onClick={!isComplete ? nextChunk : undefined}
			className="min-h-screen w-full flex flex-col bg-gradient-to-b from-white to-gray-100"
		>
			<h2 className="text-center text-2xl font-semibold">Reveal</h2>

			{/* Main verse display */}
			<div
				className="flex-1 px-8 py-10 overflow-y-auto cursor-pointer select-none transition-all duration-300 ease-in-out"
				style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
			>
				<div
					className="max-w-4xl text-right font-serif leading-relaxed"
					dir="rtl"
				>
					{/* join words revealed so far */}
					{chunks.slice(0, index + 1).join(' ')}
				</div>
			</div>

			{/* Bottom Controls */}
			<MemorizeControls
				fontSize={fontSize}
				onFontChange={(delta) =>
					setFontSize((f) => Math.min(48, Math.max(16, f + delta)))
				}
				onBack={onBack}
				statusText={isComplete ? 'Verse Complete! 🎉' : '(tap to reveal more)'}
				showFontButtons={true}
			/>
		</div>
	)
}
