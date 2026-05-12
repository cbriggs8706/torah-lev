'use client'

import { HebrewVocab } from '@/lib/vocab'
import { resolveVocabMediaUrl } from '@/lib/vocab-media'
import { matchesSelectedCategory } from '@/lib/category'
import Image from 'next/image'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useCelebration } from '@/hooks/useCelebration'
import { useLessonCards } from '@/hooks/useLessonCards'
import TypeFilter from '../filters/filter-type'
import CategoryFilter from '../filters/filter-category'
import LessonFilter from '../filters/filter-lesson'
import ProgressBar from '../progress-bar'
import { useUserId } from '@/hooks/useUserId'

type FontChoice =
	| 'arial'
	| 'times'
	| 'sans'
	| 'frank'
	| 'tinos'
	| 'nunito'
	| 'cardo'
	| 'rashi'
	| 'suez'

interface HebrewVocabProps {
	data: HebrewVocab[]
	allFields: (keyof HebrewVocab)[]
	currentLesson: string
	layout: string
	// userId: string
	courseId: number
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

const FIELD_LABELS: Partial<Record<keyof HebrewVocab, string>> = {
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
	introduction: 'Video',
}

const FONT_CLASS_MAP: Record<FontChoice, string> = {
	arial: 'font-arial',
	times: 'font-serif',
	frank: 'font-frank',
	sans: 'font-sans',
	tinos: 'font-tinos',
	nunito: 'font-nunito',
	cardo: 'font-cardo',
	rashi: 'font-rashi',
	suez: 'font-suez',
}

export default function HebrewFlashcards({
	data,
	allFields,
	currentLesson,
	layout,
	courseId,
}: // userId,
HebrewVocabProps) {
	const {
		selectedLessons,
		setSelectedLessons,
		currentIndex,
		setCurrentIndex,
		lessonOptions,
	} = useLessonCards(data, currentLesson)
	const [selectedType, setSelectedType] = useState<'all' | 'word' | 'phrase'>(
		'word'
	)
	const [frontField, setFrontField] = useState<keyof HebrewVocab>('hebNiqqud')
	const [backField, setBackField] = useState<keyof HebrewVocab>('eng')
	const [showBack, setShowBack] = useState(false)
	const [filteredCards, setFilteredCards] = useState<HebrewVocab[]>([])
	const [selectedCategory, setSelectedCategory] = useState<string>('all')

	const [frontFont, setFrontFont] = useState<FontChoice>('times')
	const [backFont, setBackFont] = useState<FontChoice>('times')

	const [frontFontSize, setFrontFontSize] = useState<FontSizeKey>('threexl')
	const [backFontSize, setBackFontSize] = useState<FontSizeKey>('threexl')
	const [showCustomize, setShowCustomize] = useState(false)
	const [showFilter, setShowFilter] = useState(false)
	const [audioVolume, setAudioVolume] = useState(1) // full volume
	const [audioSpeed, setAudioSpeed] = useState(1) // normal speed
	const [frontTopLeft, setFrontTopLeft] = useState<keyof HebrewVocab | 'none'>(
		'none'
	)
	const [frontTopCenter, setFrontTopCenter] = useState<
		keyof HebrewVocab | 'none'
	>('none')
	const [frontTopRight, setFrontTopRight] = useState<
		keyof HebrewVocab | 'hebAudio'
	>('hebAudio')
	const [frontMiddleCenter, setFrontMiddleCenter] = useState<
		keyof HebrewVocab | 'none'
	>('images')
	const [frontBottomLeft, setFrontBottomLeft] = useState<
		keyof HebrewVocab | 'none'
	>('none')
	const [frontBottomCenter, setFrontBottomCenter] = useState<
		keyof HebrewVocab | 'genderPerson'
	>('genderPerson')
	const [frontBottomRight, setFrontBottomRight] = useState<
		keyof HebrewVocab | 'none'
	>('none')
	const [backTopLeft, setBackTopLeft] = useState<keyof HebrewVocab | 'none'>(
		'none'
	)
	const [backTopCenter, setBackTopCenter] = useState<
		keyof HebrewVocab | 'none'
	>('eng')
	const [backTopRight, setBackTopRight] = useState<
		keyof HebrewVocab | 'hebAudio'
	>('hebAudio')
	const [backMiddleCenter, setBackMiddleCenter] = useState<
		keyof HebrewVocab | 'eng'
	>('hebNiqqud')
	const [backBottomLeft, setBackBottomLeft] = useState<
		keyof HebrewVocab | 'none'
	>('none')
	const [backBottomCenter, setBackBottomCenter] = useState<
		keyof HebrewVocab | 'ipa'
	>('ipa')
	const [backBottomRight, setBackBottomRight] = useState<
		keyof HebrewVocab | 'engTransliteration'
	>('engTransliteration')
	const [cardsCompleted, setCardsCompleted] = useState(0)
	const [isRandomized, setIsRandomized] = useState(false)
	const [filterVersion, setFilterVersion] = useState(0)

	const { userId } = useUserId()
	// console.log('newUserId in local', userId)

	const PRESETS = [
		{
			label: 'Picture → Word',
			front: { middle: 'images', font: 'sans', size: 'xl' },
			back: { middle: 'hebNiqqud', font: 'times', size: 'threexl' },
		},
		{
			label: 'Audio → Picture',
			front: { middle: 'hebAudio', font: 'sans', size: 'xl' },
			back: { middle: 'images', font: 'times', size: 'threexl' },
		},
		{
			label: 'Sightread',
			front: { middle: 'heb', font: 'times', size: 'threexl' },
			back: { middle: 'hebAudio', font: 'arial', size: 'lg' },
		},
		{
			label: 'Translation',
			front: { middle: 'hebNiqqud', font: 'times', size: 'threexl' },
			back: { middle: 'eng', font: 'times', size: 'lg' },
		},
	] as const

	const { Confetti, celebrate } = useCelebration()

	function applyPreset(preset: (typeof PRESETS)[number]) {
		setFrontMiddleCenter(preset.front.middle as keyof HebrewVocab)
		setFrontFont(preset.front.font as FontChoice)
		setFrontFontSize(preset.front.size as FontSizeKey)

		setBackMiddleCenter(preset.back.middle as keyof HebrewVocab)
		setBackFont(preset.back.font as FontChoice)
		setBackFontSize(preset.back.size as FontSizeKey)

		// Reset positions to default for simplicity
		setFrontTopLeft('none')
		setFrontTopCenter('none')
		setFrontTopRight('hebAudio')
		setFrontBottomLeft('none')
		setFrontBottomCenter('genderPerson')
		setFrontBottomRight('none')

		setBackTopLeft('none')
		setBackTopCenter('none')
		setBackTopRight('hebAudio')
		setBackBottomLeft('none')
		setBackBottomCenter('ipa')
		setBackBottomRight('engTransliteration')
		setShowCustomize(false)
	}

	// Filter to this prefix
	const cardsForPrefix = useMemo(() => data, [data])
	useEffect(() => {
		const newFiltered = cardsForPrefix.filter((card) => {
			const matchesSelectedLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((l) => selectedLessons.includes(l))

			const matchesType = selectedType === 'all' || card.type === selectedType
			const matchesCategory = matchesSelectedCategory(
				card.category,
				selectedCategory
			)

			// Ensure middle-center image/audio (front)
			const hasMiddleFrontImage =
				frontMiddleCenter !== 'images' || card.images.length > 0
			const hasMiddleFrontAudio =
				frontMiddleCenter !== 'hebAudio' || !!card.hebAudio

			// Ensure middle-center image/audio (back)
			const hasMiddleBackImage =
				backMiddleCenter !== 'images' || card.images.length > 0
			const hasMiddleBackAudio =
				backMiddleCenter !== 'hebAudio' || !!card.hebAudio

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
				hasValidBack &&
				hasMiddleFrontImage &&
				hasMiddleBackImage &&
				hasMiddleFrontAudio &&
				hasMiddleBackAudio
			)
		})

		// Shuffle the filtered cards
		let finalCards = [...newFiltered]
		if (isRandomized) {
			finalCards.sort(() => Math.random() - 0.5)
		}
		setFilteredCards(finalCards)

		setCurrentIndex(0)
		setShowBack(false)
	}, [
		cardsForPrefix,
		selectedLessons,
		selectedType,
		selectedCategory,
		frontField,
		backField,
		frontMiddleCenter,
		backMiddleCenter,
		setCurrentIndex,
		filterVersion,
		isRandomized,
	])

	const currentCard = filteredCards[currentIndex]

	function playWithBoostedVolume(url: string, volume: number, speed: number) {
		const audioContext = new (window.AudioContext ||
			(window as any).webkitAudioContext)()
		const audio = new Audio(url)
		audio.crossOrigin = 'anonymous'
		audio.playbackRate = speed

		const source = audioContext.createMediaElementSource(audio)
		const gainNode = audioContext.createGain()

		// Allow volume up to 2.0 (200%)
		gainNode.gain.value = Math.min(volume, 2.0)

		source.connect(gainNode).connect(audioContext.destination)
		audio.play().catch(console.error)
	}

	// Refs for controlling playback programmatically
	// const frontAudioRef = useMemo(() => {
	// 	if (frontField === 'hebAudio' && currentCard?.hebAudio)
	// 		return new Audio(currentCard.hebAudio)
	// 	return null
	// }, [frontField, currentCard])

	const backAudioRef = useMemo(() => {
		if (backField === 'hebAudio' && currentCard?.hebAudio)
			return new Audio(currentCard.hebAudio)
		return null
	}, [backField, currentCard])

	const fontOptions: {
		value: FontChoice
		label: string
		className: string
	}[] = [
		{ value: 'times', label: 'Times', className: 'font-serif' },
		{
			value: 'frank',
			label: 'Frank',
			className: 'font-frank',
		},
		{
			value: 'tinos',
			label: 'Tinos',
			className: 'font-tinos',
		},
		{
			value: 'cardo',
			label: 'Cardo',
			className: 'font-cardo',
		},
		{
			value: 'rashi',
			label: 'Rashi',
			className: 'font-rashi',
		},
		{
			value: 'suez',
			label: 'Suez',
			className: 'font-suez',
		},
		{ value: 'arial', label: 'Arial', className: 'font-arial' },
		{
			value: 'sans',
			label: 'Sans',
			className: 'font-sans',
		},

		{
			value: 'nunito',
			label: 'Nunito',
			className: 'font-nunito',
		},
	]

	useEffect(() => {
		if (frontMiddleCenter === 'hebAudio' && currentCard?.hebAudio) {
			playWithBoostedVolume(currentCard.hebAudio, audioVolume, audioSpeed)
		}
	}, [currentCard, frontMiddleCenter, audioVolume, audioSpeed])

	useEffect(() => {
		if (showBack && backField === 'hebAudio' && backAudioRef) {
			backAudioRef.play().catch(console.error)
		}
	}, [showBack, backField, backAudioRef])

	function handleNextCard() {
		setShowBack(false) // flip to front first

		// Wait for flip animation to complete before changing the card
		setTimeout(() => {
			const nextIndex = currentIndex + 1
			if (nextIndex >= filteredCards.length) {
				celebrate()
			}
			setCardsCompleted((prev) => prev + 1)

			setCurrentIndex(nextIndex % filteredCards.length)
		}, 700) // ⏱ adjust this to match your card flip duration
	}

	const awardPoints = useCallback(
		async (points: number) => {
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
		if (cardsCompleted > 0 && cardsCompleted % 25 === 0) {
			const pointsToAward = cardsCompleted / 25
			awardPoints(pointsToAward)
		}
	}, [cardsCompleted, awardPoints])

	function handlePreviousCard() {
		setShowBack(false)

		setTimeout(() => {
			setCurrentIndex(
				(prev) => (prev - 1 + filteredCards.length) % filteredCards.length
			)
		}, 700) // match the flip animation duration
	}

	// Auto set optimal font size on load
	useEffect(() => {
		const width = window.innerWidth
		if (width < 400) {
			setFrontFontSize('threexl')
			setBackFontSize('threexl')
		} else if (width < 768) {
			setFrontFontSize('threexl')
			setBackFontSize('threexl')
		} else {
			setFrontFontSize('threexl')
			setBackFontSize('threexl')
		}
	}, [])

	const allDisplayFields = allFields.filter((f) => f !== 'dictionaryUrl')
	const miniPositionFields: (keyof HebrewVocab)[] = [
		'heb',
		'hebNiqqud',
		'ipa',
		'hebAudio',
		'genderPerson',
		'engTransliteration',
		'eng',
	]

	function fixHebrewPunctuation(text: string): string {
		// Replace ? at the end of a line with RTL-friendly question mark
		// Only if the text contains Hebrew characters
		const hebrewRegex = /[\u0590-\u05FF]/ // matches Hebrew script
		if (!hebrewRegex.test(text)) return text

		// Replace ? at the end or before a line break
		return text.replace(/\?/g, '؟') // Arabic-style RTL question mark
	}

	function convertToEmbedUrl(url: string): string {
		try {
			const parsed = new URL(url)
			const videoId = parsed.pathname.split('/').pop()
			const start = parsed.searchParams.get('t')?.replace(/\D/g, '') // extract seconds
			return `https://www.youtube.com/embed/${videoId}?autoplay=1${
				start ? `&start=${start}` : ''
			}`
		} catch {
			return url
		}
	}

	function InlineVideoPlayer({ url }: { url: string }) {
		const [isPlaying, setIsPlaying] = useState(false)
		const embedUrl = convertToEmbedUrl(url)

		if (!isPlaying) {
			return (
				<button
					onClick={(e) => {
						e.stopPropagation()
						setIsPlaying(true)
					}}
					className="flex flex-col items-center gap-1"
				>
					<Image
						src={'/icons/iconYoutube.png'}
						alt="Play video"
						width={50}
						height={50}
						className="cursor-pointer hover:opacity-80"
					/>
					<span className="text-sky-600 text-sm font-semibold">Watch</span>
				</button>
			)
		}

		return (
			<div className="w-full h-full flex justify-center items-center rounded overflow-hidden">
				<iframe
					src={embedUrl}
					title="YouTube video"
					className="w-full h-full border-0 rounded object-cover"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
				></iframe>
			</div>
		)
	}

	function renderMiniContent(
		field: keyof HebrewVocab | 'none',
		isMiddle = false
	) {
		if (!currentCard || field === 'none') return null

		const value = currentCard[field]

		if (field === 'images' && Array.isArray(value)) {
			if (value.length > 0) {
				const imageUrl = resolveVocabMediaUrl(value[0])
				return (
					//TODO fix the console errors of position
					<div
						className={
							isMiddle
								? 'w-full h-full flex items-center justify-center'
								: 'w-full h-32 flex items-center justify-center'
						}
					>
						<Image
							src={imageUrl}
							alt="HebrewVocab image"
							fill={isMiddle}
							className="object-contain rounded"
							sizes="(max-width: 768px) 100vw, 50vw"
						/>
					</div>
				)
			}

			if (currentCard.hebAudio) {
				return (
					<div className="flex flex-col items-center gap-2">
						<button
							className="text-3xl text-sky-600 hover:text-sky-800"
							onClick={(e) => {
								e.stopPropagation()
								playWithBoostedVolume(
									currentCard.hebAudio || '',
									audioVolume,
									audioSpeed
								)
							}}
						>
							🔊
						</button>
						<span className="text-xs text-slate-500">No image</span>
					</div>
				)
			}

			if (currentCard.eng) {
				return (
					<div className="flex flex-col items-center gap-2">
						<span className={isMiddle ? 'text-xl font-semibold' : ''}>
							{currentCard.eng}
						</span>
						<span className="text-xs text-slate-500">No image</span>
					</div>
				)
			}

			return null
		}

		if (!value) return null

		if (field === 'hebAudio' && typeof value === 'string') {
			return (
				<button
					className="text-3xl text-sky-600 hover:text-sky-800"
					onClick={(e) => {
						e.stopPropagation()
						playWithBoostedVolume(
							currentCard.hebAudio || '',
							audioVolume,
							audioSpeed
						)
					}}
				>
					🔊
				</button>
			)
		}

		if (field === 'introduction' && typeof value === 'string') {
			return <InlineVideoPlayer url={value} />
		}

		if (Array.isArray(value)) {
			return value.join(', ')
		}

		const isHebrewField = field === 'heb' || field === 'hebNiqqud'
		const className = !isMiddle && isHebrewField ? 'font-serif text-4xl' : ''

		return (
			<span className={className}>{fixHebrewPunctuation(value as string)}</span>
		)
	}

	return (
		<div className="p-4 max-w-3xl mx-auto text-center w-full">
			{Confetti}

			{/* Customize Section Toggle */}
			<div className="mb-6 flex justify-center gap-4">
				<button
					onClick={() => setShowCustomize((prev) => !prev)}
					className={`px-4 py-2 rounded shadow flex items-center justify-center gap-4 ${
						showCustomize ? 'bg-sky-600 text-white' : 'bg-gray-200'
					}`}
				>
					<Image
						src="/woman-artist-light-skin-tone-svgrepo-com.svg"
						alt="Filter icon"
						width={30}
						height={30}
						className=""
					/>
					Customize
				</button>
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
						className=""
					/>
					Filter
				</button>
			</div>

			<div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-6">
				<div className="text-sm">
					<label className="block mb-1 font-medium">Volume</label>
					<input
						type="range"
						min="0"
						max="2"
						step="0.05"
						value={audioVolume}
						onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
						className="accent-sky-600"
					/>
					<div className="text-center">{Math.round(audioVolume * 100)}%</div>
				</div>
				<div className="text-sm">
					<label className="block mb-1 font-medium">Audio Speed</label>
					<input
						type="range"
						min="0.5"
						max="1"
						step="0.05"
						value={audioSpeed}
						onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
						className="accent-sky-600"
					/>
					<div className="text-center">{audioSpeed.toFixed(1)}x</div>
				</div>
			</div>

			{/* Front/Back Customization (Hidden Until Clicked) */}
			{showCustomize && (
				<>
					<div className="mb-4 flex flex-wrap justify-center gap-3">
						<span className="my-auto font-semibold">Presets:</span>
						{PRESETS.map((preset) => (
							<button
								key={preset.label}
								onClick={() => applyPreset(preset)}
								className="px-3 py-2 bg-violet-600 text-white rounded shadow hover:bg-violet-500"
							>
								{preset.label}
							</button>
						))}
					</div>
					<div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="grid grid-cols-3 gap-4 rounded-md p-4 border">
							<div className="font-bold text-center col-span-3 text-xl">
								Front of Card Customization
							</div>
							<div>
								<label className="block text-sm font-medium">Top Left</label>
								<select
									className="w-full p-2 border rounded"
									value={frontTopLeft}
									onChange={(e) =>
										setFrontTopLeft(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>

									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Top Center</label>
								<select
									className="w-full p-2 border rounded"
									value={frontTopCenter}
									onChange={(e) =>
										setFrontTopCenter(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Top Right</label>
								<select
									className="w-full p-2 border rounded"
									value={frontTopRight}
									onChange={(e) =>
										setFrontTopRight(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div className="col-span-3">
								<label className="block text-sm font-medium">
									Middle Center
								</label>
								<select
									className="w-full p-2 border rounded"
									value={frontMiddleCenter}
									onChange={(e) =>
										setFrontMiddleCenter(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{allDisplayFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div className="flex gap-2 flex-wrap justify-between mt-1 col-span-3">
								{fontOptions.map(({ label, value, className }) => (
									<button
										key={value}
										type="button"
										onClick={() => setFrontFont(value)}
										className={`px-4 py-1 border rounded-full text-sm ${
											frontFont === value
												? 'bg-sky-600 text-white'
												: 'bg-gray-100'
										} ${className}`}
									>
										{label}
									</button>
								))}
							</div>
							<div className="col-span-3">
								<label className="block text-sm font-medium">Size</label>
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
								<label className="block text-sm font-medium">Bottom Left</label>
								<select
									className="w-full p-2 border rounded"
									value={frontBottomLeft}
									onChange={(e) =>
										setFrontBottomLeft(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">
									Bottom Center
								</label>
								<select
									className="w-full p-2 border rounded"
									value={frontBottomCenter}
									onChange={(e) =>
										setFrontBottomCenter(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">
									Bottom Right
								</label>
								<select
									className="w-full p-2 border rounded"
									value={frontBottomRight}
									onChange={(e) =>
										setFrontBottomRight(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="grid grid-cols-3 gap-4 bg-sky-100 p-4 rounded-md">
							<div className="font-bold text-center col-span-3 text-xl">
								Back of Card Customization
							</div>
							<div>
								<label className="block text-sm font-medium">Top Left</label>
								<select
									className="w-full p-2 border rounded"
									value={backTopLeft}
									onChange={(e) =>
										setBackTopLeft(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Top Center</label>
								<select
									className="w-full p-2 border rounded"
									value={backTopCenter}
									onChange={(e) =>
										setBackTopCenter(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">Top Right</label>
								<select
									className="w-full p-2 border rounded"
									value={backTopRight}
									onChange={(e) =>
										setBackTopRight(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div className="col-span-3">
								<label className="block text-sm font-medium">
									Middle Center
								</label>
								<select
									className="w-full p-2 border rounded"
									value={backMiddleCenter}
									onChange={(e) =>
										setBackMiddleCenter(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{/* Explicit list so only these fields are allowed */}
									{[
										'heb',
										'hebNiqqud',
										'eng',
										'genderPerson',
										'partOfSpeech',
										'ipa',
										'engTransliteration',
										'images',
										'hebAudio',
										'introduction',
									].map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field as keyof HebrewVocab] || field}
										</option>
									))}
								</select>
							</div>
							<div className="flex gap-2 flex-wrap justify-between mt-1 col-span-3">
								{fontOptions.map(({ label, value, className }) => (
									<button
										key={value}
										type="button"
										onClick={() => setBackFont(value)}
										className={`px-4 py-1 border rounded-full text-sm ${
											backFont === value
												? 'bg-sky-600 text-white'
												: 'bg-gray-100'
										} ${className}`}
									>
										{label}
									</button>
								))}
							</div>
							<div className="col-span-3">
								<label className="block text-sm font-medium">Size</label>
								<select
									className="w-full p-2 border rounded"
									value={backFontSize}
									onChange={(e) =>
										setBackFontSize(e.target.value as FontSizeKey)
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
								<label className="block text-sm font-medium">Bottom Left</label>
								<select
									className="w-full p-2 border rounded"
									value={backBottomLeft}
									onChange={(e) =>
										setBackBottomLeft(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">
									Bottom Center
								</label>
								<select
									className="w-full p-2 border rounded"
									value={backBottomCenter}
									onChange={(e) =>
										setBackBottomCenter(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium">
									Bottom Right
								</label>
								<select
									className="w-full p-2 border rounded"
									value={backBottomRight}
									onChange={(e) =>
										setBackBottomRight(e.target.value as keyof HebrewVocab)
									}
								>
									<option value="none">None</option>
									{miniPositionFields.map((field) => (
										<option key={field} value={field}>
											{FIELD_LABELS[field] || field}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
				</>
			)}

			{showFilter && (
				<>
					<TypeFilter
						selectedType={selectedType}
						setSelectedType={setSelectedType}
					/>
					<CategoryFilter
						data={data}
						selectedCategory={selectedCategory}
						setSelectedCategory={setSelectedCategory}
					/>
					<LessonFilter
						data={data}
						selectedLessons={selectedLessons}
						setSelectedLessons={setSelectedLessons}
						showRanges={true}
					/>
					<div className="flex items-center justify-center my-4 gap-2">
						{!isRandomized ? (
							<button
								onClick={() => {
									setIsRandomized(true)
									setFilteredCards((prev) =>
										[...prev].sort(() => Math.random() - 0.5)
									)
									setCurrentIndex(0)
								}}
								className="px-4 py-2 bg-violet-600 text-white rounded shadow hover:bg-violet-500 transition"
							>
								🔀 Randomize Cards
							</button>
						) : (
							<button
								onClick={() => {
									setIsRandomized(false)
									setFilterVersion((v) => v + 1)
									setCurrentIndex(0)
								}}
								className="px-4 py-2 bg-gray-300 text-gray-800 rounded shadow hover:bg-gray-200 transition"
							>
								↩️ Reset Order
							</button>
						)}
					</div>
				</>
			)}

			{filteredCards.length > 0 ? (
				<div
					className={`relative w-full mb-4 perspective cursor-pointer ${
						frontMiddleCenter === 'images' ? 'h-96' : 'h-72'
					}`}
					onClick={() => setShowBack((prev) => !prev)}
				>
					<div
						className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
							showBack ? 'rotate-y-180' : ''
						}`}
					>
						{/* Front */}
						<div className="absolute w-full h-full backface-hidden bg-white border rounded-xl p-2 sm:p-6 flex flex-col">
							{/* Top Row */}
							<div className="flex justify-between text-lg font-nunito">
								<div className="text-left w-1/3">
									{renderMiniContent(frontTopLeft, false)}
								</div>
								<div className="text-center w-1/3">
									{renderMiniContent(frontTopCenter, false)}
								</div>
								<div className="text-right w-1/3">
									{renderMiniContent(frontTopRight, false)}
								</div>
							</div>

							{/* Middle Row (flexes to fill) */}
							{/* <div className="flex-1 flex items-center justify-center text-center overflow-hidden"> */}
							<div className="flex-1 relative overflow-hidden flex items-center justify-center leading-none">
								<span
									className={FONT_CLASS_MAP[frontFont]}
									style={{ fontSize: FONT_SIZE_MAP[frontFontSize] }}
								>
									{renderMiniContent(frontMiddleCenter, true)}
								</span>
							</div>
							{/* </div> */}

							{/* Bottom Row */}
							<div className="flex justify-between text-lg font-nunito">
								<div className="text-left w-1/3 self-end">
									{renderMiniContent(frontBottomLeft, false)}
								</div>
								<div className="text-center w-1/3 self-end">
									{renderMiniContent(frontBottomCenter, false)}
								</div>
								<div className="text-right w-1/3 self-end">
									{renderMiniContent(frontBottomRight, false)}
								</div>
							</div>
						</div>

						{/* Back */}
						<div className="absolute w-full h-full backface-hidden rotate-y-180 bg-sky-100 border rounded-xl p-2 sm:p-6 grid grid-rows-[auto,1fr,auto] grid-cols-[0.5fr,2fr,0.5fr] gap-1">
							{/* Top Row */}
							<div className="text-md font-nunito text-left">
								{renderMiniContent(backTopLeft, false)}
							</div>
							<div className="text-md font-nunito text-center">
								{renderMiniContent(backTopCenter, false)}
							</div>
							<div className="text-md font-nunito text-right">
								{renderMiniContent(backTopRight, false)}
							</div>

							{/* Middle */}
							<div
								className="flex-1 col-span-3 relative overflow-hidden flex items-center justify-center"
								style={{ fontSize: FONT_SIZE_MAP[backFontSize] }}
							>
								<span className={FONT_CLASS_MAP[backFont]}>
									{renderMiniContent(backMiddleCenter, true)}
								</span>
							</div>

							{/* Bottom Row */}
							<div className="text-md font-nunito text-left self-end">
								{renderMiniContent(backBottomLeft, false)}
							</div>
							<div className="text-md font-nunito text-center self-end">
								{renderMiniContent(backBottomCenter, false)}
							</div>
							<div className="text-md font-nunito text-right self-end">
								{renderMiniContent(backBottomRight, false)}
							</div>
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
				<ProgressBar currentIndex={currentIndex} total={filteredCards.length} />
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
					className="px-4 py-2 bg-sky-600 text-white rounded shadow"
				>
					Next Card
				</button>
			</div>
		</div>
	)
}
