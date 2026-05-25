'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'
import Image from 'next/image'
import { ActivityFinalScreen } from '@/components/activity-final-screen'

interface HebrewLetterQuizProps {
	letters: HebrewLetter[]
	userId: string
	courseId: number
	pointsOnPass?: number
}

type Pronunciation = 'masoretic' | 'sephardic'

interface HebrewLetter {
	char: string
	nameAudio: string
	soundAudio: string
	sephardicNameAudio?: string
	sephardicSoundAudio?: string
	category?: string
	imageKey?: string
}
type Mode = 'name' | 'sound'
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
	| 'modern-fancy'
	| 'modern-round'
	| 'proto'
	| 'torah'

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

export default function HebrewLetterQuiz({
	letters,
	userId,
	courseId,
	pointsOnPass,
}: HebrewLetterQuizProps) {
	const [gameStarted, setGameStarted] = useState(false)
	const [selectedMode, setSelectedMode] = useState<Mode>('name')
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
	const [disabledButtons, setDisabledButtons] = useState(false)
	const [studyMode, setStudyMode] = useState(false)
	const [awardedPoints, setAwardedPoints] = useState<number>(0)
	const [pronunciation, setPronunciation] = useState<Pronunciation>('sephardic')

	const getActiveNameAudio = useCallback(
		(l: HebrewLetter) => {
			if (pronunciation === 'sephardic' && l.sephardicNameAudio)
				return l.sephardicNameAudio
			return l.nameAudio
		},
		[pronunciation]
	)

	const getActiveSoundAudio = useCallback(
		(l: HebrewLetter) => {
			if (pronunciation === 'sephardic' && l.sephardicSoundAudio)
				return l.sephardicSoundAudio
			return l.soundAudio
		},
		[pronunciation]
	)

	// Filter the dataset by mode selection
	const filteredLetters = useMemo(() => {
		const base = letters.filter((l) =>
			(getActiveNameAudio(l) ?? '').includes('base')
		)

		return base.filter((l) => {
			// Exclude letters without an imageKey for image-based fonts
			if (isImageFont(fontChoice)) {
				if (!l.imageKey) return false

				// Exclude final forms for proto
				if (fontChoice === 'proto' && l.imageKey?.includes('sofit'))
					return false
			}

			return true
		})
	}, [letters, fontChoice, getActiveNameAudio])

	useEffect(() => {
		if (!gameStarted) return

		const pool = filteredLetters

		if (pool.length === 0) return

		const shuffled = [...pool].sort(() => Math.random() - 0.5)

		setShuffledLetters(shuffled as HebrewLetter[])
		setCurrentIndex(0)
		setFinished(false)
		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
	}, [gameStarted, filteredLetters])

	const currentLetter = shuffledLetters[currentIndex]

	const getAudioSrc = useCallback(() => {
		if (!currentLetter) return ''
		if (selectedMode === 'name')
			return getActiveNameAudio(currentLetter as HebrewLetter)
		if (selectedMode === 'sound')
			return getActiveSoundAudio(currentLetter as HebrewLetter)
		return ''
	}, [currentLetter, selectedMode, getActiveNameAudio, getActiveSoundAudio])

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
	}, [
		gameStarted,
		currentIndex,
		finished,
		waiting,
		currentLetter,
		studyMode,
		getAudioSrc,
	])

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
	}, [currentIndex, gameStarted, timeLimit, finished, currentLetter])

	function handleResponse(correct: boolean) {
		if (disabledButtons) return // Prevent double-click

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
				setCurrentIndex((i) => i + 1)
				setDisabledButtons(false)
			}
		}, 1500)
	}

	const total = shuffledLetters.length
	const passed = wrongCount <= 2 && timeLimit <= 3
	const hebrewExample = 'א'
	const isStartDisabled = filteredLetters.length === 0

	useEffect(() => {
		if (!gameStarted || finished || !currentLetter) return

		// Start the timer when a new currentLetter is available
		setWaiting(true)
		setHasPlayedAudio(false)
		setFeedback(null)

		const timer = setTimeout(() => {
			setWaiting(false)
		}, timeLimit * 1000)

		return () => clearTimeout(timer)
	}, [currentLetter?.char, currentLetter, finished, gameStarted, timeLimit])

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
			'modern-fancy': '',
			'modern-round': '',
			proto: '',
			torah: '',
		}
		return classes[font] || ''
	}

	function isImageFont(font: FontChoice): boolean {
		return font.startsWith('modern-') || font === 'proto' || font === 'torah'
	}

	const hasAwardedRef = useRef(false)

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
		if (finished && !passed) setAwardedPoints(0)
	}, [finished, passed])

	// Award on pass exactly once per finished run
	useEffect(() => {
		if (finished && passed && !hasAwardedRef.current) {
			hasAwardedRef.current = true
			// simple default: 5 points, or caller-specified
			const pts = typeof pointsOnPass === 'number' ? pointsOnPass : 5
			awardPoints(pts)
		}
	}, [finished, passed, pointsOnPass, awardPoints])

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
		<div className="w-full mx-auto p-6 text-center border rounded-xl shadow flex flex-col min-h-[600px] relative">
			{gameStarted && (
				<button
					onClick={resetToStart}
					className="absolute top-4 left-4 text-gray-600 hover:text-gray-900"
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
					<h1 className="text-2xl font-bold mb-6">
						Customize Your Letter Quiz
					</h1>
					<div className="mb-6">
						<p className="font-medium mb-2">Select Mode</p>
						<div className="flex justify-center gap-2">
							{(['name', 'sound'] as Mode[]).map(
								(mode) => (
									<button
										key={mode}
										onClick={() => setSelectedMode(mode)}
										className={`px-4 py-2 border rounded-full ${
											selectedMode === mode
												? 'bg-sky-600 text-white'
												: 'bg-gray-200'
										}`}
									>
										{mode === 'name'
											? 'Names'
											: 'Sounds'}
									</button>
								)
							)}
						</div>
					</div>
					<div className="mb-6">
						<p className="font-medium mb-2">Pronunciation</p>
						<div className="flex justify-center gap-2">
							{(['sephardic', 'masoretic'] as Pronunciation[]).map((p) => (
								<button
									key={p}
									onClick={() => setPronunciation(p)}
									className={`px-4 py-2 border rounded-full ${
										pronunciation === p
											? 'bg-sky-600 text-white'
											: 'bg-gray-200'
									}`}
								>
									{p === 'sephardic' ? 'Sephardic (AwB)' : 'Masoretic (older)'}
								</button>
							))}
						</div>
					</div>
					<div className="mb-6">
						<p className="font-medium mb-2">Font</p>
						<div className="flex justify-center gap-2 flex-wrap">
							{(
								[
									{
										label: 'Times',
										value: 'times' as FontChoice,
										className: 'font-times',
									},

									{
										label: 'Frank',
										value: 'frank' as FontChoice,
										className: 'font-frank',
									},
									{
										label: 'Tinos',
										value: 'tinos' as FontChoice,
										className: 'font-tinos',
									},

									{
										label: 'Cardo',
										value: 'cardo' as FontChoice,
										className: 'font-cardo',
									},
									{
										label: 'Rashi',
										value: 'rashi' as FontChoice,
										className: 'font-rashi',
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
										label: 'Sans',
										value: 'sans' as FontChoice,
										className: 'font-sans',
									},
									{
										label: 'Arial',
										value: 'arial' as FontChoice,
										className: 'font-arial',
									},
									{
										label: 'Modern Fancy',
										value: 'modern-fancy',
										className: '', // no font class needed
									},
									{
										label: 'Modern Round',
										value: 'modern-round',
										className: '',
									},
									{
										label: 'Proto',
										value: 'proto',
										className: '',
									},
									{
										label: 'Torah',
										value: 'torah',
										className: '',
									},
								] as {
									label: string
									value: FontChoice
									className: string
								}[]
							).map(({ label, value, className }) => (
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
									{isImageFont(value) ? (
										<Image
											src={`/letters/${value}-alef.jpg`}
											alt={`${label} preview`}
											width={60}
											height={60}
											className="h-16 mt-0"
										/>
									) : (
										<div
											className={`text-5xl mt-1 text-center ${className} ${
												fontChoice === value ? 'text-sky-600' : 'text-gray-700'
											}`}
											dir="rtl"
										>
											{hebrewExample}
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					<div className="mb-6">
						<p className="font-medium mb-2">Seconds to Answer</p>
						<div className="flex gap-4 justify-center">
							<button
								onClick={() => setTimeLimit(1)}
								className="px-4 py-2 border rounded-full bg-gray-200"
							>
								1s
							</button>
							<button
								onClick={() => setTimeLimit(3)}
								className="px-4 py-2 border rounded-full bg-gray-200"
							>
								3s
							</button>
							<button
								onClick={() => setTimeLimit(5)}
								className="px-4 py-2 border rounded-full bg-gray-200"
							>
								5s
							</button>
							<button
								onClick={() => setTimeLimit(8)}
								className="px-4 py-2 border rounded-full bg-gray-200"
							>
								8s
							</button>
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
					<button
						onClick={() => {
							if (!isStartDisabled) {
								setGameStarted(true)
								setStudyMode(true)
							}
						}}
						disabled={isStartDisabled}
						className={`px-6 py-2 rounded-lg text-white transition-colors ${
							isStartDisabled
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-violet-600 hover:bg-purple-700'
						} mr-4`}
					>
						Study Alphabet
					</button>

					<button
						onClick={() => {
							console.log(
								'Starting game with',
								filteredLetters.length,
								'letters'
							)

							if (!isStartDisabled) setGameStarted(true)
						}}
						disabled={isStartDisabled}
						className={`px-6 py-2 rounded-lg text-white transition-colors ${
							isStartDisabled
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-green-600 hover:bg-green-700'
						}`}
					>
						Start Quiz
					</button>
				</div>
			) : studyMode ? (
				<div className="space-y-4">
					<h2 className="text-2xl font-bold mb-4">Study the Alphabet</h2>
					<div className="flex flex-wrap justify-center gap-6" dir="rtl">
						{/* {filteredLetters.map((l, i) => ( */}
						{filteredLetters.map((l, i) => (
								<div
									key={i}
									className="p-4 border rounded-lg flex flex-col items-center w-24"
								>
									{'imageKey' in l && isImageFont(fontChoice) && l.imageKey ? (
										<Image
											src={`/letters/${fontChoice}-${l.imageKey}.jpg`}
											alt={l.char}
											width={50}
											height={50}
											className="h-auto w-auto object-contain mb-2"
										/>
									) : (
										<div
											className={`text-5xl mb-2 ${fontClassNameFor(
												fontChoice
											)}`}
											dir="rtl"
										>
											{l.char}
										</div>
									)}

									<button
										onClick={() => {
											const audio = new Audio(
												selectedMode === 'name'
													? getActiveNameAudio(l as HebrewLetter)
													: getActiveSoundAudio(l as HebrewLetter)
											)
											audio.play()
										}}
										className="text-xl text-sky-600 hover:text-sky-800"
										aria-label="Replay Audio"
									>
										🔊
									</button>
								</div>
							)
						)}
					</div>
					<button
						onClick={() => resetToStart()}
						className="mt-6 px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-gray-800"
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
								onClick={() => resetToStart()}
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
									Review Missed Letters
								</h3>
								<div className="mt-5 flex flex-wrap justify-center gap-6">
									{wrongAnswers.map((l, i) => (
										<div
											key={i}
											className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-4"
										>
											{(fontChoice === 'modern-fancy' ||
												fontChoice === 'modern-round' ||
												fontChoice === 'torah' ||
												fontChoice === 'proto') &&
											l.imageKey ? (
												<Image
													src={`/letters/${fontChoice}-${l.imageKey}.jpg`}
													alt={l.char}
													width={30}
													height={30}
													className="mb-2 h-auto w-auto object-contain"
												/>
											) : (
												<div
													className={`mb-2 text-6xl ${fontClassNameFor(fontChoice)}`}
													dir="rtl"
												>
													{l.char}
												</div>
											)}

											<button
												onClick={() => {
													const audio = new Audio(
														selectedMode === 'name'
															? getActiveNameAudio(l)
															: getActiveSoundAudio(l)
													)
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
					<div className="min-h-[180px] mb-4 flex justify-center items-center">
						{(fontChoice === 'modern-fancy' ||
							fontChoice === 'modern-round' ||
							fontChoice === 'torah' ||
							fontChoice === 'proto') &&
						currentLetter?.imageKey ? (
							<Image
								src={`/letters/${fontChoice}-${currentLetter.imageKey}.jpg`}
								alt={currentLetter.char}
								width={150}
								height={150}
								className="h-auto w-auto max-w-[150px] max-h-[150px] object-contain"
							/>
						) : (
							<div className={`text-[8rem] ${fontClassNameFor(fontChoice)}`}>
								{currentLetter?.char ?? ''}
							</div>
						)}
					</div>

					{waiting ? (
						<div className="mb-6 flex justify-center">
							<CountdownCircle seconds={timeLimit} />
						</div>
					) : (
						<button
							onClick={() => audioRef.current?.play()}
							className="text-5xl text-sky-600 hover:text-sky-800 mb-4"
							aria-label="Replay Audio"
						>
							🔊
						</button>
					)}
					<div className="flex justify-center gap-6 mt-6 min-h-[60px]">
						{finished ? null : (
							<>
								<button
									onClick={() => handleResponse(true)}
									disabled={waiting || disabledButtons}
									className={`px-4 py-2 rounded-lg ${
										waiting || disabledButtons
											? 'bg-green-300 cursor-not-allowed'
											: 'bg-green-500 hover:bg-green-600'
									}`}
								>
									I got it right 👍
								</button>
								{/* Pause button */}
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
									className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500"
								>
									⏸ Pause
								</button>
								<button
									onClick={() => handleResponse(false)}
									disabled={waiting || disabledButtons}
									className={`px-4 py-2 rounded-lg ${
										waiting || disabledButtons
											? 'bg-red-300 cursor-not-allowed'
											: 'bg-red-500 hover:bg-red-600'
									}`}
								>
									I missed it 👎
								</button>
							</>
						)}
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
						<p className="text-sm font-medium text-gray-600 mb-1">
							{currentIndex + 1} / {total}
						</p>
						<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="bg-sky-600 h-full transition-all duration-300"
								style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
							></div>
						</div>
					</div>
				</>
			)}
		</div>
	)
}
