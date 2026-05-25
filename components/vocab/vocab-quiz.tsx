'use client'

import { awardVocabQuizCompletion } from '@/actions/vocab-quiz-progress'
import { ActivityFinalScreen } from '@/components/activity-final-screen'
import TorahScrollLoader from '@/components/hebrew/hebrew-loader'
import LessonFilter from '@/components/filters/filter-lesson'
import { useLessonCards } from '@/hooks/useLessonCards'
import type { EnglishVocab, GreekVocab, HebrewVocab } from '@/lib/vocab'
import { ResultCard } from '@/app/lesson/result-card'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
	initialHearts?: number
	pointsOnPass?: number
}

function CountdownCircle({
	seconds,
	remainingMs,
}: {
	seconds: number
	remainingMs: number
}) {
	const progress = seconds <= 0 ? 100 : ((seconds * 1000 - remainingMs) / (seconds * 1000)) * 100
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
				{Math.ceil(remainingMs / 1000)}
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

function preloadAudio(src: string) {
	if (typeof window === 'undefined' || !src) return
	const audio = new Audio()
	audio.preload = 'auto'
	audio.src = src
	audio.load()
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

function waitForAudioLoad(
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
		const audio = new Audio()
		audio.preload = 'auto'

		const handleReady = () => {
			audio.removeEventListener('canplaythrough', handleReady)
			audio.removeEventListener('loadeddata', handleReady)
			audio.removeEventListener('error', handleError)
			resolve()
		}

		const handleError = () => {
			audio.removeEventListener('canplaythrough', handleReady)
			audio.removeEventListener('loadeddata', handleReady)
			audio.removeEventListener('error', handleError)
			reject(new Error(`Failed to load audio: ${src}`))
		}

		audio.addEventListener('canplaythrough', handleReady, { once: true })
		audio.addEventListener('loadeddata', handleReady, { once: true })
		audio.addEventListener('error', handleError, { once: true })
		audio.src = src
		audio.load()
	}).catch((error) => {
		cache.delete(src)
		throw error
	})

	cache.set(src, loadPromise)
	return loadPromise
}

function getCardMediaSources(card: VocabCard) {
	const imageSources = Array.isArray(card.images)
		? card.images.filter((src): src is string => typeof src === 'string' && src.length > 0)
		: []

	const audioSources = ['engAudio' in card ? card.engAudio : '', 'hebAudio' in card ? card.hebAudio : '', 'grkAudio' in card ? card.grkAudio : ''].filter(
		(src): src is string => typeof src === 'string' && src.length > 0
	)

	return { imageSources, audioSources }
}

export default function VocabQuiz({
	data,
	currentLesson,
	courseId,
	userId: _userId,
	layout,
	initialHearts = 5,
	pointsOnPass = 5,
}: VocabQuizProps) {
	const config = QUIZ_CONFIG[layout]
	const {
		selectedLessons,
		setSelectedLessons,
		lessonOptions,
	} = useLessonCards(data, currentLesson, { selectionMode: 'single' })
	const router = useRouter()
	const [selectedPrompt, setSelectedPrompt] = useState<PromptKey>(
		config.defaultPrompt
	)
	const [timeLimit, setTimeLimit] = useState(3)
	const [gameStarted, setGameStarted] = useState(false)
	const [studyMode, setStudyMode] = useState(false)
	const [cards, setCards] = useState<VocabCard[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [waiting, setWaiting] = useState(true)
	const [isPaused, setIsPaused] = useState(false)
	const [remainingMs, setRemainingMs] = useState(timeLimit * 1000)
	const [promptReady, setPromptReady] = useState(false)
	const [feedback, setFeedback] = useState<null | boolean>(null)
	const [showConfetti, setShowConfetti] = useState(false)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const [wrongAnswers, setWrongAnswers] = useState<VocabCard[]>([])
	const [disabledButtons, setDisabledButtons] = useState(false)
	const [completionHearts, setCompletionHearts] = useState(initialHearts)
	const [completionRewards, setCompletionRewards] = useState<{
		awardedPoints: number
		hearts: number
		tribePointAwarded: boolean
	} | null>(null)
	const [finishAudio] = useAudio({ src: '/shofar.mp3', autoPlay: true })
	const promptAudioRef = useRef<HTMLAudioElement | null>(null)
	const answerAudioRef = useRef<HTMLAudioElement | null>(null)
	const hasAwardedRef = useRef(false)
	const imageLoadCacheRef = useRef<Map<string, Promise<void>>>(new Map())
	const audioLoadCacheRef = useRef<Map<string, Promise<void>>>(new Map())
	const preloadRunRef = useRef(0)
	const { width, height } = useWindowSize()
	const [isPreloadingMedia, setIsPreloadingMedia] = useState(false)
	const [preloadProgress, setPreloadProgress] = useState({ loaded: 0, total: 0 })
	const [pendingStartMode, setPendingStartMode] = useState<null | 'quiz'>(null)

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
		if (gameStarted || isPreloadingMedia) return
		setPreloadProgress({ loaded: 0, total: 0 })
	}, [filteredCards, gameStarted, isPreloadingMedia, selectedPrompt, timeLimit])

	useEffect(() => {
		if (!gameStarted) return
		setCards(shuffleCards(filteredCards))
		setCurrentIndex(0)
		setWaiting(true)
		setIsPaused(false)
		setRemainingMs(timeLimit * 1000)
		setFeedback(null)
		setDisabledButtons(false)
		setShowConfetti(false)
		setFinished(false)
		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
		setCompletionRewards(null)
		hasAwardedRef.current = false
	}, [filteredCards, gameStarted, timeLimit])

	useEffect(() => {
		setCompletionHearts(initialHearts)
	}, [initialHearts])

	const currentCard = cards[currentIndex]
	const total = cards.length
	const passed = wrongCount <= 2
	const missedRatio = total > 0 ? wrongCount / total : 0
	const rewardEligible = missedRatio <= 0.75
	const celebratoryFinish = passed && rewardEligible
	const mainScreenHref =
		layout === 'hebrew'
			? '/he/learn'
			: layout === 'greek'
			? '/el/learn'
			: '/courses'

	const nextLesson = useMemo(() => {
		if (lessonOptions.length === 0 || selectedLessons.length === 0) return null

		const sortedSelected = lessonOptions.filter((lesson) =>
			selectedLessons.includes(lesson)
		)
		const lastSelectedLesson = sortedSelected[sortedSelected.length - 1]
		if (!lastSelectedLesson) return null

		const currentLessonIndex = lessonOptions.indexOf(lastSelectedLesson)
		if (currentLessonIndex === -1 || currentLessonIndex >= lessonOptions.length - 1) {
			return null
		}

		return lessonOptions[currentLessonIndex + 1]
	}, [lessonOptions, selectedLessons])

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

	const playCardAnswerAudio = useCallback(
		(card: VocabCard) => {
			if (!config.answerAudioField) return
			const src = String(getCardValue(card, config.answerAudioField) ?? '')
			if (!src) return
			answerAudioRef.current?.pause()
			const audio = new Audio(src)
			answerAudioRef.current = audio
			audio.currentTime = 0
			audio.play().catch(() => {})
		},
		[config.answerAudioField]
	)

	useEffect(() => {
		if (!gameStarted || finished || !currentCard) return
		if (!promptReady) return
		setWaiting(true)
		setIsPaused(false)
		setRemainingMs(timeLimit * 1000)
		setFeedback(null)
		setDisabledButtons(false)

		if (selectedPromptConfig?.kind === 'audio') {
			playPromptAudio()
		}
	}, [
		currentCard,
		currentIndex,
		finished,
		gameStarted,
		playPromptAudio,
		promptReady,
		selectedPromptConfig,
		timeLimit,
	])

	useEffect(() => {
		if (!waiting || isPaused) return

		const interval = window.setInterval(() => {
			setRemainingMs((prev) => Math.max(prev - 100, 0))
		}, 100)

		return () => window.clearInterval(interval)
	}, [isPaused, waiting])

	useEffect(() => {
		if (!waiting || remainingMs > 0) return

		setWaiting(false)
		if (selectedPromptConfig?.kind !== 'audio' && answerAudio) {
			playAnswerAudio()
		}
	}, [answerAudio, playAnswerAudio, remainingMs, selectedPromptConfig, waiting])

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
		try {
			const result = await awardVocabQuizCompletion({
				courseId,
				points: pointsOnPass,
			})
			setCompletionHearts(result.hearts)
			setCompletionRewards({
				awardedPoints: result.awardedPoints,
				hearts: result.hearts,
				tribePointAwarded: result.tribePointAwarded,
			})
		} catch (error) {
			console.error('Failed to award vocab quiz rewards', error)
		}
	}, [courseId, pointsOnPass])

	useEffect(() => {
		if (finished && celebratoryFinish && !hasAwardedRef.current) {
			hasAwardedRef.current = true
			awardPoints()
		}
	}, [awardPoints, celebratoryFinish, finished])

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
		preloadRunRef.current += 1
		setGameStarted(false)
		setStudyMode(false)
		setPendingStartMode(null)
		setIsPreloadingMedia(false)
		setPreloadProgress({ loaded: 0, total: 0 })
		setCards([])
		setCurrentIndex(0)
		setWaiting(true)
		setIsPaused(false)
		setRemainingMs(timeLimit * 1000)
		setFeedback(null)
		setShowConfetti(false)
		setCorrectCount(0)
		setWrongCount(0)
		setFinished(false)
		setWrongAnswers([])
		setDisabledButtons(false)
		setCompletionRewards(null)
		hasAwardedRef.current = false
	}

	async function preloadQuizMedia(cardsToPreload: VocabCard[]) {
		if (cardsToPreload.length === 0) return true

		const runId = preloadRunRef.current + 1
		preloadRunRef.current = runId

		const uniqueImages = new Set<string>()
		const uniqueAudio = new Set<string>()

		for (const card of cardsToPreload) {
			const { imageSources, audioSources } = getCardMediaSources(card)
			for (const src of imageSources) uniqueImages.add(src)
			for (const src of audioSources) uniqueAudio.add(src)
		}

		const mediaTasks = [
			...Array.from(uniqueImages, (src) => ({ kind: 'image' as const, src })),
			...Array.from(uniqueAudio, (src) => ({ kind: 'audio' as const, src })),
		]

		if (mediaTasks.length === 0) {
			setPreloadProgress({ loaded: 0, total: 0 })
			return preloadRunRef.current === runId
		}

		let completed = 0
		setIsPreloadingMedia(true)
		setPreloadProgress({ loaded: 0, total: mediaTasks.length })

		try {
			await Promise.all(
				mediaTasks.map(async ({ kind, src }) => {
					try {
						if (kind === 'image') {
							await waitForImageLoad(src, imageLoadCacheRef.current)
						} else {
							await waitForAudioLoad(src, audioLoadCacheRef.current)
						}
					} catch {
						if (kind === 'image') {
							preloadImage(src)
						} else {
							preloadAudio(src)
						}
					} finally {
						completed += 1
						if (preloadRunRef.current === runId) {
							setPreloadProgress({ loaded: completed, total: mediaTasks.length })
						}
					}
				})
			)
		} finally {
			if (preloadRunRef.current === runId) {
				setIsPreloadingMedia(false)
			}
		}

		return preloadRunRef.current === runId
	}

	async function beginActivity(nextStudyMode: boolean) {
		if (filteredCards.length === 0 || isPreloadingMedia) return

		if (!nextStudyMode) {
			setPendingStartMode('quiz')
			try {
				const preloadCompleted = await preloadQuizMedia(filteredCards)
				if (!preloadCompleted) return
			} finally {
				setPendingStartMode(null)
			}
		}

		setStudyMode(nextStudyMode)
		setGameStarted(true)
	}

	function startNextLesson() {
		if (!nextLesson) return
		resetToStart()
		setSelectedLessons([nextLesson])
	}

	function renderTextValue(value: unknown, sizeClass: string) {
		if (typeof value !== 'string' || value.trim().length === 0) return null
		return (
			<div
				className={`${sizeClass} leading-tight text-slate-900 ${
					layout === 'hebrew' ? 'font-cardo' : ''
				}`}
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

			{showConfetti && celebratoryFinish && (
				<>
					<ReactConfetti
						width={width}
						height={height}
						recycle={false}
						numberOfPieces={500}
						tweenDuration={10000}
					/>
				</>
			)}

			{!gameStarted ? (
				pendingStartMode === 'quiz' ? (
					<div className="flex min-h-[420px] flex-col items-center justify-center gap-6">
						<TorahScrollLoader size={180} speedSec={40} fontSize={40} />
						<div className="space-y-2">
							<h2 className="text-2xl font-bold text-slate-900">Loading Quiz</h2>
							<p className="text-sm text-slate-600">
								Preloading the media for this lesson before the quiz begins.
							</p>
							{preloadProgress.total > 0 && (
								<p className="text-sm font-semibold text-slate-700">
									{preloadProgress.loaded}/{preloadProgress.total} ready
								</p>
							)}
						</div>
					</div>
				) : (
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
						<div className="flex flex-row-reverse flex-wrap justify-center gap-2">
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
						<p className="text-sm text-slate-600">
							Media loads after you press <span className="font-semibold">Start Quiz</span>.
						</p>
					</div>

					{filteredCards.length === 0 && (
						<p className="font-medium text-red-600">{config.emptyState}</p>
					)}

					<div className="flex flex-wrap justify-center gap-4">
						<button
							onClick={() => {
								void beginActivity(true)
							}}
							disabled={filteredCards.length === 0 || isPreloadingMedia}
							className={`rounded-xl px-6 py-3 font-semibold text-white ${
								filteredCards.length === 0 || isPreloadingMedia
									? 'bg-slate-300'
									: 'bg-violet-600 hover:bg-violet-700'
							}`}
						>
							Study Words
						</button>
						<button
							onClick={() => {
								void beginActivity(false)
							}}
							disabled={filteredCards.length === 0 || isPreloadingMedia}
							className={`rounded-xl px-6 py-3 font-semibold text-white ${
								filteredCards.length === 0 || isPreloadingMedia
									? 'bg-slate-300'
									: 'bg-green-600 hover:bg-green-700'
							}`}
						>
							{isPreloadingMedia ? 'Loading Media...' : 'Start Quiz'}
						</button>
					</div>
				</div>
				)
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
				<ActivityFinalScreen
					title={celebratoryFinish ? 'Lesson Complete' : 'Quiz Complete!'}
					description={
						celebratoryFinish
							? 'You cleared the passing threshold and earned rewards.'
							: passed
								? 'You passed, but no points were awarded because more than 75% were missed.'
								: 'To pass, you must miss 2 or fewer.'
					}
					stats={[
						{ label: 'Correct', value: correctCount, valueClassName: 'text-emerald-600' },
						{ label: 'Incorrect', value: wrongCount, valueClassName: 'text-rose-600' },
						{
							label: 'Points',
							value: completionRewards?.awardedPoints ?? pointsOnPass ?? 0,
						},
					]}
					rewards={
						celebratoryFinish ? (
							<>
								<p className="mb-4 text-lg font-semibold text-slate-800">
									You earned {completionRewards?.awardedPoints ?? pointsOnPass} point
									{(completionRewards?.awardedPoints ?? pointsOnPass) === 1 ? '' : 's'}.
								</p>
								<div className="mx-auto flex w-full max-w-md items-center gap-x-4">
									<ResultCard
										variant="points"
										value={completionRewards?.awardedPoints ?? pointsOnPass}
										tribePointAdded={completionRewards?.tribePointAwarded ?? false}
									/>
									<ResultCard
										variant="hearts"
										value={completionRewards?.hearts ?? completionHearts}
										tribePointAdded={completionRewards?.tribePointAwarded ?? false}
									/>
								</div>
							</>
						) : undefined
					}
					message={
						!celebratoryFinish ? (
							<p className={`text-lg font-semibold ${passed ? 'text-slate-700' : 'text-rose-600'}`}>
								{passed
									? 'You passed, but this round did not qualify for rewards.'
									: "Let's try again!"}
							</p>
						) : undefined
					}
					actions={
						<div className="flex flex-wrap justify-center gap-4">
							<button
								onClick={resetToStart}
								className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
							>
								Start Over
							</button>
							<button
								onClick={startNextLesson}
								disabled={!nextLesson}
								className={`rounded-full px-6 py-3 font-semibold text-white ${
									nextLesson
										? 'bg-emerald-600 hover:bg-emerald-700'
										: 'bg-slate-300'
								}`}
							>
								{nextLesson ? `Start Next Lesson (${nextLesson})` : 'No Next Lesson'}
							</button>
							<button
								onClick={() => router.push(mainScreenHref)}
								className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700"
							>
								Return to Main Screen
							</button>
						</div>
					}
					reviewSection={
						wrongAnswers.length > 0 ? (
							<div className="w-full text-left">
								<h3 className="text-center text-xl font-bold text-slate-900">
									Review Missed Answers
								</h3>
								<div className="mt-5 grid gap-4 sm:grid-cols-2">
									{wrongAnswers.map((card, index) => (
										<div
											key={`${card.id ?? index}-wrong-${index}`}
											className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
										>
											<div className="text-center">{renderPrompt(card, 'text-2xl')}</div>
											<div className="mt-4 border-t border-slate-200 pt-4 text-center">
												{renderAnswer(card, 'text-3xl')}
												{config.answerAudioField &&
													hasValue(card, config.answerAudioField) && (
														<button
															onClick={() => playCardAnswerAudio(card)}
															className="mt-3 text-2xl text-sky-600 hover:text-sky-800"
															aria-label="Replay answer audio"
														>
															🔊
														</button>
													)}
											</div>
										</div>
									))}
								</div>
							</div>
						) : undefined
					}
					celebration={
						celebratoryFinish ? (
							<>
								{showConfetti && finishAudio}
								{showConfetti && (
									<div className="mb-4 flex justify-center">
										<Image
											src="/finish.svg"
											alt="Finish"
											className="hidden lg:block"
											height={100}
											width={100}
										/>
										<Image
											src="/finish.svg"
											alt="Finish"
											className="block lg:hidden"
											height={50}
											width={50}
										/>
									</div>
								)}
							</>
						) : undefined
					}
				/>
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
									<CountdownCircle seconds={timeLimit} remainingMs={remainingMs} />
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
						<button
							onClick={() => setIsPaused((prev) => !prev)}
							disabled={!waiting}
							className="rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-slate-900 hover:bg-yellow-500"
						>
							{isPaused ? '▶ Resume' : '⏸ Pause'}
						</button>
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
