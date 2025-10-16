'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Lesson } from './course-lesson-selector'
import { StudyGroupType } from '@/types/study-group'
import CourseLessonSelector from './course-lesson-selector'

type GameResultRow = {
	id: number
	study_group_id: number
	user_id: string
	user_name: string
	points: number
	updated_at: string
}

type PlayerAnsweredEvent = {
	userId: string
	userName: string
	correct: boolean
}

export default function LiveGameInstructor({
	studyGroup,
}: {
	studyGroup: StudyGroupType
}) {
	const [lessons, setLessons] = useState<any[]>([])
	const [selectedLesson, setSelectedLesson] = useState<any>(null)
	const [lessonData, setLessonData] = useState<any>(null)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [scores, setScores] = useState<Record<string, number>>({})
	const [userAvatars, setUserAvatars] = useState<Record<string, string>>({})
	const [gameOver, setGameOver] = useState(false)
	const channelName = `group-${studyGroup.id}`

	// 🔹 Load lessons
	useEffect(() => {
		fetch(`/api/study-groups/${studyGroup.id}/lessons`)
			.then((r) => r.json())
			.then((data) => {
				setLessons(Array.isArray(data) ? data : data.lessons || [])
			})
			.catch(console.error)
	}, [studyGroup.id])

	// 🔹 Broadcast helper
	const broadcast = async (event: string, payload: any) => {
		await supabase.channel(channelName).send({
			type: 'broadcast',
			event,
			payload,
		})
	}

	// 🧩 Start Game
	const startGame = async () => {
		if (!selectedLesson) return alert('Select a lesson first')
		const res = await fetch(`/api/lessons/${selectedLesson.id}/challenges`)
		const challenges = await res.json()
		const fullLesson = { ...selectedLesson, challenges }

		await supabase.from('study_group_sessions').upsert(
			{
				study_group_id: studyGroup.id,
				lesson_id: selectedLesson.id,
				lesson_title: selectedLesson.title,
				is_active: true,
			},
			{ onConflict: 'study_group_id' }
		)

		setLessonData(fullLesson)
		setCurrentIndex(0)
		setGameOver(false)
		await broadcast('game-started', fullLesson)
	}

	// 🔹 Next question
	const nextQuestion = async () => {
		if (!lessonData) return
		const next = currentIndex + 1

		if (next >= lessonData.challenges.length) {
			setGameOver(true)
			setLessonData(null)
			await broadcast('game-ended', { scores })
			return
		}

		setCurrentIndex(next)
		await broadcast('show-question', { index: next })
	}

	// 🧹 Listen for realtime updates
	useEffect(() => {
		const channel = supabase.channel(channelName)

		channel
			// Player joins (avatar + initial score)
			.on('broadcast', { event: 'player-joined' }, (payload) => {
				const { userName, userImageSrc } = payload.payload
				setUserAvatars((prev) => ({
					...prev,
					[userName]: userImageSrc || '/mascot.svg',
				}))
				setScores((prev) => ({
					...prev,
					[userName]: prev[userName] || 0,
				}))
			})

			// Player answers (increment score)
			.on('broadcast', { event: 'player-answered' }, (payload) => {
				const { userName, correct } = payload.payload as PlayerAnsweredEvent
				setScores((prev) => ({
					...prev,
					[userName]: (prev[userName] || 0) + (correct ? 1 : 0),
				}))
			})

			.subscribe()

		// Optional: still listening to Supabase DB table
		const subscription = supabase
			.channel('public:game_results')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'game_results' },
				(payload) => {
					const row = payload.new as GameResultRow | null
					if (!row?.user_name) return
					setScores((prev) => ({
						...prev,
						[row.user_name]: row.points,
					}))
				}
			)
			.subscribe()

		return () => {
			channel.unsubscribe()
			subscription.unsubscribe()
		}
	}, [channelName])

	const challenge = lessonData?.challenges?.[currentIndex]

	const restartGame = async () => {
		setLessonData(null)
		setSelectedLesson(null)
		setScores({})
		setCurrentIndex(0)
		setGameOver(false)
		await supabase
			.from('study_group_sessions')
			.update({ is_active: false })
			.eq('study_group_id', studyGroup.id)
	}

	return (
		<div className="w-full flex flex-col md:flex-row justify-center md:items-start gap-6 text-center relative">
			{/* 🧭 MAIN CONTENT */}
			<div className="flex-1">
				{/* Show selector before game starts */}
				{!lessonData && !gameOver && (
					<div className="flex flex-col items-center gap-4">
						<CourseLessonSelector
							studyGroup={studyGroup}
							onLessonSelect={(lesson: Lesson) => setSelectedLesson(lesson)}
						/>
						<Button
							onClick={startGame}
							className="ml-2"
							disabled={!selectedLesson}
						>
							Start Game
						</Button>
					</div>
				)}

				{/* Active Game */}
				{lessonData && (
					<div className="mt-6 flex flex-col items-center gap-6">
						{/* Compact header */}
						<div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-3xl border-b pb-2">
							<h3 className="text-lg font-semibold text-gray-700">
								Lesson:{' '}
								<span className="text-blue-600">{lessonData.title}</span>
							</h3>
							<p className="text-gray-600">
								Question {currentIndex + 1} /{' '}
								{lessonData?.challenges?.length || 0}
							</p>
						</div>

						{/* Question display */}
						<div className="p-6 bg-gray-50 rounded-lg border shadow-sm w-full max-w-3xl min-h-[200px] flex justify-center items-center">
							{challenge?.image ? (
								<Image
									src={challenge.image}
									alt="Challenge Image"
									width={400}
									height={300}
									className="rounded shadow-md"
								/>
							) : challenge?.audio ? (
								<audio key={challenge.audio} controls autoPlay className="my-3">
									<source src={challenge.audio} type="audio/mpeg" />
								</audio>
							) : challenge?.hebNiqqud ? (
								<p className="text-4xl font-hebrew text-gray-800">
									{challenge.hebNiqqud}
								</p>
							) : (
								<p className="text-gray-500 italic">No media available</p>
							)}
						</div>

						<Button onClick={nextQuestion}>
							{currentIndex + 1 === lessonData.challenges.length
								? 'End Game'
								: 'Next Question'}
						</Button>
					</div>
				)}

				{/* 🏁 End of Game — show full-screen leaderboard */}
				{gameOver && (
					<div className="w-full flex flex-col items-center mt-10">
						<h3 className="text-3xl font-bold text-green-700 mb-6">
							Game Complete 🎉
						</h3>

						<div className="w-full max-w-2xl bg-gray-100 rounded-lg p-6 shadow-md text-left">
							<h3 className="font-bold text-2xl mb-4 text-center">
								🏆 Final Scores
							</h3>
							<ul className="space-y-2">
								{Object.entries(scores)
									.sort((a, b) => b[1] - a[1])
									.map(([name, points], index) => {
										const medal =
											index === 0
												? '🥇'
												: index === 1
												? '🥈'
												: index === 2
												? '🥉'
												: ''
										const bgColor =
											index === 0
												? 'bg-yellow-100'
												: index === 1
												? 'bg-gray-200'
												: index === 2
												? 'bg-amber-200'
												: 'bg-white'
										return (
											<li
												key={name}
												className={`flex items-center justify-between border-b border-gray-200 py-2 px-3 rounded ${bgColor}`}
											>
												<div className="flex items-center gap-2">
													<Image
														src={userAvatars[name] || '/mascot.svg'}
														alt={name}
														width={36}
														height={36}
														className="rounded-full border shadow-sm object-cover"
													/>
													<span className="font-medium text-lg">
														{medal && <span className="mr-1">{medal}</span>}
														{name}
													</span>
												</div>
												<span className="font-semibold text-blue-700 text-lg">
													{points}
												</span>
											</li>
										)
									})}
							</ul>
						</div>

						<Button onClick={restartGame} className="mt-8">
							Restart Game
						</Button>
					</div>
				)}
			</div>
			{/* 🏆 RIGHT SIDEBAR — Only visible DURING the game */}
			{lessonData && !gameOver && Object.keys(scores).length > 0 && (
				<div className="w-full md:w-[300px] bg-gray-100 rounded-lg p-4 shadow-md md:sticky md:top-6 self-start">
					<h3 className="font-bold text-lg mb-3 text-left">🏆 Live Scores</h3>
					<ul className="space-y-2 max-h-[400px] overflow-y-auto text-left">
						{Object.entries(scores)
							.sort((a, b) => b[1] - a[1])
							.map(([name, points], index) => {
								const medal =
									index === 0
										? '🥇'
										: index === 1
										? '🥈'
										: index === 2
										? '🥉'
										: ''
								const bgColor =
									index === 0
										? 'bg-yellow-100'
										: index === 1
										? 'bg-gray-200'
										: index === 2
										? 'bg-amber-200'
										: 'bg-white'
								return (
									<li
										key={name}
										className={`flex items-center justify-between border-b border-gray-200 py-1 px-2 rounded ${bgColor}`}
									>
										<div className="flex items-center gap-2">
											<Image
												src={userAvatars[name] || '/mascot.svg'}
												alt={name}
												width={28}
												height={28}
												className="rounded-full border shadow-sm object-cover"
											/>
											<span className="font-medium">
												{medal && <span className="mr-1">{medal}</span>}
												{name}
											</span>
										</div>
										<span className="font-semibold text-blue-600">
											{points}
										</span>
									</li>
								)
							})}
					</ul>
				</div>
			)}
		</div>
	)
}
