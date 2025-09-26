'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'

interface EnglishLetterQuizProps {
	letters: EnglishLetter[]
	userId: string
	pointsOnPass?: number
}

type SimplePhoneme = {
	ipa: string
	type?: string
	grapheme: string
	nameAudio: string
	audio: string
	examples: string[]
}

type ComplexPhoneme = {
	ipa: string
	audio: string
	examples: string[]
	longGrapheme?: string
}

type Phonemes = {
	simple: SimplePhoneme[]
	complex: ComplexPhoneme[]
}

interface EnglishLetter {
	char: string
	nameAudio: string
	phonemes: Phonemes
}

type Mode = 'name' | 'easy' | 'hard' | 'vowel'
type FontChoice =
	| 'arial'
	| 'times'
	| 'nunito'
	| 'suez'
	| 'montecarlo'
	| 'maguntia'
	| 'reeniebeanie'

type SoundInfo = {
	audio: string
	ipa?: string
	examples?: string[]
	grapheme?: string
}

type Card = {
	letter: EnglishLetter
	sound: SimplePhoneme | ComplexPhoneme | { audio: string } // for names
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

export default function EnglishLetterQuiz({
	letters,
	userId,
	pointsOnPass,
}: EnglishLetterQuizProps) {
	const [gameStarted, setGameStarted] = useState(false)
	const [selectedMode, setSelectedMode] = useState<Mode>('name')
	const [timeLimit, setTimeLimit] = useState(3)
	const [fontChoice, setFontChoice] = useState<FontChoice>('nunito')
	const [shuffledCards, setShuffledCards] = useState<Card[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [waiting, setWaiting] = useState(true)
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

	function buildCardPool(letters: EnglishLetter[], mode: Mode): Card[] {
		const pool: Card[] = []

		for (const letter of letters) {
			if (mode === 'name') {
				pool.push({
					letter,
					sound: { audio: letter.nameAudio }, // simple wrapper
				})
			}

			if (mode === 'easy') {
				for (const s of letter.phonemes.simple) {
					pool.push({ letter, sound: s })
				}
			}

			if (mode === 'hard') {
				for (const c of letter.phonemes.complex) {
					pool.push({ letter, sound: c })
				}
			}

			if (mode === 'vowel' && 'aeiou'.includes(letter.char.toLowerCase())) {
				for (const s of letter.phonemes.simple) {
					pool.push({ letter, sound: s })
				}
			}
		}

		return pool
	}

	// Shuffle fresh set
	useEffect(() => {
		if (!gameStarted) return
		if (letters.length === 0) return

		const pool = buildCardPool(letters, selectedMode)
		const shuffled = [...pool].sort(() => Math.random() - 0.5)

		setShuffledCards(shuffled)
		setCurrentIndex(0)
		setFinished(false)
		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
	}, [gameStarted, letters, selectedMode])

	const currentCard = shuffledCards[currentIndex]
	const currentLetter = currentCard?.letter

	const audioRef = useRef<HTMLAudioElement | null>(null)
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
		setFeedback(null)
		setDisabledButtons(false)
		const timer = setTimeout(() => setWaiting(false), timeLimit * 1000)
		return () => clearTimeout(timer)
	}, [currentIndex, gameStarted, timeLimit, finished, currentLetter])

	function handleResponse(correct: boolean) {
		if (disabledButtons) return
		setDisabledButtons(true)
		setFeedback(correct)
		if (correct) setCorrectCount((p) => p + 1)
		else {
			setWrongCount((p) => p + 1)
			setWrongAnswers((p) => [...p, currentLetter])
		}
		setTimeout(() => {
			const isLast = currentIndex === shuffledCards.length - 1
			if (isLast) {
				setShowConfetti(true)
				setFinished(true)
			} else {
				setCurrentIndex((i) => i + 1)
				setDisabledButtons(false)
			}
		}, 1200)
	}

	const total = shuffledCards.length

	function hasIPA(sound: any): sound is SimplePhoneme | ComplexPhoneme {
		return 'ipa' in sound
	}

	function hasExamples(sound: any): sound is SimplePhoneme | ComplexPhoneme {
		return 'examples' in sound
	}

	function hasGrapheme(sound: any): sound is SimplePhoneme {
		return 'grapheme' in sound
	}

	const currentIPA =
		currentCard && hasIPA(currentCard.sound) ? currentCard.sound.ipa : undefined

	const currentExamples =
		currentCard && hasExamples(currentCard.sound)
			? currentCard.sound.examples
			: []

	const currentGrapheme =
		currentCard && hasGrapheme(currentCard.sound)
			? currentCard.sound.grapheme
			: undefined

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

	function resetToStart() {
		setGameStarted(false)
		setStudyMode(false)
		setShowConfetti(false)
		setFinished(false)
		setCurrentIndex(0)
		setWrongAnswers([])
		setCorrectCount(0)
		setWrongCount(0)
	}

	return (
		<div className="w-full mx-auto p-6 text-center border rounded-xl shadow">
			{showConfetti && (
				<ReactConfetti
					width={width}
					height={height}
					recycle={false}
					numberOfPieces={500}
				/>
			)}

			{!gameStarted ? (
				<div>
					<h1 className="text-2xl font-bold mb-6">Customize Your Quiz</h1>

					{/* Mode selection */}
					<div className="mb-6">
						<p className="font-medium mb-2">Select Mode</p>
						<div className="flex justify-center gap-2">
							{(['name', 'easy', 'hard', 'vowel'] as Mode[]).map((mode) => {
								const labels: Record<Mode, string> = {
									name: 'Letter Names',
									easy: 'Simple Sounds',
									hard: 'Complex Sounds',
									vowel: 'Simple Vowels',
								}
								return (
									<button
										key={mode}
										onClick={() => setSelectedMode(mode)}
										className={`px-4 py-2 border rounded-full ${
											selectedMode === mode
												? 'bg-blue-500 text-white'
												: 'bg-gray-200'
										}`}
									>
										{labels[mode]}
									</button>
								)
							})}
						</div>
					</div>

					{/* Font filter */}
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
										ABC
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Seconds customization */}
					<div className="mb-6">
						<p className="font-medium mb-2">Seconds to Answer</p>
						<div className="flex gap-4 justify-center">
							{[1, 3, 5, 8].map((n) => (
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

					<button
						onClick={() => {
							setStudyMode(true)
							setGameStarted(true)
						}}
						className="mr-4 px-6 py-2 bg-purple-600 text-white rounded-lg"
					>
						Study Alphabet
					</button>
					<button
						onClick={() => setGameStarted(true)}
						className="px-6 py-2 bg-green-600 text-white rounded-lg"
					>
						Start Quiz
					</button>
				</div>
			) : studyMode ? (
				<div className="space-y-4">
					<h2 className="text-2xl font-bold mb-4">Study the Alphabet</h2>
					<div className="flex flex-wrap justify-center gap-6">
						{letters.map((l, i) => {
							let items: SoundInfo[] = []
							if (selectedMode === 'name') {
								items = [{ audio: l.nameAudio }]
							} else if (selectedMode === 'easy') {
								items = l.phonemes.simple.map((s) => ({
									audio: s.audio,
									ipa: s.ipa,
									examples: s.examples,
									grapheme: s.grapheme,
								}))
							} else if (selectedMode === 'hard') {
								items = l.phonemes.complex.map((s) => ({
									audio: s.audio,
									ipa: s.ipa,
									examples: s.examples,
								}))
							} else if (selectedMode === 'vowel') {
								if ('aeiou'.includes(l.char.toLowerCase())) {
									items = l.phonemes.simple.map((s) => ({
										audio: s.audio,
										ipa: s.ipa,
										examples: s.examples,
										grapheme: s.grapheme,
									}))
								}
							}

							if (items.length === 0) return null

							return (
								<div
									key={i}
									className="p-4 border rounded-lg flex flex-col items-center w-56"
								>
									{['easy', 'vowel'].includes(selectedMode) ? (
										// Easy + Vowel → Grapheme big
										items.map((s, j) => (
											<div key={j} className="flex flex-col items-center mb-2">
												{s.grapheme && (
													<div
														className={`text-5xl leading-none ${fontClassNameFor(
															fontChoice
														)}`}
													>
														{s.grapheme}
													</div>
												)}
												{s.ipa && (
													<div className="text-base text-gray-800 mt-2">
														{s.ipa}
													</div>
												)}
												{s.examples && s.examples.length > 0 && (
													<div className="text-xs text-gray-600">
														{s.examples.join(', ')}
													</div>
												)}
												<button
													onClick={() => new Audio(s.audio).play()}
													className="mt-1 text-lg text-blue-600 hover:text-blue-800"
													aria-label="Play pronunciation"
												>
													🔊
												</button>
											</div>
										))
									) : (
										// Name + Hard → Upper + lower case letters
										<>
											<div className="flex items-end gap-2 mb-2">
												<div
													className={`text-5xl ${fontClassNameFor(fontChoice)}`}
												>
													{l.char.toUpperCase()}
												</div>
												<div
													className={`text-3xl text-gray-700 ${fontClassNameFor(
														fontChoice
													)}`}
												>
													{l.char.toLowerCase()}
												</div>
											</div>

											{items.map((s, j) => (
												<div key={j} className="text-center mb-2">
													{s.ipa && (
														<div className="text-base text-gray-800">
															{s.ipa}
														</div>
													)}
													{s.examples && s.examples.length > 0 && (
														<div className="text-xs text-gray-600">
															{s.examples.join(', ')}
														</div>
													)}
													<button
														onClick={() => new Audio(s.audio).play()}
														className="mt-1 text-lg text-blue-600 hover:text-blue-800"
														aria-label="Play pronunciation"
													>
														🔊
													</button>
												</div>
											))}
										</>
									)}
								</div>
							)
						})}
					</div>
					<button
						onClick={() => resetToStart()}
						className="mt-6 px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-gray-800"
					>
						Back
					</button>
				</div>
			) : finished ? (
				<div>
					<h2 className="text-2xl font-bold">Quiz Complete!</h2>
					<p>✅ Correct: {correctCount}</p>
					<p>❌ Incorrect: {wrongCount}</p>
					<button
						onClick={resetToStart}
						className="mt-6 px-6 py-2 bg-blue-600 text-white"
					>
						Start Over
					</button>
				</div>
			) : (
				<>
					{/* Prompt */}
					<div className="min-h-[220px] mb-4 flex flex-col justify-center items-center">
						<div className="flex items-end gap-4">
							<div className={`text-[8rem] ${fontClassNameFor(fontChoice)}`}>
								{currentLetter?.char.toUpperCase()}
							</div>
							<div className={`text-[7rem] ${fontClassNameFor(fontChoice)}`}>
								{currentLetter?.char.toLowerCase()}
							</div>
						</div>
						{(selectedMode === 'easy' || selectedMode === 'vowel') &&
							currentGrapheme && (
								<div className="text-4xl mt-2">{currentGrapheme}</div>
							)}
						{currentIPA && <div className="text-xl mt-2">{currentIPA}</div>}
						{currentExamples && (
							<div className="text-sm text-gray-600">
								{currentExamples.join(', ')}
							</div>
						)}
					</div>

					{/* Countdown centered */}
					{waiting ? (
						<div className="mb-6 flex justify-center">
							<CountdownCircle seconds={timeLimit} />
						</div>
					) : (
						<button
							onClick={() => audioRef.current?.play()}
							className="text-5xl"
						>
							🔊
						</button>
					)}

					{/* Self assessment */}
					{!waiting && (
						<div className="flex justify-center gap-6 mt-4">
							<button
								onClick={() => handleResponse(true)}
								className="px-4 py-2 bg-green-500 text-white rounded-lg"
							>
								I got it 👍
							</button>
							<button
								onClick={() => handleResponse(false)}
								className="px-4 py-2 bg-red-500 text-white rounded-lg"
							>
								I missed 👎
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
							{feedback ? 'Great job!' : "Don't worry, try again!"}
						</p>
					)}

					{/* Progress bar */}
					<div className="mt-6">
						<p className="text-sm text-gray-600 mb-1">
							{currentIndex + 1} / {total}
						</p>
						<div className="h-2 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="bg-blue-500 h-full transition-all duration-300"
								style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
							/>
						</div>
					</div>

					{/* Restart */}
					<div className="mt-6">
						<button
							onClick={resetToStart}
							className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-gray-800"
						>
							Back
						</button>
					</div>
				</>
			)}
		</div>
	)
}
