'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useAudio } from 'react-use'

import HebrewKeyboard from './hebrew-keyboard'
import { HebrewVocab } from '@/lib/vocab'
import { formatRootMorphology, hasRootMorphology } from '@/lib/vocab-morphology'
import { resolveVocabMediaUrl } from '@/lib/vocab-media'
import { matchesSelectedCategory } from '@/lib/category'
import { hebrewLetters } from '@/lib/data/hebrew/hebrew-letters'
import { hebrewNiqqud } from '@/lib/data/hebrew/hebrew-niqqud'
import { useCelebration } from '@/hooks/useCelebration'
import { parseLessonKey, useLessonCards } from '@/hooks/useLessonCards'
import FormatFilter, { FormatType } from '../filters/filter-format'
import LessonFilter from '../filters/filter-lesson'
import CategoryFilter from '../filters/filter-category'
import ProgressBar from '../progress-bar'

interface HebrewSpellingProps {
	data: HebrewVocab[]
	currentLesson: string
	userId: string
	courseId: number | null
}

const formatOptions: FormatType[] = [
	'image',
	'audio',
	'translation',
	'letter-by-letter',
]

type GradingMode = 'consonants-only' | 'consonants-and-vowels'

export default function HebrewSpelling({
	data,
	currentLesson,
	courseId,
	userId,
}: HebrewSpellingProps) {
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

	const [selectedCategory, setSelectedCategory] = useState('all')
	const [formatType, setFormatType] = useState<FormatType>('image')
	const [gradingMode, setGradingMode] =
		useState<GradingMode>('consonants-only')
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
			.filter((card) =>
				matchesSelectedCategory(card.category, selectedCategory)
			)

		const valid = filtered.filter((card) => {
			if (formatType === 'image') return resolveVocabMediaUrl(card.images[0])
			if (formatType === 'audio') return card.hebAudio
			if (formatType === 'translation') return !!card.eng
			if (formatType === 'letter-by-letter') return !!card.heb
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
		(card: HebrewVocab | undefined): boolean => {
			if (!card) return true

			if (
				formatType === 'image' &&
				(!card.images || card.images.length === 0)
			) {
				return true
			}
			if (formatType === 'audio' && !card.hebAudio) {
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
		src: resolveVocabMediaUrl(currentCard?.hebAudio),
	})

	function normalizeHebrewInput(input: string): string {
		return input
			.normalize('NFKC') // Compatibility form handles presentation forms
			.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '') // Remove niqqud
			.replace(/[שׁשׂ]/g, 'ש') // שׁ (U+FB2A) and שׂ (U+FB2B) → ש
	}

	function normalizeHebrewPointedInput(input: string): string {
		return input
			.normalize('NFKC')
			.replace(/[\u0591-\u05AF]/g, '')
			.replace(/[שׁ]/g, 'שׁ')
			.replace(/[שׂ]/g, 'שׂ')
	}

	function getExpectedAnswer(card: HebrewVocab): string {
		if (gradingMode === 'consonants-and-vowels') {
			return card.hebNiqqud?.trim() || card.heb.trim()
		}

		return card.heb.trim()
	}

	function handleCheck() {
		const inputEl = document.getElementById(
			'spelling-input'
		) as HTMLInputElement
		if (!inputEl || !currentCard) return

		const answer = getExpectedAnswer(currentCard)
		const cleanedInput =
			gradingMode === 'consonants-and-vowels'
				? normalizeHebrewPointedInput(inputEl.value.trim())
				: normalizeHebrewInput(inputEl.value.trim())
		const cleanedAnswer =
			gradingMode === 'consonants-and-vowels'
				? normalizeHebrewPointedInput(answer)
				: normalizeHebrewInput(answer)
		const isCorrect = cleanedInput === cleanedAnswer

		setShowFeedback(isCorrect)

		if (isCorrect) {
			setCardsCompleted((prev) => prev + 1)

			if (
				isCorrect &&
				formatType === 'letter-by-letter' &&
				currentCard?.hebAudio
			) {
				smartPlayAudio(
					resolveVocabMediaUrl(currentCard.hebAudio),
					audioVolume,
					audioSpeed
				)
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
			if (formatType === 'audio' && filteredCards[nextIndex]?.hebAudio) {
				setTimeout(() => {
					smartPlayAudio(
						resolveVocabMediaUrl(filteredCards[nextIndex].hebAudio),
						audioVolume,
						audioSpeed
					)
				}, 100)
			} else if (
				formatType === 'letter-by-letter' &&
				filteredCards[nextIndex]?.heb
			) {
				setTimeout(() => {
					playLetterByLetter(
						filteredCards[nextIndex].hebNiqqud || filteredCards[nextIndex].heb
					)
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
			if (formatType === 'audio' && filteredCards[prevIndex]?.hebAudio) {
				setTimeout(() => {
					smartPlayAudio(
						resolveVocabMediaUrl(filteredCards[prevIndex].hebAudio),
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

	const niqqudAudioByMark: Record<string, string> = {
		'\u05B0': '/alphabet/heb/shva.mp3',
		'\u05B1': '/alphabet/heb/chataf-segol.mp3',
		'\u05B2': '/alphabet/heb/chataf-patach.mp3',
		'\u05B3': '/alphabet/heb/chataf-kamatz.mp3',
		'\u05B4': '/alphabet/heb/chiriq.mp3',
		'\u05B5': '/alphabet/heb/tsere.mp3',
		'\u05B6': '/alphabet/heb/segol.mp3',
		'\u05B7': '/alphabet/heb/patach.mp3',
		'\u05B8': '/alphabet/heb/kamatz-gadol.mp3',
		'\u05B9': '/alphabet/heb/cholam.mp3',
		'\u05BB': '/alphabet/heb/kubutz.mp3',
		'\u05BC': '/alphabet/heb/dagesh.mp3',
		'\u05C7': '/alphabet/heb/kamatz-katan.mp3',
	}

	type HebrewCluster = {
		base: string
		marks: string[]
		suffix?: string
	}

	const mergedDageshNameChars: Record<string, string> = {
		ב: 'בּ',
		כ: 'כּ',
		פ: 'פּ',
	}

	const maleiAudioByPair: Record<string, string> = {
		'\u05D5\u05BC': '/alphabet/heb/shuruk.mp3',
		'\u05B4\u05D9': '/alphabet/heb/chiriq-malei.mp3',
		'\u05B5\u05D9': '/alphabet/heb/tsere-malei.mp3',
		'\u05B6\u05D9': '/alphabet/heb/segol-malei.mp3',
		'\u05B7\u05D4': '/alphabet/heb/patach-malei.mp3',
		'\u05B8\u05D4': '/alphabet/heb/kamatz-malei.mp3',
		'\u05B9\u05D5': '/alphabet/heb/cholam-malei.mp3',
	}

	function tokenizePointedHebrew(text: string): HebrewCluster[] {
		const normalized = text.normalize('NFKC')
		const tokens: HebrewCluster[] = []
		let index = 0

		while (index < normalized.length) {
			const char = normalized[index]

			if (/\s/.test(char) || char === '־') {
				index += 1
				continue
			}

			let nextIndex = index + 1

			while (
				nextIndex < normalized.length &&
				/[\u0591-\u05BD\u05BF-\u05C7]/.test(normalized[nextIndex])
			) {
				nextIndex += 1
			}

			if (
				char === '\u05D5' &&
				nextIndex < normalized.length &&
				normalized[nextIndex] === '\u05BC'
			) {
				tokens.push({ base: char, marks: ['\u05BC'], suffix: '\u05BC' })
				index = nextIndex + 1
				continue
			}

			const token = normalized.slice(index, nextIndex)
			const [base, ...marks] = Array.from(token)
			let suffix: string | undefined

			const vowelMarks = marks.filter((mark) =>
				['\u05B4', '\u05B5', '\u05B6', '\u05B7', '\u05B8', '\u05B9'].includes(
					mark
				)
			)

			if (
				vowelMarks.length > 0 &&
				nextIndex < normalized.length &&
				/[\u05D0-\u05EA]/.test(normalized[nextIndex])
			) {
				const candidateSuffix = normalized[nextIndex]
				const pairKey = `${vowelMarks[0]}${candidateSuffix}`

				if (maleiAudioByPair[pairKey]) {
					suffix = candidateSuffix
					nextIndex += 1
				}
			}

			if (base) {
				tokens.push({ base, marks, suffix })
			}
			index = nextIndex
		}

		return tokens
	}

	function playConsonantsOnlyLetterByLetter(word: string) {
		const normalized = word
			.normalize('NFKC')
			.replace(/[\u0591-\u05C7]/g, '')
			.replace(/[שׁ]/g, 'ש')
			.replace(/[שׂ]/g, 'ש')
		const audioPaths: string[] = []

		for (const char of Array.from(normalized)) {
			if (/\s/.test(char) || char === '־') {
				continue
			}

			let match = hebrewLetters.find((l) => l.char === char)

			if (!match && char === 'ש') {
				match =
					hebrewLetters.find((l) =>
						(l.nameAudio ?? '').includes('name-shin-base.mp3')
					) ||
					hebrewLetters.find((l) => l.char === 'ש')
			}

			const consonantAudio = match ? getActiveNameAudio(match) : undefined
			if (consonantAudio) {
				audioPaths.push(consonantAudio)
			} else {
				console.warn(`No consonant audio match for token: ${char}`)
			}
		}

		playAudioPaths(audioPaths)
	}

	function playPointedLetterByLetter(word: string) {
		const tokens = tokenizePointedHebrew(word)
		const audioPaths: string[] = []

		for (const token of tokens) {
			const normalizedBase = token.base.normalize('NFKC')
			const hasDagesh = token.marks.includes('\u05BC')
			const maleiMark = token.suffix
				? token.suffix === '\u05BC'
					? '\u05D5'
					: token.marks.find((mark) => maleiAudioByPair[`${mark}${token.suffix}`])
				: undefined
			const isStandaloneCholamMalei =
				normalizedBase === '\u05D5' &&
				token.marks.includes('\u05B9') &&
				!token.marks.includes('\u05BC')
			const isStandaloneShuruk =
				normalizedBase === '\u05D5' &&
				token.marks.includes('\u05BC') &&
				token.marks.length === 1
			let match = hebrewLetters.find((l) => l.char === normalizedBase)

			if (!match && normalizedBase === 'ש') {
				if (token.marks.includes('\u05C2')) {
					match =
						hebrewLetters.find((l) => (l.nameAudio ?? '').includes('name-sin-base.mp3')) ||
						hebrewLetters.find((l) => l.char === 'שׂ')
				} else {
					match =
						hebrewLetters.find((l) => (l.nameAudio ?? '').includes('name-shin-base.mp3')) ||
						hebrewLetters.find((l) => l.char === 'שׁ') ||
						hebrewLetters.find((l) => l.char === 'ש')
				}
			}

			if (hasDagesh && mergedDageshNameChars[normalizedBase]) {
				match =
					hebrewLetters.find(
						(l) => l.char === mergedDageshNameChars[normalizedBase]
					) ?? match
			}

			if (!isStandaloneCholamMalei && !isStandaloneShuruk) {
				const consonantAudio = match ? getActiveNameAudio(match) : undefined
				if (consonantAudio) {
					audioPaths.push(consonantAudio)
				} else {
					console.warn(`No consonant audio match for token: ${normalizedBase}`)
				}
			}

			const orderedMarks = [...token.marks].sort((a, b) => {
				if (a === '\u05BC' && b !== '\u05BC') return -1
				if (a !== '\u05BC' && b === '\u05BC') return 1
				return 0
			})

			for (const mark of orderedMarks) {
				if (mark === '\u05C1' || mark === '\u05C2') {
					continue
				}

				if (isStandaloneShuruk && mark === '\u05BC') {
					audioPaths.push(maleiAudioByPair['\u05D5\u05BC'])
					continue
				}

				if (isStandaloneCholamMalei && mark === '\u05B9') {
					audioPaths.push(maleiAudioByPair['\u05B9\u05D5'])
					continue
				}

				if (normalizedBase === '\u05D5' && mark === '\u05BC' && token.suffix === '\u05BC') {
					audioPaths.push(maleiAudioByPair['\u05D5\u05BC'])
					continue
				}

				if (mark === '\u05BC' && mergedDageshNameChars[normalizedBase]) {
					continue
				}

				const niqqudAudio =
					mark === maleiMark && token.suffix
						? maleiAudioByPair[`${mark}${token.suffix}`]
						: niqqudAudioByMark[mark] ??
							hebrewNiqqud.find((entry) => entry.char.endsWith(mark))?.soundAudio

				if (niqqudAudio) {
					audioPaths.push(niqqudAudio)
				} else {
					console.warn(`No niqqud audio match for mark: ${mark}`)
				}
			}
		}

		playAudioPaths(audioPaths)
	}

	function playAudioPaths(audioPaths: string[]) {
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

	function playLetterByLetter(word: string) {
		if (gradingMode === 'consonants-only') {
			playConsonantsOnlyLetterByLetter(word)
			return
		}

		playPointedLetterByLetter(word)
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
								className="accent-sky-600"
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
								className="accent-sky-600"
							/>
							<div className="text-center">{audioSpeed.toFixed(2)}x</div>
						</div>
					</div>

					<FormatFilter
						formatType={formatType}
						setFormatType={setFormatType}
						options={formatOptions}
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
					<div className="mb-4 space-y-3">
						<h2 className="text-xl font-semibold text-center">Grading</h2>
						<div className="flex flex-wrap justify-center gap-2">
							{(
								[
									'consonants-only',
									'consonants-and-vowels',
								] as GradingMode[]
							).map((mode) => (
								<button
									key={mode}
									onClick={() => setGradingMode(mode)}
									className={`px-3 py-1 border rounded-full text-xs ${
										gradingMode === mode
											? 'bg-sky-600 text-white'
											: 'bg-gray-200'
									}`}
								>
									{mode === 'consonants-only'
										? 'Consonants Only'
										: 'Consonants and Vowels'}
								</button>
							))}
						</div>
					</div>
				</>
			)}

			{/* Prompt Display */}
			{currentCard && (
				<div className="mb-6">
					{formatType === 'translation' && (
						<div className="mb-6 p-4 border-2 border-sky-300 bg-sky-50 rounded-xl shadow text-3xl font-bold">
							{currentCard.eng}
							{hasRootMorphology(currentCard) && (
								<span className="text-xl font-medium text-gray-600">
									{' '}
									({formatRootMorphology(currentCard)})
								</span>
							)}
						</div>
					)}

					{formatType === 'image' && currentCard.images[0] && (
						<Image
							src={resolveVocabMediaUrl(currentCard.images[0])}
							alt="Prompt Image"
							width={300}
							height={200}
							className="mx-auto rounded"
						/>
					)}
					{formatType === 'audio' && currentCard.hebAudio && (
						<>
							<button
								className="text-4xl mt-2 hover:text-sky-700"
								onClick={(e) => {
									e.preventDefault()
									smartPlayAudio(
										resolveVocabMediaUrl(currentCard.hebAudio),
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
					{formatType === 'letter-by-letter' && currentCard.heb && (
						<button
							className="text-4xl mt-2 hover:text-sky-700"
							onClick={(e) => {
								e.preventDefault()
								playLetterByLetter(currentCard.hebNiqqud || currentCard.heb)
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
					className="border p-2 w-full max-w-xs text-center text-4xl rounded"
					dir="rtl"
					style={{ fontFamily: 'Times New Roman, serif' }}
					autoFocus
					autoComplete="off"
					readOnly={isMobile}
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
								<>
									Incorrect. Correct answer:{' '}
									<span className="font-times font-medium text-4xl">
										{currentCard ? getExpectedAnswer(currentCard) : ''}
									</span>
								</>
							)}
						</p>
					)}
				</p>
			)}

			<HebrewKeyboard
				onEnter={() => handleCheck()}
				onKeyPress={(key) => {
					const inputEl = document.getElementById(
						'spelling-input'
					) as HTMLInputElement

					if (inputEl) {
						const start = inputEl.selectionStart || 0
						const end = inputEl.selectionEnd || 0
						let newValue = inputEl.value

						if (key === '\b') {
							// Handle backspace
							if (start === end && start > 0) {
								newValue =
									inputEl.value.slice(0, start - 1) + inputEl.value.slice(end)
								inputEl.value = newValue
								inputEl.setSelectionRange(start - 1, start - 1)
							} else {
								newValue =
									inputEl.value.slice(0, start) + inputEl.value.slice(end)
								inputEl.value = newValue
								inputEl.setSelectionRange(start, start)
							}
						} else {
							// Handle insertion
							newValue =
								inputEl.value.slice(0, start) + key + inputEl.value.slice(end)
							inputEl.value = newValue
							inputEl.setSelectionRange(start + key.length, start + key.length)
						}

						inputEl.focus()
						// Update state if needed
						setValue(newValue)
					}
				}}
			/>
		</div>
	)
}
