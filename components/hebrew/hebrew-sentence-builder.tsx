'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import ProgressBar from '../progress-bar'
import { phrases } from '@/lib/sentence-builder-phrases'
import { vocab, VocabEntry } from '@/lib/sentence-builder-specifics'
import { useCelebration } from '@/hooks/useCelebration'
import Image from 'next/image'
import { CircleHelp, X } from 'lucide-react'

interface HebrewSentenceBuilderProps {
	userId: string
	courseId: number | null
}

type VerbZone = 'first' | 'second'
type DragSource = 'bank' | 'single' | VerbZone

interface DragPayload {
	word: string
	source: DragSource
	index?: number
}

const DRAG_PAYLOAD_MIME = 'application/x-sentence-builder-word'
const TARGET_PHRASE_OPTIONS = [5, 10, 15, 20, 25, 30] as const

function pickInitialPhrasePool(targetCount: number) {
	return phrases.slice(0, targetCount)
}

function shufflePhrasePool(source: typeof phrases, targetCount: number) {
	return [...source].sort(() => Math.random() - 0.5).slice(0, targetCount)
}

function setDragPayload(
	dataTransfer: DataTransfer,
	payload: DragPayload,
) {
	dataTransfer.setData(DRAG_PAYLOAD_MIME, JSON.stringify(payload))
	dataTransfer.setData('text/plain', payload.word)
	dataTransfer.effectAllowed = 'move'
}

function getDragPayload(dataTransfer: DataTransfer): DragPayload | null {
	const rawPayload = dataTransfer.getData(DRAG_PAYLOAD_MIME)
	if (rawPayload) {
		try {
			return JSON.parse(rawPayload) as DragPayload
		} catch {
			return null
		}
	}

	const word = dataTransfer.getData('text/plain')
	return word ? { word, source: 'bank' } : null
}

export default function HebrewSentenceBuilder({
	userId,
	courseId,
}: HebrewSentenceBuilderProps) {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isDraggingWord, setIsDraggingWord] = useState(false)
	const [userOrder, setUserOrder] = useState<string[]>([])
	const [userZones, setUserZones] = useState<{
		first: string[]
		second: string[]
	} | null>(null)
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [completedCount, setCompletedCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const timerRef = useRef<NodeJS.Timeout | null>(null)
	const { Confetti, celebrate } = useCelebration()
	const [hasAwardedPoints, setHasAwardedPoints] = useState(false)
	const [showFilter, setShowFilter] = useState(false)
	const [showHelp, setShowHelp] = useState(false)
	const [singleDropIndex, setSingleDropIndex] = useState<number | null>(null)
	const [selectedLevels, setSelectedLevels] = useState<number[]>([1])
	const [selectedQuantities, setSelectedQuantities] = useState<string[]>(['s'])
	const [selectedTargetCount, setSelectedTargetCount] = useState(5)
	const [awardedMilestones, setAwardedMilestones] = useState(0)

	// Extract all available levels dynamically
	const levelOptions = useMemo(
		() =>
			Array.from(new Set(phrases.map((p) => p.level))).sort((a, b) => a - b),
		[],
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

	const effectiveTargetCount = useMemo(() => {
		const cappedTarget = Math.min(selectedTargetCount, filteredPhrases.length)
		const matchingOption = [...TARGET_PHRASE_OPTIONS]
			.reverse()
			.find((count) => count <= cappedTarget)

		return matchingOption ?? filteredPhrases.length
	}, [filteredPhrases.length, selectedTargetCount])

	const [phrasePool, setPhrasePool] = useState(() =>
		pickInitialPhrasePool(5),
	)

	useEffect(() => {
		setPhrasePool(shufflePhrasePool(filteredPhrases, effectiveTargetCount))
		setCurrentIndex(0)
		setCompletedCount(0)
		setFinished(false)
		setHasAwardedPoints(false)
		setAwardedMilestones(0)
		setShowFeedback(null)
		setUserOrder([])
		setUserZones(null)
	}, [filteredPhrases, effectiveTargetCount])

	const currentPhrase = phrasePool[currentIndex]
	const verbMatch = currentPhrase?.english.match(/\(([^)]+)\)/)
	const verbWord = verbMatch ? verbMatch[1] : null
	const correctOrder = currentPhrase?.hebrew.split(' ') ?? []
	const totalTargets = phrasePool.length

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
		[userId, courseId],
	)

	useEffect(() => {
		const completedMilestones = Math.floor(completedCount / 5)

		if (completedMilestones > awardedMilestones) {
			setAwardedMilestones(completedMilestones)
			celebrate()

			const shofar = new Audio('/shofar.mp3')
			shofar.play().catch(console.error)

			const points = calculatePoints()
			awardPoints(points)
		}

		if (!hasAwardedPoints && totalTargets > 0 && completedCount >= totalTargets) {
			setHasAwardedPoints(true)
			setFinished(true)
		}
	}, [
		completedCount,
		awardedMilestones,
		hasAwardedPoints,
		celebrate,
		awardPoints,
		calculatePoints,
		totalTargets,
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
		function handleUpdateUserZones(e: Event) {
			const custom = e as CustomEvent<{
				first: string[]
				second: string[]
			}>
			setUserZones(custom.detail)
		}
		window.addEventListener('updateUserZones', handleUpdateUserZones)
		return () => {
			window.removeEventListener('updateUserZones', handleUpdateUserZones)
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
			handleAddWordToZone as EventListener,
		)
		return () => {
			window.removeEventListener(
				'addWordToActiveZone',
				handleAddWordToZone as EventListener,
			)
		}
	}, [])

	// --- Handlers ---
	function handleSelectWord(word: string) {
		if (userOrder.includes(word)) return
		setUserOrder((prev) => [...prev, word])
	}

	function handleRemoveWord(index: number) {
		setUserOrder((prev) => prev.filter((_, i) => i !== index))
	}

	function insertWordIntoOrder(payload: DragPayload, targetIndex?: number) {
		setUserOrder((prev) => {
			if (!payload.word) return prev

			const next = [...prev]
			let insertionIndex = targetIndex ?? next.length

			if (payload.source === 'single' && payload.index !== undefined) {
				const [movedWord] = next.splice(payload.index, 1)
				if (!movedWord) return prev

				if (payload.index < insertionIndex) {
					insertionIndex -= 1
				}

				next.splice(insertionIndex, 0, movedWord)
				return next
			}

			if (next.includes(payload.word)) return prev
			next.splice(insertionIndex, 0, payload.word)
			return next
		})
	}

	function normalizeHebrew(text: string): string {
		return text
			.normalize('NFKC') // normalize presentation forms
			.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '') // remove niqqud marks
			.replace(/[שׁשׂ]/g, 'ש') // normalize old presentation forms
			.trim()
	}

	function getExpectedZones() {
		if (!verbWord) return null

		const trimmedEnglish = currentPhrase.english.trim()
		const isCopularDemonstrative = /^(This|These)\s+\([^)]+\)/.test(
			trimmedEnglish,
		)

		if (isCopularDemonstrative) {
			return {
				first: correctOrder.slice(0, 1),
				second: correctOrder.slice(1),
			}
		}

		return {
			first: correctOrder.slice(0, -1),
			second: correctOrder.slice(-1),
		}
	}

	function handleCheck() {
		const isCorrect = (() => {
			if (!verbWord) {
				const joinedUser = userOrder.join(' ')
				const joinedCorrect = correctOrder.join(' ')
				return normalizeHebrew(joinedUser) === normalizeHebrew(joinedCorrect)
			}

			const expectedZones = getExpectedZones()
			if (!expectedZones || !userZones) return false

			return (
				normalizeHebrew(userZones.first.join(' ')) ===
					normalizeHebrew(expectedZones.first.join(' ')) &&
				normalizeHebrew(userZones.second.join(' ')) ===
					normalizeHebrew(expectedZones.second.join(' '))
			)
		})()

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
		setUserZones(null)
		setShowFeedback(null)
	}

	function goToPrevious() {
		if (timerRef.current) clearTimeout(timerRef.current)
		setCurrentIndex((i) => (i - 1 + phrasePool.length) % phrasePool.length)
		setUserOrder([])
		setUserZones(null)
		setShowFeedback(null)
	}

	function handleRestart() {
		setHasAwardedPoints(false)
		setFinished(false)
		setCompletedCount(0)
		setAwardedMilestones(0)
		setShowFeedback(null)
		setUserOrder([])
		setUserZones(null)
		setCurrentIndex(0)
		setSelectedLevels([1])
		setSelectedQuantities(['s'])
		setSelectedTargetCount(5)
		setShowFilter(true)
		setPhrasePool(shufflePhrasePool(phrases, 5))
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
							draggable={!userOrder.includes(v.word)}
							onDragStart={(e) => {
								setIsDraggingWord(true)
								setDragPayload(e.dataTransfer, {
									word: v.word,
									source: 'bank',
								})
							}}
							onDragEnd={() => {
								setIsDraggingWord(false)
								setSingleDropIndex(null)
							}}
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
										: [...prev, lvl],
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
									prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q],
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

				<h2 className="text-xl font-semibold mb-2 mt-4">Target Phrases</h2>
				<div className="flex flex-wrap justify-center gap-2">
					{TARGET_PHRASE_OPTIONS.map((count) => {
						const disabled = filteredPhrases.length < count

						return (
							<button
								key={count}
								onClick={() => setSelectedTargetCount(count)}
								disabled={disabled}
								className={`px-3 py-1 border rounded-full text-xs ${
									selectedTargetCount === count
										? 'bg-sky-600 text-white'
										: 'bg-gray-200'
								} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
							>
								{count}
							</button>
						)
					})}
				</div>
				<p className="text-center text-xs text-gray-600">
					Points are awarded every 5 completed phrases.
				</p>
			</div>
		)
	}

	if (!currentPhrase) {
		return (
			<div className="p-4 max-w-5xl mx-auto text-center">
				<div className="mb-4 flex justify-center gap-3 flex-wrap">
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
				<p className="text-lg text-gray-700">
					No phrases match the current filters. Adjust the filters to keep
					building.
				</p>
			</div>
		)
	}

	// --- Summary Screen ---
	if (finished) {
		return (
			<div className="p-8 max-w-4xl mx-auto text-center">
				{Confetti}
				<h1 className="text-5xl font-bold text-green-700 mb-6">
					You finished all {totalTargets} phrases!
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
						+{awardedMilestones * calculatePoints()} point
						{awardedMilestones * calculatePoints() !== 1 ? 's' : ''}
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
			{/* 🔹 Top controls */}
			<div className="mb-4 flex justify-center gap-3 flex-wrap">
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
				<button
					onClick={() => setShowHelp((prev) => !prev)}
					aria-expanded={showHelp}
					aria-controls="sentence-builder-help"
					className={`px-4 py-2 rounded shadow flex items-center justify-center gap-2 ${
						showHelp ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-900'
					}`}
				>
					<CircleHelp className="h-5 w-5" />
					Help
				</button>
			</div>

			{showFilter && renderFilters()}
			{showHelp && (
				<div
					id="sentence-builder-help"
					className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-left shadow-sm"
				>
					<div className="mb-3 flex items-start justify-between gap-3">
						<div>
							<h2 className="text-lg font-bold text-amber-950">
								How to use Sentence Builder
							</h2>
						</div>
						<button
							onClick={() => setShowHelp(false)}
							aria-label="Close help"
							className="rounded-full p-1 text-amber-900 hover:bg-amber-200"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
					<div className="space-y-4 text-sm leading-6 text-amber-950">
						<p>
							Hebrew typically uses a Subject-Verb-Object (SVO) word order when
							constructing sentences.
						</p>
						<p>
							{' '}
							The <strong>subject</strong> is the person or thing performing the
							action of the verb.{' '}
						</p>
						<p>
							The <strong>object</strong> is the person or thing receiving the
							action of the verb.
						</p>
						<p>
							Both the <strong>subject</strong> and the <strong>object</strong>{' '}
							may include descriptive words such as <strong>adjectives</strong>{' '}
							(e.g., big, good) or <strong>demonstratives</strong> (e.g., this,
							these). When these are present, they must{' '}
							<strong>agree with the noun in gender and number.</strong>
						</p>
						<p>
							In Hebrew, the order within a noun phrase is:
							<br />
							<strong>Noun → Adjective → Demonstrative</strong>
						</p>
						<p>
							This is the reverse of English word order, where the descriptive
							words usually come before the noun.
						</p>
						<p>
							There isn&apos;t a direct equivalent of the verb is/are in Hebrew.
							This is implied for now. Future verbs will take it&apos;s place
							soon. Also the indefinite (meaning not specific) article
							&apos;a&apos; or &apos;a&apos; are implied in Hebrew.
						</p>
						<div>
							<h2 className="text-lg font-bold text-amber-950">
								Steps for Building a Sentence
							</h2>
							<ol className="mt-2 list-decimal space-y-2 pl-5">
								<li>
									<strong>Locate the verb (if there is one).</strong> This will
									help you determine whether you are building a{' '}
									<strong>phrase</strong> or a
									<strong>complete sentence.</strong> If it is a full sentence,
									work on one side of the verb at a time.
								</li>
								<li>
									<strong>Translate the subject first, then the object.</strong>{' '}
									Remember that Hebrew is read <strong>right to left,</strong>{' '}
									so words that appear on the left side in English will appear
									on the right side in Hebrew.
								</li>
								<li>
									<strong>
										Arrange the words correctly within each phrase.
									</strong>{' '}
									Place the <strong>noun first,</strong> followed by any{' '}
									<strong>adjectives</strong>, and finally any{' '}
									<strong>demonstratives.</strong>
								</li>
								<li>
									<strong>
										Determine whether the noun is specific or ambiguous.
									</strong>{' '}
									If the noun is <strong>specific</strong>, it will take the ה־
									(ha-) definite article as a prefix. Any adjectives or
									demonstratives modifying that noun must also take the definite
									article. In English, specificity is usually indicated by{' '}
									<strong>subject“the,” “this,” or “these.”</strong>
								</li>
							</ol>
						</div>
						<div>
							<h2 className="text-lg font-bold text-amber-950">Levels</h2>
							<p>
								There are 9 levels in ascending difficulty. Each have their own
								nuance to help you learn the steps listed above. Try them one at
								a time but then you&apos;ll want to mix and match them to keep
								progressing. Make sure to add in the plurals as well as
								you&apos;re learning.
							</p>
						</div>
					</div>
				</div>
			)}

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
					getGenderColor={getGenderColor}
					vocab={[...vocab]}
					currentIndex={currentIndex} // ✅ NEW PROP
				/>
			) : (
				<div
					onDragOver={(e) => {
						e.preventDefault()
						e.dataTransfer.dropEffect = 'move'
						if (userOrder.length === 0) {
							setSingleDropIndex(0)
						}
					}}
					onDrop={(e) => {
						e.preventDefault()
						const payload = getDragPayload(e.dataTransfer)
						if (payload) {
							insertWordIntoOrder(payload, singleDropIndex ?? userOrder.length)
						}
						setIsDraggingWord(false)
						setSingleDropIndex(null)
					}}
					onDragLeave={() => {
						if (userOrder.length === 0) {
							setSingleDropIndex(null)
						}
					}}
					className="min-h-[100px] border-2 border-dashed border-gray-400 rounded-lg flex flex-wrap justify-center items-center p-4 mb-6"
					dir="rtl"
				>
					{userOrder.length === 0 ? (
						<span
							className={`italic ${
								singleDropIndex === 0
									? 'font-semibold text-sky-700'
									: 'text-gray-400'
							}`}
						>
							{singleDropIndex === 0 && isDraggingWord
								? 'Drop the word here'
								: 'Build the phrase here'}
						</span>
					) : (
						<div className="flex flex-wrap justify-center items-center" dir="rtl">
							{userOrder.map((word, idx) => {
								const vocabEntry = vocab.find((v) => v.word === word)
								const color = vocabEntry ? getGenderColor(vocabEntry.gender) : ''
								return (
									<div key={idx} className="flex items-center my-1">
										<DropSlot
											active={singleDropIndex === idx}
											visible={isDraggingWord}
											onDragOver={(e) => {
												e.preventDefault()
												e.stopPropagation()
												e.dataTransfer.dropEffect = 'move'
												setSingleDropIndex(idx)
											}}
											onDrop={(e) => {
												e.preventDefault()
												e.stopPropagation()
												const payload = getDragPayload(e.dataTransfer)
												if (payload) insertWordIntoOrder(payload, idx)
												setIsDraggingWord(false)
												setSingleDropIndex(null)
											}}
										/>
										<span
											draggable
											onDragStart={(e) => {
												e.stopPropagation()
												setIsDraggingWord(true)
												setDragPayload(e.dataTransfer, {
													word,
													source: 'single',
													index: idx,
												})
											}}
											onDragEnd={() => {
												setIsDraggingWord(false)
												setSingleDropIndex(null)
											}}
											onClick={() => handleRemoveWord(idx)}
											className={`px-3 py-2 mx-1 rounded text-2xl sm:text-3xl md:text-4xl font-times cursor-pointer hover:opacity-80 border-2 ${color}`}
										>
											{word}
										</span>
										{idx === userOrder.length - 1 ? (
											<DropSlot
												active={singleDropIndex === userOrder.length}
												visible={isDraggingWord}
												onDragOver={(e) => {
													e.preventDefault()
													e.stopPropagation()
													e.dataTransfer.dropEffect = 'move'
													setSingleDropIndex(userOrder.length)
												}}
												onDrop={(e) => {
													e.preventDefault()
													e.stopPropagation()
													const payload = getDragPayload(e.dataTransfer)
													if (payload) {
														insertWordIntoOrder(payload, userOrder.length)
													}
													setIsDraggingWord(false)
													setSingleDropIndex(null)
												}}
											/>
										) : null}
									</div>
								)
							})}
						</div>
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
				<div
					className={`text-xl mt-4 font-semibold ${
						showFeedback ? 'text-green-600' : 'text-red-500'
					}`}
				>
					{showFeedback ? (
						<p>Correct!</p>
					) : (
						<div>
							<p>
								Incorrect. It should be:{' '}
								<span className="font-times text-4xl font-medium">
									{correctOrder.join(' ')}
								</span>
							</p>
							<p>
								Make sure the words are on the correct side of the implied verb.
							</p>
						</div>
					)}
				</div>
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
	getGenderColor,
	vocab,
	currentIndex, // ✅ NEW
}: {
	verbWord: string
	userOrder: string[]
	getGenderColor: (gender: string) => string
	vocab: readonly VocabEntry[]
	currentIndex: number // ✅ NEW
}) {
	const [activeZone, setActiveZone] = useState<VerbZone>('first')
	const [isDraggingWord, setIsDraggingWord] = useState(false)
	const [dropIndicator, setDropIndicator] = useState<{
		zone: VerbZone
		index: number
	} | null>(null)
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
		setDropIndicator(null)
		setIsDraggingWord(false)
	}, [currentIndex])

	// Handle word selection from word bank
	const addWordToActiveZone = useCallback(
		(word: string) => {
			if (userOrder.includes(word)) return
			setZoneWords((prev) => {
				const newZones = { ...prev }
				newZones[activeZone] = [...newZones[activeZone], word]
				return newZones
			})
		},
		[activeZone, userOrder],
	)

	const moveWordToZone = useCallback(
		(targetZone: VerbZone, payload: DragPayload, targetIndex?: number) => {
			setZoneWords((prev) => {
				if (!payload.word) return prev

				const next = {
					first: [...prev.first],
					second: [...prev.second],
				}

				let insertionIndex = targetIndex ?? next[targetZone].length

				if (payload.source === 'first' || payload.source === 'second') {
					const sourceZone = payload.source
					const removalIndex =
						payload.index ??
						next[sourceZone].findIndex((word) => word === payload.word)
					if (removalIndex < 0) return prev

					const [movedWord] = next[sourceZone].splice(removalIndex, 1)
					if (!movedWord) return prev

					if (sourceZone === targetZone && removalIndex < insertionIndex) {
						insertionIndex -= 1
					}

					next[targetZone].splice(insertionIndex, 0, movedWord)
					return next
				}

				if (userOrder.includes(payload.word)) return prev
				next[targetZone].splice(insertionIndex, 0, payload.word)
				return next
			})
			setActiveZone(targetZone)
			setDropIndicator(null)
		},
		[userOrder],
	)

	// Listen for new words to add from main component
	useEffect(() => {
		function handleRequestAddWordToZone(e: CustomEvent<string>) {
			addWordToActiveZone(e.detail)
		}
		window.addEventListener(
			'requestAddWordToZone',
			handleRequestAddWordToZone as EventListener,
		)
		return () => {
			window.removeEventListener(
				'requestAddWordToZone',
				handleRequestAddWordToZone as EventListener,
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

		const zoneEvent = new CustomEvent('updateUserZones', {
			detail: zoneWords,
		})
		window.dispatchEvent(zoneEvent)
	}, [zoneWords, userOrder])

	// Handle removing a word from one of the zones
	const removeWord = (zone: VerbZone, idx: number) => {
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
				onDragOver={(e) => {
					e.preventDefault()
					e.dataTransfer.dropEffect = 'move'
					if (zoneWords.first.length === 0) {
						setDropIndicator({ zone: 'first', index: 0 })
					}
				}}
				onDrop={(e) => {
					e.preventDefault()
					const payload = getDragPayload(e.dataTransfer)
					if (payload) {
						moveWordToZone(
							'first',
							payload,
							dropIndicator?.zone === 'first'
								? dropIndicator.index
								: zoneWords.first.length,
						)
					}
					setIsDraggingWord(false)
					setDropIndicator(null)
				}}
				onDragLeave={() => {
					if (zoneWords.first.length === 0 && dropIndicator?.zone === 'first') {
						setDropIndicator(null)
					}
				}}
				className={`min-h-[100px] border-2 border-dashed rounded-lg flex flex-wrap justify-center items-center p-4 flex-1 cursor-pointer transition-all ${
					activeZone === 'first'
						? 'border-sky-600 bg-sky-50'
						: 'border-gray-400 bg-white'
				}`}
			>
				{zoneWords.first.length === 0 ? (
					<span
						className={`italic ${
							dropIndicator?.zone === 'first' && dropIndicator.index === 0
								? 'font-semibold text-sky-700'
								: 'text-gray-400'
						}`}
					>
						{dropIndicator?.zone === 'first' && dropIndicator.index === 0
							? 'Drop the subject here'
							: 'build the subject of the sentence here'}
					</span>
				) : (
					<div className="flex flex-wrap justify-center items-center" dir="rtl">
						{zoneWords.first.map((word, idx) => {
							const vocabEntry = vocab.find((v) => v.word === word)
							const color = vocabEntry ? getGenderColor(vocabEntry.gender) : ''
							return (
								<div key={`first-${idx}`} className="flex items-center my-1">
									<DropSlot
										active={
											dropIndicator?.zone === 'first' &&
											dropIndicator.index === idx
										}
										visible={isDraggingWord}
										onDragOver={(e) => {
											e.preventDefault()
											e.stopPropagation()
											e.dataTransfer.dropEffect = 'move'
											setDropIndicator({ zone: 'first', index: idx })
										}}
										onDrop={(e) => {
											e.preventDefault()
											e.stopPropagation()
											const payload = getDragPayload(e.dataTransfer)
											if (payload) moveWordToZone('first', payload, idx)
											setIsDraggingWord(false)
											setDropIndicator(null)
										}}
									/>
									<span
										draggable
										onDragStart={(e) => {
											e.stopPropagation()
											setIsDraggingWord(true)
											setDragPayload(e.dataTransfer, {
												word,
												source: 'first',
												index: idx,
											})
										}}
										onDragEnd={() => {
											setIsDraggingWord(false)
											setDropIndicator(null)
										}}
										onClick={(e) => {
											e.stopPropagation()
											removeWord('first', idx)
										}}
										className={`px-3 py-2 mx-1 rounded text-3xl font-times cursor-pointer hover:opacity-80 border-2 ${color}`}
									>
										{word}
									</span>
									{idx === zoneWords.first.length - 1 ? (
										<DropSlot
											active={
												dropIndicator?.zone === 'first' &&
												dropIndicator.index === zoneWords.first.length
											}
											visible={isDraggingWord}
											onDragOver={(e) => {
												e.preventDefault()
												e.stopPropagation()
												e.dataTransfer.dropEffect = 'move'
												setDropIndicator({
													zone: 'first',
													index: zoneWords.first.length,
												})
											}}
											onDrop={(e) => {
												e.preventDefault()
												e.stopPropagation()
												const payload = getDragPayload(e.dataTransfer)
												if (payload) {
													moveWordToZone(
														'first',
														payload,
														zoneWords.first.length,
													)
												}
												setIsDraggingWord(false)
												setDropIndicator(null)
											}}
										/>
									) : null}
								</div>
							)
						})}
					</div>
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
				onDragOver={(e) => {
					e.preventDefault()
					e.dataTransfer.dropEffect = 'move'
					if (zoneWords.second.length === 0) {
						setDropIndicator({ zone: 'second', index: 0 })
					}
				}}
				onDrop={(e) => {
					e.preventDefault()
					const payload = getDragPayload(e.dataTransfer)
					if (payload) {
						moveWordToZone(
							'second',
							payload,
							dropIndicator?.zone === 'second'
								? dropIndicator.index
								: zoneWords.second.length,
						)
					}
					setIsDraggingWord(false)
					setDropIndicator(null)
				}}
				onDragLeave={() => {
					if (zoneWords.second.length === 0 && dropIndicator?.zone === 'second') {
						setDropIndicator(null)
					}
				}}
				className={`min-h-[100px] border-2 border-dashed rounded-lg flex flex-wrap justify-center items-center p-4 flex-1 cursor-pointer transition-all ${
					activeZone === 'second'
						? 'border-sky-600 bg-sky-50'
						: 'border-gray-400 bg-white'
				}`}
			>
				{zoneWords.second.length === 0 ? (
					<span
						className={`italic ${
							dropIndicator?.zone === 'second' && dropIndicator.index === 0
								? 'font-semibold text-sky-700'
								: 'text-gray-400'
						}`}
					>
						{dropIndicator?.zone === 'second' && dropIndicator.index === 0
							? 'Drop the object here'
							: 'build the object of the sentence here'}
					</span>
				) : (
					<div className="flex flex-wrap justify-center items-center" dir="rtl">
						{zoneWords.second.map((word, idx) => {
							const vocabEntry = vocab.find((v) => v.word === word)
							const color = vocabEntry ? getGenderColor(vocabEntry.gender) : ''
							return (
								<div key={`second-${idx}`} className="flex items-center my-1">
									<DropSlot
										active={
											dropIndicator?.zone === 'second' &&
											dropIndicator.index === idx
										}
										visible={isDraggingWord}
										onDragOver={(e) => {
											e.preventDefault()
											e.stopPropagation()
											e.dataTransfer.dropEffect = 'move'
											setDropIndicator({ zone: 'second', index: idx })
										}}
										onDrop={(e) => {
											e.preventDefault()
											e.stopPropagation()
											const payload = getDragPayload(e.dataTransfer)
											if (payload) moveWordToZone('second', payload, idx)
											setIsDraggingWord(false)
											setDropIndicator(null)
										}}
									/>
									<span
										draggable
										onDragStart={(e) => {
											e.stopPropagation()
											setIsDraggingWord(true)
											setDragPayload(e.dataTransfer, {
												word,
												source: 'second',
												index: idx,
											})
										}}
										onDragEnd={() => {
											setIsDraggingWord(false)
											setDropIndicator(null)
										}}
										onClick={(e) => {
											e.stopPropagation()
											removeWord('second', idx)
										}}
										className={`px-3 py-2 mx-1 rounded text-3xl font-times cursor-pointer hover:opacity-80 border-2 ${color}`}
									>
										{word}
									</span>
									{idx === zoneWords.second.length - 1 ? (
										<DropSlot
											active={
												dropIndicator?.zone === 'second' &&
												dropIndicator.index === zoneWords.second.length
											}
											visible={isDraggingWord}
											onDragOver={(e) => {
												e.preventDefault()
												e.stopPropagation()
												e.dataTransfer.dropEffect = 'move'
												setDropIndicator({
													zone: 'second',
													index: zoneWords.second.length,
												})
											}}
											onDrop={(e) => {
												e.preventDefault()
												e.stopPropagation()
												const payload = getDragPayload(e.dataTransfer)
												if (payload) {
													moveWordToZone(
														'second',
														payload,
														zoneWords.second.length,
													)
												}
												setIsDraggingWord(false)
												setDropIndicator(null)
											}}
										/>
									) : null}
								</div>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}

function DropSlot({
	active,
	visible,
	onDragOver,
	onDrop,
}: {
	active: boolean
	visible: boolean
	onDragOver: React.DragEventHandler<HTMLSpanElement>
	onDrop: React.DragEventHandler<HTMLSpanElement>
}) {
	return (
		<span
			onDragOver={onDragOver}
			onDrop={onDrop}
			className={`mx-1 inline-flex h-12 items-center justify-center rounded-full transition-all ${
				visible ? 'w-4 opacity-100' : 'w-0 opacity-0'
			} ${active ? 'bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.18)]' : 'bg-sky-200/70'}`}
			aria-hidden="true"
		/>
	)
}
