'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAudio, useWindowSize } from 'react-use'
import ReactConfetti from 'react-confetti'
import Image from 'next/image'

interface HebrewLetter {
	char: string
	nameAudio: string
	soundAudio: string
	category?: string
	imageKey?: string
}

type Mode = 'name' | 'sound' | 'niqqud'
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

interface LetterQuizProps {
	letters: HebrewLetter[]
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

const niqqudOptions = [
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
	// { key: 'dagesh', symbol: 'ּ' },
] as const

export default function LetterQuiz({ letters }: LetterQuizProps) {
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
	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })
	const { width, height } = useWindowSize()
	const [selectedNiqqud, setSelectedNiqqud] = useState<string[]>([])
	const [disabledButtons, setDisabledButtons] = useState(false)

	// Filter the dataset by mode selection
	const filteredLetters = useMemo(() => {
		let base: HebrewLetter[] = []

		if (selectedMode === 'name' || selectedMode === 'sound') {
			base = letters.filter((l) => l.nameAudio.includes('base'))
		} else if (selectedMode === 'niqqud') {
			if (selectedNiqqud.length === 0) return []
			base = letters.filter((l) => {
				const match = l.nameAudio.match(/name-[^-]+-(.+)\.mp3$/)
				if (!match) return false
				const niqqudKey = match[1]
				return selectedNiqqud.includes(niqqudKey)
			})
		}

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
	}, [letters, selectedMode, selectedNiqqud, fontChoice])

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
	}, [gameStarted])

	const currentLetter = shuffledLetters[currentIndex]

	const getAudioSrc = () => {
		if (!currentLetter) return ''
		if (selectedMode === 'name') return `${currentLetter.nameAudio}`
		if (selectedMode === 'sound' || selectedMode === 'niqqud')
			return `${currentLetter.soundAudio}`
		return ''
	}

	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		if (!gameStarted || finished || waiting || !currentLetter) return

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
	}, [gameStarted, currentIndex, finished, waiting])

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
	}, [currentIndex, gameStarted, timeLimit, finished])

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
				setDisabledButtons(false) // Re-enable after transition
			}
		}, 1500)
	}

	const total = shuffledLetters.length
	const passed = wrongCount <= 2 && timeLimit <= 3
	const hebrewExample = 'א'

	const isStartDisabled =
		selectedMode === 'niqqud' && selectedNiqqud.length === 0
			? true
			: filteredLetters.length === 0

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
	}, [currentLetter?.char])

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
							{(['name', 'sound', 'niqqud'] as Mode[]).map((mode) => (
								<button
									key={mode}
									onClick={() => setSelectedMode(mode)}
									className={`px-4 py-2 border rounded-full ${
										selectedMode === mode
											? 'bg-blue-500 text-white'
											: 'bg-gray-200'
									}`}
								>
									{mode === 'name'
										? 'Names'
										: mode === 'sound'
										? 'Sounds'
										: 'Syllables'}
								</button>
							))}
						</div>
					</div>
					{selectedMode === 'niqqud' && (
						<div className="mb-6">
							<p className="font-medium mb-2">Select Niqqud(s)</p>
							<div className="flex flex-wrap gap-2 justify-center">
								<button
									onClick={() => {
										if (selectedNiqqud.length === niqqudOptions.length) {
											setSelectedNiqqud([]) // Deselect all
										} else {
											setSelectedNiqqud(niqqudOptions.map((n) => n.key)) // Select all
										}
									}}
									className={`px-4 py-2 border rounded-full font-semibold ${
										selectedNiqqud.length === niqqudOptions.length
											? 'bg-red-500 text-white'
											: 'bg-green-600 text-white'
									}`}
								>
									{selectedNiqqud.length === niqqudOptions.length
										? 'Clear All'
										: 'Select All'}
								</button>
								{niqqudOptions.map(({ key, symbol }) => (
									<button
										key={key}
										onClick={() =>
											setSelectedNiqqud((prev) =>
												prev.includes(key)
													? prev.filter((v) => v !== key)
													: [...prev, key]
											)
										}
										className={`text-5xl font-times w-16 h-16 border rounded-full ${
											selectedNiqqud.includes(key)
												? 'bg-blue-600 text-white'
												: 'bg-gray-200 text-black'
										}`}
									>
										{symbol}
									</button>
								))}
							</div>
						</div>
					)}

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
												? 'bg-blue-600 text-white'
												: 'bg-gray-200'
										}`}
									>
										{label}
									</button>
									{isImageFont(value) ? (
										<Image
											src={`/letters/${value}-alef.png`}
											alt={`${label} preview`}
											width={30}
											height={30}
											className="h-10 mt-1"
										/>
									) : (
										<div
											className={`text-5xl mt-1 text-center ${className} ${
												fontChoice === value ? 'text-blue-600' : 'text-gray-700'
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
						<input
							type="number"
							min={1}
							max={10}
							value={timeLimit}
							onChange={(e) => setTimeLimit(Number(e.target.value))}
							className="w-24 p-2 border text-center rounded"
						/>
					</div>
					{selectedMode === 'niqqud' && selectedNiqqud.length === 0 && (
						<p className="text-red-600 font-medium mb-2">
							Please select at least one niqqud to begin.
						</p>
					)}

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
							? '🎉 You Passed!'
							: "😞 In order to pass, you'll need to not miss more that 2 using 3 seconds or less. Let's try again!"}
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
										{/* Letter visual: image or font */}
										{(fontChoice === 'modern-fancy' ||
											fontChoice === 'modern-round' ||
											fontChoice === 'torah' ||
											fontChoice === 'proto') &&
										l.imageKey ? (
											<Image
												src={`/letters/${fontChoice}-${l.imageKey}.png`}
												alt={l.char}
												width={30}
												height={30}
												className="h-auto w-auto object-contain mb-2"
											/>
										) : (
											<div
												className={`text-6xl mb-2 ${fontClassNameFor(
													fontChoice
												)}`}
												dir="rtl"
											>
												{l.char}
											</div>
										)}

										{/* Audio replay button */}
										<button
											onClick={() => {
												const audio = new Audio(
													selectedMode === 'name' ? l.nameAudio : l.soundAudio
												)
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
						onClick={() => {
							setGameStarted(false)
							setShowConfetti(false)
							setFinished(false)
						}}
						className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						Start Over
					</button>
				</div>
			) : (
				<>
					<div className="min-h-[180px] mb-4 flex justify-center items-center">
						{(fontChoice === 'modern-fancy' ||
							fontChoice === 'modern-round' ||
							fontChoice === 'torah' ||
							fontChoice === 'proto') &&
						currentLetter?.imageKey ? (
							<Image
								src={`/letters/${fontChoice}-${currentLetter.imageKey}.png`}
								alt={currentLetter.char}
								width={72}
								height={72}
								className="h-auto w-auto max-w-[72px] max-h-[72px] object-contain"
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
							className="text-5xl text-blue-600 hover:text-blue-800 mb-4"
							aria-label="Replay Audio"
						>
							🔊
						</button>
					)}
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
					{feedback !== null && (
						<p
							className={`mt-4 text-lg font-bold ${
								feedback ? 'text-green-600' : 'text-red-500'
							}`}
						>
							{feedback ? 'Great job!' : "Don't worry, you got this!"}
						</p>
					)}
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
					<div className="mt-6">
						<button
							onClick={() => {
								setGameStarted(false)
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
