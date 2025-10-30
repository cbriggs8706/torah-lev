'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

/* ---------- TYPES ---------- */
interface SpanishLetterQuizProps {
	letters: SpanishLetter[]
	userId: string
	pointsOnPass?: number
	courseId: number
}

type SimplePhoneme = {
	ipa: string
	grapheme?: string
	nameAudio?: string
	audio: string
	examples: string[]
}

type ComplexPhoneme = {
	ipa: string
	audio: string
	examples: string[]
}

type Phonemes = {
	simple: SimplePhoneme[]
	complex: ComplexPhoneme[]
}

interface SpanishLetter {
	char: string
	nameAudio: string
	phonemes: Phonemes
}

type Mode = 'nombre' | 'fácil' | 'difícil' | 'vocal'

type FontChoice =
	| 'nunito'
	| 'arial'
	| 'times'
	| 'suez'
	| 'montecarlo'
	| 'maguntia'
	| 'reeniebeanie'

type Card = {
	letter: SpanishLetter
	sound: SimplePhoneme | ComplexPhoneme | { audio: string }
}

/* ---------- COUNTDOWN CIRCLE ---------- */
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

/* ---------- MAIN COMPONENT ---------- */
export default function SpanishLetterQuiz({
	letters,
	userId,
	pointsOnPass,
	courseId,
}: SpanishLetterQuizProps) {
	const [gameStarted, setGameStarted] = useState(false)
	const [selectedMode, setSelectedMode] = useState<Mode>('nombre')
	const [timeLimit, setTimeLimit] = useState(3)
	const [fontChoice, setFontChoice] = useState<FontChoice>('nunito')
	const [shuffledCards, setShuffledCards] = useState<Card[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [waiting, setWaiting] = useState(true)
	const [showConfetti, setShowConfetti] = useState(false)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const [wrongAnswers, setWrongAnswers] = useState<Card[]>([])
	const [studyMode, setStudyMode] = useState(false)
	const [awardedPoints, setAwardedPoints] = useState(0)
	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })
	const { width, height } = useWindowSize()
	const hasAwardedRef = useRef(false)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const [revealed, setRevealed] = useState(false)

	/* ---------- BUILD CARD POOL ---------- */
	function buildCardPool(letters: SpanishLetter[], mode: Mode): Card[] {
		const pool: Card[] = []
		for (const letter of letters) {
			if (mode === 'nombre')
				pool.push({ letter, sound: { audio: letter.nameAudio } })
			if (mode === 'fácil')
				for (const s of letter.phonemes.simple) pool.push({ letter, sound: s })
			if (mode === 'difícil')
				for (const c of letter.phonemes.complex) pool.push({ letter, sound: c })
			if (mode === 'vocal' && 'aeiou'.includes(letter.char.toLowerCase()))
				for (const s of letter.phonemes.simple) pool.push({ letter, sound: s })
		}
		return pool
	}

	/* ---------- SHUFFLE ---------- */
	useEffect(() => {
		if (!gameStarted || !letters.length) return
		const pool = buildCardPool(letters, selectedMode)
		const shuffled = [...pool].sort(() => Math.random() - 0.5)
		setShuffledCards(shuffled)
		setCurrentIndex(0)
		setFinished(false)
		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
		setWaiting(true)
		setRevealed(false)
	}, [gameStarted, letters, selectedMode])

	const currentCard = shuffledCards[currentIndex]
	const currentLetter = currentCard?.letter

	/* ---------- AUDIO ---------- */
	useEffect(() => {
		if (!gameStarted || finished || waiting || !currentLetter || studyMode)
			return
		const src = currentCard?.sound.audio
		if (!src) return
		const audio = new Audio(src)
		audioRef.current = audio
		audio.currentTime = 0
		audio.play().catch(() => {})
		return () => {
			audio.pause()
			audioRef.current = null
		}
	}, [
		gameStarted,
		currentIndex,
		finished,
		waiting,
		currentLetter,
		studyMode,
		currentCard?.sound.audio,
	])

	useEffect(() => {
		if (!gameStarted || finished || !currentLetter) return
		setWaiting(true)
		setRevealed(false)
		const timer = setTimeout(() => setWaiting(false), timeLimit * 1000)
		return () => clearTimeout(timer)
	}, [currentIndex, gameStarted, timeLimit, finished, currentLetter])

	/* ---------- RESPONSE ---------- */
	function handleResponse(correct: boolean) {
		setRevealed(true)
		setTimeout(() => {
			if (correct) setCorrectCount((p) => p + 1)
			else if (currentCard) setWrongAnswers((p) => [...p, currentCard])
			const isLast = currentIndex === shuffledCards.length - 1
			if (isLast) {
				if (wrongAnswers.length + (correct ? 0 : 1) <= 2) setShowConfetti(true)
				setFinished(true)
			} else setCurrentIndex((i) => i + 1)
		}, 1000)
	}

	const passed = wrongCount <= 2

	/* ---------- POINTS ---------- */
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

	function fontClassNameFor(font: FontChoice): string {
		const map: Record<FontChoice, string> = {
			arial: 'font-arial',
			times: 'font-times',
			nunito: 'font-nunito',
			suez: 'font-suez',
			montecarlo: 'font-montecarlo',
			maguntia: 'font-maguntia',
			reeniebeanie: 'font-reeniebeanie',
		}
		return map[font] || ''
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
		setRevealed(false)
	}

	/* ---------- RENDER ---------- */
	return (
		<div className="w-full mx-auto p-6 text-center border rounded-xl shadow relative">
			{gameStarted && (
				<button
					onClick={resetToStart}
					className="absolute top-4 left-4 text-gray-600 hover:text-gray-900"
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
					/>
					{finishAudio}
				</>
			)}

			{/* ---------- SETUP ---------- */}
			{!gameStarted && !studyMode && !finished && (
				<>
					<h1 className="text-2xl font-bold mb-6">
						Personaliza tu Quiz de Letras
					</h1>

					{/* Mode selector */}
					<div className="mb-6">
						<p className="font-medium mb-2">Modo de práctica</p>
						<div className="flex flex-wrap justify-center gap-2">
							{(['nombre', 'fácil', 'difícil', 'vocal'] as Mode[]).map((m) => (
								<button
									key={m}
									onClick={() => setSelectedMode(m)}
									className={`px-4 py-2 border rounded-full ${
										selectedMode === m ? 'bg-sky-600 text-white' : 'bg-gray-200'
									}`}
								>
									{m.charAt(0).toUpperCase() + m.slice(1)}
								</button>
							))}
						</div>
					</div>

					{/* Font selector with previews */}
					<div className="mb-6">
						<p className="font-medium mb-2">Tipo de letra</p>
						<div className="flex flex-wrap justify-center gap-4">
							{(
								[
									{ label: 'Nunito', value: 'nunito' },
									{ label: 'Times', value: 'times' },
									{ label: 'Arial', value: 'arial' },
									{ label: 'Suez', value: 'suez' },
									{ label: 'Monte Carlo', value: 'montecarlo' },
									{ label: 'Maguntia', value: 'maguntia' },
									{ label: 'Reenie Beanie', value: 'reeniebeanie' },
								] as { label: string; value: FontChoice }[]
							).map(({ label, value }) => (
								<div key={value} className="flex flex-col items-center gap-1">
									<button
										onClick={() => setFontChoice(value)}
										className={`px-3 py-1 border rounded-full ${
											fontChoice === value
												? 'bg-sky-600 text-white'
												: 'bg-gray-200'
										}`}
									>
										{label}
									</button>
									<div
										className={`text-3xl mt-1 text-center ${fontClassNameFor(
											value
										)} ${
											fontChoice === value ? 'text-sky-600' : 'text-gray-700'
										}`}
									>
										ABC
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Time selector */}
					<div className="mb-6">
						<p className="font-medium mb-2">Segundos para responder</p>
						<div className="flex gap-2 justify-center">
							{[1, 3, 5].map((n) => (
								<button
									key={n}
									onClick={() => setTimeLimit(n)}
									className={`px-4 py-2 border rounded-full ${
										timeLimit === n ? 'bg-sky-600 text-white' : 'bg-gray-200'
									}`}
								>
									{n}s
								</button>
							))}
						</div>
					</div>

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
							Comenzar quiz
						</button>
					</div>
				</>
			)}

			{/* ---------- STUDY MODE ---------- */}
			{gameStarted && studyMode && (
				<div>
					<h2 className="text-xl font-bold mb-4">Estudia las letras</h2>
					<div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
						{letters
							.filter((l) =>
								selectedMode === 'vocal'
									? 'aeiou'.includes(l.char.toLowerCase())
									: true
							)
							.map((l) => (
								<div
									key={l.char}
									className="p-4 border rounded-lg flex flex-col items-center"
								>
									<div className={`text-5xl ${fontClassNameFor(fontChoice)}`}>
										{l.char.toUpperCase()}
									</div>
									<button
										onClick={() => new Audio(l.nameAudio).play()}
										className="mt-2 text-sky-600 text-2xl"
									>
										🔊
									</button>
								</div>
							))}
					</div>
				</div>
			)}

			{/* ---------- QUIZ MODE ---------- */}
			{gameStarted && !studyMode && !finished && currentCard && (
				<div>
					<div className="min-h-[250px] mb-6 flex flex-col items-center justify-center">
						<div
							className={`text-7xl font-bold mb-4 ${fontClassNameFor(
								fontChoice
							)}`}
						>
							{currentLetter?.char.toUpperCase()}
						</div>
						{waiting ? (
							<CountdownCircle seconds={timeLimit} />
						) : (
							<button
								onClick={() => audioRef.current?.play()}
								className="text-5xl mt-2"
							>
								🔊
							</button>
						)}
						{revealed && (
							<div className="mt-3">
								{(currentCard as any).sound?.ipa && (
									<p className="text-blue-600 text-lg italic">
										{(currentCard as any).sound.ipa}
									</p>
								)}
								{(currentCard as any).sound?.examples?.length > 0 && (
									<p className="text-gray-600 text-sm mt-1">
										{(currentCard as any).sound.examples.join(', ')}
									</p>
								)}
							</div>
						)}
					</div>

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
							Lo supe 👍
						</button>
						<button
							disabled={waiting}
							onClick={() => handleResponse(false)}
							className={`px-4 py-2 rounded-lg ${
								waiting ? 'bg-gray-300 text-gray-500' : 'bg-red-500 text-white'
							}`}
						>
							No lo supe 👎
						</button>
					</div>
				</div>
			)}

			{/* ---------- RESULTS ---------- */}
			{finished && (
				<div>
					<h2 className="text-2xl font-bold mb-4">¡Quiz completado!</h2>
					<p className="text-lg">✅ Correctas: {correctCount}</p>
					<p className="text-lg">❌ Incorrectas: {wrongAnswers.length}</p>
					<p
						className={`text-xl font-semibold ${
							passed ? 'text-green-600' : 'text-red-500'
						}`}
					>
						{passed
							? '🎉 ¡Aprobaste!'
							: 'Inténtalo otra vez (máximo 2 errores permitidos).'}
					</p>
					<p className="text-lg mt-2">
						⭐ Puntos ganados:{' '}
						<span className="font-semibold">{awardedPoints}</span>
					</p>

					<button
						onClick={resetToStart}
						className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
					>
						Reiniciar
					</button>
				</div>
			)}
		</div>
	)
}
