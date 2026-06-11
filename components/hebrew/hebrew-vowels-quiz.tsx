'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'
import { ActivityFinalScreen } from '@/components/activity-final-screen'

interface HebrewNiqqud {
	char: string
	name: string
	nameAudio: string
	soundAudio: string
	imageKey?: string
}

interface HebrewVowelsQuizProps {
	niqqud: HebrewNiqqud[]
	userId: string
	courseId: number
	pointsOnPass?: number
}

type FontChoice =
	| 'arial'
	| 'times'
	| 'sans'
	| 'frank'
	| 'tinos'
	| 'nunito'
	| 'cardo'
	| 'rashi'
	| 'suez'

function CountdownCircle({ seconds }: { seconds: number }) {
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		let frame = 0
		const totalFrames = seconds * 60
		const interval = setInterval(() => {
			frame++
			setProgress((frame / totalFrames) * 100)
			if (frame >= totalFrames) clearInterval(interval)
		}, 1000 / 60)

		return () => clearInterval(interval)
	}, [seconds])

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
				{Math.ceil(seconds - (progress / 100) * seconds)}
			</text>
		</svg>
	)
}

function fontClassNameFor(font: FontChoice): string {
	const classes: Record<FontChoice, string> = {
		arial: 'font-arial',
		times: 'font-times',
		sans: 'font-sans',
		frank: 'font-frank',
		tinos: 'font-tinos',
		nunito: 'font-nunito',
		cardo: 'font-cardo',
		rashi: 'font-rashi',
		suez: 'font-suez',
	}

	return classes[font] || ''
}

export default function HebrewVowelsQuiz({
	niqqud,
	userId,
	courseId,
	pointsOnPass,
}: HebrewVowelsQuizProps) {
	const [gameStarted, setGameStarted] = useState(false)
	const [timeLimit, setTimeLimit] = useState(3)
	const [fontChoice, setFontChoice] = useState<FontChoice>('frank')
	const [shuffledNiqqud, setShuffledNiqqud] = useState<HebrewNiqqud[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [waiting, setWaiting] = useState(true)
	const [feedback, setFeedback] = useState<null | boolean>(null)
	const [showConfetti, setShowConfetti] = useState(false)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const [wrongAnswers, setWrongAnswers] = useState<HebrewNiqqud[]>([])
	const [finishAudio] = useAudio({ src: '/shofar.mp3', autoPlay: true })
	const { width, height } = useWindowSize()
	const [disabledButtons, setDisabledButtons] = useState(false)
	const [studyMode, setStudyMode] = useState(false)
	const [awardedPoints, setAwardedPoints] = useState<number>(0)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const hasAwardedRef = useRef(false)
	const hebrewExample = 'קָ'

	useEffect(() => {
		if (!gameStarted || niqqud.length === 0) return

		const shuffled = [...niqqud].sort(() => Math.random() - 0.5)
		setShuffledNiqqud(shuffled)
		setCurrentIndex(0)
		setFinished(false)
		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
	}, [gameStarted, niqqud])

	const currentLetter = shuffledNiqqud[currentIndex]

	useEffect(() => {
		if (!gameStarted || finished || waiting || !currentLetter || studyMode) return

		const audio = new Audio(currentLetter.soundAudio)
		audioRef.current = audio
		audio.currentTime = 0

		audio.play().catch(() => {
			console.warn('Audio failed to play. Proceeding anyway.')
		})

		return () => {
			audio.pause()
			audioRef.current = null
		}
	}, [gameStarted, finished, waiting, currentLetter, studyMode])

	useEffect(() => {
		if (!gameStarted || finished || !currentLetter) return

		setWaiting(true)
		setFeedback(null)
		setDisabledButtons(false)

		const timer = setTimeout(() => {
			setWaiting(false)
		}, timeLimit * 1000)

		return () => clearTimeout(timer)
	}, [currentLetter, finished, gameStarted, timeLimit])

	const awardPoints = useCallback(
		async (points: number) => {
			try {
				const res = await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, courseId, points }),
				})
				if (!res.ok) throw new Error('Bad response')
				setAwardedPoints(points)
			} catch (err) {
				console.error('Failed to award points', err)
			}
		},
		[userId, courseId]
	)

	useEffect(() => {
		if (finished && wrongCount > 2) setAwardedPoints(0)
	}, [finished, wrongCount])

	useEffect(() => {
		const passed = wrongCount <= 2 && timeLimit <= 3
		if (finished && passed && !hasAwardedRef.current) {
			hasAwardedRef.current = true
			void awardPoints(typeof pointsOnPass === 'number' ? pointsOnPass : 5)
		}
	}, [finished, wrongCount, timeLimit, pointsOnPass, awardPoints])

	function handleResponse(correct: boolean) {
		if (disabledButtons || !currentLetter) return

		setDisabledButtons(true)
		setFeedback(correct)

		if (correct) {
			setCorrectCount((prev) => prev + 1)
		} else {
			setWrongCount((prev) => prev + 1)
			setWrongAnswers((prev) => [...prev, currentLetter])
		}

		setTimeout(() => {
			const isLast = currentIndex === shuffledNiqqud.length - 1
			if (isLast) {
				setShowConfetti(true)
				setFinished(true)
			} else {
				setCurrentIndex((index) => index + 1)
				setDisabledButtons(false)
			}
		}, 1500)
	}

	function resetToStart() {
		setGameStarted(false)
		setStudyMode(false)
		setShowConfetti(false)
		setFinished(false)
		setCurrentIndex(0)
		setWrongAnswers([])
		setCorrectCount(0)
		setWrongCount(0)
		hasAwardedRef.current = false
		setAwardedPoints(0)
	}

	const total = shuffledNiqqud.length
	const passed = wrongCount <= 2 && timeLimit <= 3
	const isStartDisabled = niqqud.length === 0

	return (
		<div className="relative flex min-h-[600px] w-full mx-auto flex-col rounded-xl border p-6 text-center shadow">
			{gameStarted && (
				<button
					onClick={resetToStart}
					className="absolute left-4 top-4 text-gray-600 hover:text-gray-900"
					aria-label="Back"
				>
					⬅️
				</button>
			)}

			{showConfetti && passed && (
				<>
					<ReactConfetti
						width={width}
						height={height}
						recycle={false}
						numberOfPieces={500}
						tweenDuration={10000}
					/>
					{finishAudio}
				</>
			)}

			{!gameStarted ? (
				<div>
					<h1 className="mb-6 text-2xl font-bold">Customize Your Vowels Quiz</h1>

					<div className="mb-6">
						<p className="mb-2 font-medium">Mode</p>
						<div className="flex justify-center gap-2">
							<div className="rounded-full bg-sky-600 px-4 py-2 text-white">
								Niqqud Names
							</div>
						</div>
					</div>

					<div className="mb-6">
						<p className="mb-2 font-medium">Font</p>
						<div className="flex flex-wrap justify-center gap-2">
							{(
								[
									{ label: 'Times', value: 'times', className: 'font-times' },
									{ label: 'Frank', value: 'frank', className: 'font-frank' },
									{ label: 'Tinos', value: 'tinos', className: 'font-tinos' },
									{ label: 'Cardo', value: 'cardo', className: 'font-cardo' },
									{ label: 'Rashi', value: 'rashi', className: 'font-rashi' },
									{ label: 'Suez', value: 'suez', className: 'font-suez' },
									{ label: 'Nunito', value: 'nunito', className: 'font-nunito' },
									{ label: 'Sans', value: 'sans', className: 'font-sans' },
									{ label: 'Arial', value: 'arial', className: 'font-arial' },
								] as {
									label: string
									value: FontChoice
									className: string
								}[]
							).map(({ label, value, className }) => (
								<div key={value} className="flex flex-col items-center gap-1">
									<button
										onClick={() => setFontChoice(value)}
										className={`rounded-full border px-3 py-1 ${
											fontChoice === value ? 'bg-sky-600 text-white' : 'bg-gray-200'
										}`}
									>
										{label}
									</button>
									<div
										className={`mt-2 text-center text-6xl leading-none ${className} ${
											fontChoice === value ? 'text-sky-600' : 'text-gray-700'
										}`}
										dir="rtl"
									>
										{hebrewExample}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="mb-6">
						<p className="mb-2 font-medium">Seconds to Answer</p>
						<div className="flex justify-center gap-4">
							{[1, 3, 5, 8].map((seconds) => (
								<button
									key={seconds}
									onClick={() => setTimeLimit(seconds)}
									className="rounded-full border bg-gray-200 px-4 py-2"
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
							onChange={(e) => setTimeLimit(Number(e.target.value))}
							className="mt-4 w-24 rounded border p-2 text-center"
						/>
					</div>

					<button
						onClick={() => {
							if (!isStartDisabled) {
								setGameStarted(true)
								setStudyMode(true)
							}
						}}
						disabled={isStartDisabled}
						className={`mr-4 rounded-lg px-6 py-2 text-white transition-colors ${
							isStartDisabled
								? 'cursor-not-allowed bg-gray-400'
								: 'bg-[#4b2a5a] hover:bg-[#5b346b]'
						}`}
					>
						Study Vowels
					</button>

					<button
						onClick={() => {
							if (!isStartDisabled) setGameStarted(true)
						}}
						disabled={isStartDisabled}
						className={`rounded-lg px-6 py-2 text-white transition-colors ${
							isStartDisabled
								? 'cursor-not-allowed bg-gray-400'
								: 'bg-emerald-700 hover:bg-emerald-800'
						}`}
					>
						Start Quiz
					</button>
				</div>
			) : studyMode ? (
				<div className="space-y-4">
					<h2 className="mb-4 text-2xl font-bold">Study the Alphabet</h2>
					<div className="flex flex-wrap justify-center gap-6" dir="rtl">
						{niqqud.map((letter, index) => (
							<div
								key={index}
								className="flex w-24 flex-col items-center rounded-lg border p-4"
							>
								<div
									className={`mb-2 text-6xl ${fontClassNameFor(fontChoice)}`}
									dir="rtl"
								>
									{letter.char}
								</div>

								<button
									onClick={() => {
										const audio = new Audio(letter.soundAudio)
										void audio.play()
									}}
									className="text-xl text-sky-600 hover:text-sky-800"
									aria-label="Replay Audio"
								>
									🔊
								</button>
							</div>
						))}
					</div>
					<button
						onClick={resetToStart}
						className="mt-6 rounded-lg bg-gray-300 px-6 py-2 text-gray-800 hover:bg-gray-400"
					>
						Back
					</button>
				</div>
			) : finished ? (
				<ActivityFinalScreen
					title="Quiz Complete!"
					description={
						passed
							? 'You stayed under the miss limit and earned your points.'
							: "In order to pass, you'll need to miss 2 or fewer using 3 seconds or less."
					}
					stats={[
						{ label: 'Correct', value: correctCount, valueClassName: 'text-emerald-600' },
						{ label: 'Incorrect', value: wrongCount, valueClassName: 'text-rose-600' },
						{ label: 'Points', value: awardedPoints },
					]}
					message={
						<p className={`text-lg font-semibold ${passed ? 'text-emerald-700' : 'text-rose-600'}`}>
							{passed ? 'You passed.' : "Let's try again!"}
						</p>
					}
					actions={
						<div className="flex justify-center">
							<button
								onClick={resetToStart}
								className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-5 py-3 font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
							>
								Start Over
							</button>
						</div>
					}
					reviewSection={
						wrongAnswers.length > 0 ? (
							<div>
								<h3 className="text-center text-xl font-bold text-slate-900">
									Review Missed Vowels
								</h3>
								<div className="mt-5 flex flex-wrap justify-center gap-6">
									{wrongAnswers.map((letter, index) => (
										<div
											key={index}
											className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-4"
										>
											<div
												className={`mb-2 text-7xl ${fontClassNameFor(fontChoice)}`}
												dir="rtl"
											>
												{letter.char}
											</div>

											<button
												onClick={() => {
													const audio = new Audio(letter.soundAudio)
													void audio.play()
												}}
												className="text-xl text-sky-600 hover:text-sky-800"
												aria-label="Replay Audio"
											>
												🔊
											</button>
										</div>
									))}
								</div>
							</div>
						) : undefined
					}
					celebration={
						passed ? (
							<>
								{finishAudio}
								<ReactConfetti
									width={width}
									height={height}
									recycle={false}
									numberOfPieces={500}
									tweenDuration={10000}
								/>
							</>
						) : null
					}
				/>
			) : (
				<>
					<div className="mb-4 flex min-h-[180px] items-center justify-center">
						<div className={`text-[8rem] ${fontClassNameFor(fontChoice)}`}>
							{currentLetter?.char ?? ''}
						</div>
					</div>

					{waiting ? (
						<div className="mb-6 flex justify-center">
							<CountdownCircle seconds={timeLimit} />
						</div>
					) : (
						<button
							onClick={() => audioRef.current?.play()}
							className="mb-4 text-5xl text-sky-600 hover:text-sky-800"
							aria-label="Replay Audio"
						>
							🔊
						</button>
					)}

					<div className="mt-6 flex min-h-[60px] justify-center gap-6">
						<button
							onClick={() => handleResponse(true)}
							disabled={waiting || disabledButtons}
							className={`rounded-lg px-4 py-2 ${
								waiting || disabledButtons
									? 'cursor-not-allowed bg-emerald-200 text-emerald-400'
									: 'bg-emerald-700 text-white hover:bg-emerald-800'
							}`}
						>
							I got it right 👍
						</button>
						<button
							onClick={() => {
								if (!audioRef.current) return
								if (audioRef.current.paused) {
									void audioRef.current.play()
								} else {
									audioRef.current.pause()
								}
							}}
							className="rounded-lg bg-yellow-400 px-4 py-2 text-black hover:bg-yellow-500"
						>
							⏸ Pause
						</button>
						<button
							onClick={() => handleResponse(false)}
							disabled={waiting || disabledButtons}
							className={`rounded-lg px-4 py-2 ${
								waiting || disabledButtons
									? 'cursor-not-allowed bg-[#4b2a5a]/15 text-[#4b2a5a]/45'
									: 'bg-[#4b2a5a] text-white hover:bg-[#5b346b]'
							}`}
						>
							I missed it 👎
						</button>
					</div>

					<div className="mt-4 min-h-[32px]">
						{feedback !== null && (
							<p
								className={`text-lg font-bold ${
									feedback ? 'text-green-600' : 'text-red-500'
								}`}
							>
								{feedback ? 'Great job!' : "Don't worry, you got this!"}
							</p>
						)}
					</div>

					<div className="mt-6">
						<p className="mb-1 text-sm font-medium text-gray-600">
							{currentIndex + 1} / {total}
						</p>
						<div className="h-2 overflow-hidden rounded-full bg-gray-200">
							<div
								className="h-full bg-sky-600 transition-all duration-300"
								style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
							/>
						</div>
					</div>
				</>
			)}
		</div>
	)
}
