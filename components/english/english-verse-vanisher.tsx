'use client'

import { useState, useMemo } from 'react'
import MemorizeControls from '../memorize-controls'
import { Button } from '../ui/button'

export default function VerseVanisher({
	verses,
	onBack,
}: {
	verses: any[]
	onBack: () => void
}) {
	const fullText = verses.map((v) => v.text).join(' ')
	const [hideLevel, setHideLevel] = useState(0)
	const [mode, setMode] = useState<'letters' | 'words'>('letters')
	const [fontSize, setFontSize] = useState(28)

	// precompute random order once so hide pattern is consistent
	const letterIndices = useMemo(() => {
		const indices = fullText
			.split('')
			.map((_, i) => i)
			.filter((i) => /[A-Za-z]/.test(fullText[i]))
		return shuffle(indices)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fullText])

	const wordIndices = useMemo(() => {
		const words = fullText.split(/(\s+)/)
		return shuffle(words.map((_, i) => i).filter((i) => /\w/.test(words[i])))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fullText])

	const vanishedText = useMemo(() => {
		if (hideLevel === 0) return fullText

		if (mode === 'letters') {
			const chars = fullText.split('')
			const totalLetters = letterIndices.length
			const hideCount = Math.floor((hideLevel / 100) * totalLetters)
			const toHide = new Set(letterIndices.slice(0, hideCount))
			return chars.map((char, i) => (toHide.has(i) ? '_' : char)).join('')
		}

		// mode === 'words'
		const words = fullText.split(/(\s+)/)
		const totalWords = wordIndices.length
		const hideCount = Math.floor((hideLevel / 100) * totalWords)
		const toHide = new Set(wordIndices.slice(0, hideCount))
		return words
			.map((w, i) =>
				toHide.has(i)
					? w.replace(/[A-Za-z]/g, '_') // keep punctuation
					: w
			)
			.join('')
	}, [fullText, hideLevel, mode, letterIndices, wordIndices])

	const changeLevel = (amount: number) => {
		setHideLevel((prev) => Math.min(100, Math.max(0, prev + amount)))
	}

	const changeFont = (delta: number) => {
		setFontSize((prev) => Math.min(48, Math.max(16, prev + delta)))
	}

	return (
		<div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-white to-gray-100">
			<h2 className="text-center text-2xl font-semibold">Vanisher</h2>
			{/* Mode Toggle */}
			<div className="flex justify-center gap-2 pt-4">
				<Button
					onClick={() => setMode('letters')}
					variant={mode === 'letters' ? 'super' : 'superOutline'}
				>
					Letters
				</Button>
				<Button
					onClick={() => setMode('words')}
					variant={mode === 'words' ? 'super' : 'superOutline'}
				>
					Words
				</Button>
			</div>

			{/* Text Area */}
			<div
				className="flex-1 px-8 py-6 overflow-y-auto transition-all duration-300 ease-in-out"
				style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
			>
				<div className="max-w-4xl text-left font-serif whitespace-pre-wrap select-none">
					{vanishedText}
				</div>
			</div>

			{/* Bottom Controls (Back + Font + Hide/Show) */}
			<MemorizeControls
				fontSize={fontSize}
				onFontChange={changeFont}
				onBack={onBack}
				statusText={`Hiding ${hideLevel}% of ${mode}`}
				showFontButtons={true}
			>
				<div className="flex gap-2">
					<Button onClick={() => changeLevel(-10)} variant="secondary">
						Show +
					</Button>
					<Button onClick={() => changeLevel(10)} variant="secondary">
						Hide -
					</Button>
				</div>
			</MemorizeControls>
		</div>
	)
}

/** Fisher–Yates shuffle */
function shuffle<T>(array: T[]): T[] {
	const arr = [...array]
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[arr[i], arr[j]] = [arr[j], arr[i]]
	}
	return arr
}
