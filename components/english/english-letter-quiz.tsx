'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'
import Image from 'next/image'
import { resolve } from 'path'

interface EnglishLetterQuizProps {
	letters: EnglishLetter[]
	userId: string
	pointsOnPass?: number
}

type Pronunciation = 'american'

/** Allow strings or rich objects for sounds */
type SoundDef =
	| string
	| {
			audio: string
			ipa?: string
			examples?: string[]
	  }

interface EnglishLetter {
	char: string
	nameAudio: string
	phonemes: SoundDef[]
}

type Mode = 'name' | 'sound'
type FontChoice =
	| 'arial'
	| 'times'
	| 'nunito'
	| 'suez'
	| 'montecarlo'
	| 'maguntia'
	| 'reeniebeanie'

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

export default function EnglishLetterQuiz({
	letters,
	userId,
	pointsOnPass,
}: EnglishLetterQuizProps) {
	const [gameStarted, setGameStarted] = useState(false)
	const [selectedMode, setSelectedMode] = useState<Mode>('name')
	const [timeLimit, setTimeLimit] = useState(3)
	const [fontChoice, setFontChoice] = useState<FontChoice>('nunito')
	const [shuffledLetters, setShuffledLetters] = useState<EnglishLetter[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [waiting, setWaiting] = useState(true)
	const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
	const [feedback, setFeedback] = useState<null | boolean>(null)
	const [showConfetti, setShowConfetti] = useState(false)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [finished, setFinished] = useState(false)
	const [wrongAnswers, setWrongAnswers] = useState<EnglishLetter[]>([])
	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })
	const { width, height } = useWindowSize()
	const [disabledButtons, setDisabledButtons] = useState(false)
	const [studyMode, setStudyMode] = useState(false)
	const [awardedPoints, setAwardedPoints] = useState<number>(0)

	// Keeps which sound index to use for each letter (for cycling)
	const soundIndexRef = useRef<Record<string, number>>({})

	// The ONE normalized sound selected for the current prompt (so audio + IPA/examples match)
	const currentSoundInfoRef = useRef<{
		audio: string
		ipa?: string
		examples?: string[]
	} | null>(null)

	useEffect(() => {
		if (!gameStarted) return
		if (letters.length === 0) return

		// Flatten into one entry per phoneme
		const allCards = letters.flatMap((l) =>
			(l.phonemes ?? []).map((s) => {
				const norm = typeof s === 'string' ? { audio: s } : s
				return {
					...l,
					// override so each card points to one specific sound
					phonemes: [norm],
				}
			})
		)

		// Shuffle
		const shuffled = [...allCards].sort(() => Math.random() - 0.5)

		setShuffledLetters(shuffled)
		setCurrentIndex(0)
		setFinished(false)
		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
	}, [gameStarted, letters])

	const currentLetter = shuffledLetters[currentIndex]

	/** Normalize a SoundDef to a concrete {audio, ipa?, examples?} */
	function normalizeSoundDef(s: SoundDef): {
		audio: string
		ipa?: string
		examples?: string[]
	} {
		if (typeof s === 'string') return { audio: s }
		return { audio: s.audio, ipa: s.ipa, examples: s.examples }
	}

	/** Pick (and advance) the sound for the current letter in sound mode; or name in name mode */
	function resolveSoundInfo(letter: EnglishLetter, mode: Mode) {
		if (mode === 'name')
			return { audio: letter.nameAudio } as {
				audio: string
				ipa?: string
				examples?: string[]
			}
		const list = letter.phonemes ?? []
		if (list.length === 0) return { audio: letter.nameAudio }
		const key = letter.char
		const idx = (soundIndexRef.current[key] ?? -1) + 1
		const next = idx % list.length
		soundIndexRef.current[key] = next
		return normalizeSoundDef(list[next])
	}

	/** Prepare one sound info per question so display and audio stay in sync */
	useEffect(() => {
		if (!currentLetter) return
		// set a new sound selection when question changes
		currentSoundInfoRef.current = resolveSoundInfo(currentLetter, selectedMode)
	}, [currentLetter, selectedMode])

	const getAudioSrc = useCallback(() => {
		return currentSoundInfoRef.current?.audio || ''
	}, [])

	const audioRef = useRef<HTMLAudioElement | null>(null)

	// Preload audio (supports both string and object entries)
	useEffect(() => {
		letters.forEach((l) => {
			new Audio(l.nameAudio)
			;(l.phonemes ?? []).forEach((s) => {
				const src = typeof s === 'string' ? s : s.audio
				if (src) new Audio(src)
			})
		})
	}, [letters])

	// Auto-play audio after countdown ends (when waiting === false) unless in study mode
	useEffect(() => {
		if (!gameStarted || finished || waiting || !currentLetter) return
		if (studyMode) return
		const src = getAudioSrc()
		if (!src) {
			setHasPlayedAudio(true)
			return
		}
		const audio = new Audio(src)
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

	// Per-question countdown
	useEffect(() => {
		if (!gameStarted || finished || !currentLetter) return
		setWaiting(true)
		setHasPlayedAudio(false)
		setFeedback(null)
		setDisabledButtons(false)
		const timer = setTimeout(() => setWaiting(false), timeLimit * 1000)
		return () => clearTimeout(timer)
	}, [currentIndex, gameStarted, timeLimit, finished, currentLetter])

	function handleResponse(correct: boolean) {
		if (disabledButtons) return
		setDisabledButtons(true)
		setFeedback(correct)
		if (correct) setCorrectCount((prev) => prev + 1)
		else {
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
	const englishExample = 'ABC'
	const isStartDisabled = letters.length === 0

	// Safety: also restart countdown when selectedMode changes mid-run
	useEffect(() => {
		if (!gameStarted || finished || !currentLetter) return
		setWaiting(true)
		setHasPlayedAudio(false)
		setFeedback(null)
		const timer = setTimeout(() => setWaiting(false), timeLimit * 1000)
		return () => clearTimeout(timer)
	}, [selectedMode]) // eslint-disable-line react-hooks/exhaustive-deps

	function fontClassNameFor(font: FontChoice): string {
		const classes: Record<FontChoice, string> = {
			arial: 'font-arial',
			times: 'font-times',
			nunito: 'font-nunito',
			suez: 'font-suez',
			montecarlo: 'font-montecarlo',
			maguntia: 'font-maguntia',
			reeniebeanie: 'font-reeniebeanie',
		}
		return classes[font] || ''
	}

	const hasAwardedRef = useRef(false)

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
		if (finished && !passed) setAwardedPoints(0)
	}, [finished, passed])

	useEffect(() => {
		if (finished && passed && !hasAwardedRef.current) {
			hasAwardedRef.current = true
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

	// Helper to read the selected prompt’s IPA/examples without advancing indices
	const currentIPA = currentSoundInfoRef.current?.ipa
	const currentExamples = currentSoundInfoRef.current?.examples

	return (
		<div className="w-full mx-auto p-6 text-center border rounded-xl shadow">
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
					<h1 className="text-2xl font-bold mb-6">Start Letter Quiz</h1>

					<div className="mb-6">
						<p className="font-medium mb-2">Select Mode</p>
						<div className="flex justify-center gap-2">
							{(['name', 'sound'] as Mode[]).map((mode) => (
								<button
									key={mode}
									onClick={() => setSelectedMode(mode)}
									className={`px-4 py-2 border rounded-full ${
										selectedMode === mode
											? 'bg-blue-500 text-white'
											: 'bg-gray-200'
									}`}
								>
									{mode === 'name' ? 'Names' : 'Sounds'}
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
										{englishExample}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="mb-6">
						<p className="font-medium mb-2">Seconds to Answer</p>
						<div className="flex gap-4 justify-center">
							{[1, 3, 5, 8].map((n) => (
								<button
									key={n}
									onClick={() => setTimeLimit(n)}
									className="px-4 py-2 border rounded-full bg-gray-200"
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
								: 'bg-purple-600 hover:bg-purple-700'
						} mr-4`}
					>
						Study Alphabet
					</button>

					<button
						onClick={() => {
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
					<div className="flex flex-wrap justify-center gap-6">
						{letters.map((l, i) => (
							<div key={i} className="flex flex-wrap justify-center gap-6">
								{(l.phonemes ?? []).map((s, j) => {
									const norm = typeof s === 'string' ? { audio: s } : s
									return (
										<div
											key={`${l.char}-${j}`}
											className="p-4 border rounded-lg flex flex-col items-center w-56"
										>
											{/* Upper + lower */}
											<div className="flex items-end gap-2 mb-2">
												<div
													className={`text-5xl leading-none ${fontClassNameFor(
														fontChoice
													)}`}
												>
													{l.char.toUpperCase()}
												</div>
												<div
													className={`text-3xl leading-none text-gray-700 ${fontClassNameFor(
														fontChoice
													)}`}
												>
													{l.char.toLowerCase()}
												</div>
											</div>

											{/* IPA + examples */}
											{norm.ipa && (
												<div className="text-base text-gray-800">
													{norm.ipa}
												</div>
											)}
											{norm.examples && norm.examples.length > 0 && (
												<div className="text-xs text-gray-600">
													{norm.examples.join(', ')}
												</div>
											)}

											{/* Play this sound */}
											<button
												onClick={() => new Audio(norm.audio).play()}
												className="mt-2 text-xl text-blue-600 hover:text-blue-800"
												aria-label="Play pronunciation"
											>
												🔊
											</button>
										</div>
									)
								})}
							</div>
						))}
					</div>
					<button
						onClick={() => resetToStart()}
						className="mt-6 px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-gray-800"
					>
						Back
					</button>
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
							: "😞 In order to pass, you'll need to not miss more that 2 using 3 seconds or less. Let's try again!"}
					</p>
					<p className="text-lg">
						⭐ Points earned:{' '}
						<span className="font-semibold">{awardedPoints}</span>
					</p>
					{wrongAnswers.length > 0 && (
						<div className="mt-6">
							<h3 className="font-medium text-lg mb-2">You missed:</h3>
							<div className="flex flex-wrap justify-center gap-6">
								{wrongAnswers.map((l, i) => (
									<div
										key={i}
										className="p-4 border rounded-lg flex flex-col items-center justify-center"
									>
										<div
											className={`text-6xl mb-2 ${fontClassNameFor(
												fontChoice
											)}`}
										>
											{l.char}
										</div>
										<button
											onClick={() => {
												const info = resolveSoundInfo(l, selectedMode)
												const audio = new Audio(info.audio)
												audio.play()
											}}
											className="text-xl text-blue-600 hover:text-blue-800"
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
						className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Start Over
					</button>
				</div>
			) : (
				<>
					{/* PROMPT: Uppercase + lowercase always visible */}
					<div className="min-h-[220px] mb-4 flex flex-col justify-center items-center">
						<div className="flex items-end gap-4">
							<div
								className={`text-[8rem] leading-none ${fontClassNameFor(
									fontChoice
								)}`}
							>
								{currentLetter?.char?.toUpperCase() ?? ''}
							</div>
							<div
								className={`text-[7rem] leading-none ${fontClassNameFor(
									fontChoice
								)}`}
							>
								{currentLetter?.char?.toLowerCase() ?? ''}
							</div>
						</div>

						{currentIPA && (
							<div className="text-2xl text-gray-800 mt-2">{currentIPA}</div>
						)}
						{currentExamples && currentExamples.length > 0 && (
							<div className="text-md text-gray-600 mt-1">
								{currentExamples.join(', ')}
							</div>
						)}
					</div>

					{/* Timer or Replay */}
					{waiting ? (
						<div className="mb-6 flex justify-center">
							<CountdownCircle seconds={timeLimit} />
						</div>
					) : (
						<button
							onClick={() => audioRef.current?.play()}
							className="text-5xl text-blue-600 hover:text-blue-800 mb-4"
							aria-label="Replay Audio"
						>
							🔊
						</button>
					)}

					{/* Self-assessment */}
					{!waiting && (
						<div className="flex justify-center gap-6 mt-4">
							<button
								onClick={() => handleResponse(true)}
								disabled={disabledButtons}
								className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 ${
									disabledButtons ? 'opacity-50 cursor-not-allowed' : ''
								}`}
							>
								I got it right 👍
							</button>
							<button
								onClick={() => handleResponse(false)}
								disabled={disabledButtons}
								className={`px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 ${
									disabledButtons ? 'opacity-50 cursor-not-allowed' : ''
								}`}
							>
								I missed it 👎
							</button>
						</div>
					)}

					{/* Feedback */}
					{feedback !== null && (
						<p
							className={`mt-4 text-lg font-bold ${
								feedback ? 'text-green-600' : 'text-red-500'
							}`}
						>
							{feedback ? 'Great job!' : "Don't worry, you got this!"}
						</p>
					)}

					{/* Progress */}
					<div className="mt-6">
						<p className="text-sm font-medium text-gray-600 mb-1">
							{currentIndex + 1} / {total}
						</p>
						<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="bg-blue-500 h-full transition-all duration-300"
								style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
							></div>
						</div>
					</div>

					{/* Restart */}
					<div className="mt-6">
						<button
							onClick={() => {
								resetToStart()
								setShowConfetti(false)
								setFinished(false)
							}}
							className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-gray-800"
						>
							Restart
						</button>
					</div>
				</>
			)}
		</div>
	)
}
