'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useAudio } from 'react-use'

import type { Flashcard } from './flashcards'
import HebrewKeyboard from './hebrew-keyboard'

interface SpellingPracticeProps {
	data: Flashcard[]
	lessonPrefix: string
}

type PromptType = 'image' | 'audio' | 'translation'

export default function SpellingPractice({
	data,
	lessonPrefix,
}: SpellingPracticeProps) {
	const [selectedLessons, setSelectedLessons] = useState<string[]>([])
	const [selectedType, setSelectedType] = useState<'all' | 'word' | 'phrase'>(
		'all'
	)
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [promptType, setPromptType] = useState<PromptType>('translation')
	const [currentIndex, setCurrentIndex] = useState(0)
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [value, setValue] = useState('')

	function handleSubmit() {
		console.log('Submitted:', value)
	}

	const cardsForPrefix = useMemo(() => {
		return data.filter((card) =>
			card.lessons.some((lesson) => lesson.startsWith(lessonPrefix))
		)
	}, [data, lessonPrefix])

	const lessonOptions = useMemo(() => {
		const all = cardsForPrefix.flatMap((card) =>
			card.lessons.filter((l) => l.startsWith(lessonPrefix))
		)
		const unique = Array.from(new Set(all))
		return unique.sort(
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
			.filter((card) => selectedType === 'all' || card.type === selectedType)
			.filter(
				(card) =>
					selectedCategory === 'all' || card.category === selectedCategory
			)

		const valid = filtered.filter((card) => {
			if (promptType === 'image') return card.images[0]
			if (promptType === 'audio') return card.hebAudio
			return true
		})

		return [...valid].sort(() => Math.random() - 0.5)
	}, [
		cardsForPrefix,
		selectedLessons,
		selectedType,
		selectedCategory,
		promptType,
	])

	useEffect(() => {
		setCurrentIndex(0)
	}, [filteredCards])

	const currentCard = filteredCards[currentIndex]

	useEffect(() => {
		if (shouldSkipCard(currentCard)) {
			const nextIndex = (currentIndex + 1) % filteredCards.length
			setCurrentIndex(nextIndex)
		}
	}, [currentCard, promptType])

	const [audioElement, __, controls] = useAudio({
		src: currentCard?.hebAudio ? `/${currentCard.hebAudio}` : '',
	})

	function normalizeHebrewInput(input: string): string {
		return input
			.normalize('NFKC') // Compatibility form handles presentation forms
			.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '') // Remove niqqud
			.replace(/[שׁשׂ]/g, 'ש') // שׁ (U+FB2A) and שׂ (U+FB2B) → ש
	}

	function handleCheck() {
		const inputEl = document.getElementById(
			'spelling-input'
		) as HTMLInputElement
		if (!inputEl || !currentCard) return

		const cleanedInput = normalizeHebrewInput(inputEl.value.trim())
		const cleanedAnswer = normalizeHebrewInput(currentCard.heb.trim())

		const isCorrect = cleanedInput === cleanedAnswer
		setShowFeedback(isCorrect)

		if (isCorrect) {
			setTimeout(() => {
				setShowFeedback(null)
				inputEl.value = ''
				setCurrentIndex((i) => (i + 1) % filteredCards.length)
			}, 1000)
		}
	}

	function shouldSkipCard(card: Flashcard | undefined): boolean {
		if (!card) return true

		if (promptType === 'image' && (!card.images || card.images.length === 0)) {
			return true
		}
		if (promptType === 'audio' && !card.hebAudio) {
			return true
		}

		return false
	}

	function goToNext() {
		setCurrentIndex((i) => (i + 1) % filteredCards.length)
		setShowFeedback(null)
	}

	function goToPrevious() {
		setCurrentIndex(
			(i) => (i - 1 + filteredCards.length) % filteredCards.length
		)
		setShowFeedback(null)
	}

	return (
		<div className="p-4 max-w-3xl mx-auto text-center">
			<h1 className="text-2xl font-bold mb-4">Spelling Practice</h1>

			{/* Prompt Type Selection */}
			<div className="mb-4">
				<label className="block font-medium mb-2">Prompt Type</label>
				<div className="flex justify-center gap-2">
					{(['translation', 'image', 'audio'] as PromptType[]).map((type) => (
						<button
							key={type}
							onClick={() => setPromptType(type)}
							className={`px-3 py-1 border rounded-full ${
								promptType === type ? 'bg-blue-600 text-white' : 'bg-gray-200'
							}`}
						>
							{type.charAt(0).toUpperCase() + type.slice(1)}
						</button>
					))}
				</div>
			</div>

			{/* Lesson + Category + Type Filters */}
			<div className="mb-4 space-y-2">
				<div>
					<label className="block text-sm font-medium">Lessons</label>
					<div className="flex justify-center gap-4 mb-3">
						<button
							onClick={() => setSelectedLessons([])}
							className="px-3 py-1 border rounded text-sm bg-red-100 hover:bg-red-200"
						>
							Clear All
						</button>
					</div>
					<div className="flex flex-wrap justify-center gap-1">
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
					<label className="block text-sm font-medium">Type</label>
					<div className="flex justify-center gap-2">
						{['all', 'word', 'phrase'].map((type) => (
							<button
								key={type}
								onClick={() =>
									setSelectedType(type as 'all' | 'word' | 'phrase')
								}
								className={`px-3 py-1 border rounded-full text-sm ${
									selectedType === type
										? 'bg-blue-500 text-white'
										: 'bg-gray-200'
								}`}
							>
								{type}
							</button>
						))}
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium">Category</label>
					<div className="flex flex-wrap justify-center gap-1">
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
			<hr className="my-10" />

			{/* Prompt Display */}
			{currentCard && (
				<div className="mb-6">
					{promptType === 'translation' && (
						<div className="mb-6 p-4 border-2 border-blue-300 bg-blue-50 rounded-xl shadow text-3xl font-bold">
							{currentCard.eng}
							{currentCard.genderPerson && (
								<span className="text-xl font-medium text-gray-600">
									{' '}
									({currentCard.genderPerson})
								</span>
							)}
						</div>
					)}

					{promptType === 'image' && currentCard.images[0] && (
						<Image
							src={currentCard.images[0]}
							alt="Prompt Image"
							width={300}
							height={200}
							className="mx-auto rounded"
						/>
					)}
					{promptType === 'audio' && currentCard.hebAudio && (
						<>
							<button
								className="text-4xl mt-2 hover:text-blue-700"
								onClick={(e) => {
									e.preventDefault()
									controls.play()
								}}
							>
								🔊
							</button>
							{audioElement}
						</>
					)}
				</div>
			)}

			{/* Input Box */}
			<div className="mb-4 flex items-center justify-center gap-4">
				<button
					onClick={goToPrevious}
					className="p-2 px-4 bg-gray-300 hover:bg-gray-400 rounded"
				>
					←
				</button>
				<input
					id="spelling-input"
					type="text"
					placeholder="type here"
					className="border p-2 w-full max-w-xs text-center text-4xl rounded"
					dir="rtl"
					style={{ fontFamily: 'Times New Roman, serif' }}
					autoFocus
					autoComplete="off"
				/>
				<button
					onClick={goToNext}
					className="p-2 px-4 bg-gray-300 hover:bg-gray-400 rounded"
				>
					→
				</button>
			</div>
			{/* Progress Bar */}
			{filteredCards.length > 0 && (
				<>
					<div className="text-sm font-medium text-gray-600 mb-1">
						{currentIndex + 1} / {filteredCards.length}
					</div>
					<div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
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
				<p
					className={`text-2xl mb-4 font-semibold ${
						showFeedback ? 'text-green-600' : 'text-red-500'
					}`}
				>
					{showFeedback
						? 'Correct!'
						: `Incorrect. Correct answer: ${currentCard?.heb}`}
				</p>
			)}

			<HebrewKeyboard onEnter={() => handleCheck()} />
		</div>
	)
}
