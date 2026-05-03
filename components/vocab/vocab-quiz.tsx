'use client'

import TorahScrollLoader from '@/components/hebrew/hebrew-loader'
import LessonFilter from '@/components/filters/filter-lesson'
import { useLessonCards } from '@/hooks/useLessonCards'
import type { EnglishVocab, GreekVocab, HebrewVocab } from '@/lib/vocab'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactConfetti from 'react-confetti'
import { useAudio, useWindowSize } from 'react-use'

type QuizLayout = 'english' | 'hebrew' | 'greek'
type VocabCard = EnglishVocab | HebrewVocab | GreekVocab
type PromptKind = 'text' | 'image' | 'audio'
type PromptKey =
	| 'eng'
	| 'spa'
	| 'por'
	| 'engDefinition'
	| 'images'
	| 'engAudio'
	| 'hebNiqqud'
	| 'heb'
	| 'hebAudio'
	| 'grk'
	| 'grkAudio'

type PromptOption = {
	key: PromptKey
	label: string
	kind: PromptKind
}

interface VocabQuizProps {
	data: VocabCard[]
	currentLesson: string
	courseId: number
	userId: string
	layout: QuizLayout
	pointsOnPass?: number
}

function CountdownCircle({ seconds }: { seconds: number }) {
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		let frame = 0
		const totalFrames = seconds * 60
		const interval = setInterval(() => {
			frame += 1
			setProgress((frame / totalFrames) * 100)
			if (frame >= totalFrames) clearInterval(interval)
		}, 1000 / 60)
		return () => clearInterval(interval)
	}, [seconds])

	const radius = 45
	const circumference = 2 * Math.PI * radius
	const offset = circumference - (progress / 100) * circumference

	return (
		<svg width="100" height="100">
			<circle
				cx="50"
				cy="50"
				r={radius}
				stroke="#e5e7eb"
				strokeWidth="8"
				fill="none"
			/>
			<circle
				cx="50"
				cy="50"
				r={radius}
				stroke="#0284c7"
				strokeWidth="8"
				fill="none"
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				transform="rotate(-90 50 50)"
			/>
			<text
				x="50"
				y="55"
				textAnchor="middle"
				fontSize="24"
				fill="#111827"
				fontWeight="bold"
			>
				{Math.ceil(seconds - (progress / 100) * seconds)}
			</text>
		</svg>
	)
}

const QUIZ_CONFIG: Record<
	QuizLayout,
	{
		answerField: PromptKey
		answerAudioField: PromptKey | null
		answerLabel: string
		title: string
		emptyState: string
		answerClassName: string
		answerDirection?: 'ltr' | 'rtl'
		promptOptions: PromptOption[]
		defaultPrompt: PromptKey
	}
> = {
	english: {
		answerField: 'eng',
		answerAudioField: 'engAudio',
		answerLabel: 'English',
		title: 'Quiz',
		emptyState: 'No quiz cards match your current filter.',
		answerClassName: 'font-nunito text-5xl md:text-6xl',
		answerDirection: 'ltr',
		defaultPrompt: 'images',
		promptOptions: [
			{ key: 'spa', label: 'Spanish', kind: 'text' },
			{ key: 'por', label: 'Portuguese', kind: 'text' },
			{ key: 'engDefinition', label: 'Definition', kind: 'text' },
			{ key: 'images', label: 'Image', kind: 'image' },
			{ key: 'engAudio', label: 'Audio', kind: 'audio' },
			{ key: 'eng', label: 'English', kind: 'text' },
		],
	},
	hebrew: {
		answerField: 'hebNiqqud',
		answerAudioField: 'hebAudio',
		answerLabel: 'Hebrew',
		title: 'חידון',
		emptyState: 'No quiz cards match your current filter.',
		answerClassName: 'font-cardo text-5xl md:text-6xl',
		answerDirection: 'rtl',
		defaultPrompt: 'images',
		promptOptions: [
			{ key: 'eng', label: 'Translation', kind: 'text' },
			{ key: 'engDefinition', label: 'Definition', kind: 'text' },
			{ key: 'images', label: 'Image', kind: 'image' },
			{ key: 'hebAudio', label: 'Audio', kind: 'audio' },
			{ key: 'hebNiqqud', label: 'Hebrew with niqqud', kind: 'text' },
			{ key: 'heb', label: 'Hebrew without niqqud', kind: 'text' },
		],
	},
	greek: {
		answerField: 'grk',
		answerAudioField: 'grkAudio',
		answerLabel: 'Greek',
		title: 'Quiz',
		emptyState: 'No quiz cards match your current filter.',
		answerClassName: 'font-serif text-5xl md:text-6xl',
		answerDirection: 'ltr',
		defaultPrompt: 'images',
		promptOptions: [
			{ key: 'eng', label: 'Translation', kind: 'text' },
			{ key: 'engDefinition', label: 'Definition', kind: 'text' },
			{ key: 'images', label: 'Image', kind: 'image' },
			{ key: 'grkAudio', label: 'Audio', kind: 'audio' },
			{ key: 'grk', label: 'Greek', kind: 'text' },
		],
	},
}

function getCardValue(card: VocabCard, key: PromptKey) {
	switch (key) {
		case 'eng':
			return 'eng' in card ? card.eng : ''
		case 'spa':
			return 'spa' in card ? card.spa : ''
		case 'por':
			return 'por' in card ? card.por : ''
		case 'engDefinition':
			return card.engDefinition ?? ''
		case 'images':
			return card.images ?? []
		case 'engAudio':
			return 'engAudio' in card ? card.engAudio ?? '' : ''
		case 'hebNiqqud':
			return 'hebNiqqud' in card ? card.hebNiqqud : ''
		case 'heb':
			return 'heb' in card ? card.heb : ''
		case 'hebAudio':
			return 'hebAudio' in card ? card.hebAudio : ''
		case 'grk':
			return 'grk' in card ? card.grk : ''
		case 'grkAudio':
			return 'grkAudio' in card ? card.grkAudio : ''
		default:
			return ''
	}
}

function hasValue(card: VocabCard, key: PromptKey) {
	const value = getCardValue(card, key)
	if (Array.isArray(value)) return value.length > 0
	return Boolean(value)
}

function shuffleCards<T>(cards: T[]) {
	return [...cards].sort(() => Math.random() - 0.5)
}

function preloadImage(src: string) {
	if (typeof window === 'undefined' || !src) return
	const image = new window.Image()
	image.src = src
}

function waitForImageLoad(
	src: string,
	cache: Map<string, Promise<void>>
) {
	if (typeof window === 'undefined' || !src) {
		return Promise.resolve()
	}

	const cached = cache.get(src)
	if (cached) {
		return cached
	}

	const loadPromise = new Promise<void>((resolve, reject) => {
		const image = new window.Image()
		image.onload = () => resolve()
		image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
		image.src = src

		if (image.complete) {
			resolve()
		}
	}).catch((error) => {
		cache.delete(src)
		throw error
	})

	cache.set(src, loadPromise)
	return loadPromise
}

export default function VocabQuiz({
	data,
	currentLesson,
	courseId,
	userId,
	layout,
	pointsOnPass = 5,
}: VocabQuizProps) {
	const config = QUIZ_CONFIG[layout]
	const {
		selectedLessons,
		setSelectedLessons,
	} = useLessonCards(data, currentLesson)
	const [selectedPrompt, setSelectedPrompt] = useState<PromptKey>(
		config.defaultPrompt
	)
	const [timeLimit, setTimeLimit] = useState(3)
	const [gameStarted, setGameStarted] = useState(false)
	const [studyMode, setStudyMode] = useState(false)
	const [cards, setCards] = useState<VocabCard[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [waiting, setWaiting] = useState(true)
	const [promptReady, setPromptReady] = useState(false)
	const [feedback, setFeedback] = useState<null | boolean>(null)
	const [showConfetti, setShowConfetti] = useState(false)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const [wrongAnswers, setWrongAnswers] = useState<VocabCard[]>([])
	const [disabledButtons, setDisabledButtons] = useState(false)
	const [awardedPoints, setAwardedPoints] = useState(0)
	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })
	const promptAudioRef = useRef<HTMLAudioElement | null>(null)
	const answerAudioRef = useRef<HTMLAudioElement | null>(null)
	const hasAwardedRef = useRef(false)
	const imageLoadCacheRef = useRef<Map<string, Promise<void>>>(new Map())
	const { width, height } = useWindowSize()

	const availablePromptOptions = useMemo(
		() =>
			config.promptOptions.filter((option) =>
				data.some((card) => hasValue(card, option.key))
			),
		[data, config.promptOptions]
	)

	useEffect(() => {
		if (
			availablePromptOptions.length > 0 &&
			!availablePromptOptions.some((option) => option.key === selectedPrompt)
		) {
			setSelectedPrompt(availablePromptOptions[0].key)
		}
	}, [availablePromptOptions, selectedPrompt])

	const selectedPromptConfig = useMemo(
		() =>
			availablePromptOptions.find((option) => option.key === selectedPrompt) ??
			availablePromptOptions[0],
		[availablePromptOptions, selectedPrompt]
	)

	const filteredCards = useMemo(() => {
		return data.filter((card) => {
			const matchesLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((lesson) => selectedLessons.includes(lesson))
			const hasPrompt = selectedPromptConfig
				? hasValue(card, selectedPromptConfig.key)
				: false
			const hasAnswer = hasValue(card, config.answerField)

			return matchesLesson && hasPrompt && hasAnswer
		})
	}, [config.answerField, data, selectedLessons, selectedPromptConfig])

	useEffect(() => {
		if (!gameStarted) return
		setCards(shuffleCards(filteredCards))
		setCurrentIndex(0)
		setWaiting(true)
		setFeedback(null)
		setDisabledButtons(false)
		setShowConfetti(false)
		setFinished(false)
		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
		setAwardedPoints(0)
		hasAwardedRef.current = false
	}, [filteredCards, gameStarted])

	const currentCard = cards[currentIndex]
	const total = cards.length
	const passed = wrongCount <= 2

	const answerAudio =
		currentCard && config.answerAudioField
			? String(getCardValue(currentCard, config.answerAudioField) ?? '')
			: ''

	useEffect(() => {
		if (!selectedPromptConfig || selectedPromptConfig.kind !== 'image') return

		const currentValue =
			currentCard ? getCardValue(currentCard, selectedPromptConfig.key) : null
		const nextCard = cards[currentIndex + 1]
		const nextValue = nextCard
			? getCardValue(nextCard, selectedPromptConfig.key)
			: null

		if (Array.isArray(currentValue) && currentValue[0]) {
			void waitForImageLoad(currentValue[0], imageLoadCacheRef.current).catch(() => {
				preloadImage(currentValue[0])
			})
		}

		if (Array.isArray(nextValue) && nextValue[0]) {
			void waitForImageLoad(nextValue[0], imageLoadCacheRef.current).catch(() => {
				preloadImage(nextValue[0])
			})
		}
	}, [cards, currentCard, currentIndex, selectedPromptConfig])

	useEffect(() => {
		let cancelled = false

		if (!gameStarted || finished || !currentCard || !selectedPromptConfig) {
			setPromptReady(false)
			return
		}

		if (selectedPromptConfig.kind !== 'image') {
			setPromptReady(true)
			return
		}

		const value = getCardValue(currentCard, selectedPromptConfig.key)
		const imageUrl = Array.isArray(value) ? value[0] : null

		if (!imageUrl) {
			setPromptReady(true)
			return
		}

		setPromptReady(false)

		waitForImageLoad(imageUrl, imageLoadCacheRef.current)
			.then(() => {
				if (!cancelled) setPromptReady(true)
			})
			.catch(() => {
				if (!cancelled) setPromptReady(true)
			})

		return () => {
			cancelled = true
		}
	}, [currentCard, finished, gameStarted, selectedPromptConfig])

	const playPromptAudio = useCallback(() => {
		if (!currentCard || !selectedPromptConfig || selectedPromptConfig.kind !== 'audio') {
			return
		}

		const src = String(getCardValue(currentCard, selectedPromptConfig.key) ?? '')
		if (!src) return

		promptAudioRef.current?.pause()
		const audio = new Audio(src)
		promptAudioRef.current = audio
		audio.currentTime = 0
		audio.play().catch(() => {})
	}, [currentCard, selectedPromptConfig])

	const playAnswerAudio = useCallback(() => {
		if (!answerAudio) return
		answerAudioRef.current?.pause()
		const audio = new Audio(answerAudio)
		answerAudioRef.current = audio
		audio.currentTime = 0
		audio.play().catch(() => {})
	}, [answerAudio])

	useEffect(() => {
		if (!gameStarted || finished || !currentCard) return
		if (!promptReady) return
		setWaiting(true)
		setFeedback(null)
		setDisabledButtons(false)

		if (selectedPromptConfig?.kind === 'audio') {
			playPromptAudio()
		}

		const timer = setTimeout(() => {
			setWaiting(false)
			if (selectedPromptConfig?.kind !== 'audio' && answerAudio) {
				playAnswerAudio()
			}
		}, timeLimit * 1000)

		return () => clearTimeout(timer)
	}, [
		answerAudio,
		currentCard,
		currentIndex,
		finished,
		gameStarted,
		playAnswerAudio,
		playPromptAudio,
		promptReady,
		selectedPromptConfig,
		timeLimit,
	])

	useEffect(() => {
		return () => {
			promptAudioRef.current?.pause()
			answerAudioRef.current?.pause()
		}
	}, [])

	const activityReady =
		!gameStarted ||
		studyMode ||
		finished ||
		!currentCard ||
		!selectedPromptConfig ||
		selectedPromptConfig.kind !== 'image' ||
		promptReady

	const awardPoints = useCallback(async () => {
		if (userId === 'guest') return
		try {
			const res = await fetch('/api/award-points', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, courseId, points: pointsOnPass }),
			})
			if (!res.ok) throw new Error('Bad response')
			setAwardedPoints(pointsOnPass)
		} catch (error) {
			console.error('Failed to award points', error)
		}
	}, [courseId, pointsOnPass, userId])

	useEffect(() => {
		if (finished && passed && !hasAwardedRef.current) {
			hasAwardedRef.current = true
			awardPoints()
		}
	}, [awardPoints, finished, passed])

	function handleResponse(correct: boolean) {
		if (waiting || disabledButtons || !currentCard) return

		setDisabledButtons(true)
		setFeedback(correct)
		if (correct) {
			setCorrectCount((prev) => prev + 1)
		} else {
			setWrongCount((prev) => prev + 1)
			setWrongAnswers((prev) => [...prev, currentCard])
		}

		setTimeout(() => {
			const isLast = currentIndex === cards.length - 1
			if (isLast) {
				if (wrongCount + (correct ? 0 : 1) <= 2) {
					setShowConfetti(true)
				}
				setFinished(true)
			} else {
				setCurrentIndex((prev) => prev + 1)
			}
		}, 1200)
	}

	function resetToStart() {
		promptAudioRef.current?.pause()
		answerAudioRef.current?.pause()
		setGameStarted(false)
		setStudyMode(false)
		setCards([])
		setCurrentIndex(0)
		setWaiting(true)
		setFeedback(null)
		setShowConfetti(false)
		setCorrectCount(0)
		setWrongCount(0)
		setFinished(false)
		setWrongAnswers([])
		setDisabledButtons(false)
		setAwardedPoints(0)
		hasAwardedRef.current = false
	}

	function renderTextValue(value: unknown, sizeClass: string) {
		if (typeof value !== 'string' || value.trim().length === 0) return null
		return (
			<div
				className={`${sizeClass} leading-tight text-slate-900`}
				dir={layout === 'hebrew' ? 'rtl' : 'ltr'}
			>
				{value}
			</div>
		)
	}

	function renderPrompt(card: VocabCard, sizeClass = 'text-3xl md:text-4xl') {
		if (!selectedPromptConfig) return null
		const value = getCardValue(card, selectedPromptConfig.key)

		if (selectedPromptConfig.kind === 'image') {
			const imageUrl = Array.isArray(value) ? value[0] : null
			if (!imageUrl) return null
			return (
				<div className="relative h-56 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white">
					<Image
						src={imageUrl}
						alt="Quiz prompt"
						fill
						className="object-contain p-4"
						sizes="(max-width: 768px) 100vw, 480px"
					/>
				</div>
			)
		}

		if (selectedPromptConfig.kind === 'audio') {
			const promptAudioSrc = typeof value === 'string' ? value : ''
			return (
				<div className="flex flex-col items-center gap-4">
					<div className="rounded-full bg-sky-100 p-6 text-6xl">🔊</div>
					<p className="text-sm text-slate-600">Listen and get ready to answer.</p>
					<button
						onClick={() => {
							if (!promptAudioSrc) return
							const audio = new Audio(promptAudioSrc)
							audio.play().catch(() => {})
						}}
						className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
					>
						Replay Prompt
					</button>
				</div>
			)
		}

		return renderTextValue(value, sizeClass)
	}

	function renderAnswer(card: VocabCard, sizeClass = config.answerClassName) {
		const value = getCardValue(card, config.answerField)
		if (typeof value !== 'string' || value.trim().length === 0) return null
		return (
			<div className={sizeClass} dir={config.answerDirection}>
				{value}
			</div>
		)
	}

	return (
		<div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm relative">
			{gameStarted && (
				<button
					onClick={resetToStart}
					className="absolute left-4 top-4 text-gray-600 hover:text-gray-900"
					aria-label="Back"
				>
					⬅️
				</button>
			)}

			{showConfetti && passed && (
				<>
					<ReactConfetti
						width={width}
						height={height}
						recycle={false}
						numberOfPieces={500}
						tweenDuration={10000}
					/>
					{finishAudio}
				</>
			)}

			{!gameStarted ? (
				<div className="space-y-6">
					<div>
						<h1 className="text-2xl font-bold text-slate-900">
							Customize Your Quiz
						</h1>
						<p className="mt-2 text-sm text-slate-600">
							Choose your prompt, set the timer, and practice vocab from any
							lesson in this course.
						</p>
					</div>

					<div className="rounded-2xl bg-white p-4 text-left">
						<LessonFilter
							data={data}
							selectedLessons={selectedLessons}
							setSelectedLessons={setSelectedLessons}
						/>
					</div>

					<div className="space-y-3">
						<h2 className="text-xl font-semibold">Select Prompt</h2>
						<div className="flex flex-wrap justify-center gap-2">
							{availablePromptOptions.map((option) => (
								<button
									key={option.key}
									onClick={() => setSelectedPrompt(option.key)}
									className={`rounded-full border px-3 py-1 text-xs ${
										selectedPrompt === option.key
											? 'border-sky-600 bg-sky-600 text-white'
											: 'border-slate-200 bg-slate-100 text-slate-700'
									}`}
								>
									{option.label}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-3">
						<h2 className="text-xl font-semibold">Seconds to Answer</h2>
						<div className="flex flex-wrap justify-center gap-3">
							{[1, 3, 5, 8].map((seconds) => (
								<button
									key={seconds}
									onClick={() => setTimeLimit(seconds)}
									className={`rounded-full border px-3 py-1 text-xs ${
										timeLimit === seconds
											? 'border-sky-600 bg-sky-600 text-white'
											: 'border-slate-200 bg-slate-100 text-slate-700'
									}`}
								>
									{seconds}s
								</button>
							))}
						</div>
						<input
							type="number"
							min={1}
							max={15}
							value={timeLimit}
							onChange={(e) =>
								setTimeLimit(Math.max(1, Math.min(15, Number(e.target.value) || 1)))
							}
							className="mx-auto block w-24 rounded-xl border border-slate-200 p-2 text-center"
						/>
					</div>

					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
							Preview
						</p>
						<p className="mt-2 text-sm text-slate-600">
							Prompt: <span className="font-semibold">{selectedPromptConfig?.label}</span>
						</p>
						<p className="text-sm text-slate-600">
							Answer: <span className="font-semibold">{config.answerLabel}</span>
						</p>
						<p className="text-sm text-slate-600">
							Cards ready: <span className="font-semibold">{filteredCards.length}</span>
						</p>
					</div>

					{filteredCards.length === 0 && (
						<p className="font-medium text-red-600">{config.emptyState}</p>
					)}

					<div className="flex flex-wrap justify-center gap-4">
						<button
							onClick={() => {
								setStudyMode(true)
								setGameStarted(true)
							}}
							disabled={filteredCards.length === 0}
							className={`rounded-xl px-6 py-3 font-semibold text-white ${
								filteredCards.length === 0
									? 'bg-slate-300'
									: 'bg-violet-600 hover:bg-violet-700'
							}`}
						>
							Study Words
						</button>
						<button
							onClick={() => {
								setStudyMode(false)
								setGameStarted(true)
							}}
							disabled={filteredCards.length === 0}
							className={`rounded-xl px-6 py-3 font-semibold text-white ${
								filteredCards.length === 0
									? 'bg-slate-300'
									: 'bg-green-600 hover:bg-green-700'
							}`}
						>
							Start Quiz
						</button>
					</div>
				</div>
			) : studyMode ? (
				<div className="space-y-6">
					<h2 className="text-2xl font-bold text-slate-900">Study the Set</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{filteredCards.map((card, index) => (
							<div
								key={`${card.id ?? index}-${index}`}
								className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"
							>
								<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
									{selectedPromptConfig?.label}
								</p>
								<div className="mt-3 flex min-h-[120px] items-center justify-center text-center">
									{renderPrompt(card, 'text-2xl md:text-3xl')}
								</div>
								<div className="mt-4 border-t border-slate-200 pt-4 text-center">
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										{config.answerLabel}
									</p>
									<div className="mt-2">{renderAnswer(card, 'text-3xl')}</div>
									{config.answerAudioField &&
										hasValue(card, config.answerAudioField) && (
											<button
												onClick={() => {
													const src = String(
														getCardValue(card, config.answerAudioField as PromptKey) ?? ''
													)
													if (!src) return
													const audio = new Audio(src)
													audio.play().catch(() => {})
												}}
												className="mt-3 text-2xl text-sky-600 hover:text-sky-800"
												aria-label="Play answer audio"
											>
												🔊
											</button>
										)}
								</div>
							</div>
						))}
					</div>
					<button
						onClick={resetToStart}
						className="rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-800 hover:bg-slate-300"
					>
						Back
					</button>
				</div>
			) : finished ? (
				<div className="space-y-4">
					<h2 className="text-2xl font-bold text-slate-900">Quiz Complete!</h2>
					<p className="text-lg">✅ Correct: {correctCount}</p>
					<p className="text-lg">❌ Incorrect: {wrongCount}</p>
					<p
						className={`text-xl font-semibold ${
							passed ? 'text-green-600' : 'text-red-500'
						}`}
					>
						{passed
							? 'You passed!'
							: "To pass, you must miss 2 or fewer. Let's try again!"}
					</p>
					<p className="text-lg">
						⭐ Points earned: <span className="font-semibold">{awardedPoints}</span>
					</p>

					{wrongAnswers.length > 0 && (
						<div className="mt-6">
							<h3 className="mb-3 text-lg font-medium">You missed:</h3>
							<div className="grid gap-4 sm:grid-cols-2">
								{wrongAnswers.map((card, index) => (
									<div
										key={`${card.id ?? index}-wrong-${index}`}
										className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
									>
										<div className="text-center">{renderPrompt(card, 'text-2xl')}</div>
										<div className="mt-4 border-t border-slate-200 pt-4 text-center">
											{renderAnswer(card, 'text-3xl')}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					<button
						onClick={resetToStart}
						className="mt-4 rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700"
					>
						Start Over
					</button>
				</div>
			) : currentCard ? (
				!activityReady ? (
					<div className="flex min-h-[420px] items-center justify-center">
						<TorahScrollLoader size={180} speedSec={40} fontSize={40} />
					</div>
				) : (
				<div className="space-y-6">
					<div>
						<p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
							{selectedPromptConfig?.label}
						</p>
						<div className="mt-4 flex min-h-[220px] items-center justify-center text-center">
							{renderPrompt(currentCard)}
						</div>
					</div>

					<div className="flex justify-center">
						{waiting ? (
							<CountdownCircle seconds={timeLimit} />
						) : (
							<div className="space-y-3">
								<p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
									{config.answerLabel}
								</p>
								<div>{renderAnswer(currentCard)}</div>
								{answerAudio && (
									<button
										onClick={playAnswerAudio}
										className="text-4xl text-sky-600 hover:text-sky-800"
										aria-label="Replay answer audio"
									>
										🔊
									</button>
								)}
							</div>
						)}
					</div>

					<div className="flex flex-wrap justify-center gap-4">
						<button
							onClick={() => handleResponse(true)}
							disabled={waiting || disabledButtons}
							className={`rounded-xl px-5 py-3 font-semibold text-white ${
								waiting || disabledButtons
									? 'bg-green-300'
									: 'bg-green-500 hover:bg-green-600'
							}`}
						>
							I got it 👍
						</button>
						<button
							onClick={() => {
								if (selectedPromptConfig?.kind === 'audio') {
									playPromptAudio()
									return
								}
								playAnswerAudio()
							}}
							className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-slate-900 hover:bg-yellow-500"
						>
							⏸ Replay
						</button>
						<button
							onClick={() => handleResponse(false)}
							disabled={waiting || disabledButtons}
							className={`rounded-xl px-5 py-3 font-semibold text-white ${
								waiting || disabledButtons
									? 'bg-red-300'
									: 'bg-red-500 hover:bg-red-600'
							}`}
						>
							I missed 👎
						</button>
					</div>

					<div className="min-h-[32px]">
						{feedback !== null && (
							<p
								className={`text-lg font-bold ${
									feedback ? 'text-green-600' : 'text-red-500'
								}`}
							>
								{feedback ? 'Great job!' : "Don't worry, keep going!"}
							</p>
						)}
					</div>

					<div>
						<p className="mb-1 text-sm text-slate-600">
							{currentIndex + 1} / {total}
						</p>
						<div className="h-2 overflow-hidden rounded-full bg-slate-200">
							<div
								className="h-full bg-sky-600 transition-all duration-300"
								style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
							/>
						</div>
					</div>
				</div>
				)
			) : (
				<p className="text-slate-600">{config.emptyState}</p>
			)}
		</div>
	)
}
