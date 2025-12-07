'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import { cn } from '@/lib/utils'
import Confetti from 'react-confetti'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../ui/tooltip'
import { useTranslations } from 'next-intl'

// ------------------
// TYPES
// ------------------
export type Mode = 'name' | 'sound' | 'syllable' | 'niqqud'
export type Pronunciation = 'masoretic' | 'sephardic'

export interface HebrewLetter {
	char: string
	nameAudio: string
	soundAudio: string
	sephardicNameAudio?: string
	sephardicSoundAudio?: string
	imageKey?: string
}

export interface HebrewNiqqud {
	char: string
	name: string
	key: string
	nameAudio: string
	soundAudio: string
	imageKey?: string
}

interface Props {
	letters: HebrewLetter[]
	niqqud: HebrewNiqqud[]
}

type FontChoice =
	| 'times'
	| 'frank'
	| 'tinos'
	| 'nunito'
	| 'cardo'
	| 'rashi'
	| 'suez'
	| 'sans'
	| 'arial'
	| 'modern-fancy'
	| 'modern-round'
	| 'proto'
	| 'torah'

// ------------------
// COMPONENT
// ------------------
export default function HebrewLetterQuiz({ letters, niqqud }: Props) {
	const [mode, setMode] = useState<Mode>('name')
	const [pronunciation, setPronunciation] = useState<Pronunciation>('sephardic')
	const [fontChoice, setFontChoice] = useState<FontChoice>('frank')

	const [timeLimit, setTimeLimit] = useState<number>(3)
	const [gameStarted, setGameStarted] = useState(false)
	const [studyMode, setStudyMode] = useState(false)

	const [shuffled, setShuffled] = useState<(HebrewLetter | HebrewNiqqud)[]>([])
	const [index, setIndex] = useState(0)

	const audioRef = useRef<HTMLAudioElement | null>(null)
	const [played, setPlayed] = useState(false)
	const [correctCount, setCorrectCount] = useState(0)
	const [wrongCount, setWrongCount] = useState(0)
	const [wrongAnswers, setWrongAnswers] = useState<HebrewLetter[]>([])
	const [quizFinished, setQuizFinished] = useState(false)
	const [shouldPlay, setShouldPlay] = useState(false)

	const t = useTranslations('alphabet')

	// ------------------
	// FILTER DATASET
	// ------------------
	function isBaseConsonant(l: HebrewLetter): boolean {
		return !/[\u0591-\u05C7]/.test(l.char)
	}

	function isAllowedForFont(
		item: HebrewLetter | HebrewNiqqud,
		font: FontChoice
	) {
		const imageFonts: FontChoice[] = [
			'modern-fancy',
			'modern-round',
			'proto',
			'torah',
		]
		if (!imageFonts.includes(font)) return true
		if (!('imageKey' in item) || !item.imageKey) return false
		if (font === 'proto' && item.imageKey.includes('sofit')) return false
		return true
	}

	const filteredItems = useMemo(() => {
		let base: (HebrewLetter | HebrewNiqqud)[] = []

		if (mode === 'niqqud') {
			base = niqqud
		} else if (mode === 'name' || mode === 'sound') {
			// Only the alphabet — no niqqud variants
			base = letters.filter(isBaseConsonant)
		} else {
			base = letters
		}

		return base.filter((item) => isAllowedForFont(item, fontChoice))
	}, [mode, letters, niqqud, fontChoice])

	// ------------------
	// START QUIZ
	// ------------------
	function startQuiz(study = false) {
		const pool = [...filteredItems].sort(() => Math.random() - 0.5)
		setShuffled(pool)
		setIndex(0)
		setStudyMode(study)
		setGameStarted(true)
		playedRef.current = false

		setPlayed(false)
		audioRef.current = null
	}

	// ------------------
	// AUDIO
	// ------------------
	const getAudio = useCallback(
		(item: HebrewLetter | HebrewNiqqud): string => {
			if (mode === 'niqqud') return (item as HebrewNiqqud).soundAudio

			const l = item as HebrewLetter

			if (mode === 'name') {
				return pronunciation === 'sephardic'
					? l.sephardicNameAudio ?? l.nameAudio
					: l.nameAudio
			}

			if (mode === 'sound') {
				return pronunciation === 'sephardic'
					? l.sephardicSoundAudio ?? l.soundAudio
					: l.soundAudio
			}

			return l.soundAudio
		},
		[mode, pronunciation]
	)

	// ------------------
	// ANSWER HANDLING
	// ------------------
	function answer(correct: boolean) {
		playedRef.current = false
		setPlayed(false)
		audioRef.current = null

		if (correct) {
			setCorrectCount((c) => c + 1)
		} else {
			setWrongCount((w) => w + 1)

			// Save the letter they missed for review
			const cur = shuffled[index]
			if (cur && 'char' in cur) {
				setWrongAnswers((arr) => [...arr, cur as HebrewLetter])
			}
		}

		// Move to next OR finish
		if (index + 1 < shuffled.length) {
			setIndex((i) => i + 1)
		} else {
			setQuizFinished(true) // <- triggers final screen
			setGameStarted(false)

			// play shofar if passed
			// determine final wrong count before checking pass
			const finalWrongCount = correct ? wrongCount : wrongCount + 1

			setQuizFinished(true)
			setGameStarted(false)

			// Only play shofar if truly passed
			if (finalWrongCount <= 1) {
				const horn = new Audio('/shofar.mp3')
				horn.play().catch((err) => console.error('Shofar failed:', err))
			}
		}
	}

	// ------------------
	// RESET
	// ------------------
	function reset() {
		setGameStarted(false)
		setStudyMode(false)
		setShuffled([])
		setIndex(0)
		setPlayed(false)
		audioRef.current = null

		setCorrectCount(0)
		setWrongCount(0)
		setWrongAnswers([])
		setQuizFinished(false)
	}

	// ------------------
	// RENDER
	// ------------------
	const playedRef = useRef(false)
	const current = shuffled[index]

	useEffect(() => {
		if (!shouldPlay || !current) return

		// mark audio as played (safe)
		playedRef.current = true

		// play audio
		const audio = new Audio(getAudio(current))
		audioRef.current = audio
		audio.play().catch(() => {})

		// schedule setState AFTER this render completes
		Promise.resolve().then(() => {
			setPlayed(true)
			setShouldPlay(false)
		})
	}, [shouldPlay, current, getAudio])

	const fontClasses: Record<FontChoice, string> = {
		times: 'font-times',
		frank: 'font-frank',
		tinos: 'font-tinos',
		nunito: 'font-nunito',
		cardo: 'font-cardo',
		rashi: 'font-rashi',
		suez: 'font-suez',
		sans: 'font-sans',
		arial: 'font-arial',
		'modern-fancy': '',
		'modern-round': '',
		proto: '',
		torah: '',
	}
	const imageFonts: FontChoice[] = [
		'modern-fancy',
		'modern-round',
		'proto',
		'torah',
	]

	// -----------------------------------------
	//  ⭑  FINAL RESULTS SCREEN
	// -----------------------------------------
	if (quizFinished) {
		const passed = wrongCount <= 2
		const awardedPoints = passed ? 10 : 3

		return (
			<div className="space-y-4 text-center px-4 py-6">
				{/* CONFETTI */}
				{passed && (
					<div className="fixed inset-0 pointer-events-none z-50">
						{/* react-confetti wrapper */}
						<Confetti recycle={false} numberOfPieces={400} />
					</div>
				)}

				<h2 className="text-2xl font-bold">{t('quizComplete')}</h2>

				<p className="text-lg">
					✅ {t('correct')} {correctCount}
				</p>
				<p className="text-lg">
					❌ {t('incorrect')} {wrongCount}
				</p>

				<p
					className={cn(
						'text-xl font-semibold',
						passed ? 'text-green-600' : 'text-red-500'
					)}
				>
					{passed ? `🎉 ${t('youPassed')}` : `😞 ${t('youFailed')}`}
				</p>

				<p className="text-lg">
					⭐ {t('pointsEarned')}:{' '}
					<span className="font-semibold">{awardedPoints}</span>
				</p>

				{/* WRONG LETTER REVIEW */}
				{wrongAnswers.length > 0 && (
					<div className="mt-6">
						<h3 className="font-medium text-lg mb-2">{t('youMissed')}</h3>
						<div className="flex flex-wrap justify-center gap-6">
							{wrongAnswers.map((l, i) => (
								<div
									key={i}
									className="p-4 border rounded-lg flex flex-col items-center justify-center"
								>
									{/* Letter visual */}
									{['modern-fancy', 'modern-round', 'proto', 'torah'].includes(
										fontChoice
									) && l.imageKey ? (
										<Image
											src={`/alphabet/heb/letters/${fontChoice}-${l.imageKey}.jpg`}
											alt={l.char}
											width={40}
											height={40}
											className="object-contain mb-2"
										/>
									) : (
										<div
											className={cn('text-6xl mb-2', fontClasses[fontChoice])}
											dir="rtl"
										>
											{l.char}
										</div>
									)}

									{/* Audio replay */}
									<button
										onClick={() => {
											const audio = new Audio(getAudio(l))
											audio.play()
										}}
										className="text-xl text-sky-600 hover:text-sky-800"
									>
										🔊
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				<Button onClick={reset} className="mt-6 px-6 py-2" size="lg">
					{t('startOver')}
				</Button>
			</div>
		)
	}

	// -----------------------------------------
	// SETUP SCREEN
	// -----------------------------------------
	if (!gameStarted) {
		return (
			<div className="space-y-10 px-4 w-full max-w-full overflow-x-hidden">
				{/* MODE + PRONUNCIATION */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* MODE */}
					<div className="w-full col-span-2">
						<div className="text-sm font-medium mb-2">{t('mode.mode')}</div>

						<Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
							<TabsList className="flex flex-wrap w-full">
								<TabsTrigger
									className="whitespace-normal text-center leading-tight px-2 py-1"
									value="name"
								>
									{t('mode.name')}
								</TabsTrigger>
								<TabsTrigger
									className="whitespace-normal text-center leading-tight px-2 py-1"
									value="sound"
								>
									{t('mode.sound')}
								</TabsTrigger>
								<TabsTrigger
									className="whitespace-normal text-center leading-tight px-2 py-1"
									value="syllable"
								>
									{t('mode.syllable')}
								</TabsTrigger>
								<TabsTrigger
									className="whitespace-normal text-center leading-tight px-2 py-1"
									value="niqqud"
								>
									{t('mode.niqqud')}
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{/* PRONUNCIATION */}
					<div className="w-full">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="text-sm font-medium mb-2 cursor-help">
										{t('pronunciation')}
									</div>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs text-sm leading-snug">
									Aleph with Beth uses <strong>Sephardic</strong> pronunciation.
									Masoretic distinguishes pronunciation between the
									<strong> BGDKPT</strong> letters.
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<Tabs
							value={pronunciation}
							onValueChange={(v) => setPronunciation(v as Pronunciation)}
						>
							<TabsList className="flex flex-wrap w-full">
								<TabsTrigger value="sephardic">{t('sephardic')}</TabsTrigger>
								<TabsTrigger value="masoretic">{t('masoretic')}</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				</div>

				{/* FONT PICKER */}
				<div className="space-y-3">
					<div className="text-sm font-medium">{t('font')}</div>

					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
						{(Object.keys(fontClasses) as FontChoice[]).map((font) => {
							const isDisabled = mode === 'niqqud' && imageFonts.includes(font)

							return (
								<Button
									key={font}
									variant={fontChoice === font ? 'default' : 'outline'}
									onClick={() => !isDisabled && setFontChoice(font)}
									disabled={isDisabled}
									className={cn(
										'flex flex-col items-center justify-start gap-1 p-3 h-28 w-full min-w-0',
										isDisabled && 'opacity-40 cursor-not-allowed'
									)}
								>
									<span className="text-xs capitalize">
										{font.replace('-', ' ')}
									</span>

									<div className="flex items-center justify-center h-16 w-full overflow-hidden">
										{imageFonts.includes(font) ? (
											<Image
												src={`/alphabet/heb/letters/${font}-alef.jpg`}
												alt="Aleph preview"
												width={48}
												height={48}
												className="object-contain"
											/>
										) : (
											<div
												className={cn(
													'text-[40px] leading-none',
													fontClasses[font]
												)}
											>
												א
											</div>
										)}
									</div>
								</Button>
							)
						})}
					</div>
				</div>

				{/* ACTIONS */}
				<div className="mt-10 border-t pt-8 flex flex-col md:flex-row md:justify-between gap-10">
					<Button
						variant="secondary"
						size="lg"
						className="w-full md:w-auto"
						onClick={() => startQuiz(true)}
					>
						{t('study')}
					</Button>

					<div>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="text-sm font-medium mb-2 cursor-help">
										{t('secondsToAnswer')}
									</div>
								</TooltipTrigger>

								<TooltipContent className="max-w-xs text-sm leading-snug">
									The goal is to complete a quiz with{' '}
									<strong>no more than 2 errors</strong> in{' '}
									<strong>3 seconds or less</strong> per letter.
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<div className="flex items-center gap-4">
							<Slider
								min={1}
								max={10}
								step={1}
								defaultValue={[timeLimit]}
								onValueChange={(v) => setTimeLimit(v[0])}
								className="w-40"
							/>
							<div className="w-10 text-center">{timeLimit}s</div>
						</div>
					</div>

					<Button
						size="lg"
						className="w-full md:w-auto"
						onClick={() => startQuiz(false)}
					>
						{t('startQuiz')}
					</Button>
				</div>
			</div>
		)
	}

	// -----------------------------------------
	// STUDY MODE
	// -----------------------------------------
	if (studyMode) {
		return (
			<Card className="max-w-3xl mx-auto p-6">
				<CardHeader className="flex justify-between items-center">
					<h2 className="text-lg font-semibold">{t('studyAlphabet')}</h2>
					<Button variant="ghost" onClick={reset}>
						{t('back')}
					</Button>
				</CardHeader>

				<CardContent className="flex flex-wrap gap-4 justify-center" dir="rtl">
					{filteredItems.map((item, i) => (
						<div
							key={i}
							className="p-4 border rounded-md flex flex-col items-center w-20"
						>
							<div
								className={cn(
									'text-5xl mb-2 leading-none',
									fontChoice.startsWith('modern') ||
										fontChoice === 'proto' ||
										fontChoice === 'torah'
										? ''
										: fontClasses[fontChoice]
								)}
								dir="rtl"
							>
								{item.imageKey &&
								['modern-fancy', 'modern-round', 'proto', 'torah'].includes(
									fontChoice
								) ? (
									<Image
										src={`/alphabet/heb/letters/${fontChoice}-${item.imageKey}.jpg`}
										alt={item.char}
										width={48}
										height={48}
										className="object-contain"
									/>
								) : (
									item.char
								)}
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => new Audio(getAudio(item)).play()}
							>
								🔊
							</Button>
						</div>
					))}
				</CardContent>
			</Card>
		)
	}

	// -----------------------------------------
	// QUIZ MODE
	// -----------------------------------------
	return (
		<Card className="max-w-xl mx-auto p-6">
			<CardHeader className="flex justify-between items-center">
				<Button variant="ghost" onClick={reset}>
					{t('back')}
				</Button>
				<div className="text-sm text-muted-foreground">
					{index + 1} / {shuffled.length}
				</div>
			</CardHeader>

			<CardContent className="space-y-6 text-center">
				{/* MODE LABEL */}
				<div className="text-lg font-medium text-sky-700 dark:text-sky-300">
					{mode === 'name' && t('mode.name')}
					{mode === 'sound' && t('mode.sound')}
					{mode === 'syllable' && t('mode.syllable')}
					{mode === 'niqqud' && t('mode.niqqud')}
				</div>
				{/* LETTER */}
				<div className="h-40 flex justify-center items-center">
					{current &&
					current.imageKey &&
					['modern-fancy', 'modern-round', 'proto', 'torah'].includes(
						fontChoice
					) ? (
						<Image
							src={`/alphabet/heb/letters/${fontChoice}-${current.imageKey}.jpg`}
							alt={current.char}
							width={160}
							height={160}
							className="object-contain"
						/>
					) : (
						<div
							className={cn(
								'text-[6rem] leading-none',
								fontClasses[fontChoice]
							)}
							dir="rtl"
						>
							{current?.char}
						</div>
					)}
				</div>

				{/* COUNTDOWN TIMER */}
				<div className="flex justify-center">
					<CountdownCircleTimer
						key={index}
						isPlaying
						duration={timeLimit}
						size={140}
						strokeWidth={10}
						colors={['#0ea5e9', '#facc15', '#dc2626']}
						colorsTime={[timeLimit, timeLimit / 2, 0]}
					>
						{({ remainingTime }) => {
							const waiting = remainingTime > 0

							// Play audio exactly once after countdown ends
							if (!waiting && !playedRef.current && current) {
								setShouldPlay(true)
							}

							return (
								<div className="text-xl font-bold">
									{waiting ? `${remainingTime}s` : '?'}
								</div>
							)
						}}
					</CountdownCircleTimer>
				</div>

				{/* REPLAY BUTTON */}
				{played && (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => audioRef.current?.play()}
					>
						🔊
					</Button>
				)}

				{/* ANSWER BUTTONS */}
				{played && (
					<div className="flex justify-center gap-4">
						<Button onClick={() => answer(true)}>{t('iGotIt')}</Button>
						<Button variant="secondary" onClick={() => answer(false)}>
							{t('iMissedIt')}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
