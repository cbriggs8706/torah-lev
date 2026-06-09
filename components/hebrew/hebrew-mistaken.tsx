'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Volume2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ReactConfetti from 'react-confetti'
import { useAudio, useWindowSize } from 'react-use'
import { awardVocabQuizCompletion } from '@/actions/vocab-quiz-progress'
import { ResultCard } from '@/app/lesson/result-card'
import { ActivityFinalScreen } from '@/components/activity-final-screen'
import LessonFilter from '@/components/filters/filter-lesson'
import { useLessonCards } from '@/hooks/useLessonCards'
import { dispatchUserProgressUpdated } from '@/lib/user-progress-events'
import { cn } from '@/lib/utils'
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
type WordSlotId = string
type GlossChoiceId = string

const DEFAULT_BOARD_PAIR_COUNT = 4

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

function getPairLookupIds(pair: MistakenPair) {
	return [getRelationLookupId(pair.first), getRelationLookupId(pair.second)].filter(
		(id): id is string => Boolean(id),
	)
}

function packPairsForBoards(
	pairs: MistakenPair[],
	boardPairCount: number,
) {
	const remaining = [...pairs]
	const ordered: MistakenPair[] = []

	while (remaining.length > 0) {
		const board: MistakenPair[] = []
		const usedIds = new Set<string>()

		for (
			let index = 0;
			index < remaining.length && board.length < boardPairCount;
		) {
			const candidate = remaining[index]
			const candidateIds = getPairLookupIds(candidate)
			const overlaps = candidateIds.some((id) => usedIds.has(id))

			if (overlaps) {
				index += 1
				continue
			}

			board.push(candidate)
			candidateIds.forEach((id) => usedIds.add(id))
			remaining.splice(index, 1)
		}

		if (board.length === 0) {
			board.push(remaining.shift()!)
		}

		ordered.push(...board)
	}

	return ordered
}

export default function HebrewMistaken({
	courseId,
	currentLesson,
	data,
}: HebrewMistakenProps) {
	const router = useRouter()
	const { selectedLessons, setSelectedLessons } = useLessonCards(
		data,
		currentLesson,
	)
	const { width, height } = useWindowSize()
	const [phase, setPhase] = useState<Phase>('setup')
	const [pairs, setPairs] = useState<MistakenPair[]>([])
	const [selectedBoardPairCount, setSelectedBoardPairCount] = useState(
		DEFAULT_BOARD_PAIR_COUNT,
	)
	const [currentBatchStart, setCurrentBatchStart] = useState(0)
	const [choiceOrder, setChoiceOrder] = useState<GlossChoiceId[]>([])
	const [assignments, setAssignments] = useState<
		Partial<Record<WordSlotId, GlossChoiceId>>
	>({})
	const [activeWordSlot, setActiveWordSlot] = useState<WordSlotId | null>(null)
	const [activeGlossChoice, setActiveGlossChoice] =
		useState<GlossChoiceId | null>(null)
	const [correctMatches, setCorrectMatches] = useState(0)
	const [incorrectAttempts, setIncorrectAttempts] = useState(0)
	const [mistakeReviews, setMistakeReviews] = useState<MistakeReview[]>([])
	const [statusText, setStatusText] = useState(
		'Tap either a Hebrew word or an English meaning first, then match it.',
	)
	const [completionRewards, setCompletionRewards] = useState<{
		awardedPoints: number
		hearts: number
		tribePointAwarded: boolean
	} | null>(null)
	const [completionAwarded, setCompletionAwarded] = useState(false)
	const [finishAudio] = useAudio({ src: '/shofar.mp3', autoPlay: true })

	const lessonFilteredCards = useMemo(() => {
		return data.filter((card) => {
			const matchesSelectedLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((lesson) => selectedLessons.includes(String(lesson)))

			return matchesSelectedLesson
		})
	}, [data, selectedLessons])

	const availablePairs = useMemo(() => {
		const byId = new Map(
			lessonFilteredCards
				.map((card) => {
					const lookupId = getRelationLookupId(card)
					return lookupId ? ([lookupId, card] as const) : null
				})
				.filter((entry): entry is readonly [string, HebrewVocab] =>
					Boolean(entry),
				),
		)
		const nextPairs: MistakenPair[] = []
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
				nextPairs.push({
					key: pairKey,
					first: card,
					second: counterpart,
				})
			}
		}

		return nextPairs
	}, [lessonFilteredCards])

	const pairCountOptions = useMemo(() => {
		if (availablePairs.length === 0) return []

		const baseOptions = [4, 6, 8, 10]
		const validOptions = baseOptions.filter((count) => count < availablePairs.length)
		return [...validOptions, availablePairs.length]
	}, [availablePairs.length])

	useEffect(() => {
		if (availablePairs.length === 0) {
			setSelectedBoardPairCount(0)
			return
		}

		setSelectedBoardPairCount((prev) => {
			if (prev > availablePairs.length || prev <= 0) {
				return Math.min(DEFAULT_BOARD_PAIR_COUNT, availablePairs.length)
			}
			return prev
		})
	}, [availablePairs.length])

	const currentBatch = useMemo(
		() =>
			pairs.slice(
				currentBatchStart,
				currentBatchStart + selectedBoardPairCount,
			),
		[pairs, currentBatchStart, selectedBoardPairCount],
	)
	const totalCount = pairs.length
	const completedCount = Math.min(currentBatchStart, totalCount)
	const totalAttempts = correctMatches + incorrectAttempts
	const accuracy = totalAttempts > 0 ? correctMatches / totalAttempts : 0
	const allMatched = totalCount > 0 && currentBatchStart >= totalCount
	const passed = allMatched && accuracy > 0.75
	const awardedPoints = passed ? totalCount : 0

	const boardWordCards = useMemo(() => {
		return shuffle(
			currentBatch.flatMap((pair) => [
				{
					id: `${pair.key}:word:first`,
					card: pair.first,
					correctChoiceId: `${pair.key}:choice:first`,
				},
				{
					id: `${pair.key}:word:second`,
					card: pair.second,
					correctChoiceId: `${pair.key}:choice:second`,
				},
			]),
		)
	}, [currentBatch])

	const choices = useMemo(() => {
		return Object.fromEntries(
			currentBatch.flatMap((pair) => [
				[`${pair.key}:choice:first`, pair.first],
				[`${pair.key}:choice:second`, pair.second],
			]),
		) as Record<GlossChoiceId, HebrewVocab>
	}, [currentBatch])

	const choiceLabelById = useMemo(() => {
		return Object.fromEntries(
			(Object.entries(choices) as [GlossChoiceId, HebrewVocab][]).map(
				([id, card]) => [id, card.eng],
			),
		) as Record<GlossChoiceId, string>
	}, [choices])

	const correctChoiceByWordSlot = useMemo(() => {
		return Object.fromEntries(
			boardWordCards.map(({ id, correctChoiceId }) => [id, correctChoiceId]),
		) as Record<WordSlotId, GlossChoiceId>
	}, [boardWordCards])

	const wordCardById = useMemo(() => {
		return Object.fromEntries(
			boardWordCards.map(({ id, card }) => [id, card]),
		) as Record<WordSlotId, HebrewVocab>
	}, [boardWordCards])

	const assignedChoiceIds = new Set(Object.values(assignments))

	useEffect(() => {
		if (currentBatch.length === 0) {
			setChoiceOrder([])
			return
		}

		setChoiceOrder(shuffle(Object.keys(choices)))
		setAssignments({})
		setActiveWordSlot(null)
		setActiveGlossChoice(null)
		setStatusText(
			'Tap either a Hebrew word or an English meaning first, then match it.',
		)
	}, [currentBatchStart, choices, currentBatch.length])

	useEffect(() => {
		if (!allMatched || phase !== 'playing') return
		setPhase('results')
	}, [allMatched, phase])

	useEffect(() => {
		if (phase !== 'results') return
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}, [phase])

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
				dispatchUserProgressUpdated({
					hearts: result.hearts,
					points: result.awardedPoints,
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
	}, [awardedPoints, completionAwarded, courseId, passed, phase, router])

	function resetRoundState(nextPairs: MistakenPair[]) {
		setPairs(nextPairs)
		setCurrentBatchStart(0)
		setChoiceOrder([])
		setAssignments({})
		setActiveWordSlot(null)
		setActiveGlossChoice(null)
		setCorrectMatches(0)
		setIncorrectAttempts(0)
		setMistakeReviews([])
		setCompletionRewards(null)
		setCompletionAwarded(false)
		setStatusText(
			'Tap either a Hebrew word or an English meaning first, then match it.',
		)
	}

	function startRound() {
		if (availablePairs.length === 0 || selectedBoardPairCount === 0) return
		resetRoundState(
			packPairsForBoards(shuffle(availablePairs), selectedBoardPairCount),
		)
		setPhase('playing')
	}

	function returnToSetup() {
		setPhase('setup')
		setAssignments({})
		setActiveWordSlot(null)
		setActiveGlossChoice(null)
		setStatusText(
			'Tap either a Hebrew word or an English meaning first, then match it.',
		)
	}

	function shuffleChoices() {
		if (currentBatch.length === 0) return
		setChoiceOrder((current) => shuffle(current))
		setAssignments({})
		setActiveWordSlot(null)
		setActiveGlossChoice(null)
		setStatusText(
			'Tap either a Hebrew word or an English meaning first, then match it.',
		)
	}

	function handleIncorrectMatch(
		wordSlot: WordSlotId,
		guessedChoice: GlossChoiceId,
	) {
		if (currentBatch.length === 0) return

		const guessedCard = choices[guessedChoice]
		const correctCard = choices[correctChoiceByWordSlot[wordSlot]]
		const reviewKey = `${wordSlot}:${guessedChoice}`

		setIncorrectAttempts((prev) => prev + 1)
		setMistakeReviews((prev) =>
			prev.some((review) => review.key === reviewKey)
				? prev
				: [
						...prev,
						{
							key: reviewKey,
							prompt: correctCard,
							guessed: guessedCard,
							correct: correctCard,
						},
					],
		)
		setActiveWordSlot(null)
		setActiveGlossChoice(null)
		setStatusText(
			`"${guessedCard.eng}" does not belong with "${getDisplayHebrew(
				correctCard,
			)}". Try again.`,
		)
	}

	function handleCorrectSelection(
		wordSlot: WordSlotId,
		glossChoice: GlossChoiceId,
	) {
		if (currentBatch.length === 0) return

		const nextAssignments: Partial<Record<WordSlotId, GlossChoiceId>> = {
			...assignments,
			[wordSlot]: glossChoice,
		}

		setAssignments(nextAssignments)
		setActiveWordSlot(null)
		setActiveGlossChoice(null)
		setCorrectMatches((prev) => prev + 1)

		const allWordsAssigned = boardWordCards.every(
			(card) => nextAssignments[card.id],
		)

		if (!allWordsAssigned) {
			setStatusText(
				`Good. "${choices[glossChoice].eng}" is on the right word. Match the other one.`,
			)
			return
		}

		setStatusText('Nice work. You sorted those confused words correctly.')

		window.setTimeout(() => {
			setCurrentBatchStart((prev) => prev + currentBatch.length)
		}, 700)
	}

	function tryMatch(wordSlot: WordSlotId, glossChoice: GlossChoiceId) {
		if (currentBatch.length === 0) return
		if (assignments[wordSlot]) return

		const isCorrect = correctChoiceByWordSlot[wordSlot] === glossChoice

		if (!isCorrect) {
			handleIncorrectMatch(wordSlot, glossChoice)
			return
		}

		handleCorrectSelection(wordSlot, glossChoice)
	}

	function handleSelectWord(wordSlot: WordSlotId) {
		if (assignments[wordSlot]) return

		if (activeWordSlot === wordSlot) {
			setActiveWordSlot(null)
			setStatusText(
				'Tap either a Hebrew word or an English meaning first, then match it.',
			)
			return
		}

		if (activeGlossChoice) {
			tryMatch(wordSlot, activeGlossChoice)
			return
		}

		setActiveWordSlot(wordSlot)
		const word = wordCardById[wordSlot]
		setStatusText(
			word
				? `Selected "${getDisplayHebrew(
						word,
					)}". Now choose the matching English meaning.`
				: 'Choose the matching English meaning.',
		)
	}

	function handleSelectGloss(glossChoice: GlossChoiceId) {
		if (assignedChoiceIds.has(glossChoice)) return

		if (activeGlossChoice === glossChoice) {
			setActiveGlossChoice(null)
			setStatusText(
				'Tap either a Hebrew word or an English meaning first, then match it.',
			)
			return
		}

		if (activeWordSlot) {
			tryMatch(activeWordSlot, glossChoice)
			return
		}

		setActiveGlossChoice(glossChoice)
		setStatusText(
			`Selected "${choices[glossChoice].eng}". Now choose the Hebrew word it belongs to.`,
		)
	}

	if (phase === 'setup') {
		return (
			<div className="mx-auto w-full max-w-4xl px-2 pb-8">
				<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-slate-900">
								Customize Similar Words
							</h2>
							<p className="mt-2 text-sm text-slate-600">
								Choose one or more lessons, then match each English meaning to
								the correct Hebrew word.
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
									{availablePairs.length}
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

						{availablePairs.length > 0 ? (
							<div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
								<h3 className="text-lg font-semibold text-slate-900">
									How Many Pairs At A Time?
								</h3>
								<p className="text-sm text-slate-600">
									Pick how many commonly confused pairs to sort on each board.
								</p>
								<div className="flex flex-wrap justify-center gap-2">
									{pairCountOptions.map((count) => (
										<button
											key={count}
											type="button"
											onClick={() => setSelectedBoardPairCount(count)}
											className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
												selectedBoardPairCount === count
													? 'border-sky-600 bg-sky-600 text-white'
													: 'border-slate-300 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700'
											}`}
										>
											{count}
										</button>
									))}
								</div>
							</div>
						) : null}

						{availablePairs.length === 0 ? (
							<div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-center text-amber-900">
								No commonly confused pairs were found for the selected lessons.
								Choose a different lesson set to begin.
							</div>
						) : null}

						<div className="flex justify-center">
							<button
								type="button"
								onClick={startRound}
								disabled={
									availablePairs.length === 0 || selectedBoardPairCount === 0
								}
								className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
							>
								Start {selectedBoardPairCount} Pair
								{selectedBoardPairCount === 1 ? '' : 's'}
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
						: 'You matched every pair, but you need more than 75% accuracy to earn points.'
				}
				stats={[
					{
						label: 'Correct',
						value: correctMatches,
						valueClassName: 'text-emerald-600',
					},
					{
						label: 'Incorrect',
						value: incorrectAttempts,
						valueClassName: 'text-rose-600',
					},
					{
						label: 'Accuracy',
						value: `${Math.round(accuracy * 100)}%`,
					},
				]}
				rewards={
					passed ? (
						<>
							<p className="mb-4 text-lg font-semibold text-slate-800">
								You earned {completionRewards?.awardedPoints ?? awardedPoints}{' '}
								point
								{(completionRewards?.awardedPoints ?? awardedPoints) === 1
									? ''
									: 's'}
								.
							</p>
							<div className="mx-auto flex w-full max-w-md gap-4">
								<ResultCard
									variant="points"
									value={completionRewards?.awardedPoints ?? awardedPoints}
									tribePointAdded={
										completionRewards?.tribePointAwarded ?? false
									}
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
								These show which English meaning was chosen for the wrong Hebrew
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

	if (currentBatch.length === 0) {
		return null
	}

	return (
		<div className="mx-auto w-full max-w-4xl px-2 pb-8">
			<div className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
						Progress
					</p>
					<p className="mt-1 text-lg font-semibold text-slate-900">
						{completedCount}/{totalCount} pairs matched
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
					onClick={shuffleChoices}
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

			<div className="space-y-6">
				<div className="space-y-4">
					<p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
						Hebrew Words
					</p>
					<div className="grid gap-4 md:grid-cols-2">
						{boardWordCards.map(({ id, card }) => {
							const isActive = activeWordSlot === id
							const assignedChoice = assignments[id]
							return (
								<div
									key={id}
									onClick={() => handleSelectWord(id)}
									role="button"
									tabIndex={assignedChoice ? -1 : 0}
									aria-disabled={Boolean(assignedChoice)}
									onKeyDown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault()
											handleSelectWord(id)
										}
									}}
									className={cn(
										'w-full rounded-3xl border p-5 text-left shadow-sm transition',
										assignedChoice
											? 'cursor-default border-emerald-200 bg-emerald-50 text-emerald-900'
											: isActive
												? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200'
												: 'cursor-pointer border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md',
									)}
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<div className="flex items-center gap-3">
												<p className="text-3xl font-cardo text-slate-900">
													{getDisplayHebrew(card)}
												</p>
												<div
													className={cn(
														'h-3 w-3 rounded-full',
														assignedChoice
															? 'bg-emerald-500'
															: isActive
																? 'bg-sky-500'
																: 'bg-slate-200',
													)}
												/>
											</div>
										</div>
										<button
											type="button"
											onClick={(event) => {
												event.stopPropagation()
												playAudio(card.hebAudio)
											}}
											disabled={!card.hebAudio}
											className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-white shadow transition hover:scale-105 hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
											aria-label={`Play audio for ${card.eng}`}
										>
											<Volume2 className="h-5 w-5" />
										</button>
									</div>
								</div>
							)
						})}
					</div>
				</div>

				<div className="rounded-[2rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
					<p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
						English Meanings
					</p>
					<div className="mt-5 grid gap-3 md:grid-cols-2">
						{choiceOrder.map((choiceId) => {
							const isAssigned = assignedChoiceIds.has(choiceId)
							const isActive = activeGlossChoice === choiceId
							return (
								<button
									key={choiceId}
									type="button"
									onClick={() => handleSelectGloss(choiceId)}
									disabled={isAssigned}
									className={cn(
										'w-full rounded-3xl border px-4 py-4 text-left shadow-sm transition',
										isAssigned
											? 'cursor-default border-emerald-200 bg-emerald-50 text-emerald-900'
											: isActive
												? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200'
												: 'border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md',
									)}
								>
									<div className="flex items-center justify-between gap-3">
										<p className="text-lg font-semibold">
											{choiceLabelById[choiceId]}
										</p>
										<div
											className={cn(
												'h-3 w-3 rounded-full',
												isAssigned
													? 'bg-emerald-500'
													: isActive
														? 'bg-sky-500'
														: 'bg-slate-200',
											)}
										/>
									</div>
								</button>
							)
						})}
					</div>
				</div>
			</div>
		</div>
	)
}
