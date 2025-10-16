'use client'

import { useState, useMemo, useEffect } from 'react'
import MemorizeControls from '../memorize-controls'
import { Button } from '../ui/button'

function shuffle<T>(arr: T[]): T[] {
	const copy = [...arr]
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[copy[i], copy[j]] = [copy[j], copy[i]]
	}
	return copy
}

export default function VerseFillInTheBlank({
	verses,
	onBack,
}: {
	verses: any[]
	onBack: () => void
}) {
	// Keep niqqud in displayed text, but strip for internal matching
	const fullText = verses.map((v) => v.text).join(' ')
	const cleanText = fullText.replace(/[\u0591-\u05C7]/g, '') // strip niqqud for logic

	const [fontSize, setFontSize] = useState(36)
	const [sessionKey, setSessionKey] = useState(Date.now())

	// split the clean version for logic, but keep the original for display
	const displayWords = useMemo(() => fullText.split(/(\s+)/), [fullText])
	const words = useMemo(() => cleanText.split(/(\s+)/), [cleanText])

	const [filled, setFilled] = useState<{ [i: number]: string }>({})
	const [activeIndex, setActiveIndex] = useState<number | null>(null)
	const [wrongSelections, setWrongSelections] = useState<string[]>([])
	const [isComplete, setIsComplete] = useState(false)

	// Determine which indices will become blanks (30% of words)
	const blanks = useMemo(() => {
		const indices = words
			.map((w, i) => (/^[\u05D0-\u05EA\u05BE׳״'\-]+$/.test(w) ? i : -1))
			.filter((i) => i >= 0)
		const blankCount = Math.max(1, Math.floor(indices.length * 0.3))
		return new Set(shuffle(indices).slice(0, blankCount))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cleanText, sessionKey])

	// Build a unique word bank
	const uniqueWords = useMemo(
		() =>
			Array.from(
				new Set(words.filter((w) => /^[\u05D0-\u05EA\u05BE׳״'\-]+$/.test(w)))
			).map((w) => w.replace(/[^\u05D0-\u05EA\u05BE׳״'\-]/g, '')),
		[words]
	)

	// Set the first blank as active
	useEffect(() => {
		if (activeIndex === null && blanks.size > 0) {
			const first = Math.min(...Array.from(blanks))
			setActiveIndex(first)
		}
	}, [blanks, activeIndex])

	// Check completion
	useEffect(() => {
		const done =
			Array.from(blanks).every((i) => filled[i]) &&
			Object.keys(filled).length > 0
		if (done) setIsComplete(true)
	}, [filled, blanks])

	// Display text (show original words with niqqud)
	const displayText = displayWords.map((w, i) => {
		if (blanks.has(i)) {
			const value = filled[i]
			if (value)
				return (
					<span
						key={i}
						onClick={() => !isComplete && setActiveIndex(i)}
						className="inline-flex items-center justify-center cursor-pointer bg-green-100 text-green-700 font-semibold rounded-md px-3 py-[2px] mx-[2px]"
						style={{ minWidth: '3ch' }}
					>
						{value}
					</span>
				)
			return (
				<span
					key={i}
					onClick={() => !isComplete && setActiveIndex(i)}
					className={`inline-flex items-center justify-center cursor-pointer rounded-md mx-[2px] ${
						activeIndex === i
							? 'bg-blue-100 ring-2 ring-blue-300'
							: 'bg-gray-200'
					}`}
					style={{ minWidth: '3ch', height: '1.2em' }}
				></span>
			)
		}
		return <span key={i}>{w}</span>
	})

	// Word bank options
	const wordBank = useMemo(() => {
		if (isComplete || activeIndex == null || !blanks.has(activeIndex)) return []

		const correct = words[activeIndex].replace(
			/[^\u05D0-\u05EA\u05BE׳״'\-]/g,
			''
		)
		const others = shuffle(uniqueWords.filter((w) => w !== correct)).slice(0, 5)
		return shuffle([correct, ...others])
	}, [activeIndex, blanks, uniqueWords, words, isComplete])

	// Selection logic
	const handleWordSelect = (word: string) => {
		if (activeIndex == null) return
		const correct = words[activeIndex].replace(
			/[^\u05D0-\u05EA\u05BE׳״'\-]/g,
			''
		)

		if (word === correct) {
			setFilled((prev) => ({ ...prev, [activeIndex]: word }))
			setWrongSelections([])

			const blanksList = Array.from(blanks).sort((a, b) => a - b)
			const nextBlank = blanksList.find((i) => i > activeIndex && !filled[i])
			if (nextBlank !== undefined) setActiveIndex(nextBlank)
			else setActiveIndex(null)
		} else {
			setWrongSelections((prev) => [...prev, word])
		}
	}

	// Reset
	const reshuffle = () => {
		setSessionKey(Date.now())
		setFilled({})
		setActiveIndex(null)
		setWrongSelections([])
		setIsComplete(false)
	}

	return (
		<div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-white to-gray-100">
			<h2 className="text-center text-2xl font-semibold">Fill in the Blank</h2>

			{/* Text area */}
			<div
				className="flex-1 px-8 py-6 overflow-y-auto transition-all duration-300 ease-in-out"
				style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
			>
				<div
					className="max-w-4xl text-right font-serif whitespace-pre-wrap select-none leading-relaxed flex flex-wrap relative"
					dir="rtl"
				>
					{displayText}
				</div>

				{isComplete && (
					<div className="w-full text-center mt-10 animate-fade-in">
						<h2 className="text-xl font-bold text-green-700">
							Verse Complete! 🎉
						</h2>
					</div>
				)}
			</div>

			{/* Word Bank */}
			{wordBank.length > 0 && (
				<div className="sticky bottom-[72px] bg-white border-t border-gray-200 px-6 py-4 flex flex-wrap justify-center gap-2 z-40">
					{wordBank.map((w, i) => {
						const isWrong = wrongSelections.includes(w)
						return (
							<Button
								key={i}
								onClick={() => handleWordSelect(w)}
								className="font-serif text-2xl"
								variant={isWrong ? 'danger' : 'secondary'}
								disabled={isWrong}
							>
								{w}
							</Button>
						)
					})}
				</div>
			)}

			{/* Bottom font-size + action controls */}
			<MemorizeControls
				fontSize={fontSize}
				onFontChange={(delta) => setFontSize((f) => f + delta)}
				onBack={onBack}
				showFontButtons={true}
			>
				<Button onClick={reshuffle} variant="secondary">
					🔁 Reshuffle
				</Button>
			</MemorizeControls>
		</div>
	)
}
