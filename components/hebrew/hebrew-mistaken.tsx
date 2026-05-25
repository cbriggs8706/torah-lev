'use client'

import { useEffect, useMemo, useState } from 'react'
import {
	DndContext,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core'
import { RefreshCw, Volume2 } from 'lucide-react'
import ReactConfetti from 'react-confetti'
import { useAudio, useWindowSize } from 'react-use'
import { awardVocabQuizCompletion } from '@/actions/vocab-quiz-progress'
import { ResultCard } from '@/app/lesson/result-card'
import { ActivityFinalScreen } from '@/components/activity-final-screen'
import LessonFilter from '@/components/filters/filter-lesson'
import { useLessonCards } from '@/hooks/useLessonCards'
import type { HebrewVocab } from '@/lib/vocab'

type HebrewMistakenProps = {
	courseId: number
	currentLesson: string
	data: HebrewVocab[]
}

type MistakenPair = {
	key: string
	first: HebrewVocab
	second: HebrewVocab
}

type MistakeReview = {
	key: string
	prompt: HebrewVocab
	guessed: HebrewVocab
	correct: HebrewVocab
}

type Phase = 'setup' | 'playing' | 'results'
type ZoneId = 'first' | 'second'

function shuffle<T>(items: T[]) {
	const next = [...items]

	for (let index = next.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1))
		;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
	}

	return next
}

function getDisplayHebrew(card: HebrewVocab) {
	return card.hebNiqqud?.trim() || card.heb?.trim() || 'Unknown word'
}

function getRelationLookupId(card: HebrewVocab) {
	if (typeof card.dbId === 'number') return String(card.dbId)
	if (typeof card.id === 'number') return String(card.id)
	return null
}

function playAudio(src?: string) {
	if (!src) return

	const audio = new Audio(src)
	audio.play().catch(() => {})
}

function DraggableGloss({
	id,
	label,
	disabled,
}: {
	id: string
	label: string
	disabled: boolean
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id,
		disabled,
	})

	return (
		<button
			ref={setNodeRef}
			type="button"
			{...listeners}
			{...attributes}
			disabled={disabled}
			className={`w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
				disabled
					? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70'
					: 'border-sky-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md active:cursor-grabbing'
			} ${isDragging ? 'z-20 shadow-lg ring-2 ring-sky-200' : ''}`}
			style={{
				transform: transform
					? `translate3d(${transform.x}px, ${transform.y}px, 0)`
					: undefined,
			}}
		>
			<p className="text-lg font-semibold">{label}</p>
		</button>
	)
}

function HebrewDropZone({
	id,
	card,
	assignedCard,
	locked,
	state,
}: {
	id: ZoneId
	card: HebrewVocab
	assignedCard: HebrewVocab | null
	locked: boolean
	state: 'idle' | 'correct' | 'incorrect'
}) {
	const { isOver, setNodeRef } = useDroppable({
		id,
		disabled: locked,
	})

	return (
		<div
			ref={setNodeRef}
			className={`rounded-3xl border p-5 shadow-sm transition ${
				state === 'correct'
					? 'border-emerald-300 bg-emerald-50'
					: state === 'incorrect'
						? 'border-rose-300 bg-rose-50'
						: isOver
							? 'border-sky-300 bg-sky-50'
							: 'border-slate-200 bg-white'
			}`}
		>
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-3xl font-cardo text-slate-900">
						{getDisplayHebrew(card)}
					</p>
					<p className="mt-2 text-sm text-slate-500">
						Drop the matching English meaning here.
					</p>
				</div>
				<button
					type="button"
					onClick={() => playAudio(card.hebAudio)}
					disabled={!card.hebAudio}
					className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-white shadow transition hover:scale-105 hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
					aria-label={`Play audio for ${card.eng}`}
				>
					<Volume2 className="h-5 w-5" />
				</button>
			</div>

			<div
				className={`mt-5 rounded-2xl border border-dashed px-4 py-5 text-center transition ${
					assignedCard
						? 'border-transparent bg-white shadow-sm'
						: state === 'incorrect'
							? 'border-rose-300 bg-white/70'
							: isOver
								? 'border-sky-300 bg-white'
								: 'border-slate-300 bg-slate-50 text-slate-400'
				}`}
			>
				{assignedCard ? (
					<p className="text-lg font-semibold text-slate-900">
						{assignedCard.eng}
					</p>
				) : (
					<p className="text-sm">Drop English translation</p>
				)}
			</div>
		</div>
	)
}

export default function HebrewMistaken({
	courseId,
	currentLesson,
	data,
}: HebrewMistakenProps) {
	const { selectedLessons, setSelectedLessons } = useLessonCards(
		data,
		currentLesson,
	)
	const { width, height } = useWindowSize()
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
	const [phase, setPhase] = useState<Phase>('setup')
	const [roundVersion, setRoundVersion] = useState(0)
	const [currentPairIndex, setCurrentPairIndex] = useState(0)
	const [placements, setPlacements] = useState<Partial<Record<ZoneId, string>>>({})
	const [statusText, setStatusText] = useState(
		'Drag each English gloss onto the Hebrew word it belongs to.',
	)
	const [correctMatches, setCorrectMatches] = useState(0)
	const [incorrectAttempts, setIncorrectAttempts] = useState(0)
	const [mistakeReviews, setMistakeReviews] = useState<MistakeReview[]>([])
	const [completionRewards, setCompletionRewards] = useState<{
		awardedPoints: number
		hearts: number
		tribePointAwarded: boolean
	} | null>(null)
	const [completionAwarded, setCompletionAwarded] = useState(false)
	const [evaluationState, setEvaluationState] = useState<'idle' | 'correct' | 'incorrect'>('idle')
	const [finishAudio] = useAudio({ src: '/shofar.mp3', autoPlay: true })

	const lessonFilteredCards = useMemo(() => {
		return data.filter((card) => {
			const matchesSelectedLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((lesson) => selectedLessons.includes(String(lesson)))

			return matchesSelectedLesson
		})
	}, [data, selectedLessons])

	const mistakenPairs = useMemo(() => {
		const byId = new Map(
			lessonFilteredCards
				.map((card) => {
					const lookupId = getRelationLookupId(card)
					return lookupId ? ([lookupId, card] as const) : null
				})
				.filter((entry): entry is readonly [string, HebrewVocab] => Boolean(entry))
		)
		const pairs: MistakenPair[] = []
		const seen = new Set<string>()

		for (const card of lessonFilteredCards) {
			const leftLookupId = getRelationLookupId(card)
			if (!leftLookupId) continue

			for (const confusedId of card.confusedWith ?? []) {
				const counterpart = byId.get(String(confusedId))
				if (!counterpart) continue

				const rightLookupId = getRelationLookupId(counterpart)
				if (!rightLookupId) continue

				const pairKey = [leftLookupId, rightLookupId]
					.sort((a, b) => a.localeCompare(b))
					.join('::')
				if (seen.has(pairKey)) continue

				seen.add(pairKey)
				pairs.push({
					key: pairKey,
					first: card,
					second: counterpart,
				})
			}
		}

		return shuffle(pairs)
	}, [lessonFilteredCards])

	const currentPair = mistakenPairs[currentPairIndex] ?? null
	const allMatched = phase === 'playing' && currentPairIndex >= mistakenPairs.length && mistakenPairs.length > 0
	const totalCount = mistakenPairs.length
	const completedCount = Math.min(currentPairIndex, totalCount)
	const totalAttempts = correctMatches + incorrectAttempts
	const accuracy = totalAttempts > 0 ? correctMatches / totalAttempts : 0
	const passed = allMatched && accuracy > 0.75
	const awardedPoints = passed ? totalCount : 0

	const zoneCards = useMemo(() => {
		if (!currentPair) return []
		return [
			{ id: 'first' as const, card: currentPair.first },
			{ id: 'second' as const, card: currentPair.second },
		]
	}, [currentPair])

	const draggableCards = useMemo(() => {
		if (!currentPair) return []
		const shuffleSeed = roundVersion
		return shuffle([
			{ id: `drag:first:${shuffleSeed}`, card: currentPair.first },
			{ id: `drag:second:${shuffleSeed}`, card: currentPair.second },
		])
	}, [currentPair, roundVersion])

	const draggableById = useMemo(
		() => new Map(draggableCards.map((item) => [item.id, item.card] as const)),
		[draggableCards]
	)

	const assignedIds = new Set(Object.values(placements))

	useEffect(() => {
		if (phase !== 'playing') return
		setCurrentPairIndex(0)
		setPlacements({})
		setCorrectMatches(0)
		setIncorrectAttempts(0)
		setMistakeReviews([])
		setCompletionRewards(null)
		setCompletionAwarded(false)
		setEvaluationState('idle')
		setStatusText('Drag each English gloss onto the Hebrew word it belongs to.')
	}, [phase, roundVersion])

	useEffect(() => {
		if (!allMatched) return
		setPhase('results')
	}, [allMatched])

	useEffect(() => {
		if (
			phase !== 'results' ||
			!passed ||
			awardedPoints <= 0 ||
			completionAwarded
		) {
			return
		}

		let cancelled = false

		const awardCompletion = async () => {
			try {
				const result = await awardVocabQuizCompletion({
					courseId,
					points: awardedPoints,
				})

				if (cancelled) return

				setCompletionRewards({
					awardedPoints: result.awardedPoints,
					hearts: result.hearts,
					tribePointAwarded: result.tribePointAwarded,
				})
				setCompletionAwarded(true)
			} catch (error) {
				console.error('Failed to award mistaken completion rewards', error)
				if (!cancelled) {
					setCompletionAwarded(true)
				}
			}
		}

		void awardCompletion()

		return () => {
			cancelled = true
		}
	}, [awardedPoints, completionAwarded, courseId, passed, phase])

	useEffect(() => {
		if (!currentPair) return
		if (!placements.first || !placements.second) return

		const firstGuess = draggableById.get(placements.first)
		const secondGuess = draggableById.get(placements.second)
		if (!firstGuess || !secondGuess) return

		const firstCorrect = getRelationLookupId(firstGuess) === getRelationLookupId(currentPair.first)
		const secondCorrect = getRelationLookupId(secondGuess) === getRelationLookupId(currentPair.second)

		if (firstCorrect && secondCorrect) {
			setEvaluationState('correct')
			setCorrectMatches((prev) => prev + 1)
			setStatusText(`Correct. "${currentPair.first.eng}" and "${currentPair.second.eng}" are now sorted.`)

			const timeoutId = window.setTimeout(() => {
				setCurrentPairIndex((prev) => prev + 1)
				setPlacements({})
				setEvaluationState('idle')
				setRoundVersion((prev) => prev + 1)
			}, 700)

			return () => window.clearTimeout(timeoutId)
		}

		setEvaluationState('incorrect')
		setIncorrectAttempts((prev) => prev + 1)
		setStatusText('Not quite. These meanings belong to the other Hebrew word. Try again.')

		const nextReviews: MistakeReview[] = []
		if (!firstCorrect) {
			nextReviews.push({
				key: `${currentPair.key}:first:${getRelationLookupId(firstGuess) ?? firstGuess.eng}`,
				prompt: currentPair.first,
				guessed: firstGuess,
				correct: currentPair.first,
			})
		}
		if (!secondCorrect) {
			nextReviews.push({
				key: `${currentPair.key}:second:${getRelationLookupId(secondGuess) ?? secondGuess.eng}`,
				prompt: currentPair.second,
				guessed: secondGuess,
				correct: currentPair.second,
			})
		}

		setMistakeReviews((prev) => {
			const existing = new Set(prev.map((review) => review.key))
			return [...prev, ...nextReviews.filter((review) => !existing.has(review.key))]
		})

		const timeoutId = window.setTimeout(() => {
			setPlacements({})
			setEvaluationState('idle')
		}, 900)

		return () => window.clearTimeout(timeoutId)
	}, [currentPair, draggableById, placements])

	function startRound() {
		if (totalCount === 0) return
		setRoundVersion((prev) => prev + 1)
		setPhase('playing')
	}

	function returnToSetup() {
		setPhase('setup')
		setPlacements({})
		setEvaluationState('idle')
		setStatusText('Drag each English gloss onto the Hebrew word it belongs to.')
	}

	function handleDragEnd(event: DragEndEvent) {
		if (evaluationState !== 'idle') return
		const activeId = String(event.active.id)
		const overId = event.over ? String(event.over.id) : null
		if (overId !== 'first' && overId !== 'second') return

		setPlacements((prev) => {
			const next: Partial<Record<ZoneId, string>> = {}

			for (const [zoneId, dragId] of Object.entries(prev) as [ZoneId, string][]) {
				if (dragId === activeId || zoneId === overId) continue
				next[zoneId] = dragId
			}

			next[overId] = activeId
			return next
		})
	}

	if (phase === 'setup') {
		return (
			<div className="mx-auto w-full max-w-4xl px-2 pb-8">
				<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-slate-900">
								Customize Mistaken
							</h2>
							<p className="mt-2 text-sm text-slate-600">
								Choose one or more lessons, then sort each English meaning onto
								the Hebrew word it belongs to.
							</p>
						</div>

						<div className="rounded-3xl bg-slate-50 p-4">
							<LessonFilter
								data={data}
								selectedLessons={selectedLessons}
								setSelectedLessons={setSelectedLessons}
							/>
						</div>

						<div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center sm:grid-cols-2">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
									Available Pairs
								</p>
								<p className="mt-2 text-3xl font-bold text-slate-900">
									{totalCount}
								</p>
							</div>
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
									Reward Threshold
								</p>
								<p className="mt-2 text-lg font-semibold text-slate-900">
									More than 75% correct
								</p>
							</div>
						</div>

						{totalCount === 0 ? (
							<div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-center text-amber-900">
								No commonly confused pairs were found for the selected lessons.
								Choose a different lesson set to begin.
							</div>
						) : null}

						<div className="flex justify-center">
							<button
								type="button"
								onClick={startRound}
								disabled={totalCount === 0}
								className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
							>
								Start Mistaken
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (phase === 'results') {
		return (
			<ActivityFinalScreen
				title={passed ? 'Lesson Complete' : 'Round Complete'}
				description={
					passed
						? 'You cleared the 75% accuracy mark and earned rewards.'
						: 'You sorted every pair, but you need more than 75% accuracy to earn points.'
				}
				stats={[
					{ label: 'Correct', value: correctMatches, valueClassName: 'text-emerald-600' },
					{ label: 'Incorrect', value: incorrectAttempts, valueClassName: 'text-rose-600' },
					{ label: 'Accuracy', value: `${Math.round(accuracy * 100)}%` },
				]}
				rewards={
					passed ? (
						<>
							<p className="mb-4 text-lg font-semibold text-slate-800">
								You earned {completionRewards?.awardedPoints ?? awardedPoints}{' '}
								point
								{(completionRewards?.awardedPoints ?? awardedPoints) === 1 ? '' : 's'}.
							</p>
							<div className="mx-auto flex w-full max-w-md gap-4">
								<ResultCard
									variant="points"
									value={completionRewards?.awardedPoints ?? awardedPoints}
									tribePointAdded={completionRewards?.tribePointAwarded ?? false}
								/>
							</div>
						</>
					) : undefined
				}
				message={
					!passed ? (
						<p className="text-sm text-slate-600">
							Try again with fewer misses to earn {totalCount} point
							{totalCount === 1 ? '' : 's'}.
						</p>
					) : undefined
				}
				actions={
					<div className="flex flex-col justify-center gap-3 sm:flex-row">
						<button
							type="button"
							onClick={startRound}
							className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-5 py-3 font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
						>
							<RefreshCw className="h-4 w-4" />
							Play Again
						</button>
						<button
							type="button"
							onClick={returnToSetup}
							className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
						>
							Change Lessons
						</button>
					</div>
				}
				reviewSection={
					mistakeReviews.length > 0 ? (
						<div className="text-left">
							<h3 className="text-center text-xl font-bold text-slate-900">
								Review Incorrect Guesses
							</h3>
							<p className="mt-2 text-center text-sm text-slate-600">
								These show which English meaning was dropped on the wrong Hebrew
								word and what belonged there instead.
							</p>
							<div className="mt-5 grid gap-4">
								{mistakeReviews.map((review) => (
									<div
										key={review.key}
										className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
									>
										<div className="rounded-2xl bg-white p-4 shadow-sm">
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
												Hebrew Word
											</p>
											<div className="mt-3 flex items-start justify-between gap-3">
												<div>
													<p className="text-3xl font-cardo text-slate-900">
														{getDisplayHebrew(review.prompt)}
													</p>
													<p className="mt-2 text-base font-semibold text-slate-800">
														Correct meaning: {review.correct.eng}
													</p>
												</div>
												<button
													type="button"
													onClick={() => playAudio(review.prompt.hebAudio)}
													disabled={!review.prompt.hebAudio}
													className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-white shadow transition hover:scale-105 hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-300"
													aria-label={`Play audio for ${review.correct.eng}`}
												>
													<Volume2 className="h-5 w-5" />
												</button>
											</div>
										</div>
										<div className="mt-4 grid gap-4 md:grid-cols-2">
											<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
												<p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600">
													Incorrect Guess
												</p>
												<p className="mt-3 text-lg font-semibold text-slate-900">
													{review.guessed.eng}
												</p>
											</div>
											<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
												<p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
													Correct Meaning
												</p>
												<p className="mt-3 text-lg font-semibold text-slate-900">
													{review.correct.eng}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					) : undefined
				}
				celebration={
					<>
						{passed ? finishAudio : null}
						{passed ? (
							<ReactConfetti
								width={width}
								height={height}
								recycle={false}
								numberOfPieces={450}
								tweenDuration={10000}
							/>
						) : null}
					</>
				}
			/>
		)
	}

	if (!currentPair) {
		return null
	}

	return (
		<div className="mx-auto w-full max-w-5xl px-2 pb-8">
			<div className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
						Progress
					</p>
					<p className="mt-1 text-lg font-semibold text-slate-900">
						{completedCount}/{totalCount} pairs sorted
					</p>
					<p className="mt-1 text-sm text-slate-600">{statusText}</p>
				</div>

				<div className="grid grid-cols-3 gap-3 text-center">
					<div className="rounded-2xl bg-slate-50 px-4 py-3">
						<p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
							Correct
						</p>
						<p className="mt-1 text-2xl font-bold text-emerald-600">
							{correctMatches}
						</p>
					</div>
					<div className="rounded-2xl bg-slate-50 px-4 py-3">
						<p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
							Incorrect
						</p>
						<p className="mt-1 text-2xl font-bold text-rose-600">
							{incorrectAttempts}
						</p>
					</div>
					<div className="rounded-2xl bg-slate-50 px-4 py-3">
						<p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
							Accuracy
						</p>
						<p className="mt-1 text-2xl font-bold text-slate-900">
							{Math.round(accuracy * 100)}%
						</p>
					</div>
				</div>
			</div>

			<div className="mb-5 flex flex-wrap justify-center gap-3">
				<button
					type="button"
					onClick={() => setRoundVersion((prev) => prev + 1)}
					className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
				>
					<RefreshCw className="h-4 w-4" />
					Shuffle
				</button>
				<button
					type="button"
					onClick={returnToSetup}
					className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
				>
					Change Lessons
				</button>
			</div>

			<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
				<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
					<div className="space-y-4">
						<p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
							Hebrew Words
						</p>
						<div className="grid gap-4 md:grid-cols-2">
							{zoneCards.map(({ id, card }) => (
								<HebrewDropZone
									key={id}
									id={id}
									card={card}
									assignedCard={
										placements[id] ? draggableById.get(placements[id]!) ?? null : null
									}
									locked={evaluationState !== 'idle'}
									state={evaluationState}
								/>
							))}
						</div>
					</div>

					<div className="rounded-[2rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
						<p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
							English Meanings
						</p>
						<div className="mt-5 space-y-3">
							{draggableCards.map((item) => (
								<DraggableGloss
									key={item.id}
									id={item.id}
									label={item.card.eng}
									disabled={assignedIds.has(item.id) || evaluationState !== 'idle'}
								/>
							))}
						</div>
					</div>
				</div>
			</DndContext>
		</div>
	)
}
