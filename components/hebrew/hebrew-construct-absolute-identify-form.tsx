'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, X } from 'lucide-react'

import LessonFilter from '@/components/filters/filter-lesson'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLessonCards } from '@/hooks/useLessonCards'
import type { ConstructAbsoluteWord } from '@/lib/data/hebrew/construct-absolute'
import { cn } from '@/lib/utils'

type FormType = 'absolute' | 'construct'

type QuizCard = {
	id: string
	hebrew: string
	type: FormType
	lessonNumber: string
	lessonTitle: string
}

function CountdownCircle({
	seconds,
	paused,
	resetKey,
	onComplete,
}: {
	seconds: number
	paused: boolean
	resetKey: number
	onComplete: () => void
}) {
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		setProgress(0)
	}, [seconds, resetKey])

	useEffect(() => {
		if (paused) return

		let frame = 0
		const totalFrames = seconds * 60
		const interval = setInterval(() => {
			frame += 1
			setProgress((frame / totalFrames) * 100)

			if (frame >= totalFrames) {
				clearInterval(interval)
				onComplete()
			}
		}, 1000 / 60)

		return () => clearInterval(interval)
	}, [seconds, paused, resetKey, onComplete])

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
				stroke="#3b82f6"
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
				{Math.max(0, Math.ceil(seconds - (progress / 100) * seconds))}
			</text>
		</svg>
	)
}

function shuffle<T>(items: T[]) {
	return [...items].sort(() => Math.random() - 0.5)
}

export default function HebrewConstructAbsoluteIdentifyForm({
	words,
	currentLesson,
}: {
	words: ConstructAbsoluteWord[]
	currentLesson: string
}) {
	const lessonFilterData = useMemo(
		() =>
			words.map((word) => ({
				lessons: word.lessonNumber ? [word.lessonNumber] : [],
			})),
		[words]
	)

	const { selectedLessons, setSelectedLessons } = useLessonCards(
		lessonFilterData,
		currentLesson
	)

	const filteredWords = useMemo(
		() =>
			words.filter(
				(word) =>
					selectedLessons.length === 0 ||
					selectedLessons.includes(word.lessonNumber)
			),
		[words, selectedLessons]
	)

	const cards = useMemo<QuizCard[]>(
		() =>
			filteredWords.flatMap((word) => [
				{
					id: `${word.id}-absolute`,
					hebrew: word.absolute,
					type: 'absolute' as const,
					lessonNumber: word.lessonNumber,
					lessonTitle: word.lessonTitle,
				},
				{
					id: `${word.id}-construct`,
					hebrew: word.construct,
					type: 'construct' as const,
					lessonNumber: word.lessonNumber,
					lessonTitle: word.lessonTitle,
				},
			]),
		[filteredWords]
	)

	const [gameStarted, setGameStarted] = useState(false)
	const [deck, setDeck] = useState<QuizCard[]>(() => shuffle(cards))
	const [currentIndex, setCurrentIndex] = useState(0)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const [selectedAnswer, setSelectedAnswer] = useState<FormType | null>(null)
	const [showAnswer, setShowAnswer] = useState(false)
	const [timeLimit, setTimeLimit] = useState(3)
	const [timerKey, setTimerKey] = useState(0)
	const [timedOut, setTimedOut] = useState(false)

	useEffect(() => {
		setDeck(shuffle(cards))
		setCurrentIndex(0)
		setCorrectCount(0)
		setWrongCount(0)
		setFinished(false)
		setSelectedAnswer(null)
		setShowAnswer(false)
		setTimeLimit(3)
		setTimerKey(0)
		setTimedOut(false)
		setGameStarted(false)
	}, [cards])

	const currentCard = deck[currentIndex] ?? null
	const totalCards = deck.length
	const answeredCount = correctCount + wrongCount
	const accuracy = answeredCount
		? Math.round((correctCount / answeredCount) * 100)
		: 0

	function startGame() {
		setDeck(shuffle(cards))
		setCurrentIndex(0)
		setCorrectCount(0)
		setWrongCount(0)
		setFinished(false)
		setSelectedAnswer(null)
		setShowAnswer(false)
		setTimerKey(0)
		setTimedOut(false)
		setGameStarted(true)
	}

	function handleAnswer(answer: FormType) {
		if (!currentCard || showAnswer) return

		const isCorrect = answer === currentCard.type
		setSelectedAnswer(answer)
		setShowAnswer(true)
		setTimedOut(false)

		if (isCorrect) {
			setCorrectCount((current) => current + 1)
			return
		}

		setWrongCount((current) => current + 1)
	}

	function handleTimeout() {
		if (!currentCard || showAnswer) return

		setSelectedAnswer(null)
		setShowAnswer(true)
		setTimedOut(true)
		setWrongCount((current) => current + 1)
	}

	function handleNext() {
		if (currentIndex >= deck.length - 1) {
			setFinished(true)
			return
		}

		setCurrentIndex((current) => current + 1)
		setSelectedAnswer(null)
		setShowAnswer(false)
		setTimedOut(false)
		setTimerKey((current) => current + 1)
	}

	if (!cards.length) {
		return (
			<div className="w-full max-w-3xl space-y-6">
				<LessonFilter
					data={lessonFilterData}
					selectedLessons={selectedLessons}
					setSelectedLessons={setSelectedLessons}
					showRanges
				/>
				<Card className="border-sidebar-border bg-white/85 shadow-sm">
					<CardContent className="p-8 text-center text-neutral-600">
						No construct/absolute words are available yet.
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!gameStarted) {
		return (
			<div className="w-full max-w-3xl space-y-6">
				<LessonFilter
					data={lessonFilterData}
					selectedLessons={selectedLessons}
					setSelectedLessons={setSelectedLessons}
					showRanges
				/>
				<Card className="border-sidebar-border bg-white/85 shadow-sm">
					<CardHeader className="text-center">
						<CardTitle className="text-3xl font-nunito text-neutral-800">
							Absolute or Construct?
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6 px-8 pb-8 text-center">
						<p className="text-sm leading-6 text-neutral-600">
							You&apos;ll see one Hebrew form at a time. Choose whether it is
							absolute or construct, then move to the next card.
						</p>
						<div className="grid gap-4 sm:grid-cols-3">
							<div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-4">
								<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
									Cards
								</p>
								<p className="mt-2 text-3xl font-extrabold text-neutral-800">
									{totalCards}
								</p>
							</div>
							<div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-4">
								<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
									Choices
								</p>
								<p className="mt-2 text-3xl font-extrabold text-neutral-800">
									2
								</p>
							</div>
							<div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-4">
								<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
									Focus
								</p>
								<p className="mt-2 text-lg font-bold text-neutral-700">
									Quick recognition
								</p>
							</div>
						</div>
						<div className="mb-2">
							<p className="font-medium mb-2">Seconds to Answer</p>
							<div className="flex gap-4 justify-center">
								{([1, 3, 5, 8] as const).map((seconds) => (
									<button
										key={seconds}
										onClick={() => setTimeLimit(seconds)}
										className={`px-4 py-2 border rounded-full ${
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
								max={10}
								value={timeLimit}
								onChange={(event) => setTimeLimit(Number(event.target.value))}
								className="w-24 p-2 border text-center rounded mt-4"
							/>
						</div>
						<Button type="button" variant="primary" size="lg" onClick={startGame}>
							Start Quiz
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (finished) {
		return (
			<div className="w-full max-w-3xl space-y-6">
				<LessonFilter
					data={lessonFilterData}
					selectedLessons={selectedLessons}
					setSelectedLessons={setSelectedLessons}
					showRanges
				/>
				<Card className="border-sidebar-border bg-white/85 shadow-sm">
					<CardHeader className="text-center">
						<CardTitle className="text-3xl font-nunito text-neutral-800">
							Round Complete
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6 px-8 pb-8 text-center">
						<div className="grid gap-4 sm:grid-cols-3">
							<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
								<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
									Correct
								</p>
								<p className="mt-2 text-3xl font-extrabold text-emerald-800">
									{correctCount}
								</p>
							</div>
							<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
								<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-700">
									Wrong
								</p>
								<p className="mt-2 text-3xl font-extrabold text-rose-800">
									{wrongCount}
								</p>
							</div>
							<div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-4">
								<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
									Accuracy
								</p>
								<p className="mt-2 text-3xl font-extrabold text-neutral-800">
									{accuracy}%
								</p>
							</div>
						</div>
						<Button
							type="button"
							variant="secondary"
							className="gap-2"
							onClick={startGame}
						>
							<RefreshCw className="h-4 w-4" />
							Play Again
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="w-full max-w-3xl space-y-6">
			<LessonFilter
				data={lessonFilterData}
				selectedLessons={selectedLessons}
				setSelectedLessons={setSelectedLessons}
				showRanges
			/>
			<Card className="border-sidebar-border bg-white/85 shadow-sm">
				<CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="grid gap-4 sm:grid-cols-3">
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Card
							</p>
							<p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-800">
								{currentIndex + 1}/{totalCards}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Correct
							</p>
							<p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-800">
								{correctCount}
							</p>
						</div>
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Accuracy
							</p>
							<p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-800">
								{accuracy}%
							</p>
						</div>
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
								Timer
							</p>
							<p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-800">
								{timeLimit}s
							</p>
						</div>
					</div>

					<Button
						type="button"
						variant="secondary"
						className="gap-2 self-start sm:self-auto"
						onClick={startGame}
					>
						<RefreshCw className="h-4 w-4" />
						Restart
					</Button>
				</CardContent>
			</Card>

			<Card className="border-sidebar-border bg-white/90 shadow-sm">
				<CardHeader className="space-y-2 text-center">
					<div className="flex justify-center">
						<CountdownCircle
							seconds={timeLimit}
							paused={showAnswer}
							resetKey={timerKey}
							onComplete={handleTimeout}
						/>
					</div>
					<p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
						{currentCard?.lessonNumber
							? `Lesson ${currentCard.lessonNumber}`
							: 'Construct practice'}
					</p>
					<CardTitle className="font-cardo text-6xl text-neutral-800 sm:text-7xl">
						{currentCard?.hebrew}
					</CardTitle>
					{currentCard?.lessonTitle ? (
						<p className="text-sm leading-6 text-neutral-600">
							{currentCard.lessonTitle}
						</p>
					) : null}
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="grid gap-4 sm:grid-cols-2">
						<Button
							type="button"
							size="lg"
							variant={
								showAnswer
									? currentCard?.type === 'absolute'
										? 'primary'
										: selectedAnswer === 'absolute'
											? 'danger'
											: 'default'
									: 'default'
							}
							className={cn(
								'h-auto min-h-24 text-base font-nunito',
								showAnswer && currentCard?.type === 'absolute' && 'ring-2 ring-emerald-400'
							)}
							onClick={() => handleAnswer('absolute')}
							disabled={showAnswer}
						>
							Absolute
						</Button>
						<Button
							type="button"
							size="lg"
							variant={
								showAnswer
									? currentCard?.type === 'construct'
										? 'primary'
										: selectedAnswer === 'construct'
											? 'danger'
											: 'default'
									: 'default'
							}
							className={cn(
								'h-auto min-h-24 text-base font-nunito',
								showAnswer && currentCard?.type === 'construct' && 'ring-2 ring-emerald-400'
							)}
							onClick={() => handleAnswer('construct')}
							disabled={showAnswer}
						>
							Construct
						</Button>
					</div>

					{showAnswer ? (
						<div
							className={cn(
								'flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm leading-6',
								selectedAnswer === currentCard?.type
									? 'border-emerald-200 bg-emerald-50 text-emerald-900'
									: 'border-rose-200 bg-rose-50 text-rose-900'
							)}
						>
							{selectedAnswer === currentCard?.type ? (
								<Check className="mt-0.5 h-5 w-5 shrink-0" />
							) : (
								<X className="mt-0.5 h-5 w-5 shrink-0" />
							)}
							<p>
								{timedOut
									? `Time ran out. ${currentCard.hebrew} is ${currentCard.type}.`
									: selectedAnswer === currentCard?.type
									? `Correct. ${currentCard.hebrew} is ${currentCard.type}.`
									: `Not quite. ${currentCard.hebrew} is ${currentCard?.type}.`}
							</p>
						</div>
					) : (
						<p className="text-center text-sm leading-6 text-neutral-600">
							Choose the form that matches the word above.
						</p>
					)}

					{showAnswer ? (
						<div className="flex justify-center">
							<Button type="button" variant="secondary" onClick={handleNext}>
								{currentIndex === totalCards - 1 ? 'Finish Round' : 'Next Word'}
							</Button>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	)
}
