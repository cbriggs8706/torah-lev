'use client'

import { EnglishVocab } from '@/lib/vocab'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCelebration } from '@/hooks/useCelebration'
import { parseLessonKey, useLessonCards } from '@/hooks/useLessonCards'
import LessonFilter from '../filters/filter-lesson'
import ProgressBar from '../progress-bar'

interface EnglishScrambleProps {
	data: EnglishVocab[]
	currentLesson: string
	userId: string
	courseId: number | null
}

type Lang = 'spa' | 'por'

export default function EnglishScramble({
	data,
	currentLesson,
	courseId,
	userId,
}: EnglishScrambleProps) {
	const { selectedLessons, setSelectedLessons, currentIndex, setCurrentIndex } =
		useLessonCards(data, currentLesson)
	// const [selectedWords, setSelectedWords] = useState<string[]>([])
	const [selectedIds, setSelectedIds] = useState<number[]>([])

	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [showFilter, setShowFilter] = useState(false)
	const { Confetti, celebrate } = useCelebration()
	const [filteredCards, setFilteredCards] = useState<EnglishVocab[]>([])
	const [cardsCompleted, setCardsCompleted] = useState(0)
	const [lang, setLang] = useState<Lang>('spa')

	const MAX_CARDS = 5

	const cardsForPrefix = useMemo(() => {
		return data.filter(
			(card) =>
				card.type === 'phrase' &&
				card.lessons.some((l) => selectedLessons.includes(String(l)))
		)
	}, [data, selectedLessons])

	useEffect(() => {
		const saved = (
			typeof window !== 'undefined'
				? window.localStorage.getItem('scrambleLang')
				: null
		) as Lang | null
		if (saved === 'spa' || saved === 'por') setLang(saved)
	}, [])

	// Persist preference
	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem('scrambleLang', lang)
		}
	}, [lang])

	useEffect(() => {
		// phrases w/2+ words
		const pool = cardsForPrefix.filter((card) => {
			const wordCount = card.eng.trim().split(/\s+/).length
			return card.type === 'phrase' && wordCount >= 2
		})

		// randomize order and take up to 25
		const shuffled = [...pool].sort(() => Math.random() - 0.5)
		const limited = shuffled.slice(0, Math.min(MAX_CARDS, shuffled.length))

		setFilteredCards(limited)
		setCurrentIndex(0)
		setSelectedIds([])
		setShowFeedback(null)
	}, [cardsForPrefix, selectedLessons, setCurrentIndex])

	// useEffect(() => {
	// 	const newFiltered = cardsForPrefix.filter((card) => {
	// 		const wordCount = card.eng.trim().split(/\s+/).length
	// 		return wordCount >= 2
	// 	})

	// 	setFilteredCards([...newFiltered].sort(() => Math.random() - 0.5))
	// 	setCurrentIndex(0)
	// 	setSelectedWords([])
	// 	setShowFeedback(null)
	// }, [cardsForPrefix, selectedLessons, setCurrentIndex])

	const currentCard = filteredCards[currentIndex]

	const correctWords = useMemo(() => {
		if (!currentCard) return []
		return currentCard.eng.trim().split(/\s+/)
	}, [currentCard])

	type Token = { id: number; text: string }
	const tokens = useMemo<Token[]>(() => {
		return correctWords.map((text, i) => ({ id: i, text }))
	}, [correctWords])

	const shuffledTokens = useMemo(() => {
		return [...tokens].sort(() => Math.random() - 0.5)
	}, [tokens])

	const shuffledWords = useMemo(() => {
		if (!currentCard) return []
		return [...correctWords].sort(() => Math.random() - 0.5)
	}, [correctWords, currentCard])

	useEffect(() => {
		setSelectedIds([])
		setShowFeedback(null)
	}, [currentCard])

	function toggleId(id: number) {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		)
	}

	function handleSubmit() {
		const joined = selectedIds
			.map((id) => tokens.find((t) => t.id === id)!.text)
			.join(' ')
		const correct = correctWords.join(' ')
		const isCorrect = joined === correct
		setShowFeedback(isCorrect)

		if (isCorrect) {
			setCardsCompleted((prev) => prev + 1)
			const isLastCard = currentIndex === filteredCards.length - 1
			if (isLastCard) celebrate()
			setTimeout(() => {
				setShowFeedback(null)
				setSelectedIds([])
				if (!isLastCard) setCurrentIndex((i) => (i + 1) % filteredCards.length)
			}, 1000)
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

	useEffect(() => {
		if (cardsCompleted > 0 && cardsCompleted % 5 === 0) {
			const pointsToAward = cardsCompleted
			awardPoints(pointsToAward)
		}
	}, [cardsCompleted, awardPoints])

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
				<>
					<LessonFilter
						data={data}
						selectedLessons={selectedLessons}
						setSelectedLessons={setSelectedLessons}
						showRanges={true}
					/>
					<h2 className="text-xl font-semibold mb-2">Select Language</h2>

					<div className="mb-6 flex justify-center gap-3">
						<button
							onClick={() => setLang('spa')}
							className={`px-3 py-2 rounded shadow text-sm ${
								lang === 'spa' ? 'bg-sky-600 text-white' : 'bg-gray-200'
							}`}
							aria-pressed={lang === 'spa'}
						>
							Spanish
						</button>
						<button
							onClick={() => setLang('por')}
							className={`px-3 py-2 rounded shadow text-sm ${
								lang === 'por' ? 'bg-sky-600 text-white' : 'bg-gray-200'
							}`}
							aria-pressed={lang === 'por'}
						>
							Portuguese
						</button>
					</div>
				</>
			)}

			{/* Prompt */}
			<div className="mb-4 text-xl font-bold">
				{currentCard
					? lang === 'spa'
						? currentCard.spa ?? currentCard.por ?? ''
						: currentCard.por ?? currentCard.spa ?? ''
					: ''}
			</div>

			{/* Word Choices */}
			<div className="flex flex-wrap justify-center gap-2 mb-6">
				{shuffledTokens.map(({ id, text }) => (
					<button
						key={id}
						onClick={() => toggleId(id)}
						className={`border px-3 py-1 rounded text-4xl font-serif ${
							selectedIds.includes(id)
								? 'bg-green-200'
								: 'bg-gray-100 hover:bg-gray-300'
						}`}
					>
						{text}
					</button>
				))}
			</div>

			{/* Selected Phrase */}
			<div className="mb-4 text-4xl font-serif border p-4 rounded min-h-[60px] bg-gray-50">
				{selectedIds
					.map((id) => tokens.find((t) => t.id === id)!.text)
					.join(' ')}
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
					onClick={() => {
						setFilteredCards((prev) => {
							const reshuffled = [...cardsForPrefix]
								.filter((c) => c.eng.trim().split(/\s+/).length >= 2)
								.sort(() => Math.random() - 0.5)
								.slice(0, Math.min(MAX_CARDS, cardsForPrefix.length))
							setCurrentIndex(0)
							setSelectedIds([])
							setShowFeedback(null)
							return reshuffled
						})
					}}
					className="px-3 py-2 bg-gray-200 rounded"
				>
					Reshuffle 5
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
							Incorrect. It should be:{' '}
							<span className="">{correctWords.join(' ')}</span>
						</>
					)}
				</div>
			)}
		</div>
	)
}
