'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

/* ---------- TYPES ---------- */
export interface SpanishNumber {
	number: number
	audio: {
		cardinal?: string
		mCardinal?: string
		fCardinal?: string
		construct?: string
		mOrdinal?: string
		fOrdinal?: string
	}
	text: {
		cardinal?: string
		mCardinal?: string
		fCardinal?: string
		construct?: string
		mOrdinal?: string
		fOrdinal?: string
	}
	translit?: {
		cardinal?: string
		mCardinal?: string
		fCardinal?: string
		construct?: string
		mOrdinal?: string
		fOrdinal?: string
	}
	categories?: string[]
	irregular?: {
		gendered?: boolean
		apocopated?: boolean
	}
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

interface SpanishNumberQuizProps {
	numbers: SpanishNumber[]
	userId: string
	pointsOnPass?: number
	courseId: number
	filters?: Record<string, number[]>
}

const defaultFilters: Record<string, number[]> = {
	'1-10': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
	Tens: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
	Hundreds: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
	Random: [7, 13, 25, 32, 48, 64, 78, 91],
}

/* ---------- COUNTDOWN CIRCLE ---------- */
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

/* ---------- MAIN COMPONENT ---------- */
export default function SpanishNumberQuiz({
	numbers,
	userId,
	pointsOnPass,
	courseId,
	filters = defaultFilters,
}: SpanishNumberQuizProps) {
	const [gameStarted, setGameStarted] = useState(false)
	const [studyMode, setStudyMode] = useState(false)
	const [fontChoice, setFontChoice] = useState<FontChoice>('nunito')
	const [timeLimit, setTimeLimit] = useState(3)
	const [selectedFilter, setSelectedFilter] = useState<string>('All')
	const [promptType, setPromptType] = useState<PromptType>('audio')
	const [shuffled, setShuffled] = useState<SpanishNumber[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [waiting, setWaiting] = useState(true)
	const [paused, setPaused] = useState(false)
	const [finished, setFinished] = useState(false)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [showConfetti, setShowConfetti] = useState(false)
	const { width, height } = useWindowSize()
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const [wrongAnswers, setWrongAnswers] = useState<SpanishNumber[]>([])
	const [awardedPoints, setAwardedPoints] = useState<number>(0)
	const hasAwardedRef = useRef(false)
	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })

	/* ---------- BUILD POOL ---------- */
	const buildPool = useCallback((): SpanishNumber[] => {
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
			const audio = new Audio(currentCard.audio.cardinal)
			audio.play().catch(() => {})
			audioRef.current = audio
		}
	}

	useEffect(() => {
		if (!gameStarted || finished || !currentCard || studyMode) return
		if (promptType === 'audio') {
			const audio = new Audio(currentCard.audio.cardinal)
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
			if (wrongCount + (correct ? 0 : 1) <= 2) setShowConfetti(true)
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

	/* ---------- RENDER ---------- */
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
						Personaliza tu Quiz de Números
					</h1>

					{/* Filter Selection */}
					<div className="mb-6">
						<p className="font-medium mb-2">Conjunto de números</p>
						<div className="flex flex-wrap justify-center gap-2">
							{['All', ...Object.keys(filters)].map((name) => (
								<button
									key={name}
									onClick={() => setSelectedFilter(name)}
									className={`px-4 py-2 border rounded-full ${
										selectedFilter === name
											? 'bg-sky-600 text-white'
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
						<p className="font-medium mb-2">Tipo de pregunta</p>
						<div className="flex justify-center gap-2">
							{(['audio', 'visual'] as PromptType[]).map((type) => (
								<button
									key={type}
									onClick={() => setPromptType(type)}
									className={`px-4 py-2 border rounded-full ${
										promptType === type
											? 'bg-sky-600 text-white'
											: 'bg-gray-200'
									}`}
								>
									{type === 'audio' ? 'Audio primero' : 'Visual primero'}
								</button>
							))}
						</div>
					</div>

					{/* Font and Time Limit identical to English version */}
					{/* ... you can copy those sections unchanged ... */}

					{/* Start buttons */}
					<div className="flex gap-4 justify-center">
						<button
							onClick={() => {
								setStudyMode(true)
								setGameStarted(true)
							}}
							className="px-6 py-2 bg-violet-600 text-white rounded-lg"
						>
							Modo de estudio
						</button>
						<button
							onClick={() => {
								setStudyMode(false)
								setGameStarted(true)
							}}
							className="px-6 py-2 bg-green-600 text-white rounded-lg"
						>
							Comenzar Quiz
						</button>
					</div>
				</>
			) : studyMode ? (
				<div>
					<h2 className="text-xl font-bold mb-4">Estudia los números</h2>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						{shuffled.map((num) => (
							<div
								key={num.number}
								className="p-4 border rounded-lg flex flex-col items-center"
							>
								<div className={`text-5xl ${fontClassNameFor(fontChoice)}`}>
									{num.number}
								</div>
								<div className="text-lg mt-1">{num.text.cardinal}</div>
								<button
									onClick={() => new Audio(num.audio.cardinal).play()}
									className="mt-2 text-sky-600 text-2xl"
								>
									🔊
								</button>
							</div>
						))}
					</div>
				</div>
			) : finished ? (
				<div className="space-y-4">
					<h2 className="text-2xl font-bold">¡Quiz completado!</h2>
					<p className="text-lg">✅ Correctas: {correctCount}</p>
					<p className="text-lg">❌ Incorrectas: {wrongCount}</p>
					<p
						className={`text-xl font-semibold ${
							passed ? 'text-green-600' : 'text-red-500'
						}`}
					>
						{passed ? '🎉 ¡Aprobaste!' : '😞 Intenta otra vez'}
					</p>
					<p className="text-lg">
						⭐ Puntos ganados:{' '}
						<span className="font-semibold">{awardedPoints}</span>
					</p>
					<button
						onClick={reset}
						className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
					>
						Volver a empezar
					</button>
				</div>
			) : (
				<div>
					{/* Quiz Play Screen identical to EnglishNumberQuiz */}
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

					{/* Response buttons */}
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
							¡Lo acerté! 👍
						</button>
						<button
							onClick={() => setPaused((p) => !p)}
							className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
						>
							{paused ? 'Reanudar ⏵' : 'Pausar ⏸'}
						</button>
						<button
							disabled={waiting}
							onClick={() => handleResponse(false)}
							className={`px-4 py-2 rounded-lg ${
								waiting ? 'bg-gray-300 text-gray-500' : 'bg-red-500 text-white'
							}`}
						>
							¡Fallé! 👎
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
