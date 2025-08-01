'use client'
import React from 'react'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
	DndContext,
	useDraggable,
	useDroppable,
	DragEndEvent,
} from '@dnd-kit/core'
import Image from 'next/image'
import { HebrewVocab } from '@/lib/vocab'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

interface WordMatchGameProps {
	data: HebrewVocab[]
	currentLesson?: number
}

type UniqueIdentifier = string | number

const MATCH_FIELD_OPTIONS: (keyof HebrewVocab)[] = ['eng', 'images', 'hebAudio']

function parseLessonKey(key: string) {
	const match = key.match(/^(\d+)?([a-zA-Z]*)$/)
	if (!match) return { num: NaN, text: key }
	return {
		num: match[1] ? parseInt(match[1], 10) : NaN,
		text: match[2] || (match[1] ? '' : key),
	}
}

export default function WordMatchGame({
	data,
	currentLesson,
}: WordMatchGameProps) {
	const [showFilter, setShowFilter] = useState(false)
	const [matchField, setMatchField] = useState<keyof HebrewVocab>('images')
	const [hebrewField, setHebrewField] = useState<'heb' | 'hebNiqqud'>(
		'hebNiqqud'
	)
	const [matches, setMatches] = useState<Record<string, UniqueIdentifier>>({})
	const [selectedType, setSelectedType] = useState<'all' | 'word' | 'phrase'>(
		'word'
	)
	const [showConfetti, setShowConfetti] = useState(false)
	const [audioEl, state, controls] = useAudio({
		src: '/finish.mp3',
		autoPlay: false,
	})
	const [shuffledDraggables, setShuffledDraggables] = useState<HebrewVocab[]>(
		[]
	)
	const [shuffledTargets, setShuffledTargets] = useState<HebrewVocab[]>([])
	const [hasFinished, setHasFinished] = useState(false)

	const { width, height } = useWindowSize()
	const audioRef = useRef<HTMLAudioElement | null>(null)

	const getCardId = (card: HebrewVocab) =>
		`${(card.heb || '').trim()}::${(card.eng || '').trim()}`

	const lessonOptions = useMemo(() => {
		const allLessons = data.flatMap((card) => card.lessons)
		const uniqueLessons = Array.from(new Set(allLessons))

		return uniqueLessons.sort((a, b) => {
			const A = parseLessonKey(a)
			const B = parseLessonKey(b)

			// If both numeric, sort by number then text
			if (!isNaN(A.num) && !isNaN(B.num)) {
				if (A.num !== B.num) return A.num - B.num
				return A.text.localeCompare(B.text)
			}

			// Numbers first
			if (!isNaN(A.num) && isNaN(B.num)) return -1
			if (isNaN(A.num) && !isNaN(B.num)) return 1

			// Both strings → alphabetical
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

	const [selectedLessons, setSelectedLessons] = useState<string[]>(
		allLessonsUpToCurrent
	)

	// Ensure selectedLessons updates if currentLesson changes
	useEffect(() => {
		setSelectedLessons(allLessonsUpToCurrent)
	}, [allLessonsUpToCurrent])

	const filteredCards = useMemo(() => {
		return data.filter((card) => {
			const inLesson = card.lessons.some((l) => selectedLessons.includes(l))
			const hasHebrew = !!card[hebrewField]
			const hasMatchField =
				matchField === 'images'
					? Array.isArray(card.images) && card.images.length > 0
					: !!card[matchField]
			const matchesType = selectedType === 'all' || card.type === selectedType

			return inLesson && hasHebrew && hasMatchField && matchesType
		})
	}, [data, matchField, selectedLessons, hebrewField, selectedType])

	useEffect(() => {
		if (filteredCards.length === 0) {
			setShuffledDraggables([])
			setShuffledTargets([])
			return
		}

		// pick 12 random cards (not just the first 12)
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
		// console.log('🟡 DRAG END', {
		// 	activeId: active.id,
		// 	overId: over?.id,
		// 	isMatch: active.id === over?.id,
		// })

		if (over && active.id === over.id) {
			setMatches((prev) => ({
				...prev,
				[String(active.id)]: String(over.id),
			}))
		}
	}

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

			const maybePromise = controls.play()
			if (maybePromise instanceof Promise) maybePromise.catch(() => {})

			// Confetti display duration
			setTimeout(() => {
				setShowConfetti(false)

				// Auto-reset the round with same filters
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
	}, [matches, shuffledTargets, hasFinished, controls, filteredCards])

	function toggleLesson(lesson: string) {
		setSelectedLessons((prev) =>
			prev.includes(lesson)
				? prev.filter((l) => l !== lesson)
				: [...prev, lesson]
		)
	}

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
			{/* 👇 Make sure the audio element is rendered */}
			{/* {React.cloneElement(finishAudio, { ref: audioRef })} */}

			<div className="mb-4 flex justify-center">
				<button
					onClick={() => setShowFilter((prev) => !prev)}
					className={`px-4 py-2 rounded shadow flex items-center justify-center gap-4 ${
						showFilter ? 'bg-blue-600 text-white' : 'bg-gray-200'
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
			</div>

			{showFilter && (
				<>
					<div className="mb-4 text-center">
						<h2 className="text-xl font-semibold">
							What do you want to match?
						</h2>
						<div className="flex flex-wrap justify-center gap-2 mt-2">
							{MATCH_FIELD_OPTIONS.map((field) => (
								<button
									key={field}
									onClick={() => setMatchField(field)}
									className={`px-3 py-1 border rounded-full text-sm ${
										matchField === field
											? 'bg-blue-500 text-white'
											: 'bg-gray-200'
									}`}
								>
									{field === 'eng'
										? 'Translation'
										: field === 'images'
										? 'Image'
										: 'Audio'}
								</button>
							))}
						</div>
					</div>

					<div className="mb-4 text-center">
						<h2 className="text-xl font-semibold">Which Hebrew format?</h2>
						<div className="flex flex-wrap justify-center gap-2 mt-2">
							{(['heb', 'hebNiqqud'] as const).map((field) => (
								<button
									key={field}
									onClick={() => setHebrewField(field)}
									className={`px-3 py-1 border rounded-full text-sm ${
										hebrewField === field
											? 'bg-blue-500 text-white'
											: 'bg-gray-200'
									}`}
								>
									{field === 'heb' ? 'Without Niqqud' : 'With Niqqud'}
								</button>
							))}
						</div>
					</div>

					<div className="mb-4 text-center">
						<h2 className="text-xl font-semibold">Select Type</h2>
						<div className="flex flex-wrap justify-center gap-2 mt-2">
							{(['all', 'word', 'phrase'] as const).map((type) => (
								<button
									key={type}
									onClick={() => setSelectedType(type)}
									className={`px-3 py-1 border rounded-full text-sm ${
										selectedType === type
											? 'bg-blue-500 text-white'
											: 'bg-gray-200'
									}`}
								>
									{type.charAt(0).toUpperCase() + type.slice(1)}
								</button>
							))}
						</div>
					</div>

					<div className="mb-4 text-center">
						<h2 className="text-xl font-semibold mb-2">Select Lessons</h2>
						<div className="flex flex-wrap justify-center gap-2">
							<button
								onClick={() => setSelectedLessons([])}
								className="px-3 py-1 border rounded-full text-sm bg-red-100 hover:bg-red-200"
							>
								Clear All
							</button>
							<button
								onClick={() => setSelectedLessons([...lessonOptions])}
								className={`px-3 py-1 border rounded-full text-sm ${
									selectedLessons.length === lessonOptions.length
										? 'bg-blue-500 text-white'
										: 'bg-gray-200'
								}`}
							>
								All
							</button>
							{lessonOptions.map((lesson) => {
								const label = lesson
								const isSelected = selectedLessons.includes(lesson)
								return (
									<button
										key={lesson}
										onClick={() => toggleLesson(lesson)}
										className={`px-3 py-1 border rounded-full text-sm ${
											isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200'
										}`}
									>
										{label}
									</button>
								)
							})}
						</div>
					</div>
				</>
			)}

			<DndContext onDragEnd={handleDragEnd}>
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
								if (matches[cardId] === cardId) return null // already matched

								return (
									<DraggableWord
										key={cardId}
										id={cardId}
										label={(card[hebrewField] || card.heb) as string}
									/>
								)
							})}
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
							{shuffledTargets.map((card) => {
								const cardId = getCardId(card)
								const matched = matches[cardId] === cardId

								return (
									<DropTarget key={cardId} id={cardId}>
										{matched ? (
											<div className="text-4xl font-serif text-green-700">
												{card[hebrewField]}
											</div>
										) : (
											<div className="flex flex-col text-center justify-center">
												<MatchContent card={card} matchField={matchField} />
												{card.genderPerson && (
													<div className="text-xs text-gray-500 mt-1">
														({card.genderPerson})
													</div>
												)}
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

function DraggableWord({ id, label }: { id: string; label: string }) {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({ id })
	const style = transform
		? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
		: undefined

	return (
		<button
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className="px-4 py-2 bg-green-200 rounded shadow text-4xl font-serif cursor-grab"
		>
			{label}
		</button>
	)
}

function DropTarget({
	id,
	children,
}: {
	id: string
	children: React.ReactNode
}) {
	const { isOver, setNodeRef } = useDroppable({ id })
	return (
		<div
			ref={setNodeRef}
			className={`min-h-24 border-2 rounded p-3 flex items-center justify-center transition ${
				isOver ? 'border-green-500 bg-green-50' : 'border-gray-300'
			}`}
		>
			{children}
		</div>
	)
}

function MatchContent({
	card,
	matchField,
}: {
	card: HebrewVocab
	matchField: keyof HebrewVocab
}) {
	const value = card[matchField]
	if (!value) return null

	if (matchField === 'images' && Array.isArray(value)) {
		return (
			<Image
				src={value[0]}
				alt="HebrewVocab"
				width={100}
				height={100}
				className="object-contain"
			/>
		)
	}

	if (matchField === 'hebAudio' && typeof value === 'string') {
		return (
			<button
				onClick={() => new Audio(value).play()}
				className="text-3xl text-blue-600"
			>
				🔊
			</button>
		)
	}

	return <div className="text-lg font-nunito">{String(value)}</div>
}
