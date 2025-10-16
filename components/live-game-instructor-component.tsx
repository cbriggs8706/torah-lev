'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'

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
	studyGroupId,
}: {
	studyGroupId: number
}) {
	const [lessons, setLessons] = useState<any[]>([])
	const [selectedLesson, setSelectedLesson] = useState<any>(null)
	const [lessonData, setLessonData] = useState<any>(null)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [scores, setScores] = useState<Record<string, number>>({})
	const [gameOver, setGameOver] = useState(false)
	const channelName = `group-${studyGroupId}`

	// 🔹 Load available lessons
	useEffect(() => {
		fetch(`/api/study-groups/${studyGroupId}/lessons`)
			.then((r) => r.json())
			.then((data) => {
				setLessons(Array.isArray(data) ? data : data.lessons || [])
			})
			.catch(console.error)
	}, [studyGroupId])

	// 🔹 Broadcast helper
	const broadcast = async (event: string, payload: any) => {
		await supabase.channel(channelName).send({
			type: 'broadcast',
			event,
			payload,
		})
	}

	// 🧩 Start Game — use existing challenges endpoint
	const startGame = async () => {
		if (!selectedLesson) return alert('Select a lesson first')

		const res = await fetch(`/api/lessons/${selectedLesson.id}/challenges`)
		const challenges = await res.json()
		const fullLesson = { ...selectedLesson, challenges }

		await supabase.from('study_group_sessions').upsert(
			{
				study_group_id: studyGroupId,
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

	// 🔹 Go to next question or end game
	const nextQuestion = async () => {
		if (!lessonData) return
		const next = currentIndex + 1

		if (next >= lessonData.challenges.length) {
			// End of lesson
			setGameOver(true)
			setLessonData(null) // hides question/media area
			await broadcast('game-ended', { scores })
			return
		}

		setCurrentIndex(next)
		await broadcast('show-question', { index: next })
	}

	// 🧹 Listen for answers and realtime DB updates
	useEffect(() => {
		const channel = supabase.channel(channelName)

		channel
			.on('broadcast', { event: 'player-answered' }, (payload) => {
				const { userName, correct } = payload.payload as PlayerAnsweredEvent
				setScores((prev) => ({
					...prev,
					[userName]: (prev[userName] || 0) + (correct ? 1 : 0),
				}))
			})
			.subscribe()

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
	}, [studyGroupId])

	// 🧩 Active challenge
	const challenge = lessonData?.challenges?.[currentIndex]

	// 🔄 Restart game — reset everything
	const restartGame = async () => {
		setLessonData(null)
		setSelectedLesson(null)
		setScores({})
		setCurrentIndex(0)
		setGameOver(false)
		const { data, error } = await supabase
			.from('study_group_sessions')
			.upsert(
				{
					study_group_id: studyGroupId,
					lesson_id: selectedLesson.id,
					lesson_title: selectedLesson.title,
					is_active: true,
				},
				{ onConflict: 'study_group_id' }
			)
			.select()

		if (error) console.error('❌ Supabase upsert error:', error)
		else console.log('✅ Upsert success:', data)
	}

	return (
		<div className="text-center">
			<h2 className="text-xl font-bold mb-2">Instructor Dashboard</h2>

			{/* If game not started yet */}
			{!lessonData && !gameOver && (
				<>
					<select
						className="border px-2 py-1"
						onChange={(e) =>
							setSelectedLesson(
								lessons.find((l) => l.id === Number(e.target.value))
							)
						}
					>
						<option value="">Select lesson</option>
						{Array.isArray(lessons) &&
							lessons.map((l) => (
								<option key={l.id} value={l.id}>
									{l.title}
								</option>
							))}
					</select>

					<Button onClick={startGame} className="ml-2">
						Start Game
					</Button>
				</>
			)}

			{/* Active Game in Progress */}
			{lessonData && (
				<div className="mt-6 flex flex-col items-center gap-4">
					<h3 className="text-lg font-semibold">
						Question {currentIndex + 1} / {lessonData?.challenges?.length || 0}
					</h3>

					{/* 🔹 Conditional media display */}
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

					<Button onClick={nextQuestion}>Next Question</Button>
				</div>
			)}

			{/* 🏁 End of Game */}
			{gameOver && (
				<div className="mt-8 flex flex-col items-center">
					<h3 className="text-2xl font-bold text-green-700 mb-3">
						Game Complete 🎉
					</h3>
					<div className="w-full max-w-md bg-gray-100 rounded-lg p-4 shadow text-left">
						<h3 className="font-bold text-lg mb-3">🏆 Final Scores</h3>
						<ul className="space-y-1">
							{Object.entries(scores)
								.sort((a, b) => b[1] - a[1])
								.map(([name, points]) => (
									<li
										key={name}
										className="flex justify-between border-b border-gray-200 py-1"
									>
										<span className="font-medium">{name}</span>
										<span>{points}</span>
									</li>
								))}
						</ul>
					</div>
					<Button onClick={restartGame} className="mt-6">
						Restart Game
					</Button>
				</div>
			)}

			{/* 🏆 Live Scoreboard (always visible during or after game) */}
			{Object.keys(scores).length > 0 && !gameOver && (
				<div className="mt-6 w-full max-w-md bg-gray-100 rounded-lg p-4 shadow text-left">
					<h3 className="font-bold text-lg mb-3">🏆 Live Scores</h3>
					<ul className="space-y-1">
						{Object.entries(scores)
							.sort((a, b) => b[1] - a[1])
							.map(([name, points]) => (
								<li
									key={name}
									className="flex justify-between border-b border-gray-200 py-1"
								>
									<span className="font-medium">{name}</span>
									<span>{points}</span>
								</li>
							))}
					</ul>
				</div>
			)}
		</div>
	)
}
