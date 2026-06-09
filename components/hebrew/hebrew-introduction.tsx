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
import type { HebrewVocab } from '@/lib/vocab'
import { awardIntroductionCompletion } from '@/actions/introduction-progress'
import { markPublicCourseActivityComplete } from '@/lib/public-course-progress'
import type { PublicCourseActivityFilters } from '@/lib/public-course-activities'

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
	}
}

type SessionPhase = 'idle' | 'teaching' | 'quiz' | 'complete'

const SUCCESS_SOUND = '/correct.wav'
const INCORRECT_SOUND = '/incorrect.wav'
const REPEAT_COUNT = 3
const REPEAT_PAUSE_MS = 1400
const POST_WORD_PAUSE_MS = 450
const CHUNK_SIZE = 10

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
	const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | 'all'>(
		'all',
	)
	const [sessionCardOrder, setSessionCardOrder] = useState<number[]>([])
	const [teachingIndices, setTeachingIndices] = useState<number[]>([])
	const [teachingCardIndex, setTeachingCardIndex] = useState<number | null>(
		null,
	)
	const [hearts, setHearts] = useState(initialHearts)
	const [learnedCount, setLearnedCount] = useState(0)
	const [pendingQuizIndices, setPendingQuizIndices] = useState<number[]>([])
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
			: 'Choose your filters, then start the vocabulary.',
	)

	const runIdRef = useRef(0)
	const removedClassroomDefaultRef = useRef(false)
	const publicCourseCompletionRef = useRef(false)
	const completionSoundPlayedRef = useRef(false)
	const initialHeartsRef = useRef(initialHearts)
	const router = useRouter()

	useEffect(() => {
		if (!initialFilters?.selectedLessons?.length) return
		setSelectedLessons(initialFilters.selectedLessons)
	}, [initialFilters?.selectedLessons, setSelectedLessons])

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
			const matchesType = card.type === 'word' || card.type === 'phrase'

			return (
				matchesSelectedLesson &&
				matchesType &&
				card.images.length > 0 &&
				!!card.images[0] &&
				!!card.hebAudio
			)
		})
	}, [data, selectedLessons])

	const chunkOptions = useMemo(() => {
		return Array.from(
			{ length: Math.ceil(lessonFilteredCards.length / CHUNK_SIZE) },
			(_, index) => {
				const start = index * CHUNK_SIZE
				const cards = lessonFilteredCards.slice(start, start + CHUNK_SIZE)

				return {
					index,
					label: `${start + 1}-${start + cards.length}`,
					cards,
				}
			},
		)
	}, [lessonFilteredCards])

	const filteredCards = useMemo(() => {
		if (selectedChunkIndex === 'all') {
			return lessonFilteredCards
		}

		return chunkOptions[selectedChunkIndex]?.cards ?? []
	}, [chunkOptions, lessonFilteredCards, selectedChunkIndex])

	useEffect(() => {
		setSelectedChunkIndex('all')
	}, [lessonFilteredCards])

	useEffect(() => {
		if (selectedChunkIndex === 'all') return
		if (selectedChunkIndex < chunkOptions.length) return
		setSelectedChunkIndex('all')
	}, [chunkOptions.length, selectedChunkIndex])

	useEffect(() => {
		runIdRef.current += 1
		setSessionCardOrder(
			shuffle(
				Array.from({ length: filteredCards.length }, (_, index) => index),
			),
		)
		setPhase('idle')
		setHearts(initialHeartsRef.current)
		setTeachingIndices([])
		setTeachingCardIndex(null)
		setLearnedCount(0)
		setPendingQuizIndices([])
		setCurrentPromptIndex(null)
		setCurrentOptions([])
		setEliminatedOptions([])
		setPulseTick(0)
		setActiveRepeatNumber(null)
		setCompletionRewards(null)
		setCompletionAwarded(false)
		completionSoundPlayedRef.current = false
		setStatusText('Choose your filters, then start the vocabulary.')
	}, [filteredCards, sessionVersion])

	const queueQuizPrompt = useCallback(
		(nextPending: number[], nextLearnedCount: number) => {
			if (nextPending.length === 0) {
				if (nextLearnedCount < sessionCardOrder.length) {
					const nextCardIndex = sessionCardOrder[nextLearnedCount]
					if (nextCardIndex == null) return
					setTeachingIndices([nextCardIndex])
					setPhase('teaching')
					setStatusText(
						`Nice work. Here comes vocab item ${nextLearnedCount + 1}.`,
					)
				} else {
					setPhase('complete')
					setCurrentPromptIndex(null)
					setCurrentOptions([])
					setEliminatedOptions([])
					setStatusText('You finished this vocabulary chunk.')
				}
				return
			}

			const randomizedPending = shuffle(nextPending)
			const correctIndex = randomizedPending[0]
			const candidateIndices = sessionCardOrder.slice(0, nextLearnedCount)
			const distractors = shuffle(
				candidateIndices.filter((index) => index !== correctIndex),
			).slice(0, Math.min(2, Math.max(0, candidateIndices.length - 1)))
			const options = shuffle([correctIndex, ...distractors])

			setCurrentPromptIndex(correctIndex)
			setCurrentOptions(options)
			setEliminatedOptions([])
			setStatusText('Tap the image that matches the audio.')
		},
		[sessionCardOrder],
	)

	const startQuizRound = useCallback(
		(nextLearnedCount: number) => {
			const nextPending = shuffle(sessionCardOrder.slice(0, nextLearnedCount))
			setPendingQuizIndices(nextPending)
			setPhase('quiz')
			queueQuizPrompt(nextPending, nextLearnedCount)
		},
		[queueQuizPrompt, sessionCardOrder],
	)

	useEffect(() => {
		if (phase !== 'teaching' || teachingIndices.length === 0) return

		const runId = ++runIdRef.current

		const runTeachingSequence = async () => {
			for (const index of teachingIndices) {
				if (runIdRef.current !== runId) return
				const card = filteredCards[index]
				setTeachingCardIndex(index)
				setStatusText(`Listen and look: ${card.eng}`)

				for (let repeat = 0; repeat < REPEAT_COUNT; repeat += 1) {
					if (runIdRef.current !== runId) return
					setActiveRepeatNumber(REPEAT_COUNT - repeat)
					setPulseTick((prev) => prev + 1)
					await playAudio(card.hebAudio)
					if (repeat < REPEAT_COUNT - 1) {
						await wait(REPEAT_PAUSE_MS)
					}
				}

				setActiveRepeatNumber(null)
				await wait(POST_WORD_PAUSE_MS)
			}

			if (runIdRef.current !== runId) return

			const nextLearnedCount = Math.min(
				sessionCardOrder.length,
				learnedCount + teachingIndices.length,
			)
			setLearnedCount(nextLearnedCount)
			setTeachingCardIndex(null)
			startQuizRound(nextLearnedCount)
		}

		void runTeachingSequence()
	}, [
		filteredCards,
		learnedCount,
		phase,
		sessionCardOrder.length,
		startQuizRound,
		teachingIndices,
	])

	useEffect(() => {
		if (phase !== 'quiz' || currentPromptIndex == null) return
		void playAudio(filteredCards[currentPromptIndex]?.hebAudio ?? '')
	}, [currentPromptIndex, filteredCards, phase])

	useEffect(() => {
		if (phase !== 'complete' || completionAwarded || filteredCards.length === 0)
			return

		let cancelled = false

		const awardCompletion = async () => {
			try {
				const result = await awardIntroductionCompletion({
					courseId: activeCourseId,
					points: filteredCards.length,
				})

				if (cancelled) return

				setHearts(result.hearts)
				dispatchUserProgressUpdated({
					hearts: result.hearts,
					points: filteredCards.length,
				})
				setCompletionRewards({
					tribePointAwarded: result.tribePointAwarded,
				})
				setCompletionAwarded(true)
			} catch (error) {
				console.error('Failed to award introduction completion rewards', error)
				if (!cancelled) {
					setCompletionAwarded(true)
				}
			}
		}

		void awardCompletion()

		return () => {
			cancelled = true
		}
	}, [activeCourseId, completionAwarded, filteredCards.length, phase])

	useEffect(() => {
		if (phase !== 'complete' || !completionAwarded) return
		if (completionSoundPlayedRef.current) return

		completionSoundPlayedRef.current = true
		void playAudio('/shofar.mp3')
	}, [completionAwarded, phase])

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
			activityKey: 'introduction',
			scorePercent: 100,
		}).catch((error) => {
			console.error('Failed to save public course introduction progress', error)
			publicCourseCompletionRef.current = false
		})
	}, [completionContext, phase])

	const startSession = () => {
		if (sessionCardOrder.length < 2) return

		setCompletionAwarded(false)
		setLearnedCount(0)
		setPendingQuizIndices([])
		setCurrentPromptIndex(null)
		setCurrentOptions([])
		setEliminatedOptions([])
		setTeachingIndices(sessionCardOrder.slice(0, 2))
		setTeachingCardIndex(sessionCardOrder[0] ?? null)
		setPhase('teaching')
		setStatusText(
			'Listen carefully to the first two vocab items in this chunk.',
		)
	}

	const handleGuess = async (optionIndex: number) => {
		if (currentPromptIndex == null) return

		if (optionIndex === currentPromptIndex) {
			await playAudio(SUCCESS_SOUND)
			const nextPending = pendingQuizIndices.filter(
				(index) => index !== currentPromptIndex,
			)
			setPendingQuizIndices(nextPending)
			queueQuizPrompt(nextPending, learnedCount)
			return
		}

		await playAudio(INCORRECT_SOUND)
		setEliminatedOptions((prev) =>
			prev.includes(optionIndex) ? prev : [...prev, optionIndex],
		)
		setStatusText('Not quite. One wrong image has been removed.')
		await playAudio(filteredCards[currentPromptIndex].hebAudio)
	}

	const currentTeachingCard =
		teachingCardIndex != null ? filteredCards[teachingCardIndex] : null
	const currentPromptCard =
		currentPromptIndex != null ? filteredCards[currentPromptIndex] : null
	const canStart = filteredCards.length >= 2
	const lessonSelectionLocked = filtersLocked || phase !== 'idle'
	const currentTeachingOrderPosition =
		teachingCardIndex != null
			? sessionCardOrder.indexOf(teachingCardIndex) + 1
			: 0
	const lessonCompletedCount =
		phase === 'teaching'
			? Math.max(learnedCount, currentTeachingOrderPosition)
			: learnedCount
	const lessonProgressPercent =
		filteredCards.length > 0
			? (lessonCompletedCount / filteredCards.length) * 100
			: 0
	const selectedChunk =
		selectedChunkIndex === 'all'
			? null
			: (chunkOptions[selectedChunkIndex] ?? null)
	const lessonEstimateMinutes = estimateMinutes(lessonFilteredCards.length)
	const chunkEstimateMinutes = estimateMinutes(filteredCards.length)
	const tribeAwarded = completionRewards?.tribePointAwarded ?? false

	return (
		<div className="mx-auto w-full max-w-5xl p-4 text-center">
			<div className="mb-6 flex justify-center">
				<button
					onClick={() => setSessionVersion((prev) => prev + 1)}
					className="rounded bg-gray-200 px-4 py-2 shadow"
				>
					Change Lesson
				</button>
			</div>

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
						? 'This chunk needs at least 2 Hebrew vocab items with an image and audio. Choose a different chunk to continue.'
						: 'At least 2 Hebrew vocab items from one lesson with an image and audio are needed for this vocabulary activity.'}
				</div>
			) : phase === 'idle' ? (
				<div className="rounded-2xl border bg-white p-8 shadow-sm">
					<p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
						Select a chunk
					</p>
					<p className="mt-3 text-3xl font-bold text-slate-900">
						{lessonFilteredCards.length} Total Words
					</p>

					{chunkOptions.length > 0 && (
						<>
							<div className="mt-4 flex flex-wrap justify-center gap-2">
								<button
									onClick={() => setSelectedChunkIndex('all')}
									className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
										selectedChunkIndex === 'all'
											? 'border-sky-600 bg-sky-600 text-white'
											: 'bg-gray-100 text-slate-700 hover:bg-gray-200'
									}`}
								>
									All
								</button>
								{chunkOptions.map((chunk) => {
									const isSelected = chunk.index === selectedChunkIndex

									return (
										<button
											key={chunk.label}
											onClick={() => setSelectedChunkIndex(chunk.index)}
											className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
												isSelected
													? 'border-sky-600 bg-sky-600 text-white'
													: 'bg-gray-100 text-slate-700 hover:bg-gray-200'
											}`}
										>
											{chunk.label}
										</button>
									)
								})}
							</div>
						</>
					)}
					{selectedChunkIndex === 'all' ? (
						<p className="mt-3 text-base font-semibold text-slate-800">
							Starting the full lesson with {filteredCards.length} words.{' '}
							Estimated time: {chunkEstimateMinutes} minute
							{chunkEstimateMinutes === 1 ? '' : 's'}.
						</p>
					) : selectedChunk ? (
						<p className="mt-3 text-base font-semibold text-slate-800">
							Starting chunk {selectedChunk.label} with {filteredCards.length}{' '}
							word{filteredCards.length === 1 ? '' : 's'}. Estimated time:{' '}
							{chunkEstimateMinutes} minute
							{chunkEstimateMinutes === 1 ? '' : 's'}.
						</p>
					) : null}
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
								{lessonCompletedCount}/{filteredCards.length}
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
					<div
						key={`teaching-${teachingCardIndex}-${pulseTick}`}
						className="animate-[pulse_700ms_ease-in-out] rounded-3xl"
					>
						<div className="relative mx-auto aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-3xl bg-slate-100 shadow-inner">
							<Image
								src={resolveVocabMediaUrl(currentTeachingCard.images[0])}
								alt={currentTeachingCard.eng}
								fill
								className="object-cover"
								sizes="(max-width: 768px) 100vw, 960px"
							/>
							<div className="absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/40 px-4 py-2 backdrop-blur-sm">
								{[1, 2, 3].map((repeatNumber) => {
									const isActive = activeRepeatNumber === repeatNumber
									return (
										<div
											key={repeatNumber}
											className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition ${
												isActive
													? 'scale-110 bg-rose-700 text-white shadow-md'
													: 'bg-white/25 text-white'
											}`}
										>
											{repeatNumber}
										</div>
									)
								})}
							</div>
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
									{lessonCompletedCount}/{filteredCards.length}
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
							const optionCard = filteredCards[optionIndex]
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
												className="object-cover"
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
								? `You earned ${filteredCards.length} point${filteredCards.length === 1 ? '' : 's'}, replenished your hearts to 5, and earned +1 Tribe Point.`
								: `You earned ${filteredCards.length} point${filteredCards.length === 1 ? '' : 's'} and replenished your hearts to 5.`
						}
						points={filteredCards.length}
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

function playAudio(src: string) {
	return new Promise<void>((resolve) => {
		if (!src) {
			resolve()
			return
		}

		const audio = new Audio(src)
		const finish = () => resolve()

		audio.addEventListener('ended', finish, { once: true })
		audio.addEventListener('error', finish, { once: true })
		void audio.play().catch(() => resolve())
	})
}

function estimateMinutes(wordCount: number) {
	if (wordCount <= 0) return 0
	return Math.ceil((wordCount * 3) / 10)
}
