'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Flashcard } from './flashcards'

interface PhraseReconstructionProps {
	data: Flashcard[]
	lessonPrefix: string
}

export default function PhraseReconstruction({
	data,
	lessonPrefix,
}: PhraseReconstructionProps) {
	const [selectedLessons, setSelectedLessons] = useState<string[]>([])
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [currentIndex, setCurrentIndex] = useState(0)
	const [selectedWords, setSelectedWords] = useState<string[]>([])
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)

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
		return Array.from(new Set(all)).sort(
			(a, b) =>
				parseFloat(a.slice(lessonPrefix.length)) -
				parseFloat(b.slice(lessonPrefix.length))
		)
	}, [cardsForPrefix, lessonPrefix])

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
			.filter(
				(card) =>
					selectedCategory === 'all' || card.category === selectedCategory
			)

		return [...filtered].sort(() => Math.random() - 0.5)
	}, [cardsForPrefix, selectedLessons, selectedCategory])

	const currentCard = filteredCards[currentIndex]

	const correctWords = useMemo(() => {
		if (!currentCard) return []
		return currentCard.heb.trim().split(' ')
	}, [currentCard])

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
			setTimeout(() => {
				setShowFeedback(null)
				setSelectedWords([])
				setCurrentIndex((i) => (i + 1) % filteredCards.length)
			}, 1000)
		}
	}

	function normalize(text: string) {
		return text.normalize('NFKC').replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '') // strip niqqud
	}

	return (
		<div className="p-4 max-w-3xl mx-auto text-center">
			<h1 className="text-2xl font-bold mb-4">Phrase Reconstruction</h1>

			{/* Filters */}
			<div className="space-y-4 mb-6">
				<div>
					<label className="block text-sm font-medium">Lessons</label>
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

				<div>
					<label className="block text-sm font-medium">Category</label>
					<div className="flex flex-wrap justify-center gap-2">
						{['all', ...categoryOptions].map((cat) => (
							<button
								key={cat}
								onClick={() => setSelectedCategory(cat)}
								className={`px-2 py-1 border rounded-full text-sm ${
									selectedCategory === cat
										? 'bg-blue-500 text-white'
										: 'bg-gray-200'
								}`}
							>
								{cat}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Prompt */}
			<div className="mb-4 text-xl font-bold">{currentCard?.eng}</div>

			{/* Word Choices */}
			<div className="flex flex-wrap justify-center gap-2 mb-6">
				{correctWords
					.sort(() => Math.random() - 0.5)
					.map((word, i) => (
						<button
							key={`${word}-${i}`}
							onClick={() => toggleWord(word)}
							className={`border px-3 py-1 rounded text-lg ${
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
			<div className="mb-4 text-2xl border p-4 rounded min-h-[60px] bg-gray-50">
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
					{showFeedback
						? 'Correct!'
						: `Incorrect. Correct: ${correctWords.join(' ')}`}
				</div>
			)}
		</div>
	)
}
