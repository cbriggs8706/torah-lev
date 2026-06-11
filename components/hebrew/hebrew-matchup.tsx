'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ActivityCompletionScreen } from '@/components/activity-completion-screen'
import { HebrewVocab } from '@/lib/vocab'
import { formatRootMorphology, hasRootMorphology } from '@/lib/vocab-morphology'
import { resolveVocabMediaUrl } from '@/lib/vocab-media'
import TypeFilter from '../filters/filter-type'
import LessonFilter from '../filters/filter-lesson'
import { markPublicCourseActivityComplete } from '@/lib/public-course-progress'
import type { PublicCourseActivityFilters } from '@/lib/public-course-activities'
import { dispatchUserProgressUpdated } from '@/lib/user-progress-events'
import { awardMatchupCompletion } from '@/actions/matchup-progress'

interface WordMatchGameProps {
	data: HebrewVocab[]
	currentLesson?: number
	userId: string
	courseId: number | null
	initialHearts: number
	lockedLesson?: string
	hideFilters?: boolean
	initialFilters?: PublicCourseActivityFilters
	returnTo?: string
	completionContext?: {
		enrollmentId: number
		publicCourseLessonId: number
	}
}

type Phase = 'playing' | 'results'
type MatchupKind = 'text' | 'image' | 'audio'
type MatchupKey =
	| 'eng'
	| 'engDefinition'
	| 'images'
	| 'hebAudio'
	| 'hebNiqqud'
	| 'heb'

type MatchupOption = {
	key: MatchupKey
	label: string
	kind: MatchupKind
}

const MATCHUP_OPTIONS: MatchupOption[] = [
	{ key: 'eng', label: 'Translation', kind: 'text' },
	{ key: 'images', label: 'Image', kind: 'image' },
	{ key: 'hebAudio', label: 'Audio', kind: 'audio' },
	{ key: 'hebNiqqud', label: 'Hebrew with niqqud', kind: 'text' },
	{ key: 'heb', label: 'Hebrew without niqqud', kind: 'text' },
]

const DEFAULT_PROMPT_KEY: MatchupKey = 'images'
const DEFAULT_RESPONSE_KEY: MatchupKey = 'hebAudio'

function parseLessonKey(key: string) {
	const match = key.match(/^(\d+)?([a-zA-Z]*)$/)
	if (!match) return { num: NaN, text: key }
	return {
		num: match[1] ? parseInt(match[1], 10) : NaN,
		text: match[2] || (match[1] ? '' : key),
	}
}

function toAbsoluteUrl(src: string) {
	if (!src) return src
	return resolveVocabMediaUrl(src)
}

function getCardValue(card: HebrewVocab, key: MatchupKey) {
	switch (key) {
		case 'eng':
			return card.eng
		case 'engDefinition':
			return card.engDefinition ?? ''
		case 'images':
			return card.images ?? []
		case 'hebAudio':
			return card.hebAudio ?? ''
		case 'hebNiqqud':
			return card.hebNiqqud
		case 'heb':
			return card.heb
		default:
			return ''
	}
}

function hasValue(card: HebrewVocab, key: MatchupKey) {
	const value = getCardValue(card, key)
	if (Array.isArray(value)) return value.length > 0
	return Boolean(value)
}

function shuffleCards<T>(cards: T[]) {
	return [...cards].sort(() => Math.random() - 0.5)
}

function getOptionTextDirection(key: MatchupKey): 'ltr' | 'rtl' {
	return key === 'heb' || key === 'hebNiqqud' ? 'rtl' : 'ltr'
}

function getOptionTextClass(key: MatchupKey) {
	return key === 'heb' || key === 'hebNiqqud' ? 'font-cardo font-normal' : ''
}

export default function WordMatchGame({
	data,
	currentLesson,
	courseId,
	userId,
	initialHearts,
	lockedLesson,
	hideFilters = false,
	initialFilters,
	returnTo,
	completionContext,
}: WordMatchGameProps) {
	const router = useRouter()
	const [showFilter, setShowFilter] = useState(false)
	const [selectedPrompt, setSelectedPrompt] =
		useState<MatchupKey>(DEFAULT_PROMPT_KEY)
	const [selectedResponse, setSelectedResponse] = useState<MatchupKey>(
		DEFAULT_RESPONSE_KEY,
	)
	const [selectedType, setSelectedType] = useState<'all' | 'word' | 'phrase'>(
		'all',
	)
	const [promptDeck, setPromptDeck] = useState<HebrewVocab[]>([])
	const [responseDeck, setResponseDeck] = useState<HebrewVocab[]>([])
	const [visiblePromptCards, setVisiblePromptCards] = useState<
		Array<HebrewVocab | null>
	>([])
	const [visibleResponseCards, setVisibleResponseCards] = useState<
		Array<HebrewVocab | null>
	>([])
	const [promptCursor, setPromptCursor] = useState(0)
	const [responseCursor, setResponseCursor] = useState(0)
	const [selectedPromptSlot, setSelectedPromptSlot] = useState<number | null>(
		null,
	)
	const [selectedResponseSlot, setSelectedResponseSlot] = useState<
		number | null
	>(null)
	const [matchedPairs, setMatchedPairs] = useState(0)
	const [wrongMatches, setWrongMatches] = useState(0)
	const [feedback, setFeedback] = useState<null | boolean>(null)
	const [hasFinished, setHasFinished] = useState(false)
	const [phase, setPhase] = useState<Phase>('playing')
	const [awardedPoints, setAwardedPoints] = useState(0)
	const [tribePointAwarded, setTribePointAwarded] = useState(false)
	const [completionHearts, setCompletionHearts] = useState(initialHearts)
	const [heartBonusStatus, setHeartBonusStatus] = useState<
		'idle' | 'pending' | 'awarded' | 'failed'
	>('idle')
	const heartsRef = useRef(initialHearts)

	const [targetSize, setTargetSize] = useState<number>(
		parseInt(
			typeof window !== 'undefined'
				? localStorage.getItem('wm_targetSize') || '140'
				: '140',
			10,
		),
	)

	useEffect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('wm_targetSize', String(targetSize))
		}
	}, [targetSize])

	useEffect(() => {
		heartsRef.current = initialHearts
		setCompletionHearts(initialHearts)
	}, [initialHearts])

	const publicCourseCompletionRef = useRef(false)

	const getCardId = (card: HebrewVocab) => String(card.id)

	const lessonOptions = useMemo(() => {
		const allLessons = data.flatMap((card) => card.lessons)
		const uniqueLessons = Array.from(new Set(allLessons))

		return uniqueLessons.sort((a, b) => {
			const A = parseLessonKey(a)
			const B = parseLessonKey(b)

			if (!isNaN(A.num) && !isNaN(B.num)) {
				if (A.num !== B.num) return A.num - B.num
				return A.text.localeCompare(B.text)
			}

			if (!isNaN(A.num) && isNaN(B.num)) return -1
			if (isNaN(A.num) && !isNaN(B.num)) return 1

			return a.localeCompare(b)
		})
	}, [data])

	const availablePromptOptions = useMemo(
		() => MATCHUP_OPTIONS.filter((option) =>
			data.some((card) => hasValue(card, option.key)),
		),
		[data],
	)

	const allLessonsUpToCurrent = useMemo(() => {
		if (currentLesson === undefined) return []

		return lessonOptions.filter((lesson) => {
			const parsed = parseLessonKey(lesson)
			if (isNaN(parsed.num)) return false
			return parsed.num <= currentLesson
		})
	}, [currentLesson, lessonOptions])

	// const [selectedLessons, setSelectedLessons] = useState<string[]>(
	// 	allLessonsUpToCurrent
	// )
	const [selectedLessons, setSelectedLessons] = useState<string[]>(
		allLessonsUpToCurrent.length > 0 ? allLessonsUpToCurrent : ['1'],
	)

	useEffect(() => {
		if (initialFilters?.selectedLessons?.length) {
			setSelectedLessons(initialFilters.selectedLessons)
		}
		if (initialFilters?.selectedType && initialFilters.selectedType !== 'stack') {
			setSelectedType(initialFilters.selectedType)
		}
	}, [initialFilters])

	useEffect(() => {
		if (
			availablePromptOptions.length > 0 &&
			!availablePromptOptions.some((option) => option.key === selectedPrompt)
		) {
			setSelectedPrompt(
				availablePromptOptions[0]?.key ?? DEFAULT_PROMPT_KEY,
			)
		}
	}, [availablePromptOptions, selectedPrompt])

	useEffect(() => {
		if (
			availablePromptOptions.length > 0 &&
			!availablePromptOptions.some((option) => option.key === selectedResponse)
		) {
			setSelectedResponse(
				availablePromptOptions[0]?.key ?? DEFAULT_RESPONSE_KEY,
			)
		}
	}, [availablePromptOptions, selectedResponse])

	useEffect(() => {
		if (lockedLesson) {
			setSelectedLessons([lockedLesson])
			return
		}

		if (allLessonsUpToCurrent.length > 0) {
			setSelectedLessons(allLessonsUpToCurrent)
		} else {
			setSelectedLessons(['1'])
		}
	}, [allLessonsUpToCurrent, lockedLesson])

	useEffect(() => {
		if (phase !== 'results' || !completionContext || publicCourseCompletionRef.current) {
			return
		}

		publicCourseCompletionRef.current = true
		void markPublicCourseActivityComplete({
			enrollmentId: completionContext.enrollmentId,
			publicCourseLessonId: completionContext.publicCourseLessonId,
			activityKey: 'matchup',
			scorePercent: 100,
		}).catch((error) => {
			console.error('Failed to save public course matchup progress', error)
			publicCourseCompletionRef.current = false
		})
	}, [completionContext, phase])

	// useEffect(() => {
	// 	setSelectedLessons(allLessonsUpToCurrent)
	// }, [allLessonsUpToCurrent])

	const filteredCards = useMemo(() => {
		const promptConfig =
			MATCHUP_OPTIONS.find((option) => option.key === selectedPrompt) ??
			MATCHUP_OPTIONS[0]
		const responseConfig =
			MATCHUP_OPTIONS.find((option) => option.key === selectedResponse) ??
			MATCHUP_OPTIONS[0]

		return data.filter((card) => {
			const inLesson = card.lessons.some((l) => selectedLessons.includes(l))
			const hasPrompt = hasValue(card, promptConfig.key)
			const hasResponse = hasValue(card, responseConfig.key)
			const matchesType = selectedType === 'all' || card.type === selectedType

			return (
				inLesson &&
				hasPrompt &&
				hasResponse &&
				matchesType
			)
		})
	}, [
		data,
		selectedPrompt,
		selectedResponse,
		selectedLessons,
		selectedType,
	])

	const initializeBoard = useCallback(() => {
		if (filteredCards.length === 0) {
			setPromptDeck([])
			setResponseDeck([])
			setVisiblePromptCards([])
			setVisibleResponseCards([])
			setPromptCursor(0)
			setResponseCursor(0)
			setSelectedPromptSlot(null)
			setSelectedResponseSlot(null)
			setMatchedPairs(0)
			setWrongMatches(0)
			setFeedback(null)
			setHasFinished(false)
			setPhase('playing')
			setHeartBonusStatus('idle')
			return
		}

		const prompt = shuffleCards(filteredCards)
		const response = [...prompt]
		const initialSlots = 6

		setPromptDeck(prompt)
		setResponseDeck(response)
		setVisiblePromptCards(prompt.slice(0, initialSlots))
		setVisibleResponseCards(shuffleCards(response.slice(0, initialSlots)))
		setPromptCursor(Math.min(initialSlots, prompt.length))
		setResponseCursor(Math.min(initialSlots, response.length))
		setSelectedPromptSlot(null)
		setSelectedResponseSlot(null)
		setMatchedPairs(0)
		setWrongMatches(0)
		setFeedback(null)
		setHasFinished(false)
		setPhase('playing')
		setHeartBonusStatus('idle')
	}, [filteredCards])

	useEffect(() => {
		initializeBoard()
	}, [initializeBoard])

	const resetBoard = useCallback(() => {
		initializeBoard()
	}, [initializeBoard])

	const awardPoints = useCallback(
		async (points: number) => {
			if (!courseId) {
				console.warn('Skipping award: no active courseId')
				return
			}
			try {
				const response = await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, courseId, points }),
				})
				dispatchUserProgressUpdated({ points })
				const payload = (await response.json()) as {
					tribePointAwarded?: boolean
				}
				setTribePointAwarded(Boolean(payload.tribePointAwarded))
			} catch (error) {
				console.error('Failed to award points', error)
			}
		},
		[userId, courseId],
	)

	useEffect(() => {
		if (matchedPairs > 0 && matchedPairs === filteredCards.length && !hasFinished) {
			setHasFinished(true)
			setPhase('results')
			setAwardedPoints(matchedPairs)
			awardPoints(matchedPairs)
		}
	}, [
		filteredCards.length,
		hasFinished,
		awardPoints,
		matchedPairs,
	])

	const selectedPromptConfig = useMemo(
		() =>
			availablePromptOptions.find((option) => option.key === selectedPrompt) ??
			availablePromptOptions[0] ??
			MATCHUP_OPTIONS[0],
		[availablePromptOptions, selectedPrompt],
	)

	const selectedResponseConfig = useMemo(
		() =>
			availablePromptOptions.find((option) => option.key === selectedResponse) ??
			availablePromptOptions[0] ??
			MATCHUP_OPTIONS[0],
		[availablePromptOptions, selectedResponse],
	)

	const requiredFirstSelectionSide = useMemo(() => {
		if (
			selectedPromptConfig.kind === 'audio' &&
			selectedResponseConfig.kind !== 'audio'
		) {
			return 'prompt' as const
		}

		if (
			selectedResponseConfig.kind === 'audio' &&
			selectedPromptConfig.kind !== 'audio'
		) {
			return 'response' as const
		}

		return null
	}, [selectedPromptConfig.kind, selectedResponseConfig.kind])

	const bumpSize = (delta: number) =>
		setTargetSize((s) => Math.max(80, Math.min(240, s + delta)))

	const totalCards = filteredCards.length
	const matchedCount = matchedPairs
	const sideCardMinWidth = Math.max(160, targetSize + 48)
	const cardBodyMinHeight = Math.max(180, targetSize + 40)

	const playFeedbackSound = useCallback((src: string) => {
		const audio = new Audio(src)
		audio.play().catch(() => {})
	}, [])

	const reduceCourseHeart = useCallback(async () => {
		if (!courseId || userId.startsWith('guest')) return

		const previousHearts = heartsRef.current
		const nextHearts = Math.max(previousHearts - 1, 0)
		heartsRef.current = nextHearts
		dispatchUserProgressUpdated({ hearts: nextHearts })

		try {
			const response = await fetch('/api/reduce-course-heart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ courseId }),
			})

			if (!response.ok) {
				throw new Error(`Failed to reduce course hearts: ${response.status}`)
			}

			const payload = (await response.json()) as { hearts?: number }
			if (typeof payload.hearts === 'number') {
				heartsRef.current = payload.hearts
				dispatchUserProgressUpdated({ hearts: payload.hearts })
			}
		} catch (error) {
			heartsRef.current = previousHearts
			dispatchUserProgressUpdated({ hearts: previousHearts })
			console.error('Failed to reduce course heart', error)
		}
	}, [courseId, userId])

	const awardPerfectRunHeart = useCallback(
		async (nextHearts: number) => {
			if (!courseId || userId.startsWith('guest')) return

			const previousHearts = heartsRef.current
			heartsRef.current = nextHearts
			setCompletionHearts(nextHearts)
			dispatchUserProgressUpdated({ hearts: nextHearts })

			try {
				const result = await awardMatchupCompletion({
					courseId,
					hearts: nextHearts,
				})

				const persistedHearts = result.hearts
				heartsRef.current = persistedHearts
				setCompletionHearts(persistedHearts)
				dispatchUserProgressUpdated({ hearts: persistedHearts })
				setHeartBonusStatus('awarded')
			} catch (error) {
				heartsRef.current = previousHearts
				setCompletionHearts(previousHearts)
				dispatchUserProgressUpdated({ hearts: previousHearts })
				setHeartBonusStatus('failed')
				console.error('Failed to award matchup heart bonus', error)
			}
		},
		[courseId, userId],
	)

	const refillVisibleCard = useCallback(
		(
			side: 'prompt' | 'response',
			slotIndex: number,
			sourceDeck: HebrewVocab[],
			cursor: number,
			setCursor: React.Dispatch<React.SetStateAction<number>>,
			setVisibleCards: React.Dispatch<
				React.SetStateAction<Array<HebrewVocab | null>>
			>,
		) => {
			const nextCard = sourceDeck[cursor] ?? null
			setCursor((current) => Math.min(current + 1, sourceDeck.length))
			setVisibleCards((current) => {
				const next = [...current]
				next[slotIndex] = nextCard
				return shuffleCards(next)
			})
		},
		[],
	)

	const handleCardSelection = useCallback(
		(side: 'prompt' | 'response', slotIndex: number) => {
			if (hasFinished || feedback !== null) return

			if (
				requiredFirstSelectionSide &&
				side !== requiredFirstSelectionSide
			) {
				const requiredSlot =
					requiredFirstSelectionSide === 'prompt'
						? selectedPromptSlot
						: selectedResponseSlot
				if (requiredSlot === null) return
			}

			const currentCard =
				side === 'prompt'
					? visiblePromptCards[slotIndex]
					: visibleResponseCards[slotIndex]
			if (!currentCard) return

			setFeedback(null)

			if (side === 'prompt') {
				setSelectedPromptSlot((current) =>
					current === slotIndex ? null : slotIndex,
				)
			} else {
				setSelectedResponseSlot((current) =>
					current === slotIndex ? null : slotIndex,
				)
			}
		},
		[
			feedback,
			hasFinished,
			requiredFirstSelectionSide,
			selectedPromptSlot,
			selectedResponseSlot,
			visiblePromptCards,
			visibleResponseCards,
		],
	)

	useEffect(() => {
		if (selectedPromptSlot === null || selectedResponseSlot === null) return

		const promptCard = visiblePromptCards[selectedPromptSlot]
		const responseCard = visibleResponseCards[selectedResponseSlot]

		if (!promptCard || !responseCard) return

		if (promptCard.id === responseCard.id) {
			playFeedbackSound('/correct.wav')
			setFeedback(true)
			setMatchedPairs((prev) => prev + 1)

			setTimeout(() => {
				setSelectedPromptSlot(null)
				setSelectedResponseSlot(null)

				refillVisibleCard(
					'prompt',
					selectedPromptSlot,
					promptDeck,
					promptCursor,
					setPromptCursor,
					setVisiblePromptCards,
				)
				refillVisibleCard(
					'response',
					selectedResponseSlot,
					responseDeck,
					responseCursor,
					setResponseCursor,
					setVisibleResponseCards,
				)
				setFeedback(null)
			}, 250)
			return
		}

		playFeedbackSound('/incorrect.wav')
		setWrongMatches((prev) => prev + 1)
		void reduceCourseHeart()
		setFeedback(false)
		setTimeout(() => {
			setSelectedPromptSlot(null)
			setSelectedResponseSlot(null)
			setFeedback(null)
		}, 500)
	}, [
		promptCursor,
		promptDeck,
		refillVisibleCard,
		responseCursor,
		responseDeck,
		selectedPromptSlot,
		selectedResponseSlot,
		visiblePromptCards,
		visibleResponseCards,
		playFeedbackSound,
		reduceCourseHeart,
	])

	useEffect(() => {
		if (phase !== 'results' || hasFinished === false) return
		if (heartBonusStatus !== 'idle') return
		if (wrongMatches > 0) {
			setHeartBonusStatus('failed')
			return
		}

		const nextHearts = Math.min(heartsRef.current + 1, 5)
		setHeartBonusStatus('pending')
		void awardPerfectRunHeart(nextHearts)
	}, [
		awardPerfectRunHeart,
		hasFinished,
		heartBonusStatus,
		phase,
		wrongMatches,
	])

	function renderCardContent(
		card: HebrewVocab,
		option: MatchupOption | undefined,
		mode: 'prompt' | 'response',
		selected = false,
	) {
		if (!option) return null

		const value = getCardValue(card, option.key)
		const isPrompt = mode === 'prompt'
		const textTone = 'text-slate-900'

		if (option.kind === 'image') {
			const imageSrc = Array.isArray(value) ? value[0] : null
			if (!imageSrc) return null

			return (
				<div
					className="relative h-full min-h-[220px] w-full overflow-hidden"
					style={{ minHeight: cardBodyMinHeight }}
				>
					{hasRootMorphology(card) && (
						<div className="absolute bottom-2 left-2 z-10 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm">
							({formatRootMorphology(card)})
						</div>
					)}
					<div className="absolute inset-0">
						<Image
							src={imageSrc}
							alt={option.label}
							fill
							sizes="(max-width: 768px) 100vw, 50vw"
							className={`object-contain object-center ${isPrompt ? 'drop-shadow-sm' : ''}`}
						/>
					</div>
				</div>
			)
		}

		if (option.kind === 'audio') {
			const audioSrc = typeof value === 'string' ? value : ''
			const playAudio = () => {
				if (!audioSrc) return
				const audio = new Audio(toAbsoluteUrl(audioSrc))
				audio.play().catch(() => {})
			}
			const iconTone = selected
				? 'bg-white/20 text-white'
				: 'bg-gray-100 text-gray-700'

			if (isPrompt) {
				return (
					<div
						className="flex h-full items-center justify-center text-gray-800"
						style={{ minHeight: cardBodyMinHeight }}
					>
						<div
							className={`rounded-full p-5 text-5xl transition ${iconTone}`}
						>
							🔊
						</div>
					</div>
				)
			}

			return (
				<div
					onClick={playAudio}
					className={`flex h-full cursor-pointer items-center justify-center text-gray-800 transition ${
						selected ? 'bg-transparent hover:bg-transparent' : 'bg-white hover:bg-gray-50'
					}`}
					style={{ minHeight: cardBodyMinHeight }}
				>
					<div
						className={`rounded-full p-5 text-5xl transition ${iconTone}`}
					>
						🔊
					</div>
				</div>
			)
		}

		const textValue =
			typeof value === 'string' && value.trim().length > 0 ? value : ''
		if (!textValue) return null

		return (
			<div
				className={`flex h-full items-center justify-center text-center ${textTone} ${getOptionTextClass(option.key)}`}
				style={{ minHeight: cardBodyMinHeight }}
				dir={getOptionTextDirection(option.key)}
			>
				<div
					className={`leading-tight ${
						isPrompt ? 'text-3xl font-normal' : 'text-2xl md:text-3xl font-normal'
					}`}
				>
					{textValue}
				</div>
			</div>
		)
	}

	if (phase === 'results') {
		const returnHref =
			typeof returnTo === 'string' && returnTo.startsWith('/')
				? returnTo
				: '/he/learn'
		const returnLabel = returnHref.startsWith('/courses/public/')
			? 'Return to Course'
			: 'Return to Learn'
		const perfectRun = wrongMatches === 0
		const displayHearts = completionHearts
		const rewardMessage = perfectRun ? (
			<>
				You earned {awardedPoints} point{awardedPoints === 1 ? '' : 's'}, got +1
				heart{tribePointAwarded ? ', and earned +1 Tribe Point.' : '.'}
			</>
		) : (
			<>
				You earned {awardedPoints} point{awardedPoints === 1 ? '' : 's'} and
				finished with {displayHearts} heart{displayHearts === 1 ? '' : 's'}.
			</>
		)

		return (
			<ActivityCompletionScreen
				title="Lesson Complete"
				description="You matched every card correctly and earned your points."
				rewardMessage={rewardMessage}
				points={awardedPoints}
				hearts={displayHearts}
				tribePointAwarded={tribePointAwarded}
				showTribeBox={true}
				leftActionLabel="Play Again"
				leftActionOnClick={resetBoard}
				rightActionLabel={returnLabel}
				rightActionOnClick={() => {
					router.push(returnHref)
				}}
			/>
		)
	}

	return (
		<div className="max-w-4xl mx-auto p-4">
			<div className="mb-4 space-y-4">
				<div className="flex flex-wrap items-center justify-center gap-3">
					{!hideFilters ? (
						<button
							onClick={() => setShowFilter((prev) => !prev)}
							className={`flex items-center justify-center gap-4 rounded-2xl px-4 py-2 shadow transition ${
								showFilter ? 'bg-sky-600 text-white' : 'bg-gray-200 text-slate-800'
							}`}
						>
							<Image
								src="/books-svgrepo-com.svg"
								alt="Filter icon"
								width={30}
								height={30}
							/>
							{showFilter ? 'Hide Filters' : 'Show Filters'}
						</button>
					) : null}

					<div className="flex items-center gap-2 rounded-2xl border bg-gray-50 px-3 py-2">
						<span className="text-sm text-gray-600">Card size</span>
						<button
							type="button"
							onClick={() => bumpSize(-10)}
							className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
							aria-label="Decrease card size"
						>
							−
						</button>
						<input
							type="range"
							min={80}
							max={240}
							step={10}
							value={targetSize}
							onChange={(e) => setTargetSize(parseInt(e.target.value, 10))}
							className="w-32 accent-sky-600"
						/>
						<button
							type="button"
							onClick={() => bumpSize(+10)}
							className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
							aria-label="Increase card size"
						>
							+
						</button>
						<span className="w-10 text-right text-xs text-gray-500">
							{targetSize}px
						</span>
					</div>
					<button
						onClick={resetBoard}
						className="rounded-2xl bg-sky-600 px-4 py-2 text-white shadow transition hover:bg-sky-700"
					>
						Reshuffle
					</button>
				</div>
			</div>

			{showFilter && !hideFilters && (
				<div className="mb-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="space-y-3">
						<h2 className="text-center text-lg font-semibold text-slate-900">
							Prompt
						</h2>
						<div className="flex flex-row-reverse flex-wrap justify-center gap-2">
							{availablePromptOptions.map((option) => (
								<button
									key={option.key}
									type="button"
									onClick={() => setSelectedPrompt(option.key)}
									className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
										selectedPrompt === option.key
											? 'border-sky-600 bg-sky-600 text-white'
											: 'border-slate-200 bg-gray-200 text-slate-700 hover:bg-slate-100'
									}`}
								>
									{option.label}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-3">
						<h2 className="text-center text-lg font-semibold text-slate-900">
							Respond With
						</h2>
						<div className="flex flex-row-reverse flex-wrap justify-center gap-2">
							{availablePromptOptions.map((option) => (
								<button
									key={option.key}
									type="button"
									onClick={() => setSelectedResponse(option.key)}
									className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
										selectedResponse === option.key
											? 'border-sky-600 bg-sky-600 text-white'
											: 'border-slate-200 bg-gray-200 text-slate-700 hover:bg-slate-100'
									}`}
								>
									{option.label}
								</button>
							))}
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3">
						<TypeFilter selectedType={selectedType} setSelectedType={setSelectedType} />
						<LessonFilter
							data={data}
							selectedLessons={selectedLessons}
							setSelectedLessons={setSelectedLessons}
							showRanges={true}
						/>
					</div>
				</div>
			)}

			{filteredCards.length === 0 ? (
				<div className="mt-8 text-center italic text-gray-500">
					No cards available with this selection.
					<br />
					Please try adjusting the filters above.
				</div>
			) : (
				<div className="space-y-6">
					{feedback !== null && (
						<div
							className={`text-center text-sm font-semibold ${
								feedback ? 'text-emerald-700' : 'text-rose-600'
							}`}
						>
							{feedback ? 'Match found.' : 'Not a match.'}
						</div>
					)}

					<div className="grid grid-cols-2 gap-3 md:gap-6">
						<div className="space-y-3">
							<h2 className="text-center text-lg font-semibold text-slate-900">
								Responses
							</h2>
							<div
								className="grid gap-3"
								style={{
									gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${sideCardMinWidth}px), 1fr))`,
								}}
							>
								{visibleResponseCards.map((card, index) =>
									card ? (
										<div
											key={`${card.id}-${index}-response`}
											role="button"
											tabIndex={0}
											onClick={() => handleCardSelection('response', index)}
											onKeyDown={(event) => {
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault()
													handleCardSelection('response', index)
												}
											}}
											className={`overflow-hidden rounded-2xl border-2 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
												selectedResponseSlot === index
													? 'border-emerald-700 bg-emerald-700 text-white shadow-md ring-2 ring-emerald-200'
													: 'border-gray-300 bg-white hover:border-gray-400'
											}`}
											style={{ minHeight: cardBodyMinHeight }}
										>
											<div className="flex h-full w-full flex-col">
												{renderCardContent(
													card,
													selectedResponseConfig,
													'response',
													selectedResponseSlot === index,
												)}
											</div>
										</div>
									) : null,
								)}
							</div>
						</div>

						<div className="space-y-3">
							<h2 className="text-center text-lg font-semibold text-slate-900">
								Prompts
							</h2>
							<div
								className="grid gap-3"
								style={{
									gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${sideCardMinWidth}px), 1fr))`,
								}}
							>
								{visiblePromptCards.map((card, index) =>
									card ? (
										<div
											key={`${card.id}-${index}-prompt`}
											role="button"
											tabIndex={0}
											onClick={() => handleCardSelection('prompt', index)}
											onKeyDown={(event) => {
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault()
													handleCardSelection('prompt', index)
												}
											}}
											className={`overflow-hidden rounded-2xl border-2 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
												selectedPromptSlot === index
													? 'border-emerald-700 bg-emerald-700 text-white shadow-md ring-2 ring-emerald-200'
													: 'border-gray-300 bg-white hover:border-gray-400'
											}`}
											style={{ minHeight: cardBodyMinHeight }}
										>
											<div className="flex h-full w-full flex-col">
												{renderCardContent(
													card,
													selectedPromptConfig,
													'prompt',
													selectedPromptSlot === index,
												)}
											</div>
										</div>
									) : null,
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
