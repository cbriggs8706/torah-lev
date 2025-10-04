'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useAudio } from 'react-use'

import { EnglishVocab } from '@/lib/vocab'
import { englishLetters } from '@/lib/english-letters'
import { useCelebration } from '@/hooks/useCelebration'
import { parseLessonKey, useLessonCards } from '@/hooks/useLessonCards'
import FormatFilter, { FormatType } from '../filters/filter-format'
import LessonFilter from '../filters/filter-lesson'
import CategoryFilter from '../filters/filter-category'
import ProgressBar from '../progress-bar'
import LanguageFilter from '../filters/filter-language'

interface EnglishSpellingProps {
	data: EnglishVocab[]
	currentLesson: string
	userId: string
}

const formatOptions: FormatType[] = [
	'image',
	'audio',
	'translation',
	'letter-by-letter',
]

export default function EnglishSpelling({
	data,
	currentLesson,
	userId,
}: EnglishSpellingProps) {
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
	const [showFilter, setShowFilter] = useState(false)
	const [isMobile, setIsMobile] = useState(false)
	const [selectedLang, setSelectedLang] = useState<'spa' | 'por'>('spa')
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [formatType, setFormatType] = useState<FormatType>('translation')
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [value, setValue] = useState('')
	const [audioVolume, setAudioVolume] = useState(1) // default: 100%
	const [audioSpeed, setAudioSpeed] = useState(1) // default: normal speed
	const { Confetti, celebrate } = useCelebration()
	const [cardsCompleted, setCardsCompleted] = useState(0)
	const [lastAwardedCheckpoint, setLastAwardedCheckpoint] = useState(0)

	function playConfiguredAudio(
		src: string,
		volume: number,
		speed: number,
		onEnd?: () => void
	) {
		if (!src) return

		const audio = new Audio(src)
		audio.volume = volume
		audio.playbackRate = speed
		if (onEnd) {
			audio.addEventListener('ended', onEnd)
		}
		audio.play().catch(console.error)
	}

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768) // You can adjust this breakpoint
		}

		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	const cardsForPrefix = useMemo(() => data, [data])

	useEffect(() => {
		if (currentLesson !== undefined) {
			const allLessonsUpToCurrent = lessonOptions.filter((lesson) => {
				const parsed = parseLessonKey(lesson)
				return !isNaN(parsed.num) && parsed.num <= Number(currentLesson)
			})
			setSelectedLessons(allLessonsUpToCurrent)
		}
	}, [currentLesson, lessonOptions, setSelectedLessons])

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
			if (formatType === 'image') return card.images[0]
			if (formatType === 'audio') return card.engAudio
			if (formatType === 'translation') return !!card.eng
			if (formatType === 'letter-by-letter') return !!card.eng
			return true
		})

		return [...valid].sort(() => Math.random() - 0.5)
	}, [
		cardsForPrefix,
		selectedLessons,
		selectedType,
		selectedCategory,
		formatType,
	])

	useEffect(() => {
		setCurrentIndex(0)
	}, [filteredCards, setCurrentIndex])

	const currentCard = filteredCards[currentIndex]

	const shouldSkipCard = useCallback(
		(card: EnglishVocab | undefined): boolean => {
			if (!card) return true

			if (
				formatType === 'image' &&
				(!card.images || card.images.length === 0)
			) {
				return true
			}
			if (formatType === 'audio' && !card.engAudio) {
				return true
			}

			return false
		},
		[formatType]
	)

	useEffect(() => {
		if (shouldSkipCard(currentCard)) {
			const nextIndex = (currentIndex + 1) % filteredCards.length
			setCurrentIndex(nextIndex)
		}
	}, [
		currentCard,
		formatType,
		currentIndex,
		filteredCards.length,
		shouldSkipCard,
		setCurrentIndex,
	])

	const [audioElement, __, controls] = useAudio({
		src: currentCard?.engAudio ? `/${currentCard.engAudio}` : '',
	})

	function normalizeEnglishInput(input: string): string {
		return input
			.normalize('NFKC') // Compatibility form handles presentation forms
			.toLowerCase() // ✅ Make comparison case-insensitive
	}

	function handleCheck() {
		const inputEl = document.getElementById(
			'spelling-input'
		) as HTMLInputElement
		if (!inputEl || !currentCard) return

		const cleanedInput = normalizeEnglishInput(inputEl.value.trim())

		// 🔑 Allow multiple acceptable answers separated by /
		const cleanedAnswers = currentCard.eng
			.split('/')
			.map((a) => normalizeEnglishInput(a.trim()))

		const isCorrect = cleanedAnswers.includes(cleanedInput)

		setShowFeedback(isCorrect)

		if (isCorrect) {
			setCardsCompleted((prev) => prev + 1)

			if (formatType === 'letter-by-letter' && currentCard?.engAudio) {
				smartPlayAudio(`/${currentCard.engAudio}`, audioVolume, audioSpeed)
			}

			const isLastCard = currentIndex === filteredCards.length - 1

			setTimeout(() => {
				setShowFeedback(null)
				inputEl.value = ''

				if (isLastCard) {
					celebrate()
				} else {
					setCurrentIndex((i) => (i + 1) % filteredCards.length)
				}
			}, 1000)
		}
	}

	function goToNext() {
		setCurrentIndex((i) => {
			const nextIndex = (i + 1) % filteredCards.length
			setShowFeedback(null)

			// Auto-play audio if formatType is audio or letter-by-letter
			if (formatType === 'audio' && filteredCards[nextIndex]?.engAudio) {
				setTimeout(() => {
					smartPlayAudio(
						`/${filteredCards[nextIndex].engAudio}`,
						audioVolume,
						audioSpeed
					)
				}, 100)
			} else if (
				formatType === 'letter-by-letter' &&
				filteredCards[nextIndex]?.eng
			) {
				setTimeout(() => {
					playLetterByLetter(filteredCards[nextIndex].eng)
				}, 100)
			}

			return nextIndex
		})
	}

	function goToPrevious() {
		setCurrentIndex((i) => {
			const prevIndex = (i - 1 + filteredCards.length) % filteredCards.length
			setShowFeedback(null)

			// Auto-play audio if formatType is audio and prev card has audio
			if (formatType === 'audio' && filteredCards[prevIndex]?.engAudio) {
				setTimeout(() => {
					smartPlayAudio(
						`/${filteredCards[prevIndex].engAudio}`,
						audioVolume,
						audioSpeed
					)
				}, 100)
			}

			return prevIndex
		})
	}

	// Prefer Sephardic audio if present; otherwise fall back
	const getActiveNameAudio = (l: any) => l.sephardicNameAudio ?? l.nameAudio
	const getActiveSoundAudio = (l: any) => l.sephardicSoundAudio ?? l.soundAudio

	function playLetterByLetter(word: string) {
		const normalized = word
			.normalize('NFKC')
			.replace(/[\u0591-\u05BD\u05BF-\u05C7\u05C1\u05C2]/g, '') // remove niqqud + shin/sin dots
			.replace(/[שׁשׂ]/g, 'ש') // normalize presentation forms

		const chars = Array.from(normalized)
		const audioPaths: string[] = []

		for (const char of chars) {
			const normalizedChar = char
				.normalize('NFKC')
				.replace(/[\u0591-\u05BD\u05BF-\u05C7\u05C1\u05C2]/g, '')

			// Find the letter object by character
			let match = englishLetters.find((l) => l.char === normalizedChar)

			// Special case: plain shin (ש) without dot → use shin audio entry
			if (!match && normalizedChar === 'ש') {
				match =
					englishLetters.find((l) => l.char === 'ש') ||
					englishLetters.find((l) =>
						(l.nameAudio ?? '').includes('name-shin-base.mp3')
					)
			}

			const nameAudio = match ? getActiveNameAudio(match) : undefined

			if (nameAudio) {
				console.log(`✅ Matched ${char} → ${match?.char} → ${nameAudio}`)
				audioPaths.push(nameAudio)
			} else {
				console.warn(`❌ No match for: ${char} (normalized: ${normalizedChar})`)
			}
		}

		function playSequentially(index = 0) {
			if (index >= audioPaths.length) return

			if (audioVolume > 1.0) {
				playWithBoostedVolume(audioPaths[index], audioVolume, audioSpeed)
				setTimeout(() => playSequentially(index + 1), 600)
			} else {
				const audio = new Audio(audioPaths[index])
				audio.volume = audioVolume
				audio.playbackRate = audioSpeed
				audio.addEventListener('ended', () => playSequentially(index + 1))
				audio.play().catch(console.error)
			}
		}

		playSequentially()
	}

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

	function smartPlayAudio(
		src: string,
		volume: number,
		speed: number,
		onEnd?: () => void
	) {
		if (volume > 1.0) {
			playWithBoostedVolume(src, volume, speed)
		} else {
			playConfiguredAudio(src, volume, speed, onEnd)
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

	useEffect(() => {
		if (
			cardsCompleted > 0 &&
			cardsCompleted % 10 === 0 &&
			cardsCompleted !== lastAwardedCheckpoint
		) {
			const pointsToAward = cardsCompleted / 10
			awardPoints(pointsToAward)
			setLastAwardedCheckpoint(cardsCompleted)
		}
	}, [cardsCompleted, lastAwardedCheckpoint, awardPoints])

	return (
		<div className="p-4 max-w-3xl mx-auto text-center">
			{Confetti}
			<div className="mb-6 flex justify-center gap-4">
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

			{/* Lesson + Category + Type Filters */}
			{showFilter && (
				<>
					<div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-6">
						<div className="text-sm text-center">
							<label className="block mb-1 font-medium">Volume</label>
							<input
								type="range"
								min="0"
								max="2"
								step="0.05"
								value={audioVolume}
								onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
							/>
							<div className="text-center">
								{Math.round(audioVolume * 100)}%
							</div>
						</div>
						<div className="text-sm text-center">
							<label className="block mb-1 font-medium">Speed</label>
							<input
								type="range"
								min="0.5"
								max="1"
								step="0.05"
								value={audioSpeed}
								onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
							/>
							<div className="text-center">{audioSpeed.toFixed(2)}x</div>
						</div>
					</div>

					<FormatFilter
						formatType={formatType}
						setFormatType={setFormatType}
						options={formatOptions}
					/>
					<LanguageFilter
						selectedLang={selectedLang}
						setSelectedLang={setSelectedLang}
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
				</>
			)}

			{/* Prompt Display */}
			{currentCard && (
				<div className="mb-6">
					{formatType === 'translation' && (
						<div className="mb-6 p-4 border-2 border-sky-300 bg-sky-50 rounded-xl shadow text-3xl font-bold">
							{selectedLang === 'spa' ? currentCard.spa : currentCard.por}
							{currentCard.gender && (
								<span className="text-xl font-medium text-gray-600">
									{' '}
									({currentCard.person}
									{currentCard.gender}
									{currentCard.number})
								</span>
							)}
						</div>
					)}

					{formatType === 'image' && currentCard.images[0] && (
						<Image
							src={currentCard.images[0]}
							alt="Prompt Image"
							width={300}
							height={200}
							className="mx-auto rounded"
						/>
					)}
					{formatType === 'audio' && currentCard.engAudio && (
						<>
							<button
								className="text-4xl mt-2 hover:text-sky-700"
								onClick={(e) => {
									e.preventDefault()
									smartPlayAudio(
										`/${currentCard.engAudio}`,
										audioVolume,
										audioSpeed
									)
								}}
							>
								🔊
							</button>
							{audioElement}
						</>
					)}
					{formatType === 'letter-by-letter' && currentCard.eng && (
						<button
							className="text-4xl mt-2 hover:text-sky-700"
							onClick={(e) => {
								e.preventDefault()
								playLetterByLetter(currentCard.eng)
							}}
						>
							🔊
						</button>
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
					className="border p-2 w-full max-w-xs text-center text-2xl rounded"
					autoFocus
					autoComplete="off"
					// readOnly={isMobile}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault()
							handleCheck()
						}
					}}
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
				<ProgressBar currentIndex={currentIndex} total={filteredCards.length} />
			)}

			{/* Feedback */}
			{showFeedback !== null && (
				<p
					className={`text-2xl mb-4 font-semibold ${
						showFeedback ? 'text-green-600' : 'text-red-500'
					}`}
				>
					{showFeedback !== null && (
						<p
							className={`text-xl mb-4 font-semibold ${
								showFeedback ? 'text-green-600' : 'text-red-500'
							}`}
						>
							{showFeedback ? (
								'Correct!'
							) : (
								<>Correct answer: {currentCard?.eng}</>
							)}
						</p>
					)}
				</p>
			)}
		</div>
	)
}
