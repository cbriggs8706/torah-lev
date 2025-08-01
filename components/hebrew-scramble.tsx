'use client'

import { HebrewVocab } from '@/lib/vocab'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import LessonFilter from './filter-lesson'
import { useCelebration } from '@/hooks/useCelebration'
import ProgressBar from './progress-bar'
import { parseLessonKey, useLessonCards } from '@/hooks/useLessonCards'

interface HebrewScrambleProps {
	data: HebrewVocab[]
	currentLesson: string
}

export default function HebrewScramble({
	data,
	currentLesson,
}: HebrewScrambleProps) {
	const { selectedLessons, setSelectedLessons, currentIndex, setCurrentIndex } =
		useLessonCards(data, currentLesson)
	const [selectedWords, setSelectedWords] = useState<string[]>([])
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [showFilter, setShowFilter] = useState(false)
	const { Confetti, celebrate } = useCelebration()
	const [filteredCards, setFilteredCards] = useState<HebrewVocab[]>([])

	const cardsForPrefix = useMemo(() => {
		return data.filter(
			(card) =>
				card.type === 'phrase' &&
				card.lessons.some((l) => selectedLessons.includes(String(l)))
		)
	}, [data, selectedLessons])

	useEffect(() => {
		const newFiltered = cardsForPrefix.filter((card) => {
			const wordCount = card.heb.trim().split(/\s+/).length
			return wordCount >= 2
		})

		setFilteredCards([...newFiltered].sort(() => Math.random() - 0.5))
		setCurrentIndex(0)
		setSelectedWords([])
		setShowFeedback(null)
	}, [cardsForPrefix, selectedLessons, setCurrentIndex])

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
				celebrate()
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
			{Confetti}
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

			{showFilter && (
				<LessonFilter
					data={data}
					selectedLessons={selectedLessons}
					setSelectedLessons={setSelectedLessons}
					showRanges={true}
				/>
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
				<ProgressBar currentIndex={currentIndex} total={filteredCards.length} />
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
