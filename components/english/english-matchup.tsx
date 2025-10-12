'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	DndContext,
	useDraggable,
	useDroppable,
	DragEndEvent,
	useSensor,
	useSensors,
	MouseSensor,
	TouchSensor,
} from '@dnd-kit/core'
import Image from 'next/image'
import { EnglishVocab } from '@/lib/vocab'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'
import FormatFilter, { FormatType } from '../filters/filter-format'
import TypeFilter from '../filters/filter-type'
import CategoryFilter from '../filters/filter-category'
import LessonFilter from '../filters/filter-lesson'

interface EnglishWordMatchGameProps {
	data: EnglishVocab[]
	userId: string
	courseId: number | null
	currentLesson?: number
}

type UniqueIdentifier = string | number
const formatOptions: FormatType[] = ['image', 'audio', 'translation']

function parseLessonKey(key: string) {
	const match = key.match(/^(\d+)?([a-zA-Z]*)$/)
	if (!match) return { num: NaN, text: key }
	return {
		num: match[1] ? parseInt(match[1], 10) : NaN,
		text: match[2] || (match[1] ? '' : key),
	}
}

export default function EnglishWordMatchGame({
	currentLesson,
	courseId,
	data,
	userId,
}: EnglishWordMatchGameProps) {
	const [showFilter, setShowFilter] = useState(false)
	// const [selectedLessons, setSelectedLessons] = useState<string[]>([])
	const [matchField, setMatchField] = useState<keyof EnglishVocab>('images')
	const [matches, setMatches] = useState<Record<string, UniqueIdentifier>>({})
	const [selectedType, setSelectedType] = useState<'all' | 'word' | 'phrase'>(
		'word'
	)
	const [showConfetti, setShowConfetti] = useState(false)
	const [audioEl, state, controls] = useAudio({
		src: '/finish.mp3',
		autoPlay: false,
	})
	const [shuffledDraggables, setShuffledDraggables] = useState<EnglishVocab[]>(
		[]
	)
	const [shuffledTargets, setShuffledTargets] = useState<EnglishVocab[]>([])
	const [hasFinished, setHasFinished] = useState(false)
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [formatType, setFormatType] = useState<FormatType>('translation')
	const [cols, setCols] = useState(4)

	const [targetSize, setTargetSize] = useState<number>(
		parseInt(
			typeof window !== 'undefined'
				? localStorage.getItem('wm_targetSize') || '140'
				: '140',
			10
		)
	)

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('wm_targetSize', String(targetSize))
		}
	}, [targetSize])

	useEffect(() => {
		function updateCols() {
			const containerWidth = window.innerWidth
			const desiredCols = Math.max(
				1,
				Math.floor(containerWidth / (targetSize + 32))
			)
			setCols(desiredCols)
		}
		updateCols()
		window.addEventListener('resize', updateCols)
		return () => window.removeEventListener('resize', updateCols)
	}, [targetSize])

	const { width, height } = useWindowSize()
	const audioRef = useRef<HTMLAudioElement | null>(null)

	const getCardId = (card: EnglishVocab) => String(card.id)

	const lessonOptions = useMemo(() => {
		const allLessons = data.flatMap((card) => card.lessons)
		const uniqueLessons = Array.from(new Set(allLessons))

		return uniqueLessons.sort((a, b) => {
			const A = parseLessonKey(a)
			const B = parseLessonKey(b)

			if (!isNaN(A.num) && !isNaN(B.num)) {
				if (A.num !== B.num) return A.num - B.num
				return A.text.localeCompare(B.text)
			}

			if (!isNaN(A.num) && isNaN(B.num)) return -1
			if (isNaN(A.num) && !isNaN(B.num)) return 1

			return a.localeCompare(b)
		})
	}, [data])

	const allLessonsUpToCurrent = useMemo(() => {
		if (currentLesson === undefined) return []

		return lessonOptions.filter((lesson) => {
			const parsed = parseLessonKey(lesson)
			if (isNaN(parsed.num)) return false
			return parsed.num <= currentLesson
		})
	}, [currentLesson, lessonOptions])

	// const [selectedLessons, setSelectedLessons] = useState<string[]>(
	// 	allLessonsUpToCurrent
	// )
	const [selectedLessons, setSelectedLessons] = useState<string[]>(
		allLessonsUpToCurrent.length > 0 ? allLessonsUpToCurrent : ['1']
	)

	useEffect(() => {
		if (allLessonsUpToCurrent.length > 0) {
			setSelectedLessons(allLessonsUpToCurrent)
		} else {
			setSelectedLessons(['1'])
		}
	}, [allLessonsUpToCurrent])

	const filteredCards = useMemo(() => {
		return data.filter((card) => {
			const hasMatchField =
				matchField === 'images'
					? Array.isArray(card.images) && card.images.length > 0
					: !!card[matchField]
			const matchesType = selectedType === 'all' || card.type === selectedType

			const matchesCategory =
				selectedCategory === 'all' || card.category === selectedCategory

			return hasMatchField && matchesType && matchesCategory
		})
	}, [data, matchField, selectedType, selectedCategory])

	useEffect(() => {
		if (filteredCards.length === 0) {
			setShuffledDraggables([])
			setShuffledTargets([])
			return
		}

		const shuffled = [...filteredCards]
			.sort(() => Math.random() - 0.5)
			.slice(0, 12)
		const shuffled1 = [...shuffled].sort(() => Math.random() - 0.5)
		const shuffled2 = [...shuffled].sort(() => Math.random() - 0.5)

		setShuffledDraggables(shuffled1)
		setShuffledTargets(shuffled2)
		setMatches({})
		setHasFinished(false)
	}, [filteredCards])

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (!over) return

		if (active.id === over.id) {
			setMatches((prev) => ({
				...prev,
				[String(active.id)]: String(over.id),
			}))
		}
	}

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

	const isTouchDevice =
		typeof window !== 'undefined' &&
		('ontouchstart' in window || navigator.maxTouchPoints > 0)

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: { distance: 5 },
		}),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 180, tolerance: 8 },
		})
	)

	useEffect(() => {
		const isComplete =
			shuffledTargets.length > 0 &&
			shuffledTargets.every((card) => {
				const id = getCardId(card)
				return matches[id] === id
			})

		if (isComplete && !hasFinished) {
			setShowConfetti(true)
			setHasFinished(true)
			awardPoints(1)
			const maybePromise = controls.play()
			if (maybePromise instanceof Promise) maybePromise.catch(() => {})

			setTimeout(() => {
				setShowConfetti(false)
				const limited = filteredCards.slice(0, 12)

				const shuffled1 = [...limited]
				const shuffled2 = [...limited]

				for (let i = shuffled1.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1))
					;[shuffled1[i], shuffled1[j]] = [shuffled1[j], shuffled1[i]]
				}
				for (let i = shuffled2.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1))
					;[shuffled2[i], shuffled2[j]] = [shuffled2[j], shuffled2[i]]
				}

				setShuffledDraggables(shuffled1)
				setShuffledTargets(shuffled2)
				setMatches({})
				setHasFinished(false)
			}, 8000)
		}
	}, [
		matches,
		shuffledTargets,
		hasFinished,
		controls,
		filteredCards,
		awardPoints,
	])

	useEffect(() => {
		if (formatType === 'image') {
			setMatchField('images')
		} else if (formatType === 'audio') {
			setMatchField('engAudio')
		} else {
			setMatchField('spa')
		}
	}, [formatType])

	const bumpSize = (delta: number) =>
		setTargetSize((s) => Math.max(80, Math.min(240, s + delta)))

	return (
		<div className="max-w-4xl mx-auto p-4">
			{audioEl}

			{showConfetti && (
				<ReactConfetti
					width={width}
					height={height}
					recycle={false}
					numberOfPieces={500}
					tweenDuration={10000}
				/>
			)}

			{/* Controls row */}

			<div className="mb-4 flex flex-wrap items-center justify-center gap-3">
				<button
					onClick={() => setShowFilter((prev) => !prev)}
					className={`px-4 py-2 rounded shadow flex items-center justify-center gap-4 ${
						showFilter ? 'bg-sky-600 text-white' : 'bg-gray-200'
					}`}
				>
					<Image
						src="/books-svgrepo-com.svg"
						alt="Filter icon"
						width={30}
						height={30}
					/>
					{showFilter ? 'Hide Filters' : 'Show Filters'}
				</button>
				<button
					onClick={() => {
						if (filteredCards.length === 0) return
						const limited = filteredCards.slice(0, 12)

						const shuffled1 = [...limited]
						const shuffled2 = [...limited]

						for (let i = shuffled1.length - 1; i > 0; i--) {
							const j = Math.floor(Math.random() * (i + 1))
							;[shuffled1[i], shuffled1[j]] = [shuffled1[j], shuffled1[i]]
						}
						for (let i = shuffled2.length - 1; i > 0; i--) {
							const j = Math.floor(Math.random() * (i + 1))
							;[shuffled2[i], shuffled2[j]] = [shuffled2[j], shuffled2[i]]
						}

						setShuffledDraggables(shuffled1)
						setShuffledTargets(shuffled2)
						setMatches({})
						setHasFinished(false)
					}}
					className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300"
				>
					Reshuffle
				</button>

				{/* NEW: Size controls */}
				<div className="flex items-center gap-2 px-3 py-2 rounded bg-gray-50 border">
					<span className="text-sm text-gray-600">Card size</span>
					<button
						type="button"
						onClick={() => bumpSize(-10)}
						className="px-2 py-1 rounded border hover:bg-gray-100"
						aria-label="Decrease card size"
					>
						−
					</button>
					<input
						type="range"
						min={80}
						max={240}
						step={10}
						value={targetSize}
						onChange={(e) => setTargetSize(parseInt(e.target.value, 10))}
						className="w-32"
					/>
					<button
						type="button"
						onClick={() => bumpSize(+10)}
						className="px-2 py-1 rounded border hover:bg-gray-100"
						aria-label="Increase card size"
					>
						+
					</button>
					<span className="text-xs text-gray-500 w-10 text-right">
						{targetSize}px
					</span>
				</div>
			</div>
			{showFilter && (
				<>
					<div className="text-center grid grid-cols-1 md:grid-cols-3">
						<FormatFilter
							formatType={formatType}
							setFormatType={setFormatType}
							options={formatOptions}
						/>
						<TypeFilter
							selectedType={selectedType}
							setSelectedType={setSelectedType}
						/>
					</div>
					<div className="text-center">
						{/* <CategoryFilter
							data={data}
							selectedCategory={selectedCategory}
							setSelectedCategory={setSelectedCategory}
						/> */}
						<LessonFilter
							data={data}
							selectedLessons={selectedLessons}
							setSelectedLessons={setSelectedLessons}
							showRanges={true}
						/>
					</div>
				</>
			)}

			<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
				{filteredCards.length === 0 ? (
					<div className="text-center text-gray-500 italic mt-8">
						No cards available with this selection.
						<br />
						Please try adjusting the filters above.
					</div>
				) : (
					<>
						<div className="flex flex-wrap justify-center gap-3 mb-6">
							{shuffledDraggables.map((card) => {
								const cardId = getCardId(card)
								if (matches[cardId] === cardId) return null // Hide matched draggable word

								return (
									<DraggableWord
										key={cardId}
										id={cardId}
										label={card.eng}
										matches={matches}
									/>
								)
							})}
						</div>

						<div
							className="grid gap-4 justify-center"
							style={{
								gridTemplateColumns: `repeat(auto-fit, minmax(${targetSize}px, 1fr))`,
							}}
						>
							{' '}
							{shuffledTargets.map((card) => {
								const cardId = getCardId(card)
								const matched = matches[cardId] === cardId
								return (
									<DropTarget
										key={cardId}
										id={cardId}
										matches={matches}
										size={targetSize} // NEW
									>
										{matched ? (
											<div
												className="font-nunito text-green-700"
												style={{ fontSize: Math.round(targetSize * 0.28) }}
											>
												{card.eng}
											</div>
										) : (
											<div className="flex flex-col text-center justify-center">
												<MatchContent
													card={card}
													matchField={matchField}
													size={targetSize} // NEW
												/>
												{/* {card.gender && (
													<div className="text-xs text-gray-500 mt-1">
														({card.gender})
													</div>
												)} */}
											</div>
										)}
									</DropTarget>
								)
							})}
						</div>
					</>
				)}
			</DndContext>
		</div>
	)
}

function DraggableWord({
	id,
	label,
	matches,
}: {
	id: string
	label: string
	matches: Record<string, string | number>
}) {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({ id })
	const style = transform
		? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
		: undefined

	return (
		<button
			type="button"
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className="px-4 py-2 bg-green-200 rounded shadow text-xl font-nunito cursor-grab touch-none select-none"
		>
			{label}
		</button>
	)
}

function DropTarget({
	id,
	children,
	matches,
	size,
}: {
	id: string
	children: React.ReactNode
	matches: Record<string, string | number>
	size: number
}) {
	const { isOver, setNodeRef } = useDroppable({ id })
	const matched = matches[id] === id

	return (
		<div
			ref={setNodeRef}
			className={`border-2 rounded p-3 flex items-center justify-center transition touch-none select-none ${
				isOver ? 'border-green-500 bg-green-50' : 'border-gray-300'
			} ${matched ? 'hidden' : ''}`} // Hide drop target if matched
			style={{
				minHeight: size + 24, // room for padding/label
			}}
		>
			{matched ? (
				<div className="font-serif text-green-700">{children}</div>
			) : (
				<div className="flex flex-col text-center justify-center w-full">
					{children}
				</div>
			)}
		</div>
	)
}

function MatchContent({
	card,
	matchField,
	size = 140,
}: {
	card: EnglishVocab
	matchField: keyof EnglishVocab
	size?: number
}) {
	const value = card[matchField]
	if (!value) return null

	// AUDIO: render a play button instead of the string path
	if (matchField === 'engAudio') {
		const src = Array.isArray(value) ? String(value[0]) : String(value)
		return <PlayButton src={src} size={Math.round(size * 0.28)} />
	}

	// IMAGE: show first image
	if (matchField === 'images' && Array.isArray(value)) {
		return (
			<Image
				src={value[0]}
				alt="EnglishVocab"
				width={size}
				height={size}
				className="object-contain pointer-events-none select-none"
				draggable={false}
			/>
		)
	}

	// TEXT fallback
	return (
		<div
			className="font-nunito text-xl"
			// style={{ fontSize: Math.max(14, Math.round(size * 0.22)) }}
		>
			{String(value)}
		</div>
	)
}

function PlayButton({ src, size = 36 }: { src: string; size?: number }) {
	const [audioEl, state, controls] = useAudio({ src, autoPlay: false })

	const handleClick = async () => {
		try {
			if (state.playing) {
				controls.pause()
			} else {
				// restart from 0 for consistent tapping behavior
				await controls.seek(0)
				await controls.play()
			}
		} catch {}
	}

	return (
		<div className="flex items-center justify-center">
			{audioEl}
			<button
				type="button"
				onClick={handleClick}
				className="p-2 active:scale-95 transition"
				aria-label={state.playing ? 'Pause audio' : 'Play audio'}
			>
				🔊
			</button>
		</div>
	)
}
