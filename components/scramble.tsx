'use client'

import { Flashcard } from '@/lib/vocab'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import ReactConfetti from 'react-confetti'
import { useAudio, useWindowSize } from 'react-use'

interface ScrambleProps {
	data: Flashcard[]
	lessonPrefix: string
	currentLesson?: number
}

export default function Scramble({
	data,
	lessonPrefix,
	currentLesson,
}: ScrambleProps) {
	const [selectedLessons, setSelectedLessons] = useState<string[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [selectedWords, setSelectedWords] = useState<string[]>([])
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [showConfetti, setShowConfetti] = useState(false)
	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })
	const [showFilter, setShowFilter] = useState(false)

	const { width, height } = useWindowSize()

	const cardsForPrefix = useMemo(() => {
		return data.filter(
			(card) =>
				card.lessons.some((l) => l.startsWith(lessonPrefix)) &&
				card.type === 'phrase'
		)
	}, [data, lessonPrefix])

	const lessonOptions = useMemo(() => {
		const all = cardsForPrefix.flatMap((card) =>
			card.lessons.filter((l) => l.startsWith(lessonPrefix))
		)

		return Array.from(new Set(all)).sort((a, b) => {
			const matchA = a.slice(lessonPrefix.length).match(/(\d+)([a-zA-Z]*)?/)
			const matchB = b.slice(lessonPrefix.length).match(/(\d+)([a-zA-Z]*)?/)

			const numA = parseInt(matchA?.[1] || '0', 10)
			const numB = parseInt(matchB?.[1] || '0', 10)

			if (numA !== numB) return numA - numB
			return (matchA?.[2] || '').localeCompare(matchB?.[2] || '')
		})
	}, [cardsForPrefix, lessonPrefix])

	useEffect(() => {
		if (currentLesson !== undefined) {
			const availableLessons = lessonOptions.filter((lesson) => {
				const num = parseInt(lesson.slice(lessonPrefix.length), 10)
				return num <= currentLesson
			})
			setSelectedLessons(availableLessons)
		}
	}, [currentLesson, lessonOptions, lessonPrefix])

	const categoryOptions = useMemo(() => {
		return Array.from(
			new Set(cardsForPrefix.map((c) => c.category).filter(Boolean))
		)
	}, [cardsForPrefix])

	const filteredCards = useMemo(() => {
		const filtered = cardsForPrefix
			.filter(
				(card) =>
					selectedLessons.length === 0 ||
					card.lessons.some((l) => selectedLessons.includes(l))
			)
			.filter((card) => {
				const wordCount = card.heb.trim().split(/\s+/).length
				return wordCount >= 2
			})

		return [...filtered].sort(() => Math.random() - 0.5)
	}, [cardsForPrefix, selectedLessons])

	useEffect(() => {
		setCurrentIndex(0)
		setSelectedWords([])
		setShowFeedback(null)
	}, [filteredCards])

	const currentCard = filteredCards[currentIndex]

	const correctWords = useMemo(() => {
		if (!currentCard) return []
		return currentCard.hebNiqqud.trim().split(' ')
	}, [currentCard])

	const shuffledWords = useMemo(() => {
		if (!currentCard) return []
		return [...correctWords].sort(() => Math.random() - 0.5)
	}, [correctWords, currentCard])

	useEffect(() => {
		setSelectedWords([])
		setShowFeedback(null)
	}, [currentCard])

	function toggleWord(word: string) {
		setSelectedWords((prev) =>
			prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
		)
	}

	function handleSubmit() {
		const joined = selectedWords.join(' ')
		const correct = correctWords.join(' ')
		const isCorrect = normalize(joined) === normalize(correct)
		setShowFeedback(isCorrect)

		if (isCorrect) {
			const isLastCard = currentIndex === filteredCards.length - 1

			if (isLastCard) {
				setShowConfetti(true)
			}

			setTimeout(() => {
				setShowFeedback(null)
				setSelectedWords([])

				if (!isLastCard) {
					setCurrentIndex((i) => (i + 1) % filteredCards.length)
				}
			}, 1000)
		}
	}

	function normalize(text: string) {
		return text.normalize('NFKC').replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '') // strip niqqud
	}

	return (
		<div className="p-4 max-w-3xl mx-auto text-center">
			{showConfetti && (
				<ReactConfetti
					width={width}
					height={height}
					recycle={false}
					numberOfPieces={500}
					tweenDuration={10000}
				/>
			)}
			{showConfetti && finishAudio}
			<h1 className="text-2xl font-bold mb-4">Scrambled Sentences</h1>

			{/* 🔹 Filter Button */}
			<div className="mb-6 flex justify-center">
				<button
					onClick={() => setShowFilter((prev) => !prev)}
					className={`px-4 py-2 rounded shadow flex items-center justify-center gap-3 ${
						showFilter ? 'bg-blue-600 text-white' : 'bg-gray-200'
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

			{/* 🔹 Lesson Filter (collapsible) */}
			{showFilter && (
				<div className="space-y-4 mb-6">
					<label className="block text-xl font-semibold">Lessons</label>
					<div className="flex flex-wrap justify-center gap-2">
						{lessonOptions.map((lesson) => (
							<button
								key={lesson}
								onClick={() =>
									setSelectedLessons((prev) =>
										prev.includes(lesson)
											? prev.filter((l) => l !== lesson)
											: [...prev, lesson]
									)
								}
								className={`px-2 py-1 border rounded-full text-sm ${
									selectedLessons.includes(lesson)
										? 'bg-blue-500 text-white'
										: 'bg-gray-200'
								}`}
							>
								{lesson.slice(lessonPrefix.length)}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Prompt */}
			{/* <div className="mb-4 text-xl font-bold">{currentCard?.eng}</div> */}

			{/* Word Choices */}
			<div className="flex flex-wrap justify-center gap-2 mb-6" dir="rtl">
				{shuffledWords.map((word, i) => (
					<button
						key={`${word}-${i}`}
						onClick={() => toggleWord(word)}
						className={`border px-3 py-1 rounded text-4xl font-serif ${
							selectedWords.includes(word)
								? 'bg-green-200'
								: 'bg-gray-100 hover:bg-gray-300'
						}`}
					>
						{word}
					</button>
				))}
			</div>

			{/* Selected Phrase */}
			<div
				className="mb-4 text-4xl font-serif border p-4 rounded min-h-[60px] bg-gray-50"
				dir="rtl"
			>
				{selectedWords.join(' ')}
			</div>

			{/* Controls */}
			<div className="flex justify-center gap-3 mb-6">
				<button
					onClick={() =>
						setCurrentIndex(
							(i) => (i - 1 + filteredCards.length) % filteredCards.length
						)
					}
					className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
				>
					←
				</button>
				<button
					onClick={handleSubmit}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					Submit
				</button>
				<button
					onClick={() => setCurrentIndex((i) => (i + 1) % filteredCards.length)}
					className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
				>
					→
				</button>
			</div>

			{/* Progress */}
			{filteredCards.length > 0 && (
				<>
					<div className="text-sm font-medium text-gray-600 mb-1">
						{currentIndex + 1} / {filteredCards.length}
					</div>
					<div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
						<div
							className="bg-blue-500 h-full transition-all duration-300"
							style={{
								width: `${((currentIndex + 1) / filteredCards.length) * 100}%`,
							}}
						></div>
					</div>
				</>
			)}

			{/* Feedback */}
			{showFeedback !== null && (
				<div
					className={`text-xl font-semibold mb-6 ${
						showFeedback ? 'text-green-600' : 'text-red-600'
					}`}
				>
					{showFeedback ? (
						'Correct!'
					) : (
						<>
							Incorrect. Correct:{' '}
							<span className="font-serif font-normal text-4xl">
								{correctWords.join(' ')}
							</span>
						</>
					)}
				</div>
			)}
		</div>
	)
}
