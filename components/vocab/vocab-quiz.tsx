'use client'

import { awardVocabQuizCompletion } from '@/actions/vocab-quiz-progress'
import { ActivityCompletionScreen } from '@/components/activity-completion-screen'
import { ActivityFinalScreen } from '@/components/activity-final-screen'
import TorahScrollLoader from '@/components/hebrew/hebrew-loader'
import LessonFilter from '@/components/filters/filter-lesson'
import { useLessonCards } from '@/hooks/useLessonCards'
import { dispatchUserProgressUpdated } from '@/lib/user-progress-events'
import type { EnglishVocab, GreekVocab, HebrewVocab } from '@/lib/vocab'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { markPublicCourseActivityComplete } from '@/lib/public-course-progress'
import type { PublicCourseActivityFilters } from '@/lib/public-course-activities'

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

function getOptionTextDirection(key: PromptKey): 'ltr' | 'rtl' {
	return key === 'heb' || key === 'hebNiqqud' ? 'rtl' : 'ltr'
}

function getOptionTextClass(key: PromptKey) {
	if (key === 'heb' || key === 'hebNiqqud') return 'font-cardo'
	if (key === 'grk') return 'font-serif'
	return ''
}

function getAudioKeyForPromptKey(key: PromptKey): PromptKey | null {
	switch (key) {
		case 'eng':
			return 'engAudio'
		case 'heb':
		case 'hebNiqqud':
			return 'hebAudio'
		case 'grk':
			return 'grkAudio'
		default:
			return null
	}
}

interface VocabQuizProps {
	data: VocabCard[]
	currentLesson: string
	courseId: number
	userId: string
	layout: QuizLayout
	initialHearts?: number
	returnTo?: string
	filtersLocked?: boolean
	initialFilters?: PublicCourseActivityFilters
	completionContext?: {
		enrollmentId: number
		publicCourseLessonId: number
	}
}

function CountdownCircle({
	seconds,
	remainingMs,
	paused,
	onTogglePause,
}: {
	seconds: number
	remainingMs: number
	paused: boolean
	onTogglePause: () => void
}) {
	const progress =
		seconds <= 0
			? 100
			: ((seconds * 1000 - remainingMs) / (seconds * 1000)) * 100
	const radius = 45
	const circumference = 2 * Math.PI * radius
	const offset = circumference - (progress / 100) * circumference

	return (
		<button
			type="button"
			onClick={onTogglePause}
			className="relative inline-flex h-[100px] w-[100px] items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
			aria-label={paused ? 'Resume countdown' : 'Pause countdown'}
		>
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
					fontSize={paused ? '28' : '24'}
					fill="#111827"
					fontWeight="bold"
				>
					{paused ? '⏸' : Math.ceil(remainingMs / 1000)}
				</text>
			</svg>
			<span className="sr-only">{paused ? 'Resume' : 'Pause'}</span>
		</button>
	)
}

const QUIZ_CONFIG: Record<
	QuizLayout,
	{
		title: string
		emptyState: string
		promptOptions: PromptOption[]
		defaultPrompt: PromptKey
		defaultRespondWith: PromptKey
	}
> = {
	english: {
		title: 'Quiz',
		emptyState: 'No quiz cards match your current filter.',
		defaultPrompt: 'images',
		defaultRespondWith: 'engAudio',
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
		title: 'חידון',
		emptyState: 'No quiz cards match your current filter.',
		defaultPrompt: 'images',
		defaultRespondWith: 'hebAudio',
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
		title: 'Quiz',
		emptyState: 'No quiz cards match your current filter.',
		defaultPrompt: 'images',
		defaultRespondWith: 'grkAudio',
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
			return 'engAudio' in card ? (card.engAudio ?? '') : ''
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

function waitForImageLoad(src: string, cache: Map<string, Promise<void>>) {
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

function waitForAudioLoad(src: string, cache: Map<string, Promise<void>>) {
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
		? card.images.filter(
				(src): src is string => typeof src === 'string' && src.length > 0,
			)
		: []

	const audioSources = [
		'engAudio' in card ? card.engAudio : '',
		'hebAudio' in card ? card.hebAudio : '',
		'grkAudio' in card ? card.grkAudio : '',
	].filter((src): src is string => typeof src === 'string' && src.length > 0)

	return { imageSources, audioSources }
}

export default function VocabQuiz({
	data,
	currentLesson,
	courseId,
	userId: _userId,
	layout,
	initialHearts = 5,
	returnTo,
	filtersLocked = false,
	initialFilters,
	completionContext,
}: VocabQuizProps) {
	const config = QUIZ_CONFIG[layout]
	const { selectedLessons, setSelectedLessons, lessonOptions } = useLessonCards(
		data,
		currentLesson,
		{ selectionMode: 'single' },
	)
	const router = useRouter()
	const [selectedPrompt, setSelectedPrompt] = useState<PromptKey>(
		config.defaultPrompt,
	)
	const [selectedRespondWith, setSelectedRespondWith] = useState<PromptKey>(
		config.defaultRespondWith,
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
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const [wrongAnswers, setWrongAnswers] = useState<VocabCard[]>([])
	const [disabledButtons, setDisabledButtons] = useState(false)
	const [completionHearts, setCompletionHearts] = useState(initialHearts)
	const [showCompletionScreen, setShowCompletionScreen] = useState(false)
	const [completionRewards, setCompletionRewards] = useState<{
		awardedPoints: number
		hearts: number
		tribePointAwarded: boolean
	} | null>(null)
	const promptAudioRef = useRef<HTMLAudioElement | null>(null)
	const answerAudioRef = useRef<HTMLAudioElement | null>(null)
	const hasAwardedRef = useRef(false)
	const publicCourseCompletionRef = useRef(false)
	const imageLoadCacheRef = useRef<Map<string, Promise<void>>>(new Map())
	const audioLoadCacheRef = useRef<Map<string, Promise<void>>>(new Map())
	const preloadRunRef = useRef(0)
	const [isPreloadingMedia, setIsPreloadingMedia] = useState(false)
	const [preloadProgress, setPreloadProgress] = useState({
		loaded: 0,
		total: 0,
	})
	const [pendingStartMode, setPendingStartMode] = useState<null | 'quiz'>(null)
	const [gameSessionId, setGameSessionId] = useState(0)
	const initialHeartsRef = useRef(initialHearts)
	const sessionCardsRef = useRef<VocabCard[]>([])

	const availablePromptOptions = useMemo(
		() =>
			config.promptOptions.filter((option) =>
				data.some((card) => hasValue(card, option.key)),
			),
		[data, config.promptOptions],
	)

	useEffect(() => {
		if (!initialFilters?.selectedLessons?.length) return
		setSelectedLessons(initialFilters.selectedLessons)
	}, [initialFilters?.selectedLessons, setSelectedLessons])

	useEffect(() => {
		initialHeartsRef.current = initialHearts
	}, [initialHearts])

	useEffect(() => {
		if (
			availablePromptOptions.length > 0 &&
			!availablePromptOptions.some((option) => option.key === selectedPrompt)
		) {
			setSelectedPrompt(availablePromptOptions[0].key)
		}
	}, [availablePromptOptions, selectedPrompt])

	useEffect(() => {
		if (
			availablePromptOptions.length > 0 &&
			!availablePromptOptions.some(
				(option) => option.key === selectedRespondWith,
			)
		) {
			setSelectedRespondWith(availablePromptOptions[0].key)
		}
	}, [availablePromptOptions, selectedRespondWith])

	const selectedPromptConfig = useMemo(
		() =>
			availablePromptOptions.find((option) => option.key === selectedPrompt) ??
			availablePromptOptions[0],
		[availablePromptOptions, selectedPrompt],
	)

	const selectedRespondWithConfig = useMemo(
		() =>
			availablePromptOptions.find(
				(option) => option.key === selectedRespondWith,
			) ?? availablePromptOptions[0],
		[availablePromptOptions, selectedRespondWith],
	)

	const filteredCards = useMemo(() => {
		return data.filter((card) => {
			const matchesLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((lesson) => selectedLessons.includes(lesson))
			const hasPrompt = selectedPromptConfig
				? hasValue(card, selectedPromptConfig.key)
				: false
			const hasAnswer = selectedRespondWithConfig
				? hasValue(card, selectedRespondWithConfig.key)
				: false

			return matchesLesson && hasPrompt && hasAnswer
		})
	}, [data, selectedLessons, selectedPromptConfig, selectedRespondWithConfig])

	useEffect(() => {
		if (gameStarted || isPreloadingMedia) return
		setPreloadProgress({ loaded: 0, total: 0 })
	}, [filteredCards, gameStarted, isPreloadingMedia, selectedPrompt, timeLimit])

	useEffect(() => {
		if (!gameStarted) return
		setCards(shuffleCards(sessionCardsRef.current))
		setCurrentIndex(0)
		setWaiting(true)
		setIsPaused(false)
		setRemainingMs(timeLimit * 1000)
		setFeedback(null)
		setDisabledButtons(false)
		setFinished(false)
		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
		setCompletionRewards(null)
		setShowCompletionScreen(false)
		hasAwardedRef.current = false
		setCompletionHearts(initialHeartsRef.current)
	}, [gameSessionId, gameStarted, timeLimit])

	const currentCard = cards[currentIndex]
	const total = cards.length
	const passed = wrongCount <= 2
	const celebratoryFinish = passed
	const returnHref =
		typeof returnTo === 'string' && returnTo.startsWith('/')
			? returnTo
			: '/he/learn'
	const returnLabel = returnHref.startsWith('/courses/public/')
		? 'Return to Course'
		: 'Return to Learn'
	const completionPoints = completionRewards?.awardedPoints ?? total
	const completionFinalHearts =
		completionRewards?.hearts ?? Math.min(completionHearts + 1, 5)
	const completionTribeAwarded = completionRewards?.tribePointAwarded ?? false

	const answerAudio =
		currentCard && selectedRespondWithConfig?.kind === 'audio'
			? String(getCardValue(currentCard, selectedRespondWithConfig.key) ?? '')
			: ''

	useEffect(() => {
		if (!selectedPromptConfig || selectedPromptConfig.kind !== 'image') return

		const currentValue = currentCard
			? getCardValue(currentCard, selectedPromptConfig.key)
			: null
		const nextCard = cards[currentIndex + 1]
		const nextValue = nextCard
			? getCardValue(nextCard, selectedPromptConfig.key)
			: null

		if (Array.isArray(currentValue) && currentValue[0]) {
			void waitForImageLoad(currentValue[0], imageLoadCacheRef.current).catch(
				() => {
					preloadImage(currentValue[0])
				},
			)
		}

		if (Array.isArray(nextValue) && nextValue[0]) {
			void waitForImageLoad(nextValue[0], imageLoadCacheRef.current).catch(
				() => {
					preloadImage(nextValue[0])
				},
			)
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
		if (
			!currentCard ||
			!selectedPromptConfig ||
			selectedPromptConfig.kind !== 'audio'
		) {
			return
		}

		const src = String(
			getCardValue(currentCard, selectedPromptConfig.key) ?? '',
		)
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

	const playCardOptionAudio = useCallback(
		(card: VocabCard, option: PromptOption | undefined) => {
			if (!option) return
			const src = String(getCardValue(card, option.key) ?? '')
			if (!src) return
			answerAudioRef.current?.pause()
			const audio = new Audio(src)
			answerAudioRef.current = audio
			audio.currentTime = 0
			audio.play().catch(() => {})
		},
		[],
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

	const awardPoints = useCallback(async (hearts: number, points: number) => {
		try {
			const result = await awardVocabQuizCompletion({
				courseId,
				points,
				hearts,
			})
			setCompletionHearts(result.hearts)
			dispatchUserProgressUpdated({
				hearts: result.hearts,
				points: result.awardedPoints,
			})
			setCompletionRewards({
				awardedPoints: result.awardedPoints,
				hearts: result.hearts,
				tribePointAwarded: result.tribePointAwarded,
			})
		} catch (error) {
			console.error('Failed to award vocab quiz rewards', error)
			setCompletionHearts(hearts)
			dispatchUserProgressUpdated({
				hearts,
				points,
			})
			setCompletionRewards({
				awardedPoints: points,
				hearts,
				tribePointAwarded: false,
			})
		}
	}, [courseId])

	useEffect(() => {
		if (showCompletionScreen && celebratoryFinish && !hasAwardedRef.current) {
			hasAwardedRef.current = true
			const heartsAfterBonus = Math.min(completionHearts + 1, 5)
			awardPoints(heartsAfterBonus, total)
		}
	}, [awardPoints, celebratoryFinish, completionHearts, showCompletionScreen, total])

	useEffect(() => {
		if (
			!showCompletionScreen ||
			!celebratoryFinish ||
			!completionContext ||
			publicCourseCompletionRef.current
		) {
			return
		}

		publicCourseCompletionRef.current = true
		void markPublicCourseActivityComplete({
			enrollmentId: completionContext.enrollmentId,
			publicCourseLessonId: completionContext.publicCourseLessonId,
			activityKey: 'quiz',
			scorePercent: Math.round((correctCount / Math.max(total, 1)) * 100),
		}).catch((error) => {
			console.error('Failed to save public course quiz progress', error)
			publicCourseCompletionRef.current = false
		})
	}, [celebratoryFinish, completionContext, correctCount, showCompletionScreen, total])

	function handleResponse(correct: boolean) {
		if (waiting || disabledButtons || !currentCard) return

		setDisabledButtons(true)
		setFeedback(correct)
		if (correct) {
			setCorrectCount((prev) => prev + 1)
		} else {
			setWrongCount((prev) => prev + 1)
			setWrongAnswers((prev) => [...prev, currentCard])
			const nextHearts = Math.max(completionHearts - 1, 0)
			setCompletionHearts(nextHearts)
			dispatchUserProgressUpdated({
				hearts: nextHearts,
			})
		}

		setTimeout(() => {
			const isLast = currentIndex === cards.length - 1
			if (isLast) {
				if (wrongCount + (correct ? 0 : 1) <= 2) {
					setShowCompletionScreen(true)
				} else {
					setFinished(true)
				}
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
		setCorrectCount(0)
		setWrongCount(0)
		setFinished(false)
		setWrongAnswers([])
		setDisabledButtons(false)
		setCompletionRewards(null)
		setCompletionHearts(initialHeartsRef.current)
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
							setPreloadProgress({
								loaded: completed,
								total: mediaTasks.length,
							})
						}
					}
				}),
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
		sessionCardsRef.current = filteredCards
		setGameSessionId((prev) => prev + 1)
		setGameStarted(true)
	}

	function renderTextValue(
		value: unknown,
		sizeClass: string,
		dir: 'ltr' | 'rtl' = 'ltr',
		fontClass = '',
	) {
		if (typeof value !== 'string' || value.trim().length === 0) return null
		return (
			<div
				className={`${sizeClass} leading-tight text-slate-900 ${fontClass}`}
				dir={dir}
			>
				{value}
			</div>
		)
	}

	function renderOptionValue(
		card: VocabCard,
		option: PromptOption | undefined,
		sizeClass = 'text-3xl md:text-4xl',
		mode: 'answer' | 'prompt' = 'answer',
	) {
		if (!option) return null
		const value = getCardValue(card, option.key)

		if (option.kind === 'image') {
			const imageUrl = Array.isArray(value) ? value[0] : null
			if (!imageUrl) return null
			return (
				<div className="relative h-56 w-full max-w-md overflow-hidden rounded-2xl bg-white">
					<Image
						src={imageUrl}
						alt={`${option.label} image`}
						fill
						className="object-contain p-4"
						sizes="(max-width: 768px) 100vw, 480px"
					/>
				</div>
			)
		}

		if (option.kind === 'audio') {
			const audioSrc = typeof value === 'string' ? value : ''
			return (
				<button
					type="button"
					onClick={() => {
						if (!audioSrc) return
						const audio = new Audio(audioSrc)
						audio.play().catch(() => {})
					}}
					className="flex flex-col items-center gap-3 rounded-2xl p-2 text-center"
					aria-label={`Replay ${option.label}`}
				>
					<div className="rounded-full bg-sky-100 p-6 text-6xl transition hover:bg-sky-200">
						🔊
					</div>
					{mode === 'prompt' && (
						<p className="text-sm text-slate-600">
							Listen and get ready to answer.
						</p>
					)}
				</button>
			)
		}

		return renderTextValue(
			value,
			sizeClass,
			getOptionTextDirection(option.key),
			getOptionTextClass(option.key),
		)
	}

	function renderPrompt(card: VocabCard, sizeClass = 'text-3xl md:text-4xl') {
		return renderOptionValue(card, selectedPromptConfig, sizeClass, 'prompt')
	}

	function renderAnswer(card: VocabCard, sizeClass = 'text-5xl md:text-6xl') {
		return renderOptionValue(card, selectedRespondWithConfig, sizeClass)
	}

	function getPromptHeaderLabel(card: VocabCard) {
		if (selectedPromptConfig?.kind === 'image') {
			return card.type === 'phrase' ? 'PHRASE' : 'WORD'
		}

		return selectedPromptConfig?.label ?? ''
	}

	function getAnswerHeaderLabel() {
		if (selectedRespondWithConfig?.kind === 'audio') return ''
		return selectedRespondWithConfig?.label ?? ''
	}

	function getStudyCardAudioOption(card: VocabCard) {
		if (selectedRespondWithConfig?.kind === 'audio')
			return selectedRespondWithConfig
		if (selectedRespondWithConfig?.kind === 'text') {
			const audioKey = getAudioKeyForPromptKey(selectedRespondWithConfig.key)
			if (!audioKey) return null
			if (hasValue(card, audioKey)) {
				const audioOption = availablePromptOptions.find(
					(option) => option.key === audioKey,
				)
				if (audioOption) return audioOption
			}
		}

		return null
	}

	if (showCompletionScreen) {
		return celebratoryFinish ? (
			<ActivityCompletionScreen
				title="Lesson Complete"
				description="You cleared the passing threshold and earned rewards."
				rewardMessage={
					<>
						You earned {completionPoints} point
						{completionPoints === 1 ? '' : 's'}, gained 1 heart, and earned
						+1 Tribe Point.
					</>
				}
				points={completionPoints}
				hearts={completionFinalHearts}
				tribePointAwarded={completionTribeAwarded}
				leftActionLabel="Return to Quiz"
				leftActionOnClick={resetToStart}
				rightActionLabel={returnLabel}
				rightActionOnClick={() => {
					router.push(returnHref)
				}}
			/>
		) : (
			<ActivityFinalScreen
				title="Quiz Complete!"
				description={
					passed
						? 'You passed, but this round did not qualify for rewards.'
						: 'To pass, you must miss 2 or fewer.'
				}
				stats={[
					{
						label: 'Correct',
						value: correctCount,
						valueClassName: 'text-emerald-600',
					},
					{
						label: 'Incorrect',
						value: wrongCount,
						valueClassName: 'text-rose-600',
					},
				]}
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
										</div>
									</div>
								))}
							</div>
						</div>
					) : undefined
				}
				actions={
					<div className="flex flex-col justify-center gap-3 sm:flex-row">
						<button
							onClick={resetToStart}
							className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
						>
							Retry Quiz
						</button>
						<button
							onClick={() => {
								router.push(returnHref)
							}}
							className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700"
						>
							{returnLabel}
						</button>
					</div>
				}
			/>
		)
	}

	return (
		<div className="relative w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
			{gameStarted && !showCompletionScreen && (
				<button
					onClick={resetToStart}
					className="absolute left-4 top-4 text-gray-600 hover:text-gray-900"
					aria-label="Back"
				>
					⬅️
				</button>
			)}

			{!gameStarted ? (
				pendingStartMode === 'quiz' ? (
					<div className="flex min-h-[420px] flex-col items-center justify-center gap-6">
						<TorahScrollLoader size={180} speedSec={40} fontSize={40} />
					</div>
				) : (
					<div className="space-y-6">
						{!filtersLocked ? (
							<>
								<div className="rounded-2xl bg-white p-4 text-left">
									<LessonFilter
										data={data}
										selectedLessons={selectedLessons}
										setSelectedLessons={setSelectedLessons}
									/>
								</div>

								<div className="space-y-3">
									<h2 className="mb-2 text-center text-xl font-semibold">
										Select Prompt
									</h2>
									<div className="flex flex-row-reverse flex-wrap justify-center gap-2">
										{availablePromptOptions.map((option) => (
											<button
												key={option.key}
												onClick={() => setSelectedPrompt(option.key)}
												className={`px-3 py-1 border rounded-full text-xs ${
													selectedPrompt === option.key
														? 'bg-sky-600 text-white'
														: 'bg-gray-200'
												}`}
											>
												{option.label}
											</button>
										))}
									</div>
								</div>

								<div className="space-y-3">
									<h2 className="mb-2 text-center text-xl font-semibold">
										Respond With
									</h2>
									<div className="flex flex-row-reverse flex-wrap justify-center gap-2">
										{availablePromptOptions.map((option) => (
											<button
												key={option.key}
												onClick={() => setSelectedRespondWith(option.key)}
												className={`px-3 py-1 border rounded-full text-xs ${
													selectedRespondWith === option.key
														? 'bg-sky-600 text-white'
														: 'bg-gray-200'
												}`}
											>
												{option.label}
											</button>
										))}
									</div>
								</div>
							</>
						) : null}

						<div className="space-y-3">
							<h2 className="text-xl font-semibold">Seconds to Answer</h2>
							<div className="flex flex-row-reverse flex-wrap justify-center gap-2">
								{[1, 3, 5, 8].map((seconds) => (
									<button
										key={seconds}
										onClick={() => setTimeLimit(seconds)}
										className={`px-3 py-1 border rounded-full text-xs ${
											timeLimit === seconds
												? 'bg-sky-600 text-white'
												: 'bg-gray-200'
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
									setTimeLimit(
										Math.max(1, Math.min(15, Number(e.target.value) || 1)),
									)
								}
								className="mx-auto block w-24 rounded-xl border border-slate-200 p-2 text-center"
							/>
						</div>

						{!filtersLocked && filteredCards.length === 0 && (
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
										: 'bg-[#4b2a5a] hover:bg-[#5b346b]'
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
										: 'bg-emerald-700 hover:bg-emerald-800'
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
						{filteredCards.map((card, index) => {
							const studyCardAudioOption = getStudyCardAudioOption(card)

							return (
								<div
									key={`${card.id ?? index}-${index}`}
									className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"
								>
									{selectedPromptConfig?.kind !== 'image' && (
										<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											{getPromptHeaderLabel(card)}
										</p>
									)}
									<div className="mt-3 flex min-h-[120px] items-center justify-center text-center">
										{renderPrompt(card, 'text-2xl md:text-3xl')}
									</div>
									<div className="mt-4 border-t border-slate-200 pt-4 text-center">
										{getAnswerHeaderLabel() && (
											<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
												{getAnswerHeaderLabel()}
											</p>
										)}
										<div className="mt-2">{renderAnswer(card, 'text-3xl')}</div>
									</div>
									{studyCardAudioOption && (
										<button
											type="button"
											onClick={() =>
												playCardOptionAudio(card, studyCardAudioOption)
											}
											className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700 hover:shadow-md"
											aria-label="Play audio"
										>
											🔊
										</button>
									)}
								</div>
							)
						})}
					</div>
					<button
						onClick={resetToStart}
						className="rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-800 hover:bg-slate-300"
					>
						Back
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
								{getPromptHeaderLabel(currentCard)}
							</p>
							<div className="mt-4 flex min-h-[220px] items-center justify-center text-center">
								{renderPrompt(currentCard)}
							</div>
						</div>

						<div className="flex min-h-[120px] justify-center">
							{waiting ? (
								<CountdownCircle
									seconds={timeLimit}
									remainingMs={remainingMs}
									paused={isPaused}
									onTogglePause={() => setIsPaused((prev) => !prev)}
								/>
							) : (
								<div className="space-y-3 text-center">
									{getAnswerHeaderLabel() && (
										<p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
											{getAnswerHeaderLabel()}
										</p>
									)}
									<div>{renderAnswer(currentCard)}</div>
								</div>
							)}
						</div>

						<div className="min-h-[16px] pt-1">
							{!waiting ? (
								<div className="flex flex-wrap justify-center gap-3">
									<button
										onClick={() => handleResponse(false)}
										disabled={waiting || disabledButtons}
										className={`rounded-xl border px-5 py-3 font-semibold transition ${
											waiting || disabledButtons
												? 'border-sidebar-primary/20 bg-sidebar-primary/10 text-sidebar-primary/50'
												: 'border-sidebar-primary/35 bg-sidebar-primary text-white hover:bg-sidebar-primary/90'
										}`}
									>
										👎 I missed
									</button>
									<button
										onClick={() => handleResponse(true)}
										disabled={waiting || disabledButtons}
										className={`rounded-xl border px-5 py-3 font-semibold transition ${
											waiting || disabledButtons
												? 'border-emerald-200 bg-emerald-100 text-emerald-400'
												: 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'
										}`}
									>
										👍 I got it
									</button>
								</div>
							) : null}
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
