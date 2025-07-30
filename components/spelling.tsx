'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useAudio, useWindowSize } from 'react-use'

import HebrewKeyboard from './hebrew-keyboard'
import ReactConfetti from 'react-confetti'
import { Flashcard } from '@/lib/vocab'
import { letters } from '@/lib/letters'

interface SpellingPracticeProps {
	data: Flashcard[]
	lessonPrefix: string
	currentLesson: number | undefined
}

type PromptType = 'image' | 'audio' | 'translation' | 'letter-by-letter'

export default function SpellingPractice({
	data,
	lessonPrefix,
	currentLesson,
}: SpellingPracticeProps) {
	const [selectedLessons, setSelectedLessons] = useState<string[]>([])

	const [selectedType, setSelectedType] = useState<'all' | 'word' | 'phrase'>(
		'word'
	)
	const [showFilter, setShowFilter] = useState(false)
	const [isMobile, setIsMobile] = useState(false)

	const [selectedCategory, setSelectedCategory] = useState('all')
	const [promptType, setPromptType] = useState<PromptType>('image')
	const [currentIndex, setCurrentIndex] = useState(0)
	const [showFeedback, setShowFeedback] = useState<null | boolean>(null)
	const [value, setValue] = useState('')
	const [showConfetti, setShowConfetti] = useState(false)
	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })
	const [audioVolume, setAudioVolume] = useState(1) // default: 100%
	const [audioSpeed, setAudioSpeed] = useState(1) // default: normal speed

	const { width, height } = useWindowSize()

	function handleSubmit() {
		console.log('Submitted:', value)
	}

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

	useEffect(() => {
		if (currentLesson !== undefined) {
			const allLessonsUpToCurrent = lessonOptions.filter((lesson) => {
				const num = parseInt(lesson.slice(lessonPrefix.length), 10)
				return num <= currentLesson
			})
			setSelectedLessons(allLessonsUpToCurrent)
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
			.filter((card) => selectedType === 'all' || card.type === selectedType)
			.filter(
				(card) =>
					selectedCategory === 'all' || card.category === selectedCategory
			)

		const valid = filtered.filter((card) => {
			if (promptType === 'image') return card.images[0]
			if (promptType === 'audio') return card.hebAudio
			if (promptType === 'translation') return !!card.eng
			if (promptType === 'letter-by-letter') return !!card.heb
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

	const shouldSkipCard = useCallback(
		(card: Flashcard | undefined): boolean => {
			if (!card) return true

			if (
				promptType === 'image' &&
				(!card.images || card.images.length === 0)
			) {
				return true
			}
			if (promptType === 'audio' && !card.hebAudio) {
				return true
			}

			return false
		},
		[promptType]
	)

	useEffect(() => {
		if (shouldSkipCard(currentCard)) {
			const nextIndex = (currentIndex + 1) % filteredCards.length
			setCurrentIndex(nextIndex)
		}
	}, [
		currentCard,
		promptType,
		currentIndex,
		filteredCards.length,
		shouldSkipCard,
	])

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
			if (
				isCorrect &&
				promptType === 'letter-by-letter' &&
				currentCard?.hebAudio
			) {
				smartPlayAudio(`/${currentCard.hebAudio}`, audioVolume, audioSpeed)
			}

			const isLastCard = currentIndex === filteredCards.length - 1

			setTimeout(() => {
				setShowFeedback(null)
				inputEl.value = ''

				if (isLastCard) {
					setShowConfetti(true)
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

			// Auto-play audio if promptType is audio or letter-by-letter
			if (promptType === 'audio' && filteredCards[nextIndex]?.hebAudio) {
				setTimeout(() => {
					smartPlayAudio(
						`/${filteredCards[nextIndex].hebAudio}`,
						audioVolume,
						audioSpeed
					)
				}, 100)
			} else if (
				promptType === 'letter-by-letter' &&
				filteredCards[nextIndex]?.heb
			) {
				setTimeout(() => {
					playLetterByLetter(filteredCards[nextIndex].heb)
				}, 100)
			}

			return nextIndex
		})
	}

	function goToPrevious() {
		setCurrentIndex((i) => {
			const prevIndex = (i - 1 + filteredCards.length) % filteredCards.length
			setShowFeedback(null)

			// Auto-play audio if promptType is audio and prev card has audio
			if (promptType === 'audio' && filteredCards[prevIndex]?.hebAudio) {
				setTimeout(() => {
					smartPlayAudio(
						`/${filteredCards[prevIndex].hebAudio}`,
						audioVolume,
						audioSpeed
					)
				}, 100)
			}

			return prevIndex
		})
	}

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
				.replace(/[\u0591-\u05BD\u05BF-\u05C7\u05C1\u05C2]/g, '') // remove niqqud and shin/sin dots

			let match = letters.find((l) => l.char === normalizedChar)

			// Special case: plain shin (ש) without dot → use shin audio
			if (!match && normalizedChar === 'ש') {
				match = letters.find((l) => l.nameAudio?.includes('name-shin-base.mp3'))
			}

			if (match?.nameAudio) {
				console.log(`✅ Matched ${char} → ${match.char} → ${match.nameAudio}`)
				audioPaths.push(match.nameAudio)
			} else {
				console.warn(`❌ No match for: ${char} (normalized: ${normalizedChar})`)
			}
		}

		function playSequentially(index = 0) {
			if (index >= audioPaths.length) return

			if (audioVolume > 1.0) {
				playWithBoostedVolume(audioPaths[index], audioVolume, audioSpeed)
				setTimeout(() => playSequentially(index + 1), 600) // rough timing fudge
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
			<div className="mb-6 flex justify-center gap-4">
				<button
					onClick={() => setShowFilter((prev) => !prev)}
					className={`px-4 py-2 rounded shadow flex items-center justify-center gap-4 ${
						showFilter ? 'bg-blue-600 text-white' : 'bg-gray-200'
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

					{/* Prompt Type Selection */}
					<div className="mb-4">
						<h2 className="font-semibold text-xl mb-2">Prompt Type</h2>
						<div className="flex justify-center gap-2">
							{(
								[
									'translation',
									'image',
									'audio',
									'letter-by-letter',
								] as PromptType[]
							).map((type) => (
								<button
									key={type}
									onClick={() => setPromptType(type)}
									className={`px-3 py-1 border rounded-full ${
										promptType === type
											? 'bg-blue-600 text-white'
											: 'bg-gray-200'
									}`}
								>
									{type.charAt(0).toUpperCase() + type.slice(1)}
								</button>
							))}
						</div>
					</div>
					<div className="mb-4 space-y-2">
						<div>
							<label className="font-semibold text-xl mb-2">Lessons</label>
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
							<label className="font-semibold text-xl mb-2">Type</label>
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
										onClick={() => setSelectedCategory(cat as string)}
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
				</>
			)}

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
									smartPlayAudio(
										`/${currentCard.hebAudio}`,
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
					{promptType === 'letter-by-letter' && currentCard.heb && (
						<button
							className="text-4xl mt-2 hover:text-blue-700"
							onClick={(e) => {
								e.preventDefault()
								playLetterByLetter(currentCard.heb)
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
										{currentCard?.heb}
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
