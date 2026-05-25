'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Volume2 } from 'lucide-react'
import ReactConfetti from 'react-confetti'
import { useAudio, useWindowSize } from 'react-use'
import { awardVocabQuizCompletion } from '@/actions/vocab-quiz-progress'
import { ResultCard } from '@/app/lesson/result-card'
import { ActivityFinalScreen } from '@/components/activity-final-screen'
import LessonFilter from '@/components/filters/filter-lesson'
import { useLessonCards } from '@/hooks/useLessonCards'
import type { HebrewVocab } from '@/lib/vocab'

type HebrewOppositesProps = {
	courseId: number
	currentLesson: string
	data: HebrewVocab[]
}

type OppositePair = {
	key: string
	first: HebrewVocab
	second: HebrewVocab
}

type OppositeItem = {
	key: string
	card: HebrewVocab
	pairKey: string
}

type MistakeReview = {
	key: string
	prompt: HebrewVocab
	guessed: HebrewVocab
	correct: HebrewVocab
}

type CardSide = 'left' | 'right'
type Phase = 'setup' | 'playing' | 'results'

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

function normalizeDisplayKey(card: HebrewVocab) {
	return getDisplayHebrew(card).normalize('NFC')
}

function getRelationLookupId(card: HebrewVocab) {
	if (typeof card.dbId === 'number') return String(card.dbId)
	if (typeof card.id === 'number') return String(card.id)
	return null
}

function isSameCard(a: HebrewVocab, b: HebrewVocab) {
	return getRelationLookupId(a) === getRelationLookupId(b)
}

function playAudio(src?: string) {
	if (!src) return

	const audio = new Audio(src)
	audio.play().catch(() => {})
}

export default function HebrewOpposites({
	courseId,
	currentLesson,
	data,
}: HebrewOppositesProps) {
	const { selectedLessons, setSelectedLessons } = useLessonCards(
		data,
		currentLesson,
	)
	const { width, height } = useWindowSize()
	const [phase, setPhase] = useState<Phase>('setup')
	const [roundVersion, setRoundVersion] = useState(0)
	const [leftColumn, setLeftColumn] = useState<OppositeItem[]>([])
	const [rightColumn, setRightColumn] = useState<OppositeItem[]>([])
	const [matchedKeys, setMatchedKeys] = useState<string[]>([])
	const [activeSelection, setActiveSelection] = useState<{
		side: CardSide
		itemKey: string
	} | null>(null)
	const [statusText, setStatusText] = useState(
		'Tap a word on either side, then tap its opposite.',
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
	const [finishAudio] = useAudio({ src: '/shofar.mp3', autoPlay: true })

	const lessonFilteredCards = useMemo(() => {
		return data.filter((card) => {
			const matchesSelectedLesson =
				selectedLessons.length === 0 ||
				card.lessons.some((lesson) => selectedLessons.includes(String(lesson)))

			return matchesSelectedLesson
		})
	}, [data, selectedLessons])

	const oppositePairs = useMemo(() => {
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
		const pairs: OppositePair[] = []
		const seen = new Set<string>()

		for (const card of lessonFilteredCards) {
			const leftLookupId = getRelationLookupId(card)
			if (!leftLookupId) continue

			for (const antonymId of card.antonyms ?? []) {
				const opposite = byId.get(String(antonymId))
				if (!opposite) continue

				const rightLookupId = getRelationLookupId(opposite)
				if (!rightLookupId) continue

				const pairKey = [leftLookupId, rightLookupId]
					.sort((a, b) => a.localeCompare(b))
					.join('::')
				if (seen.has(pairKey)) continue

				seen.add(pairKey)
				pairs.push({
					key: pairKey,
					first: card,
					second: opposite,
				})
			}
		}

		return pairs
	}, [lessonFilteredCards])

	useEffect(() => {
		if (phase !== 'playing') return

		const leftCounts = new Map<string, number>()
		const rightCounts = new Map<string, number>()
		const shuffledPairs = shuffle(oppositePairs)

		const orientedPairs = shuffledPairs.map((pair) => {
			const firstKey = normalizeDisplayKey(pair.first)
			const secondKey = normalizeDisplayKey(pair.second)

			const firstLeftCount = leftCounts.get(firstKey) ?? 0
			const firstRightCount = rightCounts.get(firstKey) ?? 0
			const secondLeftCount = leftCounts.get(secondKey) ?? 0
			const secondRightCount = rightCounts.get(secondKey) ?? 0

			const scoreFirstLeft =
				Math.max(firstLeftCount + 1 - firstRightCount, 0) +
				Math.max(secondRightCount + 1 - secondLeftCount, 0)
			const scoreSecondLeft =
				Math.max(secondLeftCount + 1 - secondRightCount, 0) +
				Math.max(firstRightCount + 1 - firstLeftCount, 0)

			const putFirstOnLeft =
				scoreFirstLeft === scoreSecondLeft
					? Math.random() >= 0.5
					: scoreFirstLeft < scoreSecondLeft

			const leftCard = putFirstOnLeft ? pair.first : pair.second
			const rightCard = putFirstOnLeft ? pair.second : pair.first

			const leftKey = normalizeDisplayKey(leftCard)
			const rightKey = normalizeDisplayKey(rightCard)

			leftCounts.set(leftKey, (leftCounts.get(leftKey) ?? 0) + 1)
			rightCounts.set(rightKey, (rightCounts.get(rightKey) ?? 0) + 1)

			return {
				left: leftCard,
				right: rightCard,
				pairKey: pair.key,
			}
		})

		setLeftColumn(
			shuffle(
				orientedPairs.map((pair) => ({
					key: `left:${pair.pairKey}`,
					card: pair.left,
					pairKey: pair.pairKey,
				})),
			),
		)
		setRightColumn(
			shuffle(
				orientedPairs.map((pair) => ({
					key: `right:${pair.pairKey}`,
					card: pair.right,
					pairKey: pair.pairKey,
				})),
			),
		)
		setMatchedKeys([])
		setActiveSelection(null)
		setCorrectMatches(0)
		setIncorrectAttempts(0)
		setMistakeReviews([])
		setCompletionRewards(null)
		setCompletionAwarded(false)
		setStatusText('Tap a word on either side, then tap its opposite.')
	}, [oppositePairs, phase, roundVersion])

	const itemsByKey = useMemo(() => {
		const items = new Map<string, OppositeItem>()

		for (const item of [...leftColumn, ...rightColumn]) {
			items.set(item.key, item)
		}

		return items
	}, [leftColumn, rightColumn])

	const activeCard =
		activeSelection != null
			? (itemsByKey.get(activeSelection.itemKey)?.card ?? null)
			: null
	const totalCount = oppositePairs.length
	const completedCount = matchedKeys.length
	const allMatched = totalCount > 0 && completedCount === totalCount
	const totalAttempts = correctMatches + incorrectAttempts
	const accuracy = totalAttempts > 0 ? correctMatches / totalAttempts : 0
	const passed = allMatched && accuracy > 0.75
	const awardedPoints = passed ? totalCount : 0
	const pairByKey = useMemo(
		() => new Map(oppositePairs.map((pair) => [pair.key, pair] as const)),
		[oppositePairs],
	)

	useEffect(() => {
		if (!allMatched || phase !== 'playing') return
		setPhase('results')
	}, [allMatched, phase])

	useEffect(() => {
		if (
			phase !== 'results' ||
			!passed ||
			awardedPoints <= 0 ||
			completionAwarded
		)
			return

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
				console.error('Failed to award opposites completion rewards', error)
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

	function startRound() {
		if (totalCount === 0) return
		setRoundVersion((prev) => prev + 1)
		setPhase('playing')
	}

	function returnToSetup() {
		setPhase('setup')
		setActiveSelection(null)
		setStatusText('Tap a word on either side, then tap its opposite.')
	}

	function handleSelect(side: CardSide, itemKey: string) {
		const item = itemsByKey.get(itemKey)
		if (!item) return
		const card = item.card

		if (matchedKeys.includes(item.pairKey)) return

		if (!activeSelection) {
			setActiveSelection({ side, itemKey })
			setStatusText(`Selected "${card.eng}". Now choose its opposite.`)
			return
		}

		if (activeSelection.side === side) {
			setActiveSelection({ side, itemKey })
			setStatusText(`Selected "${card.eng}". Now choose its opposite.`)
			return
		}

		const anchorItem = itemsByKey.get(activeSelection.itemKey)
		if (!anchorItem) {
			setActiveSelection(null)
			setStatusText('Choose a word, then choose its opposite.')
			return
		}

		if (anchorItem.pairKey !== item.pairKey) {
			const anchorCard = anchorItem.card
			const correctPair = pairByKey.get(anchorItem.pairKey)
			const correctCard =
				correctPair == null
					? null
					: isSameCard(correctPair.first, anchorCard)
						? correctPair.second
						: correctPair.first

			setIncorrectAttempts((prev) => prev + 1)
			if (correctCard) {
				const reviewKey = [
					getRelationLookupId(anchorCard) ?? getDisplayHebrew(anchorCard),
					getRelationLookupId(item.card) ?? getDisplayHebrew(item.card),
					getRelationLookupId(correctCard) ?? getDisplayHebrew(correctCard),
				].join('::')

				setMistakeReviews((prev) =>
					prev.some((review) => review.key === reviewKey)
						? prev
						: [
								...prev,
								{
									key: reviewKey,
									prompt: anchorCard,
									guessed: item.card,
									correct: correctCard,
								},
						  ],
				)
			}
			setStatusText(
				anchorCard
					? `"${card.eng}" is not the opposite of "${anchorCard.eng}". Try again.`
					: 'That pair does not match. Try again.',
			)
			return
		}

		setMatchedKeys((prev) => [...prev, item.pairKey])
		setCorrectMatches((prev) => prev + 1)
		setActiveSelection(null)
		setStatusText(`Matched "${card.eng}" with its opposite.`)
	}

	function renderWordCard(side: CardSide, item: OppositeItem) {
		const isActive =
			activeSelection?.side === side && activeSelection.itemKey === item.key
		const isMatched = matchedKeys.includes(item.pairKey)
		const card = item.card

		return (
			<button
				key={item.key}
				type="button"
				onClick={() => handleSelect(side, item.key)}
				disabled={isMatched}
				className={`w-full rounded-3xl border px-4 py-4 text-left shadow-sm transition ${
					isMatched
						? 'border-emerald-200 bg-emerald-50 text-emerald-900 opacity-70'
						: isActive
							? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200'
							: 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md'
				}`}
			>
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-2xl font-cardo text-slate-900 sm:text-3xl">
							{getDisplayHebrew(card)}
						</p>
						{/* <p className="mt-1 text-sm text-slate-500">{card.eng}</p> */}
					</div>
					<div
						className={`h-3 w-3 rounded-full ${
							isMatched
								? 'bg-emerald-500'
								: isActive
									? 'bg-sky-500'
									: 'bg-slate-200'
						}`}
					/>
				</div>
			</button>
		)
	}

	if (phase === 'setup') {
		return (
			<div className="mx-auto w-full max-w-4xl px-2 pb-8">
				<div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
					<div className="space-y-6">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-slate-900">
								Customize Opposites
							</h2>
							<p className="mt-2 text-sm text-slate-600">
								Choose one or more lessons, then match each vocab item to its
								opposite on the next screen.
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
								No antonym pairs were found for the selected lessons. Choose a
								different lesson set to begin.
							</div>
						) : null}

						<div className="flex justify-center">
							<button
								type="button"
								onClick={startRound}
								disabled={totalCount === 0}
								className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
							>
								Start Opposites
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
								These show what was chosen and what should have been chosen
								instead.
							</p>
							<div className="mt-5 grid gap-4">
								{mistakeReviews.map((review) => (
									<div
										key={`review-${review.key}`}
										className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
									>
										<div className="rounded-2xl bg-white p-4 shadow-sm">
											<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
												Prompt Word
											</p>
											<div className="mt-3 flex items-start justify-between gap-3">
												<div>
													<p className="text-3xl font-cardo text-slate-900">
														{getDisplayHebrew(review.prompt)}
													</p>
													<p className="mt-2 text-base font-semibold text-slate-800">
														{review.prompt.eng}
													</p>
												</div>
												<button
													type="button"
													onClick={() => playAudio(review.prompt.hebAudio)}
													disabled={!review.prompt.hebAudio}
													className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-white shadow transition hover:scale-105 hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-300"
													aria-label={`Play audio for ${review.prompt.eng}`}
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
												<div className="mt-3 flex items-start justify-between gap-3">
													<div>
														<p className="text-3xl font-cardo text-slate-900">
															{getDisplayHebrew(review.guessed)}
														</p>
														<p className="mt-2 text-base font-semibold text-slate-800">
															{review.guessed.eng}
														</p>
													</div>
													<button
														type="button"
														onClick={() => playAudio(review.guessed.hebAudio)}
														disabled={!review.guessed.hebAudio}
														className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white shadow transition hover:scale-105 hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-300"
														aria-label={`Play audio for ${review.guessed.eng}`}
													>
														<Volume2 className="h-5 w-5" />
													</button>
												</div>
											</div>
											<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
												<p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
													Correct Opposite
												</p>
												<div className="mt-3 flex items-start justify-between gap-3">
													<div>
														<p className="text-3xl font-cardo text-slate-900">
															{getDisplayHebrew(review.correct)}
														</p>
														<p className="mt-2 text-base font-semibold text-slate-800">
															{review.correct.eng}
														</p>
													</div>
													<button
														type="button"
														onClick={() => playAudio(review.correct.hebAudio)}
														disabled={!review.correct.hebAudio}
														className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow transition hover:scale-105 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
														aria-label={`Play audio for ${review.correct.eng}`}
													>
														<Volume2 className="h-5 w-5" />
													</button>
												</div>
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

	return (
		<div className="mx-auto w-full max-w-6xl px-2 pb-8">
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

			<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)]">
				<div className="space-y-3">
					<p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
						Column A
					</p>
					{leftColumn.map((item) => renderWordCard('left', item))}
				</div>

				<div className="order-first lg:order-none">
					<div className="sticky top-4 rounded-[2rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 text-center shadow-sm">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
							Selected Word
						</p>

						{activeCard ? (
							<>
								<p className="mt-4 text-4xl font-cardo text-slate-900">
									{getDisplayHebrew(activeCard)}
								</p>
								<p className="mt-3 text-lg font-semibold text-slate-800">
									{activeCard.eng}
								</p>
								{activeCard.engTransliteration ? (
									<p className="mt-1 text-sm text-slate-500">
										{activeCard.engTransliteration}
									</p>
								) : null}
								<button
									type="button"
									onClick={() => playAudio(activeCard.hebAudio)}
									disabled={!activeCard.hebAudio}
									className="mt-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow transition hover:scale-105 hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
									aria-label={`Play audio for ${activeCard.eng}`}
								>
									<Volume2 className="h-6 w-6" />
								</button>
							</>
						) : (
							<div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-500">
								Select a word from either column to inspect it here before
								choosing its opposite.
							</div>
						)}
					</div>
				</div>

				<div className="space-y-3">
					<p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
						Column B
					</p>
					{rightColumn.map((item) => renderWordCard('right', item))}
				</div>
			</div>
		</div>
	)
}
