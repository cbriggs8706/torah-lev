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
	pointsOnPass?: number
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
	pointsOnPass = 5,
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
	const publicCourseCompletionRef = useRef(false)
	const imageLoadCacheRef = useRef<Map<string, Promise<void>>>(new Map())
	const audioLoadCacheRef = useRef<Map<string, Promise<void>>>(new Map())
	const preloadRunRef = useRef(0)
	const { width, height } = useWindowSize()
	const [isPreloadingMedia, setIsPreloadingMedia] = useState(false)
	const [preloadProgress, setPreloadProgress] = useState({
		loaded: 0,
		total: 0,
	})
	const [pendingStartMode, setPendingStartMode] = useState<null | 'quiz'>(null)

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
				: '/curriculum'

	const nextLesson = useMemo(() => {
		if (lessonOptions.length === 0 || selectedLessons.length === 0) return null

		const sortedSelected = lessonOptions.filter((lesson) =>
			selectedLessons.includes(lesson),
		)
		const lastSelectedLesson = sortedSelected[sortedSelected.length - 1]
		if (!lastSelectedLesson) return null

		const currentLessonIndex = lessonOptions.indexOf(lastSelectedLesson)
		if (
			currentLessonIndex === -1 ||
			currentLessonIndex >= lessonOptions.length - 1
		) {
			return null
		}

		return lessonOptions[currentLessonIndex + 1]
	}, [lessonOptions, selectedLessons])

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

	useEffect(() => {
		if (
			!finished ||
			!passed ||
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
	}, [completionContext, correctCount, finished, passed, total])

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
		setGameStarted(true)
	}

	function startNextLesson() {
		if (!nextLesson) return
		resetToStart()
		setSelectedLessons([nextLesson])
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
					</div>
				) : (
					<div className="space-y-6">
						{/* <div>
							<h1 className="text-2xl font-bold text-slate-900">
								Customize Your Quiz
							</h1>
							<p className="mt-2 text-sm text-slate-600">
								Choose your prompt, set the timer, and practice vocab from any
								lesson in this course.
							</p>
						</div> */}

						{!filtersLocked ? (
							<div className="rounded-2xl bg-white p-4 text-left">
								<LessonFilter
									data={data}
									selectedLessons={selectedLessons}
									setSelectedLessons={setSelectedLessons}
								/>
							</div>
						) : (
							<div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
								This quiz is locked to the lesson assigned from your study group
								schedule.
							</div>
						)}

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

						{/* <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
								Preview
							</p>
							<p className="mt-2 text-sm text-slate-600">
								Prompt:{' '}
								<span className="font-semibold">
									{selectedPromptConfig?.label}
								</span>
							</p>
							<p className="text-sm text-slate-600">
								Answer:{' '}
								<span className="font-semibold">
									{selectedRespondWithConfig?.label}
								</span>
							</p>
							<p className="text-sm text-slate-600">
								Cards ready:{' '}
								<span className="font-semibold">{filteredCards.length}</span>
							</p>
						</div> */}

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
						{
							label: 'Points',
							value: completionRewards?.awardedPoints ?? pointsOnPass ?? 0,
						},
					]}
					rewards={
						celebratoryFinish ? (
							<>
								<p className="mb-4 text-lg font-semibold text-slate-800">
									You earned {completionRewards?.awardedPoints ?? pointsOnPass}{' '}
									point
									{(completionRewards?.awardedPoints ?? pointsOnPass) === 1
										? ''
										: 's'}
									.
								</p>
								<div className="mx-auto flex w-full max-w-md items-center gap-x-4">
									<ResultCard
										variant="points"
										value={completionRewards?.awardedPoints ?? pointsOnPass}
										tribePointAdded={
											completionRewards?.tribePointAwarded ?? false
										}
									/>
									<ResultCard
										variant="hearts"
										value={completionRewards?.hearts ?? completionHearts}
										tribePointAdded={
											completionRewards?.tribePointAwarded ?? false
										}
									/>
								</div>
							</>
						) : undefined
					}
					message={
						!celebratoryFinish ? (
							<p
								className={`text-lg font-semibold ${passed ? 'text-slate-700' : 'text-rose-600'}`}
							>
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
								{nextLesson
									? `Start Next Lesson (${nextLesson})`
									: 'No Next Lesson'}
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
											<div className="text-center">
												{renderPrompt(card, 'text-2xl')}
											</div>
											<div className="mt-4 border-t border-slate-200 pt-4 text-center">
												{renderAnswer(card, 'text-3xl')}
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
