'use client'

import Image from 'next/image'
import { useState, useMemo, useEffect } from 'react'
import ReactConfetti from 'react-confetti'
import { useAudio, useWindowSize } from 'react-use'

type FontChoice = 'arial' | 'times' | 'sans' | 'frank' | 'nunito'

export interface Flashcard {
	id: number
	hebNiqqud: string
	heb: string
	eng: string
	engDefinition: string
	genderPerson: string
	partOfSpeech: string[]
	ipa: string
	engTransliteration: string
	dictionaryUrl: string
	images: string[]
	lessons: string[]
	hebAudio: string
	engAudio: string
	synonyms: string[]
	antonyms: string[]
	scriptures: string[]
	strongs: string
	type: 'word' | 'phrase'
	category: string
}

interface FlashcardReviewProps {
	data: Flashcard[]
	allFields: (keyof Flashcard)[]
	lessonPrefix: string
}

const FONT_SIZE_MAP = {
	s: 16,
	m: 20,
	lg: 28,
	xl: 36,
	twoxl: 48,
	threexl: 72,
} as const

type FontSizeKey = keyof typeof FONT_SIZE_MAP

const FONT_SIZE_LABELS: Record<FontSizeKey, string> = {
	s: 'S',
	m: 'M',
	lg: 'LG',
	xl: 'XL',
	twoxl: '2XL',
	threexl: '3XL',
}

const FIELD_LABELS: Partial<Record<keyof Flashcard, string>> = {
	heb: 'Without Niqqud',
	hebNiqqud: 'With Niqqud',
	eng: 'Translation',
	engDefinition: 'Definition',
	genderPerson: 'Gender / Person',
	partOfSpeech: 'Part of Speech',
	ipa: 'IPA (Pronunciation)',
	engTransliteration: 'English Transliteration',
	images: 'Image',
	hebAudio: 'Audio',
}

const FONT_CLASS_MAP: Record<FontChoice, string> = {
	arial: 'font-arial',
	times: 'font-serif',
	frank: 'font-frank',
	sans: 'font-sans',
	nunito: 'font-nunito',
}

export default function FlashcardReview({
	data,
	allFields,
	lessonPrefix,
}: FlashcardReviewProps) {
	const [selectedType, setSelectedType] = useState<'all' | 'word' | 'phrase'>(
		'all'
	)
	const [selectedLessons, setSelectedLessons] = useState<string[]>([])
	const [frontField, setFrontField] = useState<keyof Flashcard>('hebNiqqud')
	const [backField, setBackField] = useState<keyof Flashcard>('eng')
	const [currentIndex, setCurrentIndex] = useState(0)
	const [showBack, setShowBack] = useState(false)
	const [showConfetti, setShowConfetti] = useState(false)
	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })
	const [filteredCards, setFilteredCards] = useState<Flashcard[]>([])
	const [selectedCategory, setSelectedCategory] = useState<string>('all')

	const [frontFont, setFrontFont] = useState<FontChoice>('times')
	const [backFont, setBackFont] = useState<FontChoice>('nunito')

	const [frontFontSize, setFrontFontSize] = useState<FontSizeKey>('threexl')
	const [backFontSize, setBackFontSize] = useState<FontSizeKey>('xl')
	const [showCustomization, setShowCustomization] = useState(false)

	const { width, height } = useWindowSize()

	// Filter to this prefix
	const cardsForPrefix = useMemo(() => {
		return data.filter((card) =>
			card.lessons.some((lesson) => lesson.startsWith(lessonPrefix))
		)
	}, [data, lessonPrefix])

	// Collect lesson keys like 'awb1' and sort numerically by suffix
	const lessonOptions = useMemo(() => {
		const all = cardsForPrefix.flatMap((card) =>
			card.lessons.filter((l) => l.startsWith(lessonPrefix))
		)
		const unique = Array.from(new Set(all))

		return unique.sort((a, b) => {
			const aNum = parseFloat(a.slice(lessonPrefix.length)) || 0
			const bNum = parseFloat(b.slice(lessonPrefix.length)) || 0
			return aNum - bNum
		})
	}, [cardsForPrefix, lessonPrefix])

	const categoryOptions = useMemo(() => {
		const all = cardsForPrefix.map((card) => card.category).filter(Boolean)
		const unique = Array.from(new Set(all))
		return unique.sort()
	}, [cardsForPrefix])

	useEffect(() => {
		const newFiltered = cardsForPrefix.filter((card) => {
			const matchesSelectedLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((l) => selectedLessons.includes(l))

			const matchesType = selectedType === 'all' || card.type === selectedType

			const matchesCategory =
				selectedCategory === 'all' || card.category === selectedCategory

			const hasValidFront =
				(frontField === 'images' && card.images.length > 0) ||
				(frontField === 'hebAudio' && !!card.hebAudio) ||
				(frontField !== 'images' &&
					frontField !== 'hebAudio' &&
					!!card[frontField])

			const hasValidBack =
				(backField === 'images' && card.images.length > 0) ||
				(backField === 'hebAudio' && !!card.hebAudio) ||
				(backField !== 'images' &&
					backField !== 'hebAudio' &&
					!!card[backField])

			return (
				matchesSelectedLesson &&
				matchesType &&
				matchesCategory &&
				hasValidFront &&
				hasValidBack
			)
		})

		// Shuffle the filtered cards
		const shuffled = [...newFiltered].sort(() => Math.random() - 0.5)

		setFilteredCards(shuffled)
		setCurrentIndex(0) // Reset progress to 1
		setShowBack(false) // Reset card flip
	}, [
		cardsForPrefix,
		selectedLessons,
		selectedType,
		selectedCategory,
		frontField,
		backField,
	])

	const currentCard = filteredCards[currentIndex]

	// Refs for controlling playback programmatically
	const frontAudioRef = useMemo(() => {
		if (frontField === 'hebAudio' && currentCard?.hebAudio)
			return new Audio(currentCard.hebAudio)
		return null
	}, [frontField, currentCard])

	const backAudioRef = useMemo(() => {
		if (backField === 'hebAudio' && currentCard?.hebAudio)
			return new Audio(currentCard.hebAudio)
		return null
	}, [backField, currentCard])

	useEffect(() => {
		if (frontField === 'hebAudio' && frontAudioRef) {
			frontAudioRef.play().catch(console.error)
		}
	}, [currentIndex, frontField, frontAudioRef])

	useEffect(() => {
		if (showBack && backField === 'hebAudio' && backAudioRef) {
			backAudioRef.play().catch(console.error)
		}
	}, [showBack, backField, backAudioRef])

	function handleNextCard() {
		setShowBack(false)
		const nextIndex = currentIndex + 1
		if (nextIndex >= filteredCards.length) {
			setShowConfetti(true)
			setTimeout(() => setShowConfetti(false), 12000)
		}
		setCurrentIndex(nextIndex % filteredCards.length)
	}

	function handlePreviousCard() {
		setShowBack(false)
		setCurrentIndex(
			(prev) => (prev - 1 + filteredCards.length) % filteredCards.length
		)
	}

	function toggleLesson(lesson: string) {
		setSelectedLessons((prev) =>
			prev.includes(lesson)
				? prev.filter((l) => l !== lesson)
				: [...prev, lesson]
		)
	}

	// Auto set optimal font size on load
	useEffect(() => {
		const width = window.innerWidth
		if (width < 400) {
			setFrontFontSize('threexl')
			setBackFontSize('m')
		} else if (width < 768) {
			setFrontFontSize('threexl')
			setBackFontSize('lg')
		} else {
			setFrontFontSize('threexl')
			setBackFontSize('xl')
		}
	}, [])

	const displayFields = allFields.filter((field) => field !== 'dictionaryUrl')

	function getAdaptiveFontSize(text: string, baseSize: FontSizeKey): number {
		if (text.length > 40) return FONT_SIZE_MAP.s
		if (text.length > 30) return FONT_SIZE_MAP.m
		if (text.length > 20) return FONT_SIZE_MAP.lg
		if (text.length > 15) return FONT_SIZE_MAP.xl
		return FONT_SIZE_MAP[baseSize]
	}

	function fixHebrewPunctuation(text: string): string {
		// Replace ? at the end of a line with RTL-friendly question mark
		// Only if the text contains Hebrew characters
		const hebrewRegex = /[\u0590-\u05FF]/ // matches Hebrew script
		if (!hebrewRegex.test(text)) return text

		// Replace ? at the end or before a line break
		return text.replace(/\?/g, '؟') // Arabic-style RTL question mark
	}

	function renderCardContent(field: keyof Flashcard) {
		if (!currentCard) return null

		// Special case: field is 'hebAudio'
		if (field === 'hebAudio') {
			const hasAudio = !!currentCard.hebAudio

			const playAudio = () => {
				if (!currentCard.hebAudio) return
				const audio = new Audio(`/${currentCard.hebAudio}`)
				console.log(audio)
				audio.play().catch(console.error)
			}

			if (hasAudio) {
				return (
					<div className="flex items-center justify-center w-full h-full relative">
						<button
							onClick={(e) => {
								e.stopPropagation()
								const audio = new Audio(currentCard.hebAudio)
								audio.play().catch(console.error)
							}}
							className="text-6xl text-blue-600 hover:text-blue-800"
							aria-label="Play Hebrew audio"
						>
							🔊
						</button>
					</div>
				)
			} else {
				// fallback to hebNiqqud text
				return (
					<p
						className={`break-words text-center leading-tight whitespace-pre-wrap ${
							showBack ? FONT_CLASS_MAP[backFont] : FONT_CLASS_MAP[frontFont]
						}`}
						style={{
							fontSize: showBack
								? FONT_SIZE_MAP[backFontSize]
								: FONT_SIZE_MAP[frontFontSize],
						}}
					>
						{fixHebrewPunctuation(currentCard[field] as string)}
					</p>
				)
			}
		}

		const showAudio: boolean =
			typeof field === 'string' &&
			(field.startsWith('heb') || field === 'images') &&
			!!currentCard.hebAudio

		const playAudio = () => {
			if (!currentCard.hebAudio) return
			const audio = new Audio(`/${currentCard.hebAudio}`)
			audio.play().catch(console.error)
		}

		let content: React.ReactNode = null

		if (field === 'images') {
			const images = currentCard.images
			if (images && images.length > 0) {
				const firstImage = images[0]
				content = (
					<div className="relative w-full h-48 sm:h-60 flex items-center justify-center">
						<Image
							src={firstImage}
							alt="Flashcard visual"
							fill
							className="object-contain rounded"
							sizes="(max-width: 768px) 100vw, 50vw"
						/>
					</div>
				)
			} else {
				content = <p>{currentCard.hebNiqqud}</p>
			}
		} else {
			content = (
				<p
					className={`break-words text-center leading-tight whitespace-pre-wrap ${
						showBack ? FONT_CLASS_MAP[backFont] : FONT_CLASS_MAP[frontFont]
					}`}
					style={{
						fontSize: showBack
							? FONT_SIZE_MAP[backFontSize]
							: FONT_SIZE_MAP[frontFontSize],
					}}
				>
					{fixHebrewPunctuation(currentCard[field] as string)}
				</p>
			)
		}

		return (
			<div className="relative w-full">
				{/* {showAudio && (
					<button
						onClick={(e) => {
							e.stopPropagation()
							playAudio()
						}}
						className="absolute top-0 right-0 p-2 text-gray-600 hover:text-blue-600"
						aria-label="Play audio"
					>
						🔊
					</button>
				)} */}
				{content}
			</div>
		)
	}

	return (
		<div className="p-4 max-w-3xl mx-auto text-center w-full">
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

			{/* Customize Section Toggle */}
			<div className="mb-8">
				<div className="flex items-center justify-center gap-2 cursor-pointer">
					<h2 className="text-muted-foreground text-center text-lg">
						Customize Your Deck
					</h2>
					<button
						onClick={() => setShowCustomization((prev) => !prev)}
						aria-label="Toggle customization"
						className="text-xl transition-transform duration-300"
					>
						<span
							className={`inline-block transform transition-transform duration-300 ${
								showCustomization ? 'rotate-180' : ''
							}`}
						>
							⚙️
						</span>
					</button>
				</div>
			</div>

			{/* Front/Back Customization (Hidden Until Clicked) */}
			{showCustomization && (
				<>
					<div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium">
								Front of Card:
							</label>
							<select
								className="w-full p-2 border rounded"
								value={frontField}
								onChange={(e) =>
									setFrontField(e.target.value as keyof Flashcard)
								}
							>
								{displayFields.map((field) => (
									<option key={field} value={field}>
										{FIELD_LABELS[field] || field}
									</option>
								))}
							</select>

							<label className="block mt-2 text-sm">Font:</label>

							{(() => {
								const isHebrew =
									frontField === 'heb' || frontField === 'hebNiqqud'
								const fontPreviewText = isHebrew ? 'אבגד' : 'ABC'
								const fontSizeClass = isHebrew ? 'text-2xl' : 'text-lg'

								const fontOptions: {
									value: FontChoice
									label: string
									className: string
								}[] = [
									{ value: 'arial', label: 'Arial', className: 'font-arial' },
									{ value: 'times', label: 'Times', className: 'font-serif' },
									{
										value: 'sans',
										label: 'Sans',
										className: 'font-sans',
									},
									{
										value: 'frank',
										label: 'Frank',
										className: 'font-frank',
									},
									{
										value: 'nunito',
										label: 'Nunito',
										className: 'font-nunito',
									},
								]

								return (
									<div className="flex gap-2 flex-wrap justify-between mt-1">
										{fontOptions.map(({ label, value, className }) => (
											<button
												key={value}
												type="button"
												onClick={() => setFrontFont(value)}
												className={`px-4 py-1 border rounded-full text-sm ${
													frontFont === value
														? 'bg-blue-500 text-white'
														: 'bg-gray-100'
												} ${className}`}
											>
												{label}
											</button>
										))}
									</div>
								)
							})()}

							<label className="block mt-2 text-sm">Font Size:</label>
							<select
								className="w-full p-2 border rounded"
								value={frontFontSize}
								onChange={(e) =>
									setFrontFontSize(e.target.value as FontSizeKey)
								}
							>
								{Object.keys(FONT_SIZE_MAP).map((size) => (
									<option key={size} value={size}>
										{FONT_SIZE_LABELS[size as FontSizeKey]}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium">Back of Card:</label>
							<select
								className="w-full p-2 border rounded"
								value={backField}
								onChange={(e) =>
									setBackField(e.target.value as keyof Flashcard)
								}
							>
								{displayFields.map((field) => (
									<option key={field} value={field}>
										{FIELD_LABELS[field] || field}
									</option>
								))}
							</select>

							<label className="block mt-2 text-sm">Font:</label>

							{(() => {
								const fontOptions: {
									value: FontChoice
									label: string
									className: string
								}[] = [
									{ value: 'arial', label: 'Arial', className: 'font-arial' },
									{ value: 'times', label: 'Times', className: 'font-serif' },
									{
										value: 'sans',
										label: 'Sans',
										className: 'font-sans',
									},
									{
										value: 'frank',
										label: 'Frank',
										className: 'font-frank',
									},
									{
										value: 'nunito',
										label: 'Nunito',
										className: 'font-nunito',
									},
								]

								return (
									<div className="flex gap-2 flex-wrap justify-between mt-1">
										{fontOptions.map(({ label, value, className }) => (
											<button
												key={value}
												type="button"
												onClick={() => setBackFont(value)}
												className={`px-4 py-1 border rounded-full text-sm ${
													backFont === value
														? 'bg-blue-500 text-white'
														: 'bg-gray-100'
												} ${className}`}
											>
												{label}
											</button>
										))}
									</div>
								)
							})()}

							<label className="block mt-2 text-sm">Font Size:</label>
							<select
								className="w-full p-2 border rounded"
								value={backFontSize}
								onChange={(e) => setBackFontSize(e.target.value as FontSizeKey)}
							>
								{Object.keys(FONT_SIZE_MAP).map((size) => (
									<option key={size} value={size}>
										{FONT_SIZE_LABELS[size as FontSizeKey]}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="mb-4">
						<h2 className="text-xl font-semibold">Select Type</h2>
						<div className="flex flex-wrap justify-center gap-2">
							{['all', 'word', 'phrase'].map((typeOption) => (
								<button
									key={typeOption}
									onClick={() =>
										setSelectedType(typeOption as 'all' | 'word' | 'phrase')
									}
									className={`px-3 py-1 border rounded-full text-sm ${
										selectedType === typeOption
											? 'bg-blue-500 text-white'
											: 'bg-gray-200'
									}`}
								>
									{typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
								</button>
							))}
						</div>
					</div>
					<div className="mb-4">
						<h2 className="text-xl font-semibold">Select Category</h2>
						<div className="flex flex-wrap justify-center gap-2">
							<button
								onClick={() => setSelectedCategory('all')}
								className={`px-3 py-1 border rounded-full text-sm ${
									selectedCategory === 'all'
										? 'bg-blue-500 text-white'
										: 'bg-gray-200'
								}`}
							>
								All
							</button>
							{categoryOptions.map((pos) => (
								<button
									key={pos}
									onClick={() => setSelectedCategory(pos)}
									className={`px-3 py-1 border rounded-full text-sm ${
										selectedCategory === pos
											? 'bg-blue-500 text-white'
											: 'bg-gray-200'
									}`}
								>
									{pos}
								</button>
							))}
						</div>
					</div>
					<div className="mb-4">
						<h2 className="text-xl font-semibold mb-2">Select Lessons</h2>

						{/* Lesson Buttons */}
						<div className="flex flex-wrap justify-center gap-2">
							{/* Clear All Button */}
							<button
								onClick={() => setSelectedLessons([])}
								className="px-3 py-1 border rounded-full text-sm bg-red-100 hover:bg-red-200"
							>
								Clear All
							</button>

							{/* All Button */}
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

							{/* Individual Lesson Buttons */}
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

			{filteredCards.length > 0 ? (
				<div
					className="relative w-full h-60 mb-4 perspective group cursor-pointer"
					onClick={() => setShowBack((prev) => !prev)}
				>
					{/* Flip Card */}
					<div
						className={`transition-transform duration-700 transform-style-preserve-3d w-full h-full rounded-xl shadow-md ${
							showBack ? 'rotate-y-180' : ''
						}`}
					>
						{/* Front */}
						<div className="absolute w-full h-full backface-hidden bg-white border rounded-xl p-2 sm:p-6 flex items-center justify-center overflow-hidden">
							{renderCardContent(frontField)}
						</div>

						{/* Back */}
						<div className="absolute w-full h-full backface-hidden rotate-y-180 bg-blue-100 border rounded-xl p-2 sm:p-6 flex items-center justify-center overflow-hidden">
							{renderCardContent(backField)}
						</div>
					</div>

					{/* Tap-to-flip hint */}
					<div className="absolute bottom-2 right-3 z-10 text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
						Tap to flip
					</div>
				</div>
			) : (
				<div className="text-center text-gray-500 text-base italic mb-6">
					No cards available with these customizations.
					<br />
					Please select a different lesson or choose different card sides.
				</div>
			)}

			{/* 🔵 Progress bar */}
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

			<div className="flex justify-center gap-4">
				<button
					onClick={handlePreviousCard}
					className="px-4 py-2 bg-gray-500 text-white rounded shadow"
				>
					Previous Card
				</button>
				<button
					onClick={handleNextCard}
					className="px-4 py-2 bg-blue-500 text-white rounded shadow"
				>
					Next Card
				</button>
			</div>
		</div>
	)
}
