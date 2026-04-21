'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Confetti from 'react-confetti'
import {
	ArrowLeft,
	ArrowRight,
	FileText,
	Headphones,
	Heart,
	Sparkles,
} from 'lucide-react'
import {
	QuizMediaAsset,
	type QuizMediaAssetValue,
} from '@/components/learning/QuizMediaAsset'
import { Button } from '@/components/ui/button'

export type PlayerModule = {
	id: string
	title: string
	type: 'video' | 'audio' | 'document' | 'quiz'
	externalUrl: string | null
	mediaAsset: {
		bucket: string
		objectPath: string
	} | null
	quiz: {
		title: string
		questionAssignments: Array<{
			question: {
				title: string
				promptText: string | null
				promptAsset: QuizMediaAssetValue | null
				answers: Array<{
					id: string
					answerText: string | null
					answerAsset: QuizMediaAssetValue | null
					isCorrect: boolean
				}>
			}
		}>
	} | null
}

type Quiz = NonNullable<PlayerModule['quiz']>
type QuizQuestion = Quiz['questionAssignments'][number]['question']
type QuizAnswer = QuizQuestion['answers'][number]

type YouTubePlayer = {
	destroy: () => void
}

type YouTubePlayerStateChangeEvent = {
	data: number
}

declare global {
	interface Window {
		YT?: {
			Player: new (
				element: HTMLElement,
				options: {
					videoId: string
					width?: string
					height?: string
					playerVars?: Record<string, number>
					events?: {
						onStateChange?: (event: YouTubePlayerStateChangeEvent) => void
					}
				}
			) => YouTubePlayer
			PlayerState: {
				ENDED: number
			}
		}
		onYouTubeIframeAPIReady?: () => void
		webkitAudioContext?: typeof AudioContext
	}
}

function mediaUrl(bucket: string, objectPath: string) {
	const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	if (!baseUrl) return null

	return `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`
}

function youtubeVideoId(url: string) {
	try {
		const parsed = new URL(url)
		const host = parsed.hostname.replace(/^www\./, '')

		if (host === 'youtu.be') {
			return parsed.pathname.split('/').filter(Boolean)[0] ?? null
		}

		if (host === 'youtube.com' || host === 'm.youtube.com') {
			if (parsed.pathname.startsWith('/embed/')) {
				return parsed.pathname.split('/').filter(Boolean)[1] ?? null
			}

			return parsed.searchParams.get('v')
		}
	} catch {
		return null
	}

	return null
}

function loadYouTubeApi() {
	if (window.YT?.Player) return Promise.resolve(window.YT)

	return new Promise<NonNullable<Window['YT']>>((resolve) => {
		const existingReady = window.onYouTubeIframeAPIReady
		window.onYouTubeIframeAPIReady = () => {
			existingReady?.()
			if (window.YT) resolve(window.YT)
		}

		if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
			const script = document.createElement('script')
			script.src = 'https://www.youtube.com/iframe_api'
			document.head.append(script)
		}
	})
}

function lessonRewardStorageKey(studyGroupId: string, lessonId: string) {
	return `lesson-rewards:${studyGroupId}:${lessonId}`
}

export function LessonModulePlayer({
	studyGroupId,
	lessonId,
	studyGroupHref,
	currentModule,
	currentModuleCompleted,
	moduleIndex,
	moduleCount,
	previousHref,
	nextHref,
}: {
	studyGroupId: string
	lessonId: string
	studyGroupHref: string
	currentModule: PlayerModule | undefined
	currentModuleCompleted: boolean
	moduleIndex: number
	moduleCount: number
	previousHref: string
	nextHref: string
}) {
	const router = useRouter()
	const [videoComplete, setVideoComplete] = useState(
		currentModuleCompleted || currentModule?.type !== 'video'
	)
	const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)
	const [quizQuestionCorrect, setQuizQuestionCorrect] =
		useState(currentModuleCompleted)
	const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<{
		id: string
		isCorrect: boolean
	} | null>(currentModuleCompleted ? { id: 'completed', isCorrect: true } : null)
	const [incorrectAnswerCount, setIncorrectAnswerCount] = useState(() => {
		if (typeof window === 'undefined') return 0

		return Number(
			window.sessionStorage.getItem(
				lessonRewardStorageKey(studyGroupId, lessonId)
			) ?? 0
		)
	})
	const [savingProgress, setSavingProgress] = useState(false)
	const [claimingReward, setClaimingReward] = useState(false)
	const [showRewardScreen, setShowRewardScreen] = useState(false)
	const isFirstModule = moduleIndex === 0
	const isLastModule = !moduleCount || moduleIndex >= moduleCount - 1
	const isVideoModule = currentModule?.type === 'video'
	const quizQuestionCount =
		currentModule?.quiz?.questionAssignments.length ?? 0
	const isLastQuizQuestion = quizQuestionIndex >= quizQuestionCount - 1
	const quizComplete =
		currentModuleCompleted ||
		quizQuestionCount === 0 ||
		(isLastQuizQuestion && quizQuestionCorrect)
	const moduleComplete =
		currentModuleCompleted ||
		!currentModule ||
		(currentModule.type === 'video' && videoComplete) ||
		(currentModule.type === 'quiz' && quizComplete) ||
		(currentModule.type !== 'video' && currentModule.type !== 'quiz')
	const nextDisabled =
		!moduleCount ||
		savingProgress ||
		(currentModule?.type === 'video' && !moduleComplete) ||
		(currentModule?.type === 'quiz' &&
			!currentModuleCompleted &&
			quizQuestionCount > 0 &&
			!quizQuestionCorrect)
	const handleVideoComplete = useCallback(() => {
		setVideoComplete(true)
	}, [])
	const handleQuizAnswer = useCallback((answerId: string, isCorrect: boolean) => {
		setSelectedQuizAnswer({ id: answerId, isCorrect })

		if (isCorrect) {
			playSuccessSound()
			setQuizQuestionCorrect(true)
			return
		}

		playErrorDrumSound()
		setIncorrectAnswerCount((current) => {
			const next = current + 1
			window.sessionStorage.setItem(
				lessonRewardStorageKey(studyGroupId, lessonId),
				String(next)
			)
			return next
		})
	}, [lessonId, studyGroupId])

	async function completeCurrentModule() {
		if (!currentModule || currentModuleCompleted) return

		const response = await fetch('/api/learning/module-progress', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				studyGroupId,
				lessonId,
				moduleId: currentModule.id,
			}),
		})

		if (!response.ok) {
			throw new Error('Failed to record module progress')
		}
	}

	async function handleNext() {
		if (!currentModule || nextDisabled) return

		if (
			currentModule.type === 'quiz' &&
			!currentModuleCompleted &&
			quizQuestionCorrect &&
			!isLastQuizQuestion
		) {
			setQuizQuestionIndex((current) => current + 1)
			setQuizQuestionCorrect(false)
			setSelectedQuizAnswer(null)
			return
		}

		if (!moduleComplete) return

		setSavingProgress(true)

		try {
			await completeCurrentModule()

			if (isLastModule) {
				setShowRewardScreen(true)
				return
			}

			router.push(nextHref)
			router.refresh()
		} finally {
			setSavingProgress(false)
		}
	}

	async function handleRewardContinue() {
		const earnedHearts = Math.max(0, moduleCount * 3 - incorrectAnswerCount)
		const earnedPoints = moduleCount * 10

		setClaimingReward(true)

		try {
			await fetch('/api/learning/lesson-rewards', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					studyGroupId,
					lessonId,
					heartsAwarded: earnedHearts,
					pointsAwarded: earnedPoints,
				}),
			})
		} finally {
			setClaimingReward(false)
		}

		window.sessionStorage.removeItem(lessonRewardStorageKey(studyGroupId, lessonId))
		router.push(studyGroupHref)
		router.refresh()
	}

	if (showRewardScreen) {
		const earnedHearts = Math.max(0, moduleCount * 3 - incorrectAnswerCount)
		const earnedPoints = moduleCount * 10

		return (
			<>
				<section className="flex min-h-0 flex-1 flex-col justify-center py-4 md:py-6">
					<LessonRewardScreen
						earnedHearts={earnedHearts}
						earnedPoints={earnedPoints}
						incorrectAnswerCount={incorrectAnswerCount}
						moduleCount={moduleCount}
					/>
				</section>
				<footer className="flex shrink-0 items-center justify-end border-t border-border/70 py-5">
					<Button onClick={handleRewardContinue} disabled={claimingReward}>
						{claimingReward ? 'Saving...' : 'Continue'}
						<ArrowRight className="size-4" />
					</Button>
				</footer>
			</>
		)
	}

	return (
		<>
			<section className="flex min-h-0 flex-1 flex-col justify-center py-4 md:py-6">
				<div
					className={
						isVideoModule
							? 'mx-auto flex min-h-0 w-full max-w-none flex-col justify-center md:max-w-[min(100%,calc((100vh-7rem)*16/9))]'
							: 'mx-auto w-full max-w-5xl space-y-8'
					}
				>
					{currentModule ? (
						<ModuleStage
							module={currentModule}
							quizQuestionIndex={quizQuestionIndex}
							currentModuleCompleted={currentModuleCompleted}
							selectedQuizAnswer={selectedQuizAnswer}
							onQuizAnswer={handleQuizAnswer}
							onVideoComplete={handleVideoComplete}
						/>
					) : (
						<div className="rounded-[2rem] border border-dashed border-border p-10 text-center text-muted-foreground">
							This lesson does not have modules assigned yet.
						</div>
					)}
				</div>
			</section>

			<footer className="flex shrink-0 items-center justify-between border-t border-border/70 py-5">
				{isFirstModule ? (
					<Button variant="outline" disabled>
						<ArrowLeft className="size-4" />
						Back
					</Button>
				) : (
					<Button asChild variant="outline">
						<Link href={previousHref}>
							<ArrowLeft className="size-4" />
							Back
						</Link>
					</Button>
				)}

				<Button
					disabled={nextDisabled}
					aria-describedby="lesson-next-status"
					onClick={handleNext}
				>
					{savingProgress
						? 'Saving...'
						: isLastModule && moduleComplete
							? 'Finish'
							: 'Next'}
					<ArrowRight className="size-4" />
				</Button>
				<span id="lesson-next-status" className="sr-only">
					{currentModule?.type === 'video' && !moduleComplete
						? 'Next is available after the video finishes.'
						: currentModule?.type === 'quiz' && !quizQuestionCorrect
							? 'Next is available after the correct answer is selected.'
						: 'Next is unavailable.'}
				</span>
			</footer>
		</>
	)
}

function LessonRewardScreen({
	earnedHearts,
	earnedPoints,
	incorrectAnswerCount,
	moduleCount,
}: {
	earnedHearts: number
	earnedPoints: number
	incorrectAnswerCount: number
	moduleCount: number
}) {
	const maxHearts = moduleCount * 3
	const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

	useEffect(() => {
		playSuccessSound()

		function updateWindowSize() {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			})
		}

		updateWindowSize()
		window.addEventListener('resize', updateWindowSize)

		return () => window.removeEventListener('resize', updateWindowSize)
	}, [])

	return (
		<>
			{windowSize.width && windowSize.height ? (
				<Confetti
					width={windowSize.width}
					height={windowSize.height}
					numberOfPieces={260}
					recycle={false}
					className="pointer-events-none fixed inset-0 z-50"
				/>
			) : null}
			<div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm md:p-10">
				<div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
					<Sparkles className="size-7" />
				</div>
				<p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
					Lesson complete
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl font-semibold">
					You earned your reward
				</h1>
				<div className="mt-8 grid gap-4 md:grid-cols-2">
					<div className="rounded-2xl border border-border bg-background p-6">
						<div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
							<Heart className="size-5 fill-current" />
						</div>
						<p className="text-4xl font-semibold">{earnedHearts}</p>
						<p className="mt-1 text-sm text-muted-foreground">
							hearts earned out of {maxHearts}
						</p>
					</div>
					<div className="rounded-2xl border border-border bg-background p-6">
						<div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<Sparkles className="size-5" />
						</div>
						<p className="text-4xl font-semibold">{earnedPoints}</p>
						<p className="mt-1 text-sm text-muted-foreground">points earned</p>
					</div>
				</div>
				{incorrectAnswerCount ? (
					<p className="mt-5 text-sm text-muted-foreground">
						{incorrectAnswerCount} incorrect answer
						{incorrectAnswerCount === 1 ? '' : 's'} deducted{' '}
						{incorrectAnswerCount} heart
						{incorrectAnswerCount === 1 ? '' : 's'}.
					</p>
				) : (
					<p className="mt-5 text-sm text-muted-foreground">
						Perfect run. No hearts were deducted.
					</p>
				)}
			</div>
		</>
	)
}

function ModuleStage({
	module,
	quizQuestionIndex,
	currentModuleCompleted,
	selectedQuizAnswer,
	onQuizAnswer,
	onVideoComplete,
}: {
	module: PlayerModule
	quizQuestionIndex: number
	currentModuleCompleted: boolean
	selectedQuizAnswer: { id: string; isCorrect: boolean } | null
	onQuizAnswer: (answerId: string, isCorrect: boolean) => void
	onVideoComplete: () => void
}) {
	if (module.type === 'video') {
		const videoId = module.externalUrl ? youtubeVideoId(module.externalUrl) : null
		const assetUrl = module.mediaAsset
			? mediaUrl(module.mediaAsset.bucket, module.mediaAsset.objectPath)
			: null

		if (videoId) {
			return (
				<YouTubeVideoStage
					title={module.title}
					videoId={videoId}
					onComplete={onVideoComplete}
				/>
			)
		}

		if (assetUrl) {
			return (
				<video
					src={assetUrl}
					controls
					onEnded={onVideoComplete}
					className="aspect-video max-h-[calc(100vh-10rem)] w-full rounded-[1.5rem] border border-border bg-black object-contain shadow-xl md:max-h-[calc(100vh-7rem)]"
				/>
			)
		}
	}

	if (module.type === 'audio') {
		const assetUrl = module.mediaAsset
			? mediaUrl(module.mediaAsset.bucket, module.mediaAsset.objectPath)
			: null

		return (
			<div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
				<div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
					<Headphones className="size-7" />
				</div>
				<h2 className="font-[family:var(--font-eczar)] text-3xl font-semibold">
					Listen
				</h2>
				{assetUrl ? (
					<audio src={assetUrl} controls className="mt-6 w-full" />
				) : (
					<p className="mt-4 text-muted-foreground">No audio asset assigned.</p>
				)}
			</div>
		)
	}

	if (module.type === 'document') {
		const assetUrl = module.mediaAsset
			? mediaUrl(module.mediaAsset.bucket, module.mediaAsset.objectPath)
			: null

		return (
			<div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
				<div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
					<FileText className="size-7" />
				</div>
				<h2 className="font-[family:var(--font-eczar)] text-3xl font-semibold">
					Read this document
				</h2>
				{assetUrl ? (
					<Button asChild className="mt-6">
						<a href={assetUrl} target="_blank" rel="noreferrer">
							Open document
						</a>
					</Button>
				) : (
					<p className="mt-4 text-muted-foreground">
						No document asset assigned.
					</p>
				)}
			</div>
		)
	}

	if (module.type === 'quiz') {
		const questions = module.quiz?.questionAssignments ?? []
		const currentQuestion = questions[quizQuestionIndex]?.question

		return (
			<QuizStage
				currentModuleCompleted={currentModuleCompleted}
				currentQuestion={currentQuestion}
				module={module}
				onQuizAnswer={onQuizAnswer}
				questionCount={questions.length}
				quizQuestionIndex={quizQuestionIndex}
				selectedQuizAnswer={selectedQuizAnswer}
			/>
		)
	}

	return (
		<div className="rounded-[2rem] border border-dashed border-border p-10 text-center text-muted-foreground">
			This module is not ready yet.
		</div>
	)
}

function QuizStage({
	currentModuleCompleted,
	currentQuestion,
	module,
	onQuizAnswer,
	questionCount,
	quizQuestionIndex,
	selectedQuizAnswer,
	}: {
	currentModuleCompleted: boolean
	currentQuestion: QuizQuestion | undefined
	module: PlayerModule
	onQuizAnswer: (answerId: string, isCorrect: boolean) => void
	questionCount: number
	quizQuestionIndex: number
	selectedQuizAnswer: { id: string; isCorrect: boolean } | null
}) {
	const shuffledAnswers = useMemo(
		() => shuffleAnswers(currentQuestion?.answers ?? []),
		[currentQuestion]
	)

	return (
		<div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
				<p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
					Quiz
				</p>
				<h2 className="mt-2 font-[family:var(--font-eczar)] text-3xl font-semibold">
					{module.quiz?.title ?? module.title}
				</h2>
				{currentQuestion ? (
					<div className="mt-8 space-y-5">
						<div className="flex items-start justify-between gap-4">
								<p className="text-xl font-semibold">{currentQuestion.title}</p>
								<p className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
									{quizQuestionIndex + 1}/{questionCount}
								</p>
						</div>
						{currentQuestion.promptText ? (
							<p className="rounded-2xl border border-border bg-background p-4 text-lg">
								{currentQuestion.promptText}
							</p>
						) : currentQuestion.promptAsset ? (
							<QuizMediaAsset asset={currentQuestion.promptAsset} />
						) : null}
						<div className="grid gap-3 md:grid-cols-2">
							{shuffledAnswers.map((answer) => {
								const selected = selectedQuizAnswer?.id === answer.id
								const selectedClass = selected
									? answer.isCorrect
										? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/35'
										: 'border-destructive bg-destructive/10 ring-2 ring-destructive/30'
									: 'border-border bg-background hover:border-primary'

								return (
									<button
										key={answer.id}
										type="button"
										disabled={currentModuleCompleted}
										onClick={() => onQuizAnswer(answer.id, answer.isCorrect)}
										className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${selectedClass}`}
									>
										{answer.answerText ? (
											answer.answerText
										) : answer.answerAsset ? (
											<QuizMediaAsset asset={answer.answerAsset} />
										) : (
											<span className="text-muted-foreground">Media answer</span>
										)}
									</button>
								)
							})}
						</div>
					</div>
				) : (
					<p className="mt-4 text-muted-foreground">
						This quiz does not have questions yet.
					</p>
				)}
		</div>
	)
}

function shuffleAnswers(answers: QuizAnswer[]) {
	const shuffled = [...answers]

	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1))
		;[shuffled[index], shuffled[swapIndex]] = [
			shuffled[swapIndex],
			shuffled[index],
		]
	}

	return shuffled
}

function playSuccessSound() {
	const AudioContextClass = window.AudioContext || window.webkitAudioContext
	if (!AudioContextClass) return

	const context = new AudioContextClass()
	void context.resume()
	const gain = context.createGain()
	gain.connect(context.destination)
	gain.gain.setValueAtTime(0.0001, context.currentTime)
	gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01)
	gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42)

	for (const [index, frequency] of [523.25, 659.25, 783.99].entries()) {
		const oscillator = context.createOscillator()
		oscillator.type = 'sine'
		oscillator.frequency.value = frequency
		oscillator.connect(gain)
		oscillator.start(context.currentTime + index * 0.08)
		oscillator.stop(context.currentTime + index * 0.08 + 0.16)
	}
}

function playErrorDrumSound() {
	const AudioContextClass = window.AudioContext || window.webkitAudioContext
	if (!AudioContextClass) return

	const context = new AudioContextClass()
	void context.resume()
	const oscillator = context.createOscillator()
	const gain = context.createGain()
	const noise = context.createBufferSource()
	const noiseGain = context.createGain()
	const buffer = context.createBuffer(1, context.sampleRate * 0.16, context.sampleRate)
	const data = buffer.getChannelData(0)

	for (let index = 0; index < data.length; index += 1) {
		data[index] = Math.random() * 2 - 1
	}

	oscillator.type = 'triangle'
	oscillator.frequency.setValueAtTime(150, context.currentTime)
	oscillator.frequency.exponentialRampToValueAtTime(38, context.currentTime + 0.28)
	gain.gain.setValueAtTime(0.55, context.currentTime)
	gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3)
	noise.buffer = buffer
	noiseGain.gain.setValueAtTime(0.22, context.currentTime)
	noiseGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12)

	oscillator.connect(gain)
	gain.connect(context.destination)
	noise.connect(noiseGain)
	noiseGain.connect(context.destination)
	oscillator.start()
	noise.start()
	oscillator.stop(context.currentTime + 0.32)
	noise.stop(context.currentTime + 0.14)
}

function YouTubeVideoStage({
	title,
	videoId,
	onComplete,
}: {
	title: string
	videoId: string
	onComplete: () => void
}) {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		let player: YouTubePlayer | null = null
		let cancelled = false

		loadYouTubeApi().then((yt) => {
			if (cancelled || !containerRef.current) return

			player = new yt.Player(containerRef.current, {
				videoId,
				width: '100%',
				height: '100%',
				playerVars: {
					rel: 0,
				},
				events: {
					onStateChange: (event) => {
						if (event.data === yt.PlayerState.ENDED) {
							onComplete()
						}
					},
				},
			})
		})

		return () => {
			cancelled = true
			player?.destroy()
		}
	}, [onComplete, videoId])

	return (
		<div className="relative aspect-video max-h-[calc(100vh-10rem)] w-full overflow-hidden rounded-[1.5rem] border border-border bg-black shadow-xl md:max-h-[calc(100vh-7rem)] [&_iframe]:h-full [&_iframe]:w-full">
			<div
				ref={containerRef}
				title={title}
				className="absolute inset-0 h-full w-full"
			/>
		</div>
	)
}
