'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

export interface EnglishNumber {
	number: number
	eng: string
	spa: string
	por: string
	grk: string
	heb: string
}

type FontChoice =
	| 'arial'
	| 'times'
	| 'nunito'
	| 'suez'
	| 'montecarlo'
	| 'maguntia'
	| 'reeniebeanie'

type PromptType = 'audio' | 'visual'

interface NumberQuizProps {
	numbers: EnglishNumber[]
	userId: string
	pointsOnPass?: number
	filters?: Record<string, number[]>
}

const defaultFilters: Record<string, number[]> = {
	'1-10': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
	Tens: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
	'Often Confused': [13, 30, 14, 40, 15, 50],
}

function CountdownCircle({
	seconds,
	paused,
	onComplete,
}: {
	seconds: number
	paused: boolean
	onComplete: () => void
}) {
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		if (paused) return
		let frame = 0
		const totalFrames = seconds * 60
		const interval = setInterval(() => {
			frame++
			setProgress((frame / totalFrames) * 100)
			if (frame >= totalFrames) {
				clearInterval(interval)
				onComplete()
			}
		}, 1000 / 60)
		return () => clearInterval(interval)
	}, [seconds, paused, onComplete])

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

export default function EnglishNumberQuiz({
	numbers,
	userId,
	pointsOnPass,
	filters = defaultFilters,
}: NumberQuizProps) {
	const [gameStarted, setGameStarted] = useState(false)
	const [studyMode, setStudyMode] = useState(false)
	const [fontChoice, setFontChoice] = useState<FontChoice>('nunito')
	const [timeLimit, setTimeLimit] = useState(3)
	const [selectedFilter, setSelectedFilter] = useState<string>('All')
	const [promptType, setPromptType] = useState<PromptType>('audio')
	const [shuffled, setShuffled] = useState<EnglishNumber[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [waiting, setWaiting] = useState(true)
	const [paused, setPaused] = useState(false)
	const [finished, setFinished] = useState(false)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [showConfetti, setShowConfetti] = useState(false)
	const { width, height } = useWindowSize()
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const [wrongAnswers, setWrongAnswers] = useState<EnglishNumber[]>([])
	const [awardedPoints, setAwardedPoints] = useState<number>(0)
	const hasAwardedRef = useRef(false)
	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })

	const buildPool = useCallback((): EnglishNumber[] => {
		if (selectedFilter !== 'All' && filters[selectedFilter]) {
			return numbers.filter((n) => filters[selectedFilter].includes(n.number))
		}
		return numbers
	}, [selectedFilter, filters, numbers])

	useEffect(() => {
		if (!gameStarted) return
		const pool = buildPool()
		const ordered = studyMode ? pool : [...pool].sort(() => Math.random() - 0.5)
		setShuffled(ordered)
		setCurrentIndex(0)
		setCorrectCount(0)
		setWrongCount(0)
		setFinished(false)
		setWaiting(true)
		setPaused(false)
	}, [gameStarted, studyMode, buildPool])

	const currentCard = shuffled[currentIndex]

	function handleCountdownComplete() {
		setWaiting(false)
		if (promptType === 'visual' && currentCard) {
			const audio = new Audio(currentCard.eng)
			audio.play().catch(() => {})
			audioRef.current = audio
		}
	}

	useEffect(() => {
		if (!gameStarted || finished || !currentCard || studyMode) return
		if (promptType === 'audio') {
			const audio = new Audio(currentCard.eng)
			audio.play().catch(() => {})
			audioRef.current = audio
		}
	}, [gameStarted, currentIndex, studyMode, finished, currentCard, promptType])

	function handleResponse(correct: boolean) {
		if (waiting) return
		if (correct) {
			setCorrectCount((p) => p + 1)
		} else {
			setWrongCount((p) => p + 1)
			if (currentCard) setWrongAnswers((p) => [...p, currentCard])
		}
		const last = currentIndex === shuffled.length - 1
		if (last) {
			setFinished(true)
			if (wrongCount + (correct ? 0 : 1) <= 2) {
				setShowConfetti(true)
			}
		} else {
			setCurrentIndex((i) => i + 1)
			setWaiting(true)
		}
	}

	const passed = wrongCount <= 2

	const awardPoints = useCallback(
		async (points: number) => {
			try {
				const res = await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, points }),
				})
				if (!res.ok) throw new Error('Bad response')
				setAwardedPoints(points)
			} catch (err) {
				console.error('Failed to award points', err)
			}
		},
		[userId]
	)

	useEffect(() => {
		if (finished && passed && !hasAwardedRef.current) {
			hasAwardedRef.current = true
			const pts = typeof pointsOnPass === 'number' ? pointsOnPass : 5
			awardPoints(pts)
		}
	}, [finished, passed, pointsOnPass, awardPoints])

	function reset() {
		setGameStarted(false)
		setStudyMode(false)
		setShowConfetti(false)
		setFinished(false)
		setCurrentIndex(0)
	}

	function fontClassNameFor(font: FontChoice) {
		const classes: Record<FontChoice, string> = {
			arial: 'font-arial',
			times: 'font-times',
			nunito: 'font-nunito',
			suez: 'font-suez',
			montecarlo: 'font-montecarlo',
			maguntia: 'font-maguntia',
			reeniebeanie: 'font-reeniebeanie',
		}
		return classes[font]
	}

	return (
		<div className="w-full mx-auto p-6 text-center border rounded-lg shadow relative">
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

			{/* Back button */}
			{gameStarted && (
				<button
					onClick={reset}
					className="absolute top-4 left-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300"
				>
					⬅
				</button>
			)}

			{/* Setup Screen */}
			{!gameStarted ? (
				<>
					<h1 className="text-2xl font-bold mb-6">
						Customize Your Number Quiz
					</h1>

					{/* Number Set Filters */}
					<div className="mb-6">
						<p className="font-medium mb-2">Number Sets</p>
						<div className="flex flex-wrap justify-center gap-2">
							{['All', ...Object.keys(filters)].map((name) => (
								<button
									key={name}
									onClick={() => setSelectedFilter(name)}
									className={`px-4 py-2 border rounded-full ${
										selectedFilter === name
											? 'bg-blue-500 text-white'
											: 'bg-gray-200'
									}`}
								>
									{name}
								</button>
							))}
						</div>
					</div>

					{/* Prompt Type */}
					<div className="mb-6">
						<p className="font-medium mb-2">Prompt Type</p>
						<div className="flex justify-center gap-2">
							{(['audio', 'visual'] as PromptType[]).map((type) => (
								<button
									key={type}
									onClick={() => setPromptType(type)}
									className={`px-4 py-2 border rounded-full ${
										promptType === type
											? 'bg-blue-500 text-white'
											: 'bg-gray-200'
									}`}
								>
									{type === 'audio' ? 'Audio First' : 'Visual First'}
								</button>
							))}
						</div>
					</div>

					{/* Font selector */}
					<div className="mb-6">
						<p className="font-medium mb-2">Font</p>
						<div className="flex gap-2 justify-center flex-wrap">
							{(
								[
									{
										label: 'Times',
										value: 'times' as FontChoice,
										className: 'font-times',
									},
									{
										label: 'Suez',
										value: 'suez' as FontChoice,
										className: 'font-suez',
									},
									{
										label: 'Nunito',
										value: 'nunito' as FontChoice,
										className: 'font-nunito',
									},
									{
										label: 'Arial',
										value: 'arial' as FontChoice,
										className: 'font-arial',
									},
									{
										label: 'Monte Carlo',
										value: 'montecarlo' as FontChoice,
										className: 'font-montecarlo',
									},
									{
										label: 'Maguntia',
										value: 'maguntia' as FontChoice,
										className: 'font-maguntia',
									},
									{
										label: 'Reenie Beanie',
										value: 'reeniebeanie' as FontChoice,
										className: 'font-reeniebeanie',
									},
								] as { label: string; value: FontChoice; className: string }[]
							).map(({ label, value, className }) => (
								<div key={value} className="flex flex-col items-center gap-1">
									<button
										onClick={() => setFontChoice(value)}
										className={`px-3 py-1 border rounded-full ${
											fontChoice === value
												? 'bg-blue-600 text-white'
												: 'bg-gray-200'
										}`}
									>
										{label}
									</button>
									<div
										className={`text-3xl mt-1 text-center ${className} ${
											fontChoice === value ? 'text-blue-600' : 'text-gray-700'
										}`}
									>
										ABC
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Seconds selector */}
					<div className="mb-6">
						<p className="font-medium mb-2">Seconds to Answer</p>
						<div className="flex gap-2 justify-center">
							{[1, 3, 5].map((n) => (
								<button
									key={n}
									onClick={() => setTimeLimit(n)}
									className={`px-4 py-2 border rounded-full ${
										timeLimit === n ? 'bg-blue-500 text-white' : 'bg-gray-200'
									}`}
								>
									{n}s
								</button>
							))}
						</div>
						<input
							type="number"
							min={1}
							max={10}
							value={timeLimit}
							onChange={(e) => setTimeLimit(Number(e.target.value))}
							className="w-24 p-2 border text-center rounded mt-4"
						/>
					</div>

					{/* Start buttons */}
					<div className="flex gap-4 justify-center">
						<button
							onClick={() => {
								setStudyMode(true)
								setGameStarted(true)
							}}
							className="px-6 py-2 bg-purple-600 text-white rounded-lg"
						>
							Study Mode
						</button>
						<button
							onClick={() => {
								setStudyMode(false)
								setGameStarted(true)
							}}
							className="px-6 py-2 bg-green-600 text-white rounded-lg"
						>
							Start Quiz
						</button>
					</div>
				</>
			) : studyMode ? (
				<div>
					<h2 className="text-xl font-bold mb-4">Study Numbers</h2>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						{shuffled.map((num) => (
							<div
								key={num.number}
								className="p-4 border rounded-lg flex flex-col items-center"
							>
								<div className={`text-5xl ${fontClassNameFor(fontChoice)}`}>
									{num.number}
								</div>
								<button
									onClick={() => new Audio(num.eng).play()}
									className="mt-2 text-blue-500 text-2xl"
								>
									🔊
								</button>
							</div>
						))}
					</div>
				</div>
			) : finished ? (
				<div className="space-y-4">
					<h2 className="text-2xl font-bold">Quiz Complete!</h2>
					<p className="text-lg">✅ Correct: {correctCount}</p>
					<p className="text-lg">❌ Incorrect: {wrongCount}</p>

					<p
						className={`text-xl font-semibold ${
							passed ? 'text-green-600' : 'text-red-500'
						}`}
					>
						{passed
							? `🎉 You Passed!`
							: "😞 In order to pass, you'll need to not miss more than 2. Let's try again!"}
					</p>
					<p className="text-lg">
						⭐ Points earned:{' '}
						<span className="font-semibold">{awardedPoints}</span>
					</p>

					{wrongAnswers.length > 0 && (
						<div className="mt-6">
							<h3 className="font-medium text-lg mb-2">You missed:</h3>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
								{wrongAnswers.map((num, idx) => (
									<div
										key={idx}
										className="p-4 border rounded-lg flex flex-col items-center"
									>
										<div className={`text-5xl ${fontClassNameFor(fontChoice)}`}>
											{num.number}
										</div>
										<button
											onClick={() => new Audio(num.eng).play()}
											className="mt-2 text-blue-500 text-2xl"
										>
											🔊
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					<button
						onClick={reset}
						className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
					>
						Start Over
					</button>
				</div>
			) : (
				<div>
					<div className="min-h-[250px] mb-6 flex flex-col items-center justify-center">
						<div
							className={`text-7xl font-bold mb-4 ${fontClassNameFor(
								fontChoice
							)}`}
						>
							{promptType === 'audio'
								? waiting
									? '?'
									: currentCard?.number
								: currentCard?.number}
						</div>
						{waiting ? (
							<CountdownCircle
								seconds={timeLimit}
								paused={paused}
								onComplete={handleCountdownComplete}
							/>
						) : (
							<button
								onClick={() => audioRef.current?.play()}
								className="text-5xl mt-2"
							>
								🔊
							</button>
						)}
					</div>

					{/* Self assessment */}
					<div className="flex justify-center gap-6 mt-4">
						<button
							disabled={waiting}
							onClick={() => handleResponse(true)}
							className={`px-4 py-2 rounded-lg ${
								waiting
									? 'bg-gray-300 text-gray-500'
									: 'bg-green-500 text-white'
							}`}
						>
							I got it 👍
						</button>
						<button
							onClick={() => setPaused((p) => !p)}
							className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
						>
							{paused ? 'Resume ⏵' : 'Pause ⏸'}
						</button>
						<button
							disabled={waiting}
							onClick={() => handleResponse(false)}
							className={`px-4 py-2 rounded-lg ${
								waiting ? 'bg-gray-300 text-gray-500' : 'bg-red-500 text-white'
							}`}
						>
							I missed 👎
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
