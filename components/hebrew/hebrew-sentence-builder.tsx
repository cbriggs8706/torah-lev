'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import ProgressBar from '../progress-bar'
import { phrases } from '@/lib/sentence-builder-phrases'
import { vocab, VocabEntry } from '@/lib/sentence-builder-specifics'
import { useCelebration } from '@/hooks/useCelebration'
import Image from 'next/image'

interface SentenceBuilderProps {
	userId: string
	courseId: number | null
}

export default function SentenceBuilder({
	userId,
	courseId,
}: SentenceBuilderProps) {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [userOrder, setUserOrder] = useState<string[]>([])
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [completedCount, setCompletedCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const { Confetti, celebrate } = useCelebration()
	const [hasAwardedPoints, setHasAwardedPoints] = useState(false)
	const [showFilter, setShowFilter] = useState(false)
	const [selectedLevels, setSelectedLevels] = useState<number[]>([1])
	const [selectedQuantities, setSelectedQuantities] = useState<string[]>(['s'])

	// Extract all available levels dynamically
	const levelOptions = useMemo(
		() =>
			Array.from(new Set(phrases.map((p) => p.level))).sort((a, b) => a - b),
		[]
	)
	// --- Filtered Phrase Pool ---
	const filteredPhrases = useMemo(() => {
		return phrases.filter((p) => {
			const levelMatch =
				selectedLevels.length === 0 || selectedLevels.includes(p.level)
			const quantityMatch =
				selectedQuantities.length === 0 ||
				selectedQuantities.includes(p.quantity)
			return levelMatch && quantityMatch
		})
	}, [selectedLevels, selectedQuantities])

	// Shuffle and pick 5
	const [phrasePool, setPhrasePool] = useState(() =>
		[...phrases].sort(() => Math.random() - 0.5).slice(0, 5)
	)

	useEffect(() => {
		setPhrasePool(
			[...filteredPhrases].sort(() => Math.random() - 0.5).slice(0, 5)
		)
		setCurrentIndex(0)
	}, [filteredPhrases])

	const currentPhrase = phrasePool[currentIndex]
	const verbMatch = currentPhrase.english.match(/\(([^)]+)\)/)
	const verbWord = verbMatch ? verbMatch[1] : null
	const displayEnglish = currentPhrase.english.replace(/\s*\([^)]+\)\s*/g, ' ')
	const correctOrder = currentPhrase.hebrew.split(' ')

	// --- Filtered Word Bank ---
	const filteredVocab = useMemo(() => {
		return vocab.filter((v) => {
			const quantityMatch =
				selectedQuantities.length === 0 ||
				selectedQuantities.includes(v.quantity)

			const levelMatch =
				selectedLevels.length === 0 ||
				(v.levels && v.levels.some((lvl) => selectedLevels.includes(lvl)))

			return quantityMatch && levelMatch
		})
	}, [selectedQuantities, selectedLevels])

	// --- Gender colors ---
	function getGenderColor(gender: string) {
		if (gender === 'm') return 'bg-blue-200 border-blue-500'
		if (gender === 'f') return 'bg-pink-200 border-pink-500'
		if (gender === 'mf') return 'bg-purple-200 border-purple-500'
		return 'bg-gray-200 border-gray-500'
	}

	// --- Precompute vocab sections ---
	const { masculineNouns, feminineNouns, adjectives, demonstratives } =
		useMemo(() => {
			const masculineNouns = filteredVocab
				.filter((v) => v.type === 'noun' && v.gender === 'm')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			const feminineNouns = filteredVocab
				.filter((v) => v.type === 'noun' && v.gender === 'f')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			const adjectives = filteredVocab
				.filter((v) => v.type === 'adjective')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			const demonstratives = filteredVocab
				.filter((v) => v.type === 'demonstrative')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			return { masculineNouns, feminineNouns, adjectives, demonstratives }
		}, [filteredVocab])

	const calculatePoints = useCallback(() => {
		const maxLevel = Math.max(...selectedLevels, 1)
		const pluralSelected = selectedQuantities.includes('p')

		if (!pluralSelected && maxLevel <= 3) return 1 // single + levels 1-3
		if (!pluralSelected && maxLevel >= 4) return 2 // single + levels 4-9
		if (pluralSelected && maxLevel <= 3) return 2 // plural + levels 1-3
		if (pluralSelected && maxLevel >= 4) return 5 // plural + levels 4-9
		return 1
	}, [selectedLevels, selectedQuantities])

	// --- Award Points Helper ---
	const awardPoints = useCallback(
		async (points: number) => {
			if (!courseId) {
				console.warn('Skipping award: no active courseId')
				return
			}
			try {
				await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, courseId, points }),
				})
			} catch (error) {
				console.error('Failed to award points', error)
			}
		},
		[userId, courseId]
	)

	useEffect(() => {
		if (!hasAwardedPoints && completedCount >= 5) {
			setHasAwardedPoints(true)
			setFinished(true)
			celebrate()

			const shofar = new Audio('/shofar.mp3')
			shofar.play().catch(console.error)

			const points = calculatePoints()
			awardPoints(points)
		}
	}, [
		completedCount,
		hasAwardedPoints,
		celebrate,
		awardPoints,
		calculatePoints,
	])

	useEffect(() => {
		function handleUpdateUserOrder(e: Event) {
			const custom = e as CustomEvent<string[]>
			setUserOrder(custom.detail)
		}
		window.addEventListener('updateUserOrder', handleUpdateUserOrder)
		return () => {
			window.removeEventListener('updateUserOrder', handleUpdateUserOrder)
		}
	}, [])

	useEffect(() => {
		function handleAddWordToZone(e: CustomEvent<string>) {
			const word = e.detail
			// Just pass along for DropAreaWithVerb to handle
			const event = new CustomEvent('requestAddWordToZone', { detail: word })
			window.dispatchEvent(event)
		}
		window.addEventListener(
			'addWordToActiveZone',
			handleAddWordToZone as EventListener
		)
		return () => {
			window.removeEventListener(
				'addWordToActiveZone',
				handleAddWordToZone as EventListener
			)
		}
	}, [])

	// --- Handlers ---
	function handleSelectWord(word: string) {
		setUserOrder((prev) => [...prev, word])
	}

	function handleRemoveWord(index: number) {
		setUserOrder((prev) => prev.filter((_, i) => i !== index))
	}

	function normalizeHebrew(text: string): string {
		return text
			.normalize('NFKC') // normalize presentation forms
			.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '') // remove niqqud marks
			.replace(/[שׁשׂ]/g, 'ש') // normalize old presentation forms
			.trim()
	}

	function handleCheck() {
		const joinedUser = userOrder.join(' ')
		const joinedCorrect = correctOrder.join(' ')

		const isCorrect =
			normalizeHebrew(joinedUser) === normalizeHebrew(joinedCorrect)

		setShowFeedback(isCorrect)

		if (isCorrect) {
			setCompletedCount((prev) => prev + 1)

			if (timerRef.current) clearTimeout(timerRef.current)
			timerRef.current = setTimeout(() => {
				goToNext()
			}, 2000)
		}
	}

	function goToNext() {
		if (timerRef.current) clearTimeout(timerRef.current)
		setCurrentIndex((i) => (i + 1) % phrasePool.length)
		setUserOrder([])
		setShowFeedback(null)
	}

	function goToPrevious() {
		if (timerRef.current) clearTimeout(timerRef.current)
		setCurrentIndex((i) => (i - 1 + phrasePool.length) % phrasePool.length)
		setUserOrder([])
		setShowFeedback(null)
	}

	function handleRestart() {
		setHasAwardedPoints(false)
		setFinished(false)
		setCompletedCount(0)
		setShowFeedback(null)
		setUserOrder([])
		setCurrentIndex(0)
		setSelectedLevels([1])
		setSelectedQuantities(['s'])
		setShowFilter(true)
		setPhrasePool([...phrases].sort(() => Math.random() - 0.5).slice(0, 5))
	}

	// --- Render section helper ---
	function renderSection(title: string, words: VocabEntry[]) {
		if (words.length === 0) return null
		return (
			<div className="mb-8">
				<h3 className="text-xl font-bold mb-3">{title}</h3>
				<div className="flex flex-wrap justify-center gap-3" dir="rtl">
					{words.map((v) => (
						<button
							key={v.id}
							onClick={() => {
								if (verbWord) {
									const event = new CustomEvent('addWordToActiveZone', {
										detail: v.word,
									})
									window.dispatchEvent(event)
								} else {
									handleSelectWord(v.word)
								}
							}}
							disabled={userOrder.includes(v.word)}
							className={`px-3 py-2 rounded text-2xl font-times border-2 hover:opacity-80 ${
								userOrder.includes(v.word)
									? 'bg-gray-300 border-gray-400 cursor-not-allowed'
									: getGenderColor(v.gender)
							}`}
						>
							{v.word}
						</button>
					))}
				</div>
			</div>
		)
	}

	// --- Filter UI ---
	function renderFilters() {
		return (
			<div className="space-y-3 mb-4">
				{/* Levels */}
				<h2 className="text-xl font-semibold mb-2">Select Levels</h2>
				<div className="flex flex-wrap justify-center gap-2">
					<button
						onClick={() => setSelectedLevels([])}
						className="px-3 py-1 border rounded-full text-xs bg-red-100 hover:bg-red-200"
					>
						Clear
					</button>
					<button
						onClick={() => setSelectedLevels(levelOptions)}
						className="px-3 py-1 border rounded-full text-xs bg-green-100 hover:bg-green-200"
					>
						All
					</button>
					{levelOptions.map((lvl) => (
						<button
							key={lvl}
							onClick={() =>
								setSelectedLevels((prev) =>
									prev.includes(lvl)
										? prev.filter((l) => l !== lvl)
										: [...prev, lvl]
								)
							}
							className={`px-3 py-1 border rounded-full text-xs ${
								selectedLevels.includes(lvl)
									? 'bg-sky-600 text-white'
									: 'bg-gray-200'
							}`}
						>
							Level {lvl}
						</button>
					))}
				</div>

				{/* Quantities */}
				<h2 className="text-xl font-semibold mb-2 mt-4">Select Quantity</h2>
				<div className="flex flex-wrap justify-center gap-2">
					<button
						onClick={() => setSelectedQuantities([])}
						className="px-3 py-1 border rounded-full text-xs bg-red-100 hover:bg-red-200"
					>
						Clear
					</button>
					<button
						onClick={() => setSelectedQuantities(['s', 'p'])}
						className="px-3 py-1 border rounded-full text-xs bg-green-100 hover:bg-green-200"
					>
						Both
					</button>
					{['s', 'p'].map((q) => (
						<button
							key={q}
							onClick={() =>
								setSelectedQuantities((prev) =>
									prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]
								)
							}
							className={`px-3 py-1 border rounded-full text-xs ${
								selectedQuantities.includes(q)
									? 'bg-sky-600 text-white'
									: 'bg-gray-200'
							}`}
						>
							{q === 's' ? 'Singular' : 'Plural'}
						</button>
					))}
				</div>
			</div>
		)
	}

	// --- Summary Screen ---
	if (finished) {
		return (
			<div className="p-8 max-w-4xl mx-auto text-center">
				{Confetti}
				<h1 className="text-5xl font-bold text-green-700 mb-6">
					You finished all 5 phrases!
					<Image
						src="/icons/iconShofar.png"
						alt="Shofar Celebration"
						width={100}
						height={100}
						className="animate-pulse text-center justify-center mx-auto"
					/>
				</h1>
				<p className="text-2xl mb-6">
					You’ve earned{' '}
					<strong>
						+{calculatePoints()} point{calculatePoints() > 1 ? 's' : ''}
					</strong>
					!
				</p>
				<p className="text-lg text-gray-700 mb-8">
					Want to try another round? Click below to reshuffle and continue your
					streak!
				</p>
				<button
					onClick={handleRestart}
					className="px-6 py-3 bg-sky-600 text-white text-2xl rounded hover:bg-sky-700"
				>
					Restart / Reshuffle
				</button>
			</div>
		)
	}

	// --- Main Screen ---
	return (
		<div className="p-4 max-w-5xl mx-auto text-center">
			{Confetti}
			{/* 🔹 Filter Button */}
			<div className="mb-6 flex justify-center">
				<button
					onClick={() => setShowFilter((prev) => !prev)}
					className={`px-4 py-2 rounded shadow flex items-center justify-center gap-3 ${
						showFilter ? 'bg-sky-600 text-white' : 'bg-gray-200'
					}`}
				>
					<Image
						src="/books-svgrepo-com.svg"
						alt="Filter icon"
						width={30}
						height={30}
					/>
					Filter
				</button>
			</div>

			{showFilter && renderFilters()}

			{/* Prompt */}
			<div className="mb-6 p-4 border-2 border-sky-300 bg-sky-50 rounded-xl shadow text-2xl font-bold">
				{/* Target phrase: &apos;{displayEnglish}&apos; */}
				Target phrase: &apos;{currentPhrase.english}&apos;
			</div>

			{/* Drop area */}
			{verbWord ? (
				<DropAreaWithVerb
					verbWord={verbWord}
					userOrder={userOrder}
					handleRemoveWord={handleRemoveWord}
					getGenderColor={getGenderColor}
					vocab={[...vocab]}
					currentIndex={currentIndex} // ✅ NEW PROP
				/>
			) : (
				<div
					className="min-h-[100px] border-2 border-dashed border-gray-400 rounded-lg flex flex-wrap justify-center items-center p-4 mb-6"
					dir="rtl"
				>
					{userOrder.length === 0 ? (
						<span className="text-gray-400 italic">Build the phrase here</span>
					) : (
						userOrder.map((word, idx) => {
							const vocabEntry = vocab.find((v) => v.word === word)
							const color = vocabEntry ? getGenderColor(vocabEntry.gender) : ''
							return (
								<span
									key={idx}
									onClick={() => handleRemoveWord(idx)}
									className={`px-3 py-2 mx-1 my-1 rounded text-2xl sm:text-3xl md:text-4xl font-times cursor-pointer hover:opacity-80 border-2 ${color}`}
								>
									{word}
								</span>
							)
						})
					)}
				</div>
			)}

			{/* Controls */}
			<div className="flex justify-center gap-4 mb-4">
				<button
					onClick={goToPrevious}
					className="p-2 px-4 bg-gray-300 hover:bg-gray-400 rounded"
				>
					←
				</button>
				<button
					onClick={handleCheck}
					className="p-2 px-4 bg-green-500 text-white hover:bg-green-600 rounded"
				>
					Check
				</button>
				<button
					onClick={goToNext}
					className="p-2 px-4 bg-gray-300 hover:bg-gray-400 rounded"
				>
					→
				</button>
			</div>

			{/* Progress */}
			<ProgressBar currentIndex={currentIndex} total={phrasePool.length} />

			{/* Feedback */}
			{showFeedback !== null && (
				<p
					className={`text-xl mt-4 font-semibold ${
						showFeedback ? 'text-green-600' : 'text-red-500'
					}`}
				>
					{showFeedback ? (
						<p>Correct!</p>
					) : (
						<p>
							Incorrect. Correct answer:{' '}
							<span className="font-times text-4xl font-medium">
								{correctOrder.join(' ')}
							</span>
						</p>
					)}
				</p>
			)}

			{/* Word bank (scrollable area) */}
			<div className="mt-6 h-[45vh] overflow-y-auto border-t-2 border-gray-300 rounded-b-xl">
				<h3 className="sticky top-0 z-10 bg-white text-2xl font-bold m-0 py-2 border-b border-gray-200">
					Word Bank
				</h3>

				<div className="pt-2 px-2">
					{renderSection('Masculine Nouns', masculineNouns)}
					{renderSection('Feminine Nouns', feminineNouns)}
					{renderSection('Adjectives', adjectives)}
					{renderSection('Demonstratives', demonstratives)}
				</div>
			</div>
		</div>
	)
}

function DropAreaWithVerb({
	verbWord,
	userOrder,
	handleRemoveWord,
	getGenderColor,
	vocab,
	currentIndex, // ✅ NEW
}: {
	verbWord: string
	userOrder: string[]
	handleRemoveWord: (index: number) => void
	getGenderColor: (gender: string) => string
	vocab: readonly VocabEntry[]
	currentIndex: number // ✅ NEW
}) {
	const [activeZone, setActiveZone] = useState<'first' | 'second'>('first')
	const [zoneWords, setZoneWords] = useState<{
		first: string[]
		second: string[]
	}>({
		first: [],
		second: [],
	})

	useEffect(() => {
		setZoneWords({ first: [], second: [] })
		setActiveZone('first')
	}, [currentIndex])

	// Handle word selection from word bank
	const addWordToActiveZone = useCallback(
		(word: string) => {
			setZoneWords((prev) => {
				const newZones = { ...prev }
				newZones[activeZone] = [...newZones[activeZone], word]
				return newZones
			})
		},
		[activeZone]
	)

	// Listen for new words to add from main component
	useEffect(() => {
		function handleRequestAddWordToZone(e: CustomEvent<string>) {
			addWordToActiveZone(e.detail)
		}
		window.addEventListener(
			'requestAddWordToZone',
			handleRequestAddWordToZone as EventListener
		)
		return () => {
			window.removeEventListener(
				'requestAddWordToZone',
				handleRequestAddWordToZone as EventListener
			)
		}
	}, [addWordToActiveZone])

	// Sync main component’s userOrder with combined zones
	useEffect(() => {
		const combined = [...zoneWords.first, ...zoneWords.second]
		if (combined.join(' ') !== userOrder.join(' ')) {
			// Reconstruct order to maintain global checking logic
			const event = new CustomEvent('updateUserOrder', { detail: combined })
			window.dispatchEvent(event)
		}
	}, [zoneWords, userOrder])

	// Handle removing a word from one of the zones
	const removeWord = (zone: 'first' | 'second', idx: number) => {
		setZoneWords((prev) => ({
			...prev,
			[zone]: prev[zone].filter((_, i) => i !== idx),
		}))
	}

	return (
		<div
			className="flex items-center justify-center gap-4 mb-6 flex-wrap"
			dir="rtl"
		>
			{/* First zone */}
			<div
				onClick={() => setActiveZone('first')}
				className={`min-h-[100px] border-2 border-dashed rounded-lg flex flex-wrap justify-center items-center p-4 flex-1 cursor-pointer transition-all ${
					activeZone === 'first'
						? 'border-sky-600 bg-sky-50'
						: 'border-gray-400 bg-white'
				}`}
			>
				{zoneWords.first.length === 0 ? (
					<span className="text-gray-400 italic">
						Click here to build first part
					</span>
				) : (
					zoneWords.first.map((word, idx) => {
						const vocabEntry = vocab.find((v) => v.word === word)
						const color = vocabEntry ? getGenderColor(vocabEntry.gender) : ''
						return (
							<span
								key={`first-${idx}`}
								onClick={(e) => {
									e.stopPropagation()
									removeWord('first', idx)
								}}
								className={`px-3 py-2 mx-1 my-1 rounded text-3xl font-times cursor-pointer hover:opacity-80 border-2 ${color}`}
							>
								{word}
							</span>
						)
					})
				)}
			</div>

			{/* Verb display */}
			<div className="flex flex-col">
				<span className="text-3xl font-bold text-gray-600">({verbWord})</span>
				<span className="text-xs">implied</span>
			</div>
			{/* Second zone */}
			<div
				onClick={() => setActiveZone('second')}
				className={`min-h-[100px] border-2 border-dashed rounded-lg flex flex-wrap justify-center items-center p-4 flex-1 cursor-pointer transition-all ${
					activeZone === 'second'
						? 'border-sky-600 bg-sky-50'
						: 'border-gray-400 bg-white'
				}`}
			>
				{zoneWords.second.length === 0 ? (
					<span className="text-gray-400 italic">
						Click here to build second part
					</span>
				) : (
					zoneWords.second.map((word, idx) => {
						const vocabEntry = vocab.find((v) => v.word === word)
						const color = vocabEntry ? getGenderColor(vocabEntry.gender) : ''
						return (
							<span
								key={`second-${idx}`}
								onClick={(e) => {
									e.stopPropagation()
									removeWord('second', idx)
								}}
								className={`px-3 py-2 mx-1 my-1 rounded text-3xl font-times cursor-pointer hover:opacity-80 border-2 ${color}`}
							>
								{word}
							</span>
						)
					})
				)}
			</div>
		</div>
	)
}
