'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import ProgressBar from '../progress-bar'
import { phrases } from '@/lib/sentence-builder-phrases'
import { vocab, VocabEntry } from '@/lib/sentence-builder-specifics'
import { useCelebration } from '@/hooks/useCelebration'
import Image from 'next/image'
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
	useDroppable,
} from '@dnd-kit/core'

import {
	SortableContext,
	useSortable,
	arrayMove,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
interface SentenceBuilderProps {
	userId: string
}

export default function SentenceBuilder({ userId }: SentenceBuilderProps) {
	const [currentIndex, setCurrentIndex] = useState(0)
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

	// --- shuffle phrases once and pick 5 ---
	const [phrasePool, setPhrasePool] = useState(() =>
		[...phrases].sort(() => Math.random() - 0.5).slice(0, 5)
	)
	const currentPhrase = phrasePool[currentIndex]
	const verbMatch = currentPhrase.english.match(/\(([^)]+)\)/)
	const verbWord = verbMatch ? verbMatch[1] : null
	const displayEnglish = currentPhrase.english.replace(/\s*\([^)]+\)\s*/g, ' ')

	const correctOrder = currentPhrase.hebrew.split(' ')

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
			const masculineNouns = vocab
				.filter((v) => v.type === 'noun' && v.gender === 'm')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			const feminineNouns = vocab
				.filter((v) => v.type === 'noun' && v.gender === 'f')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			const adjectives = vocab
				.filter((v) => v.type === 'adjective')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			const demonstratives = vocab
				.filter((v) => v.type === 'demonstrative')
				.sort((a, b) => a.word.localeCompare(b.word, 'he'))

			return { masculineNouns, feminineNouns, adjectives, demonstratives }
		}, [])

	// --- Award Points Helper ---
	const awardPoints = useCallback(
		async (points: number) => {
			try {
				await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, points }),
				})
			} catch (error) {
				console.error('Failed to award points', error)
			}
		},
		[userId]
	)

	useEffect(() => {
		if (!hasAwardedPoints && completedCount >= 5) {
			setHasAwardedPoints(true)
			setFinished(true)
			celebrate()

			const shofar = new Audio('/shofar.mp3')
			shofar.play().catch(console.error)

			awardPoints(1)
		}
	}, [completedCount, hasAwardedPoints, celebrate, awardPoints])

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

	function getExpectedZones() {
		if (!verbWord) return null

		const trimmedEnglish = currentPhrase.english.trim()
		const isCopularDemonstrative =
			/^(This|These)\s+\([^)]+\)/.test(trimmedEnglish)

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
		setShowFeedback(null)
		setUserOrder([])
		setUserZones(null)
		setCurrentIndex(0)
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
									// Send event so DropAreaWithVerb catches it
									const event = new CustomEvent('addWordToActiveZone', {
										detail: v.word,
									})
									window.dispatchEvent(event)
								} else {
									handleSelectWord(v.word)
								}
							}}
							disabled={userOrder.includes(v.word)}
							className={`px-3 py-2 rounded text-2xl sm:text-3xl md:text-4xl font-times border-2 hover:opacity-80 ${
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
					You’ve earned <strong>+1 point</strong>!
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

			{/* Prompt */}
			<div className="mb-6 p-4 border-2 border-sky-300 bg-sky-50 rounded-xl shadow text-2xl font-bold">
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
				<DropAreaSingle
					userOrder={userOrder}
					handleRemoveWord={handleRemoveWord}
					getGenderColor={getGenderColor}
					vocab={[...vocab]}
					setUserOrder={setUserOrder}
				/>
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

			<h3 className="text-2xl font-bold mb-3">Word Bank</h3>

			{/* Word bank sections */}
			{renderSection('Masculine Nouns', masculineNouns)}
			{renderSection('Feminine Nouns', feminineNouns)}
			{renderSection('Adjectives', adjectives)}
			{renderSection('Demonstratives', demonstratives)}
		</div>
	)
}

export function DropAreaWithVerb({
	verbWord,
	userOrder,
	handleRemoveWord,
	getGenderColor,
	vocab,
	currentIndex,
}: {
	verbWord: string
	userOrder: string[]
	handleRemoveWord: (index: number) => void
	getGenderColor: (gender: string) => string
	vocab: readonly VocabEntry[]
	currentIndex: number
}) {
	const [activeZone, setActiveZone] = useState<'first' | 'second'>('first')
	const [zoneWords, setZoneWords] = useState<{
		first: string[]
		second: string[]
	}>({
		first: [],
		second: [],
	})
	const [hoveredZone, setHoveredZone] = useState<string | null>(null)

	// reset on new phrase
	useEffect(() => {
		setZoneWords({ first: [], second: [] })
		setActiveZone('first')
	}, [currentIndex])

	// sensors for drag
	const sensors = useSensors(useSensor(PointerSensor))

	// add word from word bank
	const addWordToActiveZone = useCallback(
		(word: string) => {
			setZoneWords((prev) => ({
				...prev,
				[activeZone]: [...prev[activeZone], word],
			}))
		},
		[activeZone]
	)

	// listen for add requests
	useEffect(() => {
		function handleRequestAddWordToZone(e: Event) {
			const custom = e as CustomEvent<string>
			addWordToActiveZone(custom.detail)
		}
		window.addEventListener('requestAddWordToZone', handleRequestAddWordToZone)
		return () =>
			window.removeEventListener(
				'requestAddWordToZone',
				handleRequestAddWordToZone
			)
	}, [addWordToActiveZone])

	// sync global userOrder
	useEffect(() => {
		const combined = [...zoneWords.first, ...zoneWords.second]
		const event = new CustomEvent('updateUserOrder', { detail: combined })
		window.dispatchEvent(event)

		const zoneEvent = new CustomEvent('updateUserZones', {
			detail: zoneWords,
		})
		window.dispatchEvent(zoneEvent)
	}, [zoneWords])

	// remove word on click
	const removeWord = (zone: 'first' | 'second', idx: number) => {
		setZoneWords((prev) => ({
			...prev,
			[zone]: prev[zone].filter((_, i) => i !== idx),
		}))
	}

	function handleDragOver(event: any) {
		const { over } = event
		if (!over) {
			setHoveredZone(null)
			return
		}
		const zoneId = over.data?.current?.sortable?.containerId || over.id
		setHoveredZone(zoneId)
	}

	// handle drag
	function handleDragEnd(event: DragEndEvent) {
		setHoveredZone(null) // reset highlight

		const { active, over } = event
		if (!over) return

		const [activeZoneId, activeIdx] = active.id.toString().split(':')
		const overZoneId = over.data?.current?.sortable?.containerId || over.id // ✅ get true zone id

		setZoneWords((prev) => {
			const from = activeZoneId as 'first' | 'second'
			const to = overZoneId as 'first' | 'second'
			if (!['first', 'second'].includes(to)) return prev

			const fromItems = [...prev[from]]
			const toItems = [...prev[to]]
			const [movedItem] = fromItems.splice(Number(activeIdx), 1)

			if (from === to) {
				// reorder within same zone
				const targetIdx = over.id.toString().includes(':')
					? Number(over.id.toString().split(':')[1])
					: toItems.length
				const reordered = arrayMove(toItems, Number(activeIdx), targetIdx)
				return { ...prev, [to]: reordered }
			} else {
				// ✅ move across zones
				const targetIdx = over.id.toString().includes(':')
					? Number(over.id.toString().split(':')[1])
					: toItems.length
				toItems.splice(targetIdx, 0, movedItem)
				return { ...prev, [from]: fromItems, [to]: toItems }
			}
		})
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<div
				className="flex items-center justify-center gap-4 mb-6 flex-wrap"
				dir="rtl"
			>
				<Zone
					id="first"
					title="Click here to build first part"
					words={zoneWords.first}
					vocab={vocab}
					getGenderColor={getGenderColor}
					active={activeZone === 'first'}
					isHovered={hoveredZone === 'first'}
					setActiveZone={setActiveZone}
					removeWord={removeWord}
				/>
				<div className="flex flex-col">
					<span className="text-3xl font-bold text-gray-600">({verbWord})</span>
					<span className="text-xs">implied</span>
				</div>
				<Zone
					id="second"
					title="Click here to build second part"
					words={zoneWords.second}
					vocab={vocab}
					getGenderColor={getGenderColor}
					active={activeZone === 'second'}
					isHovered={hoveredZone === 'second'}
					setActiveZone={setActiveZone}
					removeWord={removeWord}
				/>
			</div>
		</DndContext>
	)
}

function DropAreaSingle({
	userOrder,
	handleRemoveWord,
	getGenderColor,
	vocab,
	setUserOrder,
}: {
	userOrder: string[]
	handleRemoveWord: (index: number) => void
	getGenderColor: (gender: string) => string
	vocab: readonly VocabEntry[]
	setUserOrder: React.Dispatch<React.SetStateAction<string[]>>
}) {
	const sensors = useSensors(useSensor(PointerSensor))

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over || active.id === over.id) return

		const oldIndex = Number(active.id)
		const newIndex = Number(over.id)
		setUserOrder((items) => arrayMove(items, oldIndex, newIndex))
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				id="single"
				items={userOrder.map((_, idx) => `${idx}`)}
				strategy={verticalListSortingStrategy}
			>
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
								<SortableWord
									key={idx}
									id={`${idx}`}
									zone="single"
									word={word}
									color={color}
									onRemove={() => handleRemoveWord(idx)}
								/>
							)
						})
					)}
				</div>
			</SortableContext>
		</DndContext>
	)
}

function Zone({
	id,
	title,
	words,
	vocab,
	getGenderColor,
	active,
	isHovered,
	setActiveZone,
	removeWord,
}: {
	id: 'first' | 'second'
	title: string
	words: string[]
	vocab: readonly VocabEntry[]
	getGenderColor: (gender: string) => string
	active: boolean
	isHovered?: boolean
	setActiveZone: (z: 'first' | 'second') => void
	removeWord: (zone: 'first' | 'second', idx: number) => void
}) {
	const { setNodeRef } = useDroppable({ id })

	return (
		<SortableContext
			id={id}
			items={words.map((_, idx) => `${id}:${idx}`)}
			strategy={verticalListSortingStrategy}
		>
			<div
				ref={setNodeRef}
				onClick={() => setActiveZone(id)}
				className={`min-h-[100px] border-2 border-dashed rounded-lg flex flex-wrap justify-center items-center p-4 flex-1 cursor-pointer transition-all ${
					isHovered
						? 'border-green-500 bg-green-50'
						: active
						? 'border-sky-600 bg-sky-50'
						: 'border-gray-400 bg-white'
				}`}
			>
				{words.length === 0 ? (
					<span className="text-gray-400 italic">{title}</span>
				) : (
					words.map((word, idx) => {
						const vocabEntry = vocab.find((v) => v.word === word)
						const color = vocabEntry ? getGenderColor(vocabEntry.gender) : ''
						return (
							<SortableWord
								key={`${id}:${idx}`}
								id={`${id}:${idx}`}
								zone={id}
								word={word}
								color={color}
								onRemove={() => removeWord(id, idx)}
							/>
						)
					})
				)}
			</div>
		</SortableContext>
	)
}

function SortableWord({
	id,
	word,
	color,
	zone,
	onRemove,
}: {
	id: string
	word: string
	color: string
	zone: 'first' | 'second' | 'single'
	onRemove: () => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isOver,
		isDragging,
	} = useSortable({
		id,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition: 'transform 150ms ease, box-shadow 150ms ease',
		boxShadow: isDragging
			? '0 0 10px rgba(0,0,0,0.2)'
			: isOver
			? 'inset 0 0 0 2px #22c55e' // tailwind green-500 border
			: undefined,
		opacity: isDragging ? 0.8 : 1,
	}

	return (
		<span
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			onClick={(e) => {
				e.stopPropagation()
				onRemove()
			}}
			className={`px-3 py-2 mx-1 my-1 rounded text-3xl font-times cursor-move hover:opacity-80 border-2 ${color}`}
		>
			{word}
		</span>
	)
}
