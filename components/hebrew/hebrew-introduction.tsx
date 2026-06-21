'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ActivityCompletionScreen } from '@/components/activity-completion-screen'
import LessonFilter from '@/components/filters/filter-lesson'
import { useLessonCards } from '@/hooks/useLessonCards'
import { dispatchUserProgressUpdated } from '@/lib/user-progress-events'
import { resolveVocabMediaUrl } from '@/lib/vocab-media'
import { isIntroductionReadyHebrewVocab } from '@/lib/hebrew-introduction-vocab'
import type { HebrewVocab } from '@/lib/vocab'
import { awardIntroductionCompletion } from '@/actions/introduction-progress'
import { markPublicCourseActivityComplete } from '@/lib/public-course-progress'
import type {
	PublicCourseActivityFilters,
	PublicCourseActivityKey,
} from '@/lib/public-course-activities'

type HebrewIntroductionProps = {
	activeCourseId: number
	data: HebrewVocab[]
	currentLesson: string
	initialHearts: number
	returnTo?: string
	filtersLocked?: boolean
	initialFilters?: PublicCourseActivityFilters
	completionContext?: {
		enrollmentId: number
		publicCourseLessonId: number
		activityKey?: PublicCourseActivityKey
	}
}

type SessionPhase = 'idle' | 'teaching' | 'quiz' | 'complete'

const SUCCESS_SOUND = '/correct.wav'
const INCORRECT_SOUND = '/incorrect.wav'
const MIN_SESSION_CARDS = 2
const REPEAT_COUNT = 3
const REPEAT_PAUSE_MS = 1400
const POST_WORD_PAUSE_MS = 450
const INITIAL_TEACHING_BATCH_SIZE = 2
const QUIZ_PROMPT_COUNT = 3
const INSUFFICIENT_MEDIA_MESSAGE =
	'At least 2 Hebrew vocab items from one lesson with an image and audio are needed for this vocabulary activity.'
type VocabTypeFilter = 'word' | 'phrase'

export default function HebrewIntroduction({
	activeCourseId,
	data,
	currentLesson,
	initialHearts,
	returnTo,
	filtersLocked = false,
	initialFilters,
	completionContext,
}: HebrewIntroductionProps) {
	const { selectedLessons, setSelectedLessons } = useLessonCards(
		data,
		currentLesson,
		{ selectionMode: 'single' },
	)
	const [phase, setPhase] = useState<SessionPhase>('idle')
	const [sessionVersion, setSessionVersion] = useState(0)
	const [selectedType, setSelectedType] = useState<VocabTypeFilter>(() =>
		initialFilters?.selectedType === 'phrase' ? 'phrase' : 'word',
	)
	const [sessionCards, setSessionCards] = useState<HebrewVocab[]>([])
	const [sessionCardOrder, setSessionCardOrder] = useState<number[]>([])
	const [skippedCardIndices, setSkippedCardIndices] = useState<number[]>([])
	const [introducedCount, setIntroducedCount] = useState(0)
	const [teachingIndices, setTeachingIndices] = useState<number[]>([])
	const [teachingCardIndex, setTeachingCardIndex] = useState<number | null>(
		null,
	)
	const [hearts, setHearts] = useState(initialHearts)
	const [pendingQuizIndices, setPendingQuizIndices] = useState<number[]>([])
	const [currentQuizPoolIndices, setCurrentQuizPoolIndices] = useState<
		number[]
	>([])
	const [currentPromptIndex, setCurrentPromptIndex] = useState<number | null>(
		null,
	)
	const [currentOptions, setCurrentOptions] = useState<number[]>([])
	const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([])
	const [pulseTick, setPulseTick] = useState(0)
	const [activeRepeatNumber, setActiveRepeatNumber] = useState<number | null>(
		null,
	)
	const [completionRewards, setCompletionRewards] = useState<{
		tribePointAwarded: boolean
	} | null>(null)
	const [completionAwarded, setCompletionAwarded] = useState(false)
	const [statusText, setStatusText] = useState(
		filtersLocked
			? 'This class opens directly into the assigned lesson.'
			: 'Choose your filters and a type, then start the vocabulary.',
	)

	const runIdRef = useRef(0)
	const phaseRef = useRef<SessionPhase>('idle')
	const removedClassroomDefaultRef = useRef(false)
	const publicCourseCompletionRef = useRef(false)
	const completionSoundPlayedRef = useRef(false)
	const completionLockedRef = useRef(false)
	const initialHeartsRef = useRef(initialHearts)
	const activeAudioRef = useRef<HTMLAudioElement | null>(null)
	const skippedCardSetRef = useRef(new Set<number>())
	const router = useRouter()

	useEffect(() => {
		if (!initialFilters?.selectedLessons?.length) return
		setSelectedLessons(initialFilters.selectedLessons)
	}, [initialFilters?.selectedLessons, setSelectedLessons])

	useEffect(() => {
		phaseRef.current = phase
	}, [phase])

	const stopActiveAudio = useCallback(() => {
		const audio = activeAudioRef.current
		if (!audio) return

		audio.pause()
		audio.currentTime = 0
		activeAudioRef.current = null
	}, [])

	const playAudio = useCallback(
		(src: string) =>
			new Promise<boolean>((resolve) => {
				stopActiveAudio()

				if (!src) {
					resolve(false)
					return
				}

				const audio = new Audio(src)
				activeAudioRef.current = audio
				const finish = (ok: boolean) => {
					if (activeAudioRef.current === audio) {
						activeAudioRef.current = null
					}
					resolve(ok)
				}

				audio.addEventListener('ended', () => finish(true), { once: true })
				audio.addEventListener('error', () => finish(false), { once: true })
				void audio.play().catch(() => finish(false))
			}),
		[stopActiveAudio],
	)

	useEffect(() => {
		return () => {
			runIdRef.current += 1
			stopActiveAudio()
		}
	}, [stopActiveAudio])

	useEffect(() => {
		if (
			initialFilters?.selectedType !== 'word' &&
			initialFilters?.selectedType !== 'phrase'
		) {
			return
		}

		setSelectedType(initialFilters.selectedType)
	}, [initialFilters?.selectedType])

	useEffect(() => {
		if (phase !== 'idle') return
		if (removedClassroomDefaultRef.current) return
		if (!selectedLessons.includes('Classroom1')) return

		removedClassroomDefaultRef.current = true
		setSelectedLessons((prev) =>
			prev.filter((lesson) => lesson !== 'Classroom1'),
		)
	}, [phase, selectedLessons, setSelectedLessons])

	useEffect(() => {
		removedClassroomDefaultRef.current = false
	}, [currentLesson, data])

	useEffect(() => {
		initialHeartsRef.current = initialHearts
	}, [initialHearts])

	const lessonFilteredCards = useMemo(() => {
		return data.filter((card) => {
			const matchesSelectedLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((lesson) => selectedLessons.includes(lesson))

			return matchesSelectedLesson && isIntroductionReadyHebrewVocab(card)
		})
	}, [data, selectedLessons])

	const wordCards = useMemo(
		() => lessonFilteredCards.filter((card) => card.type === 'word'),
		[lessonFilteredCards],
	)
	const phraseCards = useMemo(
		() => lessonFilteredCards.filter((card) => card.type === 'phrase'),
		[lessonFilteredCards],
	)

	const activeSessionCardOrder = useMemo(
		() => sessionCardOrder.filter((index) => !skippedCardIndices.includes(index)),
		[sessionCardOrder, skippedCardIndices],
	)

	const filteredCards = useMemo(() => {
		return selectedType === 'word' ? wordCards : phraseCards
	}, [phraseCards, selectedType, wordCards])

	useEffect(() => {
		if (selectedType === 'word' && wordCards.length > 0) return
		if (selectedType === 'phrase' && phraseCards.length > 0) return

		if (wordCards.length > 0) {
			setSelectedType('word')
			return
		}

		if (phraseCards.length > 0) {
			setSelectedType('phrase')
		}
	}, [phraseCards.length, selectedType, wordCards.length])

	const beginSession = useCallback(
		(cardOrder: number[]) => {
			if (cardOrder.length < MIN_SESSION_CARDS) {
				setStatusText(INSUFFICIENT_MEDIA_MESSAGE)
				return
			}

			setCompletionAwarded(false)
			setIntroducedCount(0)
			setPendingQuizIndices([])
			setCurrentQuizPoolIndices([])
			setCurrentPromptIndex(null)
			setCurrentOptions([])
			setEliminatedOptions([])
			setActiveRepeatNumber(null)
			setTeachingIndices(
				cardOrder.slice(0, Math.min(INITIAL_TEACHING_BATCH_SIZE, cardOrder.length)),
			)
			setTeachingCardIndex(cardOrder[0] ?? null)
			setPhase('teaching')
			setStatusText(
				`Listen carefully to the first ${Math.min(
					INITIAL_TEACHING_BATCH_SIZE,
					cardOrder.length,
				)} ${selectedType === 'word' ? 'words' : 'phrases'} in this set.`,
			)
		},
		[selectedType],
	)

	useEffect(() => {
		if (completionLockedRef.current && phaseRef.current === 'complete') {
			return
		}

		const nextSessionCards = shuffle(filteredCards)
		const nextSessionCardOrder = Array.from(
			{ length: nextSessionCards.length },
			(_, index) => index,
		)

		runIdRef.current += 1
		setSessionCards(nextSessionCards)
		setSessionCardOrder(nextSessionCardOrder)
		setSkippedCardIndices([])
		skippedCardSetRef.current = new Set()
		setPhase('idle')
		setHearts(initialHeartsRef.current)
		setIntroducedCount(0)
		setTeachingIndices([])
		setTeachingCardIndex(null)
		setPendingQuizIndices([])
		setCurrentQuizPoolIndices([])
		setCurrentPromptIndex(null)
		setCurrentOptions([])
		setEliminatedOptions([])
		setPulseTick(0)
		setActiveRepeatNumber(null)
		setCompletionRewards(null)
		setCompletionAwarded(false)
		completionSoundPlayedRef.current = false
		setStatusText(
			filtersLocked
				? 'This class opens directly into the assigned lesson.'
				: 'Choose your filters and a type, then start the vocabulary.',
		)

		if (
			filtersLocked &&
			!completionLockedRef.current &&
			nextSessionCardOrder.length >= MIN_SESSION_CARDS
		) {
			beginSession(nextSessionCardOrder)
		}
	}, [beginSession, filteredCards, filtersLocked, sessionVersion])

	const skipCard = useCallback((cardIndex: number) => {
		setSkippedCardIndices((prev) => {
			if (prev.includes(cardIndex)) return prev
			skippedCardSetRef.current.add(cardIndex)
			return [...prev, cardIndex]
		})
	}, [])

	const startQuizRound = useCallback(
		(quizPoolIndices: number[]) => {
			if (quizPoolIndices.length < MIN_SESSION_CARDS) {
				setPhase('idle')
				setStatusText(INSUFFICIENT_MEDIA_MESSAGE)
				return
			}

			const nextPending = buildQuizRoundQueue(quizPoolIndices, QUIZ_PROMPT_COUNT)
			setCurrentQuizPoolIndices(quizPoolIndices)
			setPendingQuizIndices(nextPending)
			setPhase('quiz')
			setCurrentPromptIndex(nextPending[0] ?? null)
			setCurrentOptions(
				buildQuizOptions(nextPending[0] ?? null, quizPoolIndices),
			)
			setEliminatedOptions([])
			setStatusText('Tap the image that matches the audio.')
		},
		[],
	)

	const advanceAfterQuizPrompt = useCallback(() => {
		setPendingQuizIndices((prevPending) => {
			const latestQuizPoolIndices = currentQuizPoolIndices.filter(
				(index) => !skippedCardSetRef.current.has(index),
			)
			const nextPending = prevPending
				.slice(1)
				.filter((index) => !skippedCardSetRef.current.has(index))

			if (nextPending.length > 0) {
				const nextPromptIndex = nextPending[0]
				setCurrentPromptIndex(nextPromptIndex)
				setCurrentOptions(
					buildQuizOptions(nextPromptIndex ?? null, latestQuizPoolIndices),
				)
				setEliminatedOptions([])
				setStatusText('Tap the image that matches the audio.')
				return nextPending
			}

			setCurrentPromptIndex(null)
			setCurrentOptions([])
			setEliminatedOptions([])

			const latestActiveSessionCardOrder = sessionCardOrder.filter(
				(index) => !skippedCardSetRef.current.has(index),
			)

			const nextTeachIndex = introducedCount
			if (nextTeachIndex < latestActiveSessionCardOrder.length) {
				const nextCardIndex = latestActiveSessionCardOrder[nextTeachIndex]
				if (nextCardIndex != null) {
					setTeachingIndices([nextCardIndex])
					setPhase('teaching')
					setStatusText(`Nice work. Here comes vocab item ${nextTeachIndex + 1}.`)
					return []
				}
			}

			setPhase('complete')
			setStatusText('You finished this vocabulary set.')
			return []
		})
	}, [
		currentQuizPoolIndices,
		introducedCount,
		sessionCardOrder,
	])

	useEffect(() => {
		if (phase !== 'teaching' || teachingIndices.length === 0) return

		const runId = ++runIdRef.current

		const runTeachingSequence = async () => {
			for (const index of teachingIndices) {
				if (runIdRef.current !== runId) return
				if (skippedCardSetRef.current.has(index)) continue
				const card = sessionCards[index]
				if (!card) {
					skipCard(index)
					continue
				}
				setTeachingCardIndex(index)
				setStatusText(`Listen and look: ${card.eng}`)

				for (let repeat = 0; repeat < REPEAT_COUNT; repeat += 1) {
					if (runIdRef.current !== runId) return
					if (skippedCardSetRef.current.has(index)) break
					setActiveRepeatNumber(REPEAT_COUNT - repeat)
					setPulseTick((prev) => prev + 1)
						const ok = await playAudio(card.hebAudio)
						if (!ok) {
							console.warn('Vocabulary teaching audio did not play.', {
								id: card.id,
								eng: card.eng,
								src: card.hebAudio,
							})
						}
					if (repeat < REPEAT_COUNT - 1) {
						await wait(REPEAT_PAUSE_MS)
					}
				}

				setActiveRepeatNumber(null)
				await wait(POST_WORD_PAUSE_MS)
			}

			if (runIdRef.current !== runId) return

			const latestActiveSessionCardOrder = sessionCardOrder.filter(
				(index) => !skippedCardSetRef.current.has(index),
			)
			const newlyIntroducedCount = teachingIndices.filter(
				(index) => !skippedCardSetRef.current.has(index),
			).length
			const nextIntroducedCount = Math.min(
				latestActiveSessionCardOrder.length,
				introducedCount + newlyIntroducedCount,
			)

			setIntroducedCount(nextIntroducedCount)
			setTeachingCardIndex(null)
			startQuizRound(latestActiveSessionCardOrder.slice(0, nextIntroducedCount))
		}

		void runTeachingSequence()
	}, [
		sessionCards,
		introducedCount,
		phase,
		skipCard,
		playAudio,
		startQuizRound,
		sessionCardOrder,
		teachingIndices,
	])

	useEffect(() => {
		if (phase !== 'quiz' || currentPromptIndex == null) return
		void (async () => {
			const currentCard = sessionCards[currentPromptIndex]
			if (!currentCard) {
				skipCard(currentPromptIndex)
				advanceAfterQuizPrompt()
				return
			}

			const ok = await playAudio(currentCard.hebAudio)
			if (!ok) {
				console.warn('Vocabulary quiz audio did not play.', {
					id: currentCard.id,
					eng: currentCard.eng,
					src: currentCard.hebAudio,
				})
				setStatusText('Tap the audio button to hear the prompt again.')
			}
		})()
	}, [
		advanceAfterQuizPrompt,
		currentPromptIndex,
		sessionCards,
		phase,
		skipCard,
		playAudio,
	])

	useEffect(() => {
		if (
			phase !== 'complete' ||
			completionAwarded ||
			activeSessionCardOrder.length === 0
		)
			return

		let cancelled = false

		const awardCompletion = async () => {
			try {
				const result = await awardIntroductionCompletion({
					courseId: activeCourseId,
					points: activeSessionCardOrder.length,
				})

				if (cancelled) return

				setHearts(result.hearts)
				dispatchUserProgressUpdated({
					hearts: result.hearts,
					points: activeSessionCardOrder.length,
				})
				setCompletionRewards({
					tribePointAwarded: result.tribePointAwarded,
				})
				setCompletionAwarded(true)
				completionLockedRef.current = true
			} catch (error) {
				console.error('Failed to award introduction completion rewards', error)
				if (!cancelled) {
					setCompletionAwarded(true)
					completionLockedRef.current = true
				}
			}
		}

		void awardCompletion()

		return () => {
			cancelled = true
		}
	}, [activeCourseId, activeSessionCardOrder.length, completionAwarded, phase, playAudio])

	useEffect(() => {
		if (phase !== 'complete' || !completionAwarded) return
		if (completionSoundPlayedRef.current) return

		completionSoundPlayedRef.current = true
		void playAudio('/shofar.mp3')
	}, [completionAwarded, phase, playAudio])

	useEffect(() => {
		if (
			phase !== 'complete' ||
			!completionContext ||
			publicCourseCompletionRef.current
		) {
			return
		}

		publicCourseCompletionRef.current = true
		void markPublicCourseActivityComplete({
			enrollmentId: completionContext.enrollmentId,
			publicCourseLessonId: completionContext.publicCourseLessonId,
			activityKey: completionContext.activityKey ?? 'introduction',
			scorePercent: 100,
		}).catch((error) => {
			console.error('Failed to save public course introduction progress', error)
			publicCourseCompletionRef.current = false
		})
	}, [completionContext, phase])

	const startSession = useCallback(() => {
		completionLockedRef.current = false
		beginSession(activeSessionCardOrder)
	}, [activeSessionCardOrder, beginSession])

	const handleGuess = async (optionIndex: number) => {
		if (currentPromptIndex == null) return

		if (optionIndex === currentPromptIndex) {
			await playAudio(SUCCESS_SOUND)
			advanceAfterQuizPrompt()
			return
		}

		await playAudio(INCORRECT_SOUND)
		setEliminatedOptions((prev) =>
			prev.includes(optionIndex) ? prev : [...prev, optionIndex],
		)
		setStatusText('Not quite. One wrong image has been removed.')
		await playAudio(sessionCards[currentPromptIndex]?.hebAudio ?? '')
	}

	const currentTeachingCard =
		teachingCardIndex != null ? sessionCards[teachingCardIndex] : null
	const currentPromptCard =
		currentPromptIndex != null ? sessionCards[currentPromptIndex] : null
	const canStart = activeSessionCardOrder.length >= MIN_SESSION_CARDS
	const lessonSelectionLocked = filtersLocked || phase !== 'idle'
	const currentTeachingOrderPosition =
		teachingCardIndex != null
			? teachingIndices.indexOf(teachingCardIndex) + 1
			: 0
	const lessonCompletedCount =
		phase === 'teaching'
			? introducedCount + currentTeachingOrderPosition
			: introducedCount
	const lessonProgressPercent =
		activeSessionCardOrder.length > 0
			? (lessonCompletedCount / activeSessionCardOrder.length) * 100
			: 0
	const selectedTypeEstimateMinutes = estimateMinutes(activeSessionCardOrder.length)
	const tribeAwarded = completionRewards?.tribePointAwarded ?? false
	const selectedTypePlural = selectedType === 'word' ? 'words' : 'phrases'

	return (
		<div className="mx-auto w-full max-w-5xl p-4 text-center">
			{!filtersLocked && (
				<div className="mb-6 flex justify-center">
					<button
						onClick={() => {
							completionLockedRef.current = false
							setSessionVersion((prev) => prev + 1)
						}}
						className="rounded bg-gray-200 px-4 py-2 shadow"
					>
						Change Lesson
					</button>
				</div>
			)}

			{!lessonSelectionLocked && (
				<>
					<div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
						<div className="mb-4 flex items-center justify-center gap-3">
							<Image
								src="/books-svgrepo-com.svg"
								alt="Filter icon"
								width={26}
								height={26}
							/>
							<p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
								Filters
							</p>
						</div>
						<div className="flex flex-col items-center">
							<LessonFilter
								data={data}
								selectedLessons={selectedLessons}
								setSelectedLessons={setSelectedLessons}
								showRanges={false}
								selectionMode="single"
							/>
						</div>
					</div>
				</>
			)}

			{!canStart ? (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
					{lessonFilteredCards.length >= 2
						? `This ${selectedTypePlural} selection needs at least 2 Hebrew vocab items with an image and audio. Choose the other pill to continue.`
						: INSUFFICIENT_MEDIA_MESSAGE}
				</div>
			) : phase === 'idle' ? (
				<div className="rounded-2xl border bg-white p-8 shadow-sm">
					<p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
						Select a type
					</p>
					<p className="mt-3 text-3xl font-bold text-slate-900">
						{lessonFilteredCards.length} Total Items
					</p>

					<div className="mt-4 flex flex-wrap justify-center gap-2">
						<button
							onClick={() => setSelectedType('word')}
							disabled={wordCards.length === 0}
							className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
								selectedType === 'word'
									? 'border-sky-600 bg-sky-600 text-white'
									: wordCards.length === 0
										? 'cursor-not-allowed border-gray-200 bg-gray-100 text-slate-400'
										: 'bg-gray-100 text-slate-700 hover:bg-gray-200'
							}`}
						>
							Words
							<span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
								{wordCards.length}
							</span>
						</button>
						<button
							onClick={() => setSelectedType('phrase')}
							disabled={phraseCards.length === 0}
							className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
								selectedType === 'phrase'
									? 'border-sky-600 bg-sky-600 text-white'
									: phraseCards.length === 0
										? 'cursor-not-allowed border-gray-200 bg-gray-100 text-slate-400'
										: 'bg-gray-100 text-slate-700 hover:bg-gray-200'
							}`}
						>
							Phrases
							<span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
								{phraseCards.length}
							</span>
						</button>
					</div>
					<p className="mt-3 text-base font-semibold text-slate-800">
						Starting with {filteredCards.length} {selectedTypePlural}. Estimated
						time:{' '}
						{selectedTypeEstimateMinutes} minute
						{selectedTypeEstimateMinutes === 1 ? '' : 's'}.
					</p>
					<button
						onClick={startSession}
						className="mt-6 rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white shadow hover:bg-sky-500"
					>
						Start Vocabulary
					</button>
				</div>
			) : phase === 'teaching' && currentTeachingCard ? (
				<div className="rounded-2xl border bg-white p-6 shadow-sm">
					<div className="mb-4 flex flex-col items-center justify-center gap-2">
						<div className="flex w-full max-w-xl items-center justify-between gap-4">
							<div className="text-sm font-medium text-slate-600">
								Lesson Progress
							</div>
							<div className="text-sm font-semibold text-slate-700">
								{Math.min(lessonCompletedCount, filteredCards.length)}/
								{filteredCards.length}
							</div>
						</div>
						<div className="w-full max-w-xl">
							<div className="h-3 overflow-hidden rounded-full bg-slate-200">
								<div
									className="h-full bg-sky-600 transition-all duration-300"
									style={{ width: `${lessonProgressPercent}%` }}
								></div>
							</div>
						</div>
					</div>
					<p className="mb-4 text-sm font-semibold uppercase tracking-wide text-sky-700">
						New Vocab Item
					</p>
					<div className="animate-[pulse_700ms_ease-in-out] rounded-3xl">
						<div className="mb-4 flex justify-center">
							<div className="flex items-center gap-3 rounded-full bg-slate-800/90 px-4 py-2 shadow-sm">
								{[1, 2, 3].map((repeatNumber) => {
									const isActive = activeRepeatNumber === repeatNumber
									return (
										<div
											key={repeatNumber}
											className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition ${
												isActive
													? 'scale-110 bg-rose-700 text-white shadow-md'
													: 'bg-white/20 text-white'
											}`}
										>
											{repeatNumber}
										</div>
									)
								})}
							</div>
						</div>
						<div className="relative mx-auto aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-3xl bg-slate-100 shadow-inner">
							<Image
								src={resolveVocabMediaUrl(currentTeachingCard.images[0])}
								alt={currentTeachingCard.eng}
								fill
								className="object-contain"
								sizes="(max-width: 768px) 100vw, 960px"
							/>
						</div>
					</div>
				</div>
			) : phase === 'quiz' && currentPromptCard ? (
				<div className="rounded-2xl border bg-white p-6 shadow-sm">
					<div className="mb-4 flex flex-col items-center justify-center gap-4">
						<div className="w-full max-w-xl">
							<div className="mb-2 flex items-center justify-between gap-4">
								<div className="text-sm font-medium text-slate-600">
									Lesson Progress
								</div>
								<div className="text-sm font-semibold text-slate-700">
									{Math.min(lessonCompletedCount, filteredCards.length)}/
									{filteredCards.length}
								</div>
							</div>
							<div className="h-3 overflow-hidden rounded-full bg-slate-200">
								<div
									className="h-full bg-sky-600 transition-all duration-300"
									style={{ width: `${lessonProgressPercent}%` }}
								></div>
							</div>
						</div>
						<button
							onClick={() => void playAudio(currentPromptCard.hebAudio)}
							className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-sky-200 bg-sky-100 text-sky-700 shadow transition hover:scale-105 hover:bg-sky-200"
							aria-label="Replay audio"
						>
							<Volume2 className="h-10 w-10" />
						</button>
					</div>
					<p className="mb-6 text-lg text-slate-700">{statusText}</p>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{currentOptions.map((optionIndex) => {
							const optionCard = sessionCards[optionIndex]
							const isEliminated = eliminatedOptions.includes(optionIndex)

							return (
								<button
									key={`${optionCard.id ?? optionIndex}-${optionIndex}`}
									onClick={() => void handleGuess(optionIndex)}
									disabled={isEliminated}
									className={`overflow-hidden rounded-3xl border-2 text-left shadow-sm transition ${
										isEliminated
											? 'cursor-not-allowed border-rose-200 bg-rose-200 opacity-35'
											: 'border-rose-800 bg-rose-700 hover:-translate-y-1 hover:bg-rose-600 hover:shadow-lg'
									}`}
								>
									<div className="p-3">
										<div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-rose-50">
												<Image
													src={resolveVocabMediaUrl(optionCard.images[0])}
													alt={optionCard.eng}
													fill
													className="object-contain"
													sizes="(max-width: 768px) 100vw, 33vw"
												/>
										</div>
									</div>
								</button>
							)
						})}
					</div>
				</div>
			) : (
				<>
					<ActivityCompletionScreen
						title="Lesson Complete"
						description="You finished this vocabulary lesson and unlocked the full reward bundle."
						playCelebrationSound={false}
						rewardMessage={
							tribeAwarded
								? `You earned ${activeSessionCardOrder.length} point${activeSessionCardOrder.length === 1 ? '' : 's'}, replenished your hearts to 5, and earned +1 Tribe Point.`
								: `You earned ${activeSessionCardOrder.length} point${activeSessionCardOrder.length === 1 ? '' : 's'} and replenished your hearts to 5.`
						}
						points={activeSessionCardOrder.length}
						hearts={hearts}
						tribePointAwarded={tribeAwarded}
						leftActionLabel="Return to Vocabulary"
						leftActionOnClick={startSession}
						rightActionLabel={
							typeof returnTo === 'string' && returnTo.startsWith('/courses/public/')
								? 'Return to Course'
								: 'Return to Learn'
						}
						rightActionOnClick={() => {
							router.push(returnTo?.startsWith('/') ? returnTo : '/he/learn')
						}}
					/>
				</>
			)}
		</div>
	)
}

function shuffle<T>(items: T[]) {
	const next = [...items]
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1))
		;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
	}
	return next
}

function wait(ms: number) {
	return new Promise<void>((resolve) => {
		window.setTimeout(resolve, ms)
	})
}

function estimateMinutes(wordCount: number) {
	if (wordCount <= 0) return 0
	return Math.ceil((wordCount * 3) / 10)
}

function buildQuizRoundQueue(indices: number[], promptCount: number) {
	if (indices.length === 0) return []

	const uniquePrompts = shuffle([...new Set(indices)]).slice(0, promptCount)
	return uniquePrompts
}

function buildQuizOptions(
	correctIndex: number | null,
	poolIndices: number[],
) {
	if (correctIndex == null) return []

	const distractors = shuffle(
		poolIndices.filter((index) => index !== correctIndex),
	).slice(0, Math.min(2, Math.max(0, poolIndices.length - 1)))

	return shuffle([correctIndex, ...distractors])
}
