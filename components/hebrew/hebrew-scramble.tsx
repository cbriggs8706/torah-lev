'use client'

import { HebrewVocab } from '@/lib/vocab'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCelebration } from '@/hooks/useCelebration'
import { parseLessonKey, useLessonCards } from '@/hooks/useLessonCards'
import LessonFilter from '../filters/filter-lesson'
import ProgressBar from '../progress-bar'

interface HebrewScrambleProps {
	data: HebrewVocab[]
	currentLesson: string
	userId: string
}

export default function HebrewScramble({
	data,
	currentLesson,
	userId,
}: HebrewScrambleProps) {
	const { selectedLessons, setSelectedLessons, currentIndex, setCurrentIndex } =
		useLessonCards(data, currentLesson)
	const [selectedWords, setSelectedWords] = useState<string[]>([])
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [showFilter, setShowFilter] = useState(false)
	const { Confetti, celebrate } = useCelebration()
	const [filteredCards, setFilteredCards] = useState<HebrewVocab[]>([])
	const [cardsCompleted, setCardsCompleted] = useState(0)
	const [finished, setFinished] = useState(false)
	const [hasAwardedPoints, setHasAwardedPoints] = useState(false)

	const MAX_CARDS = 5

	const cardsForPrefix = useMemo(() => {
		return data.filter(
			(card) =>
				card.type === 'phrase' &&
				card.lessons?.some((l) => selectedLessons.includes(String(l)))
		)
	}, [data, selectedLessons])

	useEffect(() => {
		const pool = cardsForPrefix.filter((card) => {
			const wordCount = card.heb.trim().split(/\s+/).length
			return card.type === 'phrase' && wordCount >= 2
		})

		const shuffled = [...pool].sort(() => Math.random() - 0.5)
		const limited = shuffled.slice(0, Math.min(MAX_CARDS, shuffled.length))

		setFilteredCards(limited)
		setCurrentIndex(0)
		setSelectedWords([])
		setShowFeedback(null)
		setFinished(false)
		setHasAwardedPoints(false)
		setCardsCompleted(0)
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

	function toggleWord(uniqueId: string) {
		setSelectedWords((prev) =>
			prev.includes(uniqueId)
				? prev.filter((w) => w !== uniqueId)
				: [...prev, uniqueId]
		)
	}

	function normalize(text: string) {
		return text.normalize('NFKC').replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '') // strip niqqud
	}

	function handleSubmit() {
		const joined = selectedWords.map((id) => id.split('-')[0]).join(' ')
		const correct = correctWords.join(' ')
		const isCorrect = normalize(joined) === normalize(correct)
		setShowFeedback(isCorrect)

		if (isCorrect) {
			setCardsCompleted((prev) => prev + 1)
			const isLastCard = currentIndex === filteredCards.length - 1

			if (isLastCard) {
				setFinished(true)
				celebrate()
				const shofar = new Audio('/shofar.mp3')
				shofar.play().catch(console.error)
				if (!hasAwardedPoints) {
					awardPoints(1)
					setHasAwardedPoints(true)
				}
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

	function handleRestart() {
		const reshuffled = [...cardsForPrefix]
			.filter((c) => c.heb.trim().split(/\s+/).length >= 2)
			.sort(() => Math.random() - 0.5)
			.slice(0, Math.min(MAX_CARDS, cardsForPrefix.length))

		setFilteredCards(reshuffled)
		setCurrentIndex(0)
		setSelectedWords([])
		setShowFeedback(null)
		setFinished(false)
		setCardsCompleted(0)
		setHasAwardedPoints(false)
	}

	// ✅ Success Screen
	if (finished) {
		return (
			<div className="p-8 max-w-4xl mx-auto text-center">
				{Confetti}
				<Image
					src="/icons/iconShofar.png"
					alt="Shofar Celebration"
					width={100}
					height={100}
					className="mx-auto mb-6"
				/>
				<h1 className="text-5xl font-bold text-green-700 mb-6">
					You finished all 5 phrases!
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

	return (
		<div className="p-4 max-w-3xl mx-auto text-center">
			{Confetti}
			<h1 className="text-2xl font-bold mb-4">Scrambled Sentences</h1>

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

			{showFilter && (
				<LessonFilter
					data={data}
					selectedLessons={selectedLessons}
					setSelectedLessons={setSelectedLessons}
					showRanges={true}
				/>
			)}

			{/* Word bank */}
			<div className="flex flex-wrap justify-center gap-2 mb-6" dir="rtl">
				{shuffledWords.map((word, i) => {
					const uniqueId = `${word}-${i}`
					const isSelected = selectedWords.some((w, idx) => w === uniqueId)
					return (
						<button
							key={uniqueId}
							onClick={() => toggleWord(uniqueId)}
							className={`border px-3 py-1 rounded text-4xl font-serif ${
								isSelected ? 'bg-green-200' : 'bg-gray-100 hover:bg-gray-300'
							}`}
						>
							{word}
						</button>
					)
				})}
			</div>

			{/* Drop Target (updated style) */}
			<div
				className="min-h-[100px] border-2 border-dashed border-gray-400 rounded-lg flex flex-wrap justify-center items-center p-4 mb-6 bg-gray-50"
				dir="rtl"
			>
				{selectedWords.length === 0 ? (
					<span className="text-gray-400 italic">Build the phrase here</span>
				) : (
					selectedWords.map((word, i) => (
						<span
							key={`${word}-${i}`}
							onClick={() =>
								setSelectedWords((prev) => prev.filter((_, idx) => idx !== i))
							}
							className="px-3 py-2 mx-1 my-1 bg-sky-100 border border-sky-500 rounded text-3xl font-times cursor-pointer hover:bg-sky-200"
						>
							{word.split('-')[0]}
						</span>
					))
				)}
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
					className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
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

			{/* ✅ Progress Bar */}
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
							<span className="font-times text-4xl font-medium">
								{correctWords.join(' ')}
							</span>
						</>
					)}
				</div>
			)}
		</div>
	)
}
