'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { ResultCard } from '@/app/lesson/result-card'
import { ActivityFinalScreen } from '@/components/activity-final-screen'
import { HebrewVocab } from '@/lib/vocab'
import { formatRootMorphology, hasRootMorphology } from '@/lib/vocab-morphology'
import { resolveVocabMediaUrl } from '@/lib/vocab-media'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'
import TypeFilter from '../filters/filter-type'
import LessonFilter from '../filters/filter-lesson'
import { markPublicCourseActivityComplete } from '@/lib/public-course-progress'
import type { PublicCourseActivityFilters } from '@/lib/public-course-activities'

interface WordMatchGameProps {
	data: HebrewVocab[]
	currentLesson?: number
	userId: string
	courseId: number | null
	lockedLesson?: string
	hideFilters?: boolean
	initialFilters?: PublicCourseActivityFilters
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
	lockedLesson,
	hideFilters = false,
	initialFilters,
	completionContext,
}: WordMatchGameProps) {
	const [showFilter, setShowFilter] = useState(false)
	const [selectedPrompt, setSelectedPrompt] =
		useState<MatchupKey>(DEFAULT_PROMPT_KEY)
	const [selectedResponse, setSelectedResponse] = useState<MatchupKey>(
		DEFAULT_RESPONSE_KEY,
	)
	const [selectedType, setSelectedType] = useState<'all' | 'word' | 'phrase'>(
		'all',
	)
	const [showConfetti, setShowConfetti] = useState(false)
	const [finishAudio] = useAudio({
		src: '/shofar.mp3',
		autoPlay: true,
	})
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
	const [feedback, setFeedback] = useState<null | boolean>(null)
	const [hasFinished, setHasFinished] = useState(false)
	const [phase, setPhase] = useState<Phase>('playing')
	const [awardedPoints, setAwardedPoints] = useState(0)

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

	const { width, height } = useWindowSize()
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
			setFeedback(null)
			setHasFinished(false)
			setShowConfetti(false)
			setPhase('playing')
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
		setFeedback(null)
		setHasFinished(false)
		setShowConfetti(false)
		setPhase('playing')
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
				await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, courseId, points }),
				})
			} catch (error) {
				console.error('Failed to award points', error)
			}
		},
		[userId, courseId],
	)

	useEffect(() => {
		if (matchedPairs > 0 && matchedPairs === filteredCards.length && !hasFinished) {
			setShowConfetti(true)
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

	const bumpSize = (delta: number) =>
		setTargetSize((s) => Math.max(80, Math.min(240, s + delta)))

	const totalCards = filteredCards.length
	const matchedCount = matchedPairs
	const sideCardMinWidth = Math.max(220, targetSize + 64)
	const cardBodyMinHeight = Math.max(180, targetSize + 40)

	const playFeedbackSound = useCallback((src: string) => {
		const audio = new Audio(src)
		audio.play().catch(() => {})
	}, [])

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
		[feedback, hasFinished, visiblePromptCards, visibleResponseCards],
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
	])

	function renderCardContent(
		card: HebrewVocab,
		option: MatchupOption | undefined,
		mode: 'prompt' | 'response',
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
			const iconTone = isPrompt
				? 'bg-gray-100 text-gray-700'
				: 'bg-gray-100 text-gray-700'

			if (isPrompt) {
				return (
					<div
						className="flex h-full items-center justify-center text-gray-800"
						style={{ minHeight: cardBodyMinHeight }}
					>
						<div className={`rounded-full p-5 text-5xl ${iconTone}`}>🔊</div>
					</div>
				)
			}

			return (
				<button
					type="button"
					onClick={playAudio}
					className="flex h-full items-center justify-center bg-white text-gray-800 transition hover:bg-gray-50"
					style={{ minHeight: cardBodyMinHeight }}
					aria-label={`Play ${option.label}`}
				>
					<div className={`rounded-full p-5 text-5xl ${iconTone}`}>🔊</div>
				</button>
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
		return (
			<ActivityFinalScreen
				title="Lesson Complete"
				description="You matched every card correctly and earned your point."
				stats={[
					{
						label: 'Matched',
						value: matchedCount,
						valueClassName: 'text-emerald-600',
					},
					{
						label: 'Cards',
						value: totalCards,
					},
					{
						label: 'Points',
						value: awardedPoints,
						valueClassName: 'text-sky-700',
					},
				]}
				rewards={
					<div className="mx-auto flex w-full max-w-md gap-4">
						<ResultCard variant="points" value={awardedPoints} tribePointAdded={false} />
					</div>
				}
				actions={
					<div className="flex flex-col justify-center gap-3 sm:flex-row">
						<button
							type="button"
							onClick={resetBoard}
							className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-5 py-3 font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
						>
							<RefreshCw className="h-4 w-4" />
							Play Again
						</button>
						<button
							type="button"
							onClick={() => setShowFilter(true)}
							className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
						>
							Change Filters
						</button>
					</div>
				}
				celebration={
					<>
						{finishAudio}
						{showConfetti ? (
							<ReactConfetti
								width={width}
								height={height}
								recycle={false}
								numberOfPieces={500}
								tweenDuration={10000}
							/>
						) : null}
					</>
				}
			/>
		)
	}

	return (
		<div className="max-w-4xl mx-auto p-4">
			{showConfetti && (
				<ReactConfetti
					width={width}
					height={height}
					recycle={false}
					numberOfPieces={500}
					tweenDuration={10000}
				/>
			)}

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

					<div className="grid gap-6 md:grid-cols-2">
						<div className="space-y-3">
							<h2 className="text-center text-lg font-semibold text-slate-900">
								Responses
							</h2>
							<div
								className="grid gap-3"
								style={{
									gridTemplateColumns: `repeat(auto-fit, minmax(${sideCardMinWidth}px, 1fr))`,
								}}
							>
								{visibleResponseCards.map((card, index) =>
									card ? (
										<button
											key={`${card.id}-${index}-response`}
											type="button"
											onClick={() => handleCardSelection('response', index)}
											className={`overflow-hidden rounded-2xl border-2 text-left transition ${
												selectedResponseSlot === index
													? 'border-emerald-700 bg-emerald-700 text-white shadow-md ring-2 ring-emerald-200'
													: 'border-gray-300 bg-white hover:border-gray-400'
											}`}
											style={{ minHeight: cardBodyMinHeight }}
										>
											<div className="flex h-full w-full flex-col">
												{renderCardContent(card, selectedResponseConfig, 'response')}
											</div>
										</button>
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
									gridTemplateColumns: `repeat(auto-fit, minmax(${sideCardMinWidth}px, 1fr))`,
								}}
							>
								{visiblePromptCards.map((card, index) =>
									card ? (
										<button
											key={`${card.id}-${index}-prompt`}
											type="button"
											onClick={() => handleCardSelection('prompt', index)}
											className={`overflow-hidden rounded-2xl border-2 text-left transition ${
												selectedPromptSlot === index
													? 'border-emerald-700 bg-emerald-700 text-white shadow-md ring-2 ring-emerald-200'
													: 'border-gray-300 bg-white hover:border-gray-400'
											}`}
											style={{ minHeight: cardBodyMinHeight }}
										>
											<div className="flex h-full w-full flex-col">
												{renderCardContent(card, selectedPromptConfig, 'prompt')}
											</div>
										</button>
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
