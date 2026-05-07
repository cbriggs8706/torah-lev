'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

interface HebrewSyllablesQuizProps {
	letters: HebrewLetter[]
	userId: string
	courseId: number
	pointsOnPass?: number
}

type Pronunciation = 'masoretic' | 'sephardic'
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

interface HebrewLetter {
	char: string
	nameAudio: string
	soundAudio: string
	sephardicNameAudio?: string
	sephardicSoundAudio?: string
}

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

const syllableOptions = [
	{ key: 'qamats', symbol: 'ָ' },
	{ key: 'patach', symbol: 'ַ' },
	{ key: 'chataf-patach', symbol: 'ֲ' },
	{ key: 'tsere', symbol: 'ֵ' },
	{ key: 'tsere-yod', symbol: 'י ֵ' },
	{ key: 'segol', symbol: 'ֶ' },
	{ key: 'segol-yod', symbol: 'י ֶ' },
	{ key: 'chataf-segol', symbol: 'ֱ' },
	{ key: 'hiriq', symbol: 'ִ' },
	{ key: 'hiriq-yod', symbol: 'י ִ' },
	{ key: 'holam', symbol: 'ֹ' },
	{ key: 'holam-male', symbol: 'וֹ' },
	{ key: 'chataf-qamats', symbol: 'ֳ' },
	{ key: 'shuruk', symbol: 'וּ' },
	{ key: 'qubutz', symbol: 'ֻ' },
	{ key: 'patach-yod', symbol: 'י ַ' },
	{ key: 'qamats-hey', symbol: 'ה ָ' },
	{ key: 'shva', symbol: 'ְ' },
] as const

export default function HebrewSyllablesQuiz({
	letters,
	userId,
	courseId,
	pointsOnPass,
}: HebrewSyllablesQuizProps) {
	const [gameStarted, setGameStarted] = useState(false)
	const [timeLimit, setTimeLimit] = useState(3)
	const [fontChoice, setFontChoice] = useState<FontChoice>('frank')
	const [shuffledLetters, setShuffledLetters] = useState<HebrewLetter[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [waiting, setWaiting] = useState(true)
	const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
	const [feedback, setFeedback] = useState<null | boolean>(null)
	const [showConfetti, setShowConfetti] = useState(false)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const [wrongAnswers, setWrongAnswers] = useState<HebrewLetter[]>([])
	const [finishAudio] = useAudio({ src: '/shofar.mp3', autoPlay: true })
	const { width, height } = useWindowSize()
	const [selectedVowel, setSelectedVowels] = useState<string[]>([])
	const [disabledButtons, setDisabledButtons] = useState(false)
	const [studyMode, setStudyMode] = useState(false)
	const [awardedPoints, setAwardedPoints] = useState<number>(0)
	const [pronunciation, setPronunciation] = useState<Pronunciation>('sephardic')

	const getActiveNameAudio = useCallback(
		(letter: HebrewLetter) => {
			if (pronunciation === 'sephardic' && letter.sephardicNameAudio) {
				return letter.sephardicNameAudio
			}

			return letter.nameAudio
		},
		[pronunciation]
	)

	const getActiveSoundAudio = useCallback(
		(letter: HebrewLetter) => {
			if (pronunciation === 'sephardic' && letter.sephardicSoundAudio) {
				return letter.sephardicSoundAudio
			}

			return letter.soundAudio
		},
		[pronunciation]
	)

	const filteredLetters = useMemo(() => {
		if (selectedVowel.length === 0) return []

		return letters.filter((letter) => {
			const activeName = getActiveNameAudio(letter) ?? ''
			const match = activeName.match(/name-[^-]+-(.+)\.mp3$/)
			if (!match) return false

			return selectedVowel.includes(match[1])
		})
	}, [getActiveNameAudio, letters, selectedVowel])

	useEffect(() => {
		if (!gameStarted) return

		if (filteredLetters.length === 0) return

		const shuffled = [...filteredLetters].sort(() => Math.random() - 0.5)
		setShuffledLetters(shuffled)
		setCurrentIndex(0)
		setFinished(false)
		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
	}, [filteredLetters, gameStarted])

	const currentLetter = shuffledLetters[currentIndex]

	const getAudioSrc = useCallback(() => {
		if (!currentLetter) return ''
		return getActiveSoundAudio(currentLetter)
	}, [currentLetter, getActiveSoundAudio])

	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		if (!gameStarted || finished || waiting || !currentLetter) return
		if (studyMode) return

		const audio = new Audio(getAudioSrc())
		audioRef.current = audio
		audio.currentTime = 0

		audio
			.play()
			.then(() => setHasPlayedAudio(true))
			.catch(() => {
				console.warn('Audio failed to play. Proceeding anyway.')
				setHasPlayedAudio(true)
			})

		return () => {
			audio.pause()
			audioRef.current = null
		}
	}, [currentIndex, currentLetter, finished, gameStarted, getAudioSrc, studyMode, waiting])

	useEffect(() => {
		if (!gameStarted || finished || !currentLetter) return

		setWaiting(true)
		setHasPlayedAudio(false)
		setFeedback(null)
		setDisabledButtons(false)

		const timer = setTimeout(() => {
			setWaiting(false)
		}, timeLimit * 1000)

		return () => clearTimeout(timer)
	}, [currentIndex, currentLetter, finished, gameStarted, timeLimit])

	function handleResponse(correct: boolean) {
		if (disabledButtons) return

		setDisabledButtons(true)
		setFeedback(correct)

		if (correct) {
			setCorrectCount((prev) => prev + 1)
		} else {
			setWrongCount((prev) => prev + 1)
			setWrongAnswers((prev) => [...prev, currentLetter])
		}

		setTimeout(() => {
			const isLast = currentIndex === shuffledLetters.length - 1
			if (isLast) {
				setShowConfetti(true)
				setFinished(true)
			} else {
				setCurrentIndex((index) => index + 1)
				setDisabledButtons(false)
			}
		}, 1500)
	}

	const total = shuffledLetters.length
	const passed = wrongCount <= 2 && timeLimit <= 3
	const hebrewExample = 'אָ'

	const isStartDisabled = selectedVowel.length === 0 || filteredLetters.length === 0

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

		return classes[font]
	}

	const hasAwardedRef = useRef(false)

	const awardPoints = useCallback(
		async (points: number) => {
			try {
				const response = await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, courseId, points }),
				})

				if (!response.ok) throw new Error('Bad response')
				setAwardedPoints(points)
			} catch (error) {
				console.error('Failed to award points', error)
			}
		},
		[courseId, userId]
	)

	useEffect(() => {
		if (finished && !passed) setAwardedPoints(0)
	}, [finished, passed])

	useEffect(() => {
		if (finished && passed && !hasAwardedRef.current) {
			hasAwardedRef.current = true
			const points = typeof pointsOnPass === 'number' ? pointsOnPass : 5
			awardPoints(points)
		}
	}, [awardPoints, finished, passed, pointsOnPass])

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

	return (
		<div className="relative mx-auto flex min-h-[600px] w-full flex-col rounded-xl border p-6 text-center shadow">
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
					<h1 className="mb-6 text-2xl font-bold">Customize Your Syllables Quiz</h1>
					<div className="mb-6">
						<p className="mb-2 font-medium">Pronunciation</p>
						<div className="flex justify-center gap-2">
							{(['sephardic', 'masoretic'] as Pronunciation[]).map((value) => (
								<button
									key={value}
									onClick={() => setPronunciation(value)}
									className={`rounded-full border px-4 py-2 ${
										pronunciation === value
											? 'bg-sky-600 text-white'
											: 'bg-gray-200'
									}`}
								>
									{value === 'sephardic' ? 'Sephardic (AwB)' : 'Masoretic (older)'}
								</button>
							))}
						</div>
					</div>

					<div className="mb-6">
						<p className="mb-2 font-medium">Select Vowel(s)</p>
						<div className="flex flex-wrap justify-center gap-2">
							<button
								onClick={() => {
									if (selectedVowel.length === syllableOptions.length) {
										setSelectedVowels([])
									} else {
										setSelectedVowels(syllableOptions.map((option) => option.key))
									}
								}}
								className={`rounded-full border px-4 py-2 font-semibold ${
									selectedVowel.length === syllableOptions.length
										? 'bg-red-500 text-white'
										: 'bg-green-600 text-white'
								}`}
							>
								{selectedVowel.length === syllableOptions.length ? 'Clear All' : 'Select All'}
							</button>

							{syllableOptions.map(({ key, symbol }) => (
								<button
									key={key}
									onClick={() =>
										setSelectedVowels((previous) =>
											previous.includes(key)
												? previous.filter((value) => value !== key)
												: [...previous, key]
										)
									}
									className={`h-16 w-16 rounded-full border font-times text-5xl ${
										selectedVowel.includes(key)
											? 'bg-sky-600 text-white'
											: 'bg-gray-200 text-black'
									}`}
								>
									{symbol}
								</button>
							))}
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
										className={`mt-1 text-center text-5xl ${className} ${
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
							<button
								onClick={() => setTimeLimit(1)}
								className="rounded-full border bg-gray-200 px-4 py-2"
							>
								1s
							</button>
							<button
								onClick={() => setTimeLimit(3)}
								className="rounded-full border bg-gray-200 px-4 py-2"
							>
								3s
							</button>
							<button
								onClick={() => setTimeLimit(5)}
								className="rounded-full border bg-gray-200 px-4 py-2"
							>
								5s
							</button>
							<button
								onClick={() => setTimeLimit(8)}
								className="rounded-full border bg-gray-200 px-4 py-2"
							>
								8s
							</button>
						</div>
						<input
							type="number"
							min={1}
							max={10}
							value={timeLimit}
							onChange={(event) => setTimeLimit(Number(event.target.value))}
							className="mt-4 w-24 rounded border p-2 text-center"
						/>
					</div>

					{selectedVowel.length === 0 && (
						<p className="mb-2 font-medium text-red-600">
							Please select at least one syllable to begin.
						</p>
					)}

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
								: 'bg-violet-600 hover:bg-purple-700'
						}`}
					>
						Study Alphabet
					</button>

					<button
						onClick={() => {
							if (!isStartDisabled) setGameStarted(true)
						}}
						disabled={isStartDisabled}
						className={`rounded-lg px-6 py-2 text-white transition-colors ${
							isStartDisabled
								? 'cursor-not-allowed bg-gray-400'
								: 'bg-green-600 hover:bg-green-700'
						}`}
					>
						Start Quiz
					</button>
				</div>
			) : studyMode ? (
				<div className="space-y-4">
					<h2 className="mb-4 text-2xl font-bold">Study the Alphabet</h2>
					<div className="flex flex-wrap justify-center gap-6" dir="rtl">
						{filteredLetters.map((letter, index) => (
							<div
								key={index}
								className="flex w-24 flex-col items-center rounded-lg border p-4"
							>
								<div className={`mb-2 text-5xl ${fontClassNameFor(fontChoice)}`} dir="rtl">
									{letter.char}
								</div>

								<button
									onClick={() => {
										const audio = new Audio(getActiveSoundAudio(letter))
										audio.play()
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
						onClick={() => resetToStart()}
						className="mt-6 rounded-lg bg-gray-300 px-6 py-2 text-gray-800 hover:bg-gray-400"
					>
						Back
					</button>
				</div>
			) : finished ? (
				<div className="space-y-4">
					<h2 className="text-2xl font-bold">Quiz Complete!</h2>
					<p className="text-lg">✅ Correct: {correctCount}</p>
					<p className="text-lg">❌ Incorrect: {wrongCount}</p>
					<p className={`text-xl font-semibold ${passed ? 'text-green-600' : 'text-red-500'}`}>
						{passed
							? '🎉 You Passed!'
							: "😞 In order to pass, you'll need to not miss more that 2 using 3 seconds or less. Let's try again!"}
					</p>
					<p className="text-lg">
						⭐ Points earned: <span className="font-semibold">{awardedPoints}</span>
					</p>

					{wrongAnswers.length > 0 && (
						<div className="mt-6">
							<h3 className="mb-2 text-lg font-medium">You missed:</h3>
							<div className="flex flex-wrap justify-center gap-6">
								{wrongAnswers.map((letter, index) => (
									<div
										key={index}
										className="flex flex-col items-center justify-center rounded-lg border p-4"
									>
										<div className={`mb-2 text-6xl ${fontClassNameFor(fontChoice)}`} dir="rtl">
											{letter.char}
										</div>
										<button
											onClick={() => {
												const audio = new Audio(getActiveSoundAudio(letter))
												audio.play()
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
					)}

					<button
						onClick={() => resetToStart()}
						className="mt-6 rounded-lg bg-sky-600 px-6 py-2 text-white hover:bg-sky-700"
					>
						Start Over
					</button>
				</div>
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
						<>
							<button
								onClick={() => handleResponse(true)}
								disabled={waiting || disabledButtons}
								className={`rounded-lg px-4 py-2 ${
									waiting || disabledButtons
										? 'cursor-not-allowed bg-green-300'
										: 'bg-green-500 hover:bg-green-600'
								}`}
							>
								I got it right 👍
							</button>
							<button
								onClick={() => {
									if (audioRef.current) {
										if (audioRef.current.paused) {
											audioRef.current.play()
										} else {
											audioRef.current.pause()
										}
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
										? 'cursor-not-allowed bg-red-300'
										: 'bg-red-500 hover:bg-red-600'
								}`}
							>
								I missed it 👎
							</button>
						</>
					</div>

					<div className="mt-4 min-h-[32px]">
						{feedback !== null && (
							<p className={`text-lg font-bold ${feedback ? 'text-green-600' : 'text-red-500'}`}>
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
