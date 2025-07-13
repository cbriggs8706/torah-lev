'use client'

import { toast } from 'sonner'
import Image from 'next/image'
import Confetti from 'react-confetti'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useAudio, useWindowSize, useMount } from 'react-use'
import ReactPlayer from 'react-player/youtube'

import { reduceHearts } from '@/actions/user-progress'
import { useHeartsModal } from '@/store/use-hearts-modal'
import { challengeOptions, challenges, userSubscription } from '@/db/schema'
import { usePracticeModal } from '@/store/use-practice-modal'
import { upsertChallengeProgress } from '@/actions/challenge-progress'

import { Header } from './header'
import { Footer } from './footer'
import { Challenge } from './challenge'
import { ResultCard } from './result-card'
import { QuestionBubble } from './question-bubble'

type Props = {
	initialPercentage: number
	initialHearts: number
	initialLessonId: number
	initialLessonChallenges: (typeof challenges.$inferSelect & {
		completed: boolean
		challengeOptions: (typeof challengeOptions.$inferSelect)[]
	})[]
	userSubscription:
		| (typeof userSubscription.$inferSelect & {
				isActive: boolean
		  })
		| null
}

export const Quiz = ({
	initialPercentage,
	initialHearts,
	initialLessonId,
	initialLessonChallenges,
	userSubscription,
}: Props) => {
	const { open: openHeartsModal } = useHeartsModal()
	const { open: openPracticeModal } = usePracticeModal()

	useMount(() => {
		if (initialPercentage === 100) {
			openPracticeModal()
		}
	})

	const { width, height } = useWindowSize()

	const router = useRouter()

	const [finishAudio] = useAudio({ src: '/finish.mp3', autoPlay: true })
	const [correctAudio, _c, correctControls] = useAudio({ src: '/correct.wav' })
	const [incorrectAudio, _i, incorrectControls] = useAudio({
		src: '/incorrect.wav',
	})

	const [pending, startTransition] = useTransition()

	const [lessonId] = useState(initialLessonId)
	const [hearts, setHearts] = useState(initialHearts)
	const [percentage, setPercentage] = useState(() => {
		return initialPercentage === 100 ? 0 : initialPercentage
	})
	const [challenges] = useState(initialLessonChallenges)
	const [activeIndex, setActiveIndex] = useState(() => {
		const uncompletedIndex = challenges.findIndex(
			(challenge) => !challenge.completed
		)
		return uncompletedIndex === -1 ? 0 : uncompletedIndex
	})

	const [selectedOption, setSelectedOption] = useState<number>()
	const [status, setStatus] = useState<'correct' | 'wrong' | 'none'>('none')

	const challenge = challenges[activeIndex]
	const options = challenge?.challengeOptions ?? []

	const onNext = () => {
		setActiveIndex((current) => current + 1)
	}

	const onSelect = (id: number) => {
		if (status !== 'none') return

		setSelectedOption(id)
	}

	const onContinue = () => {
		if (!selectedOption) return

		if (status === 'wrong') {
			setStatus('none')
			setSelectedOption(undefined)
			return
		}

		if (status === 'correct') {
			onNext()
			setStatus('none')
			setSelectedOption(undefined)
			return
		}

		const correctOption = options.find((option) => option.correct)

		if (!correctOption) {
			return
		}

		if (correctOption.id === selectedOption) {
			startTransition(() => {
				upsertChallengeProgress(challenge.id)
					.then((response) => {
						if (response?.error === 'hearts') {
							openHeartsModal()
							return
						}

						correctControls.play()
						setStatus('correct')
						setPercentage((prev) => prev + 100 / challenges.length)

						// This is a practice
						if (initialPercentage === 100) {
							setHearts((prev) => Math.min(prev + 1, 5))
						}
					})
					.catch(() => toast.error('Something went wrong. Please try again.'))
			})
		} else {
			startTransition(() => {
				reduceHearts(challenge.id)
					.then((response) => {
						if (response?.error === 'hearts') {
							openHeartsModal()
							return
						}

						incorrectControls.play()
						setStatus('wrong')

						if (!response?.error) {
							setHearts((prev) => Math.max(prev - 1, 0))
						}
					})
					.catch(() => toast.error('Something went wrong. Please try again.'))
			})
		}
	}

	if (!challenge) {
		return (
			<>
				{finishAudio}
				<Confetti
					width={width}
					height={height}
					recycle={false}
					numberOfPieces={500}
					tweenDuration={10000}
				/>
				<div className="flex flex-col gap-y-4 lg:gap-y-8 max-w-lg mx-auto text-center items-center justify-center h-full">
					<Image
						src="/finish.svg"
						alt="Finish"
						className="hidden lg:block"
						height={100}
						width={100}
					/>
					<Image
						src="/finish.svg"
						alt="Finish"
						className="block lg:hidden"
						height={50}
						width={50}
					/>
					<h1 className="text-xl lg:text-3xl font-bold text-neutral-700">
						Great job! <br /> You&apos;ve completed the lesson.
					</h1>
					<div className="flex items-center gap-x-4 w-full">
						<ResultCard variant="points" value={challenges.length * 10} />
						<ResultCard variant="hearts" value={hearts} />
					</div>
				</div>
				<Footer
					lessonId={lessonId}
					status="completed"
					onCheck={() => router.push('/learn')}
				/>
			</>
		)
	}

	// let title
	// if (challenge.type === 'ASSIST') {
	// 	title = 'Select to correct meaning'
	// } else if (challenge.type === 'SELECT') {
	// 	title = challenge.question
	// } else if (challenge.type === 'WATCH') {
	// 	title = 'Watch this video'
	// } else if (challenge.type === 'AUDIO-VISUAL') {
	// 	title = 'Select the correct meaning'
	// } else if (challenge.type === 'AUDIO-TEXT') {
	// 	title = 'Select the correct meaning'
	// } else if (challenge.type === 'VISUAL-AUDIO') {
	// 	title = 'Select the correct meaning'
	// } else if (challenge.type === 'VISUAL-TEXT') {
	// 	title = 'Select the correct meaning'
	// } else if (challenge.type === 'TEXT-AUDIO') {
	// 	title = 'Select the correct meaning'
	// } else if (challenge.type === 'TEXT-VISUAL') {
	// 	title = 'Select the correct meaning'
	// }

	// PRIOR CODE
	// const title =
	// 	challenge.type === 'ASSIST'
	// 		? 'Select the correct answer'
	// 		: challenge.question

	const title =
		challenge.type === 'WATCH'
			? 'Watch this video'
			: 'Select the correct answer'

	return (
		<>
			{incorrectAudio}
			{correctAudio}
			<Header
				hearts={hearts}
				percentage={percentage}
				hasActiveSubscription={!!userSubscription?.isActive}
			/>
			<div className="flex-1">
				<div className="h-full flex items-center justify-center">
					<div className="lg:min-h-[350px] w-5/6 px-6 lg:px-0 flex flex-col gap-y-12">
						{/* <div className="lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-12"> */}
						<h1 className="text-lg lg:text-3xl text-center lg:text-start font-bold text-neutral-700">
							{title}
						</h1>
						<div>
							{challenge.type === 'ASSIST' && (
								//TODO Cameron reverse this to display text in the challenge bubble
								<QuestionBubble question={challenge.video} />
								// <QuestionBubble question={challenge.question} />
							)}
							{challenge.type === 'AUDIO-VISUAL' && (
								<QuestionBubble question={challenge.video} />
							)}
							{challenge.type === 'AUDIO-TEXT' && (
								<QuestionBubble question={challenge.video} />
							)}
							{challenge.type === 'VISUAL-AUDIO' && (
								<QuestionBubble question={challenge.video} />
							)}
							{challenge.type === 'VISUAL-TEXT' && (
								<QuestionBubble question={challenge.video} />
							)}
							{challenge.type === 'TEXT-AUDIO' && (
								<QuestionBubble question={challenge.video} />
							)}
							{challenge.type === 'TEXT-VISUAL' && (
								<QuestionBubble question={challenge.video} />
							)}

							{challenge.type === 'WATCH' && challenge.video && (
								<>
									<div className="player-wrapper w-full mx-auto h-[400px] lg:h-[600px]">
										<ReactPlayer
											url={`https://www.youtube.com/watch?v=${challenge.video}`}
											controls={true}
											width="100%"
											height="100%"
											className="react-player"
											onEnded={() =>
												startTransition(() => {
													upsertChallengeProgress(challenge.id)
														.then(() => {
															correctControls.play()
															setSelectedOption(1)
															setStatus('correct')
															setPercentage(
																(prev) => prev + 100 / challenges.length
															)

															// This is a practice
															if (initialPercentage === 100) {
																setHearts((prev) => Math.min(prev + 1, 5))
															}
														})
														.catch(() =>
															toast.error(
																'Something went wrong. Please try again.'
															)
														)
												})
											}
										/>
									</div>

									{/* <p>
										&bull; Must watch the video all the way through to mark as
										complete.
									</p>
									<p>
										&bull; To change the speed, click on the settings cog in the
										bottom right hand corner of the video.
									</p>
									<p>
										&bull; If the video is not loading{' '}
										<a
											href={`${challenge.video}`}
											target="_blank"
											className="underline"
											onClick={() =>
												startTransition(() => {
													upsertChallengeProgress(challenge.id)
														.then(() => {
															correctControls.play()
															setSelectedOption(1)
															setStatus('correct')
															setPercentage(
																(prev) => prev + 100 / challenges.length
															)

															// This is a practice
															if (initialPercentage === 100) {
																setHearts((prev) => Math.min(prev + 1, 5))
															}
														})
														.catch(() =>
															toast.error(
																'Something went wrong. Please try again.'
															)
														)
												})
											}
										>
											click here{' '}
										</a>
										to watch it on YouTube.
									</p> */}
								</>
							)}
							<Challenge
								options={options}
								onSelect={onSelect}
								status={status}
								selectedOption={selectedOption}
								disabled={pending}
								type={challenge.type}
							/>
						</div>
					</div>
				</div>
			</div>
			<Footer
				disabled={pending || !selectedOption}
				status={status}
				onCheck={onContinue}
			/>
		</>
	)
}
