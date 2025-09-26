'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

interface HebrewSpeedQuizProps {
	userId: string
	currentLesson?: string
}

const AVAILABLE_QUIZZES = [
	'1.1',
	'1.2',
	'2.1',
	'2.2',
	'3.1',
	'3.3',
	'4.1',
	'5.1',
	'6.1',
	'6.2',
	'7.1',
	'7.2',
	'8.1',
	'8.2',
	'9.1',
	'9.2',
	'10.1',
	'10.2',
	'10.3',
	'11.1',
	'11.2',
	'12.1',
	'12.2',
	'12.3',
	'12.4',
	'14.1',
	'15.1',
	'15.2',
	'15.5',
	'16.3',
	'18.1',
	'18.2',
	'20.2',
	'21.1',
	'21.2',
	'22.1',
	'22.2',
	'23.2',
	'23.3',
	'24.2',
	'25.1',
	'25.2',
	'26.1',
	'26.2',
	'27.1',
	'27.2',
	'28.1',
	'29.1',
	'30.2',
	'31.1',
	'31.2',
	'31.3',
	'32.1',
	'32.2',
	'35.3',
	'36.1',
	'36.2',
	'37.1',
	'38.3',
	'39.1',
	'39.2',
	'39.3',
	'40.1',
	'41.1',
	'41.2',
	'42.1',
	'42.3',
	'45.1',
	'45.2',
	'46.1',
	'47.1',
	'47.2',
	'48.1',
	'48.2',
	'49.1',
	'50.1',
	'51.1',
	'51.3',
	'52.1',
	'53.1',
	'53.2',
	'54.1',
	'54.3',
	'55.1',
]

function buildUrl(quiz: string) {
	const [lesson, part] = quiz.split('.')
	return `https://wordboat.com/embed/quiz-${lesson}-${part}/`
}

export default function HebrewSpeedQuiz({
	userId,
	currentLesson,
}: HebrewSpeedQuizProps) {
	const [activeQuiz, setActiveQuiz] = useState<string>('1.1')
	const [showFilter, setShowFilter] = useState(false)
	const [audioVolume, setAudioVolume] = useState(1)
	const [audioSpeed, setAudioSpeed] = useState(1)

	useEffect(() => {
		if (!currentLesson) {
			setActiveQuiz('1.1')
			return
		}
		const firstForLesson = AVAILABLE_QUIZZES.find((q) =>
			q.startsWith(currentLesson + '.')
		)
		setActiveQuiz(firstForLesson ?? '1.1')
	}, [currentLesson])

	const awardPoints = useCallback(
		async (points: number) => {
			try {
				await fetch('/api/award-points', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, points }),
				})
			} catch (error) {
				console.error('Failed to award points', error)
			}
		},
		[userId]
	)

	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (event.origin !== 'https://wordboat.com') return // security check
			if (event.data?.type === 'quizComplete') {
				// award 5 points
				awardPoints(5)
			}
		}

		window.addEventListener('message', handleMessage)
		return () => window.removeEventListener('message', handleMessage)
	}, [awardPoints])

	return (
		<div className="flex flex-col min-h-screen">
			{/* Top Controls */}
			<div className="p-4">
				<div className="mb-6 flex justify-center gap-4">
					<button
						onClick={() => setShowFilter((prev) => !prev)}
						className={`px-4 py-2 rounded shadow flex items-center justify-center gap-4 ${
							showFilter ? 'bg-blue-600 text-white' : 'bg-gray-200'
						}`}
					>
						<Image
							src="/books-svgrepo-com.svg"
							alt="Filter icon"
							width={30}
							height={30}
						/>
						Filter
					</button>
				</div>

				{showFilter && (
					<>
						{/* <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-6">
							<div className="text-sm text-center">
								<label className="block mb-1 font-medium">Volume</label>
								<input
									type="range"
									min="0"
									max="2"
									step="0.05"
									value={audioVolume}
									onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
								/>
								<div className="text-center">
									{Math.round(audioVolume * 100)}%
								</div>
							</div>
							<div className="text-sm text-center">
								<label className="block mb-1 font-medium">Speed</label>
								<input
									type="range"
									min="0.5"
									max="1"
									step="0.05"
									value={audioSpeed}
									onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
								/>
								<div className="text-center">{audioSpeed.toFixed(2)}x</div>
							</div>
						</div> */}

						<h2 className="text-xl font-semibold mb-2 text-center">
							Select a Quiz
						</h2>
						<div className="flex flex-wrap gap-2 justify-center mb-6">
							{AVAILABLE_QUIZZES.map((quiz) => (
								<button
									key={quiz}
									onClick={() => setActiveQuiz(quiz)}
									className={`px-3 py-1 border rounded-full text-xs ${
										activeQuiz === quiz
											? 'bg-blue-500 text-white'
											: 'bg-gray-200 hover:bg-gray-300'
									}`}
								>
									{quiz}
								</button>
							))}
						</div>
					</>
				)}
			</div>

			{/* Quiz iframe takes all remaining space */}
			<div className="flex-1 min-h-0">
				<iframe
					key={activeQuiz}
					src={buildUrl(activeQuiz)}
					className="w-full flex-1 min-h-[80vh]"
					style={{ border: 'none' }}
					allow="fullscreen"
				/>
			</div>
		</div>
	)
}
