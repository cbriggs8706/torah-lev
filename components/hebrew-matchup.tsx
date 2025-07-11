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
import { Flashcard } from '@/lib/vocab'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

interface WordMatchGameProps {
	data: Flashcard[]
	lessonPrefix: string
	currentLesson?: number
}

type UniqueIdentifier = string | number

const MATCH_FIELD_OPTIONS: (keyof Flashcard)[] = ['eng', 'images', 'hebAudio']

export default function WordMatchGame({
	data,
	lessonPrefix,
	currentLesson,
}: WordMatchGameProps) {
	const [selectedLessons, setSelectedLessons] = useState<string[]>(
		currentLesson !== undefined ? [`${lessonPrefix}${currentLesson}`] : []
	)
	const [showFilter, setShowFilter] = useState(false)
	const [matchField, setMatchField] = useState<keyof Flashcard>('eng')
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
	const [shuffled, setShuffled] = useState<Flashcard[]>([])
	const [hasFinished, setHasFinished] = useState(false)

	const { width, height } = useWindowSize()
	const audioRef = useRef<HTMLAudioElement | null>(null)

	const getCardId = (card: Flashcard) =>
		`${(card.heb || '').trim()}::${(card.eng || '').trim()}`

	const lessonOptions = useMemo(() => {
		const all = data.flatMap((card) =>
			card.lessons.filter((l) => l.startsWith(lessonPrefix))
		)
		return Array.from(new Set(all)).sort((a, b) => {
			const aNum = parseInt(a.replace(lessonPrefix, ''))
			const bNum = parseInt(b.replace(lessonPrefix, ''))
			return aNum - bNum
		})
	}, [data, lessonPrefix])

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
			setShuffled([])
			return
		}
		const pairs = [...filteredCards]
		for (let i = pairs.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
		}
		setShuffled(pairs.slice(0, 12)) // limit to 12
	}, [filteredCards])

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		console.log('🟡 DRAG END', {
			activeId: active.id,
			overId: over?.id,
			isMatch: active.id === over?.id,
		})

		if (over && active.id === over.id) {
			setMatches((prev) => ({
				...prev,
				[String(active.id)]: String(over.id),
			}))
		}
	}

	useEffect(() => {
		const isComplete =
			shuffled.length > 0 &&
			shuffled.every((card) => {
				const id = getCardId(card)
				return matches[id] === id
			})

		if (isComplete && !hasFinished) {
			setShowConfetti(true)
			setHasFinished(true)

			const maybePromise = controls.play()
			if (maybePromise instanceof Promise) maybePromise.catch(() => {})

			setTimeout(() => setShowConfetti(false), 8000)
		}
	}, [matches, shuffled, hasFinished, controls])

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
					<img
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
								const label = lesson.slice(lessonPrefix.length)
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
							{shuffled.map((card) => {
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
							{shuffled.map((card) => {
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
	card: Flashcard
	matchField: keyof Flashcard
}) {
	const value = card[matchField]
	if (!value) return null

	if (matchField === 'images' && Array.isArray(value)) {
		return (
			<Image
				src={value[0]}
				alt="Flashcard"
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
