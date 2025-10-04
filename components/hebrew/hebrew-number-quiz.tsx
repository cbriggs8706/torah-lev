'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

export type GenderedForms = {
	mCardinal?: string
	fCardinal?: string
	mOrdinal?: string
	fOrdinal?: string
	construct?: string | null
	constructF?: string
	constructM?: string
}

export interface HebrewNumber {
	number: number
	audio: GenderedForms & {
		cardinal?: string
		ordinal?: string
	}
	text: GenderedForms & {
		cardinal?: string
		ordinal?: string
	}
	translit: GenderedForms & {
		cardinal?: string
		ordinal?: string
	}
	gematria: string
	categories: ('cardinal' | 'ordinal' | 'construct' | 'biblical')[]
	irregular: {
		hasConstruct: boolean
		genderedConstruct: boolean
	}
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

type FormType = 'cardinal' | 'ordinal' | 'construct'
type GenderType = 'masculine' | 'feminine' | 'both'
type DisplayType = 'number' | 'gematria'
type PromptType = 'audio' | 'visual'

interface HebrewNumberQuizProps {
	numbers: HebrewNumber[]
	userId: string
	pointsOnPass?: number
	filters?: Record<string, number[]>
}

// Circle timer
function CountdownCircle({
	seconds,
	paused,
	onComplete,
	resetKey,
}: {
	seconds: number
	paused: boolean
	onComplete: () => void
	resetKey?: any
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

export default function HebrewNumberQuiz({
	numbers,
	userId,
	pointsOnPass = 5,
	filters = {
		'1-10': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		Tens: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
		// Random: [2, 5, 7, 13, 21, 34],
	},
}: HebrewNumberQuizProps) {
	const [gameStarted, setGameStarted] = useState(false)
	const [studyMode, setStudyMode] = useState(false)
	const [finished, setFinished] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [fontChoice, setFontChoice] = useState<FontChoice>('frank')
	const [timeLimit, setTimeLimit] = useState(3)
	const [shuffled, setShuffled] = useState<HebrewNumber[]>([])
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [wrongAnswers, setWrongAnswers] = useState<HebrewNumber[]>([])
	const [showConfetti, setShowConfetti] = useState(false)
	const [selectedFilter, setSelectedFilter] = useState<string>('All')
	const { width, height } = useWindowSize()
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const [waiting, setWaiting] = useState(true)
	const [paused, setPaused] = useState(false)
	const [finishAudio] = useAudio({ src: '/shofar.mp3', autoPlay: true })
	const [promptType, setPromptType] = useState<PromptType>('visual')

	// NEW filters
	const [formType, setFormType] = useState<FormType>('cardinal')
	const [gender, setGender] = useState<GenderType>('feminine')
	const [displayType, setDisplayType] = useState<DisplayType>('number')

	// pool builder
	// pool builder
	const buildPool = useCallback((): HebrewNumber[] => {
		// Start with filter logic
		const base =
			selectedFilter !== 'All' && filters[selectedFilter]
				? numbers.filter((n) => filters[selectedFilter].includes(n.number))
				: numbers

		// Remove cards that don't have audio for the chosen form/gender
		return base.filter((n) => {
			const audioSrc = getAudioSrc(n, formType, gender)
			return !!audioSrc
		})
	}, [selectedFilter, filters, numbers, formType, gender])

	useEffect(() => {
		if (gameStarted) {
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current.currentTime = 0
				audioRef.current = null
			}
			const pool = buildPool()
			const ordered = studyMode
				? pool
				: [...pool].sort(() => Math.random() - 0.5)
			setShuffled(ordered)
			setCurrentIndex(0)
			setFinished(false)
			setCorrectCount(0)
			setWrongCount(0)
			setWrongAnswers([])
			setWaiting(true) // 👈 always reset here, no conditional
			setPaused(false)
		}
	}, [gameStarted, studyMode]) // 👈 removed waiting

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current.currentTime = 0
				audioRef.current = null
			}
		}
	}, [])

	const currentCard = shuffled[currentIndex]
	useEffect(() => {
		console.log('📢 waiting changed:', waiting, ' currentIndex:', currentIndex)
	}, [waiting, currentIndex])

	useEffect(() => {
		if (!gameStarted || finished || !currentCard || studyMode) return

		const audioSrc = getAudioSrc(currentCard, formType, gender)

		if (promptType === 'audio') {
			// play immediately on card load
			if (audioSrc) {
				if (audioRef.current) {
					audioRef.current.pause()
					audioRef.current.currentTime = 0
				}
				audioRef.current = new Audio(audioSrc)
				audioRef.current.play().catch(() => {})
			}
		}

		// For visual-first: audio waits until countdown ends
	}, [
		gameStarted,
		finished,
		currentIndex,
		currentCard,
		formType,
		gender,
		promptType,
		studyMode,
	])

	function handleCountdownComplete() {
		setWaiting(false)
		if (promptType === 'visual' && currentCard) {
			const audioSrc = getAudioSrc(currentCard, formType, gender)
			if (audioSrc) {
				audioRef.current = new Audio(audioSrc)
				audioRef.current.play().catch(() => {})
			}
		}
	}

	function reset() {
		if (audioRef.current) {
			audioRef.current.pause()
			audioRef.current.currentTime = 0
			audioRef.current = null
		}
		setGameStarted(false)
		setStudyMode(false)
		setFinished(false)
		setShowConfetti(false)
	}

	function handleResponse(correct: boolean, force = false) {
		if (audioRef.current) {
			audioRef.current.pause()
			audioRef.current.currentTime = 0
			audioRef.current = null
		}
		console.log(
			'✅ handleResponse fired. correct:',
			correct,
			' waiting:',
			waiting,
			' index:',
			currentIndex
		)

		if (waiting && !force) return

		if (correct) setCorrectCount((p) => p + 1)
		else {
			setWrongCount((p) => p + 1)
			if (currentCard) setWrongAnswers((p) => [...p, currentCard])
		}

		const last = currentIndex === shuffled.length - 1
		if (last) {
			setFinished(true)
			if (wrongCount + (correct ? 0 : 1) <= 2) setShowConfetti(true)
		} else {
			setCurrentIndex((i) => i + 1)
			setWaiting(true) // 👈 reset for next card
		}
	}

	function fontClassNameFor(font: FontChoice) {
		const classes: Record<FontChoice, string> = {
			times: 'font-times',
			frank: 'font-frank',
			tinos: 'font-tinos',
			cardo: 'font-cardo',
			rashi: 'font-rashi',
			suez: 'font-suez',
			nunito: 'font-nunito',
			sans: 'font-sans',
			arial: 'font-arial',
		}
		return classes[font]
	}

	const passed = wrongCount <= 2

	function getFormFor(num: HebrewNumber) {
		let text: string | undefined
		let translit: string | undefined
		let audio: string | undefined

		const clean = (val?: string | null) => (val == null ? undefined : val)

		if (formType === 'cardinal') {
			if (gender === 'masculine') {
				text = clean(num.text.mCardinal) || clean(num.text.cardinal)
				translit = clean(num.translit.mCardinal) || clean(num.translit.cardinal)
				audio = clean(num.audio.mCardinal) || clean(num.audio.cardinal)
			} else if (gender === 'feminine') {
				text = clean(num.text.fCardinal) || clean(num.text.cardinal)
				translit = clean(num.translit.fCardinal) || clean(num.translit.cardinal)
				audio = clean(num.audio.fCardinal) || clean(num.audio.cardinal)
			} else {
				text =
					[num.text.mCardinal, num.text.fCardinal, num.text.cardinal]
						.map(clean)
						.filter(Boolean)
						.join(' / ') || undefined
				translit =
					[
						num.translit.mCardinal,
						num.translit.fCardinal,
						num.translit.cardinal,
					]
						.map(clean)
						.filter(Boolean)
						.join(' / ') || undefined
				audio =
					clean(num.audio.mCardinal) ||
					clean(num.audio.fCardinal) ||
					clean(num.audio.cardinal)
			}
		}

		if (formType === 'ordinal') {
			if (gender === 'masculine') {
				text = clean(num.text.mOrdinal) || clean(num.text.ordinal)
				translit = clean(num.translit.mOrdinal) || clean(num.translit.ordinal)
				audio = clean(num.audio.mOrdinal) || clean(num.audio.ordinal)
			} else if (gender === 'feminine') {
				text = clean(num.text.fOrdinal) || clean(num.text.ordinal)
				translit = clean(num.translit.fOrdinal) || clean(num.translit.ordinal)
				audio = clean(num.audio.fOrdinal) || clean(num.audio.ordinal)
			} else {
				text =
					[num.text.mOrdinal, num.text.fOrdinal, num.text.ordinal]
						.map(clean)
						.filter(Boolean)
						.join(' / ') || undefined
				translit =
					[num.translit.mOrdinal, num.translit.fOrdinal, num.translit.ordinal]
						.map(clean)
						.filter(Boolean)
						.join(' / ') || undefined
				audio =
					clean(num.audio.mOrdinal) ||
					clean(num.audio.fOrdinal) ||
					clean(num.audio.ordinal)
			}
		}

		if (formType === 'construct') {
			// Same logic as before…
			if (gender === 'masculine') {
				text = clean(num.text.constructM) || clean(num.text.construct)
				translit =
					clean(num.translit.constructM) || clean(num.translit.construct)
				audio = clean(num.audio.constructM) || clean(num.audio.construct)
			} else if (gender === 'feminine') {
				text = clean(num.text.constructF) || clean(num.text.construct)
				translit =
					clean(num.translit.constructF) || clean(num.translit.construct)
				audio = clean(num.audio.constructF) || clean(num.audio.construct)
			} else {
				text =
					[num.text.constructM, num.text.constructF, num.text.construct]
						.map(clean)
						.filter(Boolean)
						.join(' / ') || undefined
				translit =
					[
						num.translit.constructM,
						num.translit.constructF,
						num.translit.construct,
					]
						.map(clean)
						.filter(Boolean)
						.join(' / ') || undefined
				audio =
					clean(num.audio.constructM) ||
					clean(num.audio.constructF) ||
					clean(num.audio.construct)
			}
		}

		return { text, translit, audio }
	}

	function getAudioSrc(
		num: HebrewNumber,
		formType: FormType,
		gender: GenderType
	): string | null {
		if (!num) return null
		if (formType === 'cardinal') {
			return gender === 'feminine'
				? num.audio.fCardinal || num.audio.cardinal || null
				: num.audio.mCardinal || num.audio.cardinal || null
		}
		if (formType === 'ordinal') {
			return gender === 'feminine'
				? num.audio.fOrdinal || num.audio.ordinal || null
				: num.audio.mOrdinal || num.audio.ordinal || null
		}
		if (formType === 'construct') {
			return gender === 'feminine'
				? num.audio.constructF || num.audio.construct || null
				: num.audio.constructM || num.audio.construct || null
		}
		return null
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

			{!gameStarted ? (
				<>
					<h1 className="text-2xl font-bold mb-6">Customize Your Quiz</h1>
					<div className="grid grid-cols-1 md:grid-cols-3">
						{/* Number Set Filters */}
						<div className="col-span-3 md:col-span-1 mb-6">
							<p className="font-medium mb-2">Number Sets</p>
							<div className="flex flex-wrap justify-center gap-2">
								{['All', ...Object.keys(filters)].map((name) => (
									<button
										key={name}
										onClick={() => setSelectedFilter(name)}
										className={`px-3 py-1 border rounded-full text-xs ${
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
						<div className="col-span-3 md:col-span-1 mb-6">
							<p className="font-medium mb-2">Prompt Type</p>
							<div className="flex justify-center gap-2">
								{(['audio', 'visual'] as PromptType[]).map((type) => (
									<button
										key={type}
										onClick={() => setPromptType(type)}
										className={`px-3 py-1 border rounded-full text-xs ${
											promptType === type
												? 'bg-sky-600 text-white'
												: 'bg-gray-200'
										}`}
									>
										{type === 'audio' ? 'Audio First' : 'Visual First'}
									</button>
								))}
							</div>
						</div>

						{/* Display Filter */}
						<div className="col-span-3 md:col-span-1 mb-6">
							<p className="font-medium mb-2">Display</p>
							<div className="flex justify-center gap-2">
								{(['number', 'gematria'] as DisplayType[]).map((d) => (
									<button
										key={d}
										onClick={() => setDisplayType(d)}
										className={`px-3 py-1 border rounded-full text-xs ${
											displayType === d
												? 'bg-sky-600 text-white'
												: 'bg-gray-200'
										}`}
									>
										{d}
									</button>
								))}
							</div>
						</div>

						{/* Form Filter */}
						<div className="col-span-3 md:col-span-1 mb-6">
							<p className="font-medium mb-2">Form</p>
							<div className="flex justify-center gap-2">
								{(['cardinal', 'ordinal', 'construct'] as FormType[]).map(
									(form) => (
										<button
											key={form}
											onClick={() => setFormType(form)}
											className={`px-3 py-1 border rounded-full text-xs ${
												formType === form
													? 'bg-sky-600 text-white'
													: 'bg-gray-200'
											}`}
										>
											{form}
										</button>
									)
								)}
							</div>
						</div>

						{/* Gender Filter */}
						<div className="col-span-3 md:col-span-1 mb-6">
							<p className="font-medium mb-2">Gender</p>
							<div className="flex justify-center gap-2">
								{(['masculine', 'feminine', 'both'] as GenderType[]).map(
									(g) => (
										<button
											key={g}
											onClick={() => setGender(g)}
											className={`px-3 py-1 border rounded-full text-xs ${
												gender === g ? 'bg-sky-600 text-white' : 'bg-gray-200'
											}`}
										>
											{g}
										</button>
									)
								)}
							</div>
						</div>

						{/* Seconds selector */}
						<div className="col-span-3 md:col-span-1 mb-6">
							<p className="font-medium mb-2">Seconds to Answer</p>
							<div className="flex gap-2 justify-center">
								{[1, 3, 5].map((n) => (
									<button
										key={n}
										onClick={() => setTimeLimit(n)}
										className={`px-3 py-1 border rounded-full text-xs ${
											timeLimit === n ? 'bg-sky-600 text-white' : 'bg-gray-200'
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
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4" dir="rtl">
						{shuffled.map((num) => {
							const { text, translit, audio } = getFormFor(num)

							return (
								<div
									key={num.number}
									className="p-4 border rounded-lg flex flex-col items-center text-center"
								>
									{/* number/gematria */}
									<div
										className={`text-5xl ${fontClassNameFor(
											fontChoice
										)} font-bold mb-1`}
									>
										{displayType === 'number' ? num.number : num.gematria}
									</div>
									<div
										className={`text-4xl ${fontClassNameFor(
											fontChoice
										)} text-gray-500 mb-2`}
									>
										{displayType === 'number' ? num.gematria : num.number}
									</div>

									{/* Hebrew text */}
									<div
										className={`text-4xl mb-1 ${fontClassNameFor(fontChoice)}`}
									>
										{text}
									</div>

									{/* Transliteration */}
									<div className="text-lg italic text-gray-700 mb-2">
										{translit}
									</div>

									{/* Audio */}
									{audio && (
										<button
											onClick={() => new Audio(audio).play()}
											className="mt-2 text-sky-600 text-2xl"
										>
											🔊
										</button>
									)}
								</div>
							)
						})}
					</div>
				</div>
			) : finished ? (
				<div className="space-y-4">
					<h2 className="text-2xl font-bold">Quiz Complete!</h2>
					<p>✅ Correct: {correctCount}</p>
					<p>❌ Incorrect: {wrongCount}</p>
					<p
						className={`text-xl font-semibold ${
							passed ? 'text-green-600' : 'text-red-500'
						}`}
					>
						{passed ? '🎉 You Passed!' : '😞 Try again!'}
					</p>

					{/* 🔊 Show missed numbers for review */}
					{wrongAnswers.length > 0 && (
						<div className="mt-6">
							<h3 className="font-medium text-lg mb-2">You missed:</h3>
							<div className="flex flex-wrap justify-center gap-6">
								{wrongAnswers.map((num, i) => {
									const { text, translit, audio } = getFormFor(num)
									return (
										<div
											key={i}
											className="p-4 border rounded-lg flex flex-col items-center text-center w-28"
										>
											{/* number / gematria */}
											<div
												className={`text-4xl font-bold mb-1 ${fontClassNameFor(
													fontChoice
												)}`}
											>
												{displayType === 'number' ? num.number : num.gematria}
											</div>
											<div className="text-2xl font-cardo text-gray-600 mb-2">
												{displayType === 'number' ? num.gematria : num.number}
											</div>

											{/* Hebrew word */}
											<div
												className={`text-2xl mb-1 ${fontClassNameFor(
													fontChoice
												)}`}
											>
												{text}
											</div>

											{/* Transliteration */}
											<div className="text-sm italic text-gray-700 mb-2">
												{translit}
											</div>

											{/* Replay audio */}
											{audio && (
												<button
													onClick={() => {
														const a = new Audio(audio)
														a.play()
													}}
													className="text-xl text-sky-600 hover:text-sky-800"
													aria-label="Replay Audio"
												>
													🔊
												</button>
											)}
										</div>
									)
								})}
							</div>
						</div>
					)}

					<button
						onClick={reset}
						className="mt-6 px-6 py-2 bg-sky-600 text-white rounded-lg"
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
							<div
								className={`text-7xl font-bold mb-4 ${fontClassNameFor(
									fontChoice
								)}`}
							>
								{promptType === 'audio'
									? waiting
										? '?' // hide number until after countdown
										: displayType === 'number'
										? currentCard?.number
										: currentCard?.gematria
									: displayType === 'number'
									? currentCard?.number
									: currentCard?.gematria}
							</div>

							{/* {displayType === 'number'
								? currentCard?.number
								: currentCard?.gematria} */}
						</div>
						<div className="text-lg font-medium text-gray-600 mb-4">
							{formType.charAt(0).toUpperCase() + formType.slice(1)} (
							{gender.charAt(0).toUpperCase() + gender.slice(1)})
						</div>
						{waiting && (
							<CountdownCircle
								key={`${currentIndex}-${waiting}`} // 🔑 force remount per card
								seconds={timeLimit}
								paused={paused}
								onComplete={handleCountdownComplete}
							/>
						)}

						{!waiting && (
							<button
								onClick={() => audioRef.current?.play()}
								className="text-5xl mt-2"
							>
								🔊
							</button>
						)}

						{/* {waiting ? (
							<CountdownCircle
								seconds={timeLimit}
								paused={paused}
								onComplete={() => setWaiting(false)}
							/>
						) : (
							<button
								onClick={() => audioRef.current?.play()}
								className="text-5xl mt-2"
							>
								🔊
							</button>
						)} */}
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
