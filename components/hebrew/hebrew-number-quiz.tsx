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

export default function HebrewNumberQuiz({
	numbers,
	userId,
	pointsOnPass = 5,
	filters = {
		'1-10': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		Tens: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
		Random: [2, 5, 7, 13, 21, 34],
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

	// NEW filters
	const [formType, setFormType] = useState<FormType>('cardinal')
	const [gender, setGender] = useState<GenderType>('feminine')
	const [displayType, setDisplayType] = useState<DisplayType>('number')

	// pool builder
	const buildPool = useCallback((): HebrewNumber[] => {
		if (selectedFilter !== 'All' && filters[selectedFilter]) {
			return numbers.filter((n) => filters[selectedFilter].includes(n.number))
		}
		return numbers
	}, [selectedFilter, filters, numbers])

	useEffect(() => {
		if (gameStarted) {
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
			setWaiting(true)
			setPaused(false)
		}
	}, [gameStarted, studyMode, buildPool])

	const currentCard = shuffled[currentIndex]

	// play audio for current form/gender
	useEffect(() => {
		if (!gameStarted || finished || !currentCard || studyMode) return
		let audioSrc: string | undefined | null
		if (formType === 'cardinal') {
			audioSrc =
				gender === 'feminine'
					? currentCard.audio.fCardinal
					: currentCard.audio.mCardinal
		} else if (formType === 'ordinal') {
			audioSrc =
				gender === 'feminine'
					? currentCard.audio.fOrdinal
					: currentCard.audio.mOrdinal
		} else if (formType === 'construct') {
			audioSrc =
				gender === 'feminine'
					? currentCard.audio.constructF || currentCard.audio.construct
					: currentCard.audio.constructM || currentCard.audio.construct
		}
		if (audioSrc) {
			const audio = new Audio(audioSrc)
			audio.play().catch(() => {})
			audioRef.current = audio
		}
	}, [
		gameStarted,
		currentIndex,
		studyMode,
		finished,
		currentCard,
		formType,
		gender,
	])

	function handleResponse(correct: boolean) {
		if (waiting) return
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
			setWaiting(true)
		}
	}

	function reset() {
		setGameStarted(false)
		setStudyMode(false)
		setFinished(false)
		setShowConfetti(false)
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

	return (
		<div className="w-full mx-auto p-6 text-center border rounded-lg shadow relative">
			{showConfetti && passed && (
				<ReactConfetti
					width={width}
					height={height}
					recycle={false}
					numberOfPieces={400}
				/>
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
						<div className="col-span-3 mb-6">
							<p className="font-medium mb-2">Number Sets</p>
							<div className="flex flex-wrap justify-center gap-2">
								{['All', ...Object.keys(filters)].map((name) => (
									<button
										key={name}
										onClick={() => setSelectedFilter(name)}
										className={`px-3 py-1 border rounded-full text-xs ${
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
													? 'bg-blue-500 text-white'
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
												gender === g ? 'bg-blue-500 text-white' : 'bg-gray-200'
											}`}
										>
											{g}
										</button>
									)
								)}
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
												? 'bg-blue-500 text-white'
												: 'bg-gray-200'
										}`}
									>
										{d}
									</button>
								))}
							</div>
						</div>

						{/* Seconds selector */}
						<div className="col-span-3 mb-6">
							<p className="font-medium mb-2">Seconds to Answer</p>
							<div className="flex gap-2 justify-center">
								{[1, 3, 5].map((n) => (
									<button
										key={n}
										onClick={() => setTimeLimit(n)}
										className={`px-3 py-1 border rounded-full text-xs ${
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
											className="mt-2 text-blue-500 text-2xl"
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
					<button
						onClick={reset}
						className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg"
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
							{displayType === 'number'
								? currentCard?.number
								: currentCard?.gematria}
						</div>

						{waiting ? (
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

// export type GenderedForms = {
// 	mCardinal?: string
// 	fCardinal?: string
// 	mOrdinal?: string
// 	fOrdinal?: string
// 	construct?: string | null
// 	constructF?: string
// 	constructM?: string
// }

// export interface HebrewNumber {
// 	number: number
// 	audio: GenderedForms & {
// 		cardinal?: string
// 		ordinal?: string
// 	}
// 	text: GenderedForms & {
// 		cardinal?: string
// 		ordinal?: string
// 	}
// 	translit: GenderedForms & {
// 		cardinal?: string
// 		ordinal?: string
// 	}
// 	gematria: string
// 	categories: ('cardinal' | 'ordinal' | 'construct' | 'biblical')[]
// 	irregular: {
// 		hasConstruct: boolean
// 		genderedConstruct: boolean
// 	}
// }

{
	/* <div>
	<h2 className="text-xl font-bold mb-4">Study Numbers</h2>
	<div className="grid grid-cols-2 sm:grid-cols-4 gap-4" dir="rtl">
		{shuffled.map((num) => (
			<div
				key={num.number}
				className="p-4 border rounded-lg flex flex-col items-center"
			>
				<div className="text-5xl font-bold mb-1">{num.number}</div>

				<div
					className={`text-4xl ${fontClassNameFor(
						fontChoice
					)} text-gray-600 mb-2`}
				>
					{num.gematria}
				</div>

				<div className={`text-4xl mb-1 ${fontClassNameFor(fontChoice)}`}>
					{num.text.mCardinal || num.text.fCardinal || num.text.construct}
				</div>

				<div className="text-lg italic text-gray-700 mb-2">
					{num.translit.mCardinal ||
						num.translit.fCardinal ||
						num.translit.construct}
				</div>

				{num.audio.mCardinal && (
					<button
						onClick={() => new Audio(num.audio.mCardinal!).play()}
						className="mt-2 text-blue-500 text-2xl"
					>
						🔊
					</button>
				)}
			</div>
		))}
	</div>
</div> */
}
