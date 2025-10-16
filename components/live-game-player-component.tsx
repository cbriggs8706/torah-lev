'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'

export default function LiveGamePlayer({
	studyGroupId,
	userId,
	userName,
}: {
	studyGroupId: number
	userId: string
	userName: string
}) {
	const [gameStarted, setGameStarted] = useState(false)
	const [gameOver, setGameOver] = useState(false)
	const [lessonData, setLessonData] = useState<any>(null)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [points, setPoints] = useState<number>(0)
	const [hasAnswered, setHasAnswered] = useState(false)
	const channelName = `group-${studyGroupId}`

	const checkActiveSession = async () => {
		const { data, error } = await supabase
			.from('study_group_sessions')
			.select('*')
			.eq('study_group_id', studyGroupId)
			.eq('is_active', true)
			.limit(1)

		if (error) {
			console.error('❌ Error fetching session:', error)
			return
		}

		const session = Array.isArray(data) ? data[0] : data
		if (session) {
			console.log('⚡ Found active quiz session:', session)
			const res = await fetch(`/api/lessons/${session.lesson_id}/challenges`)
			const challenges = await res.json()
			setLessonData({ title: session.lesson_title, challenges })
			setGameStarted(true)
			setCurrentIndex(0)
		} else {
			console.log('ℹ️ No active quiz session found')
		}
	}

	// 🟢 Setup Realtime listener
	useEffect(() => {
		// define inline so it doesn't change reference
		const checkActiveSession = async () => {
			const { data, error } = await supabase
				.from('study_group_sessions')
				.select('*')
				.eq('study_group_id', studyGroupId)
				.eq('is_active', true)
				.limit(1)

			if (error) {
				console.error('❌ Error fetching session:', error)
				return
			}

			const session = Array.isArray(data) ? data[0] : data
			if (session) {
				console.log('⚡ Found active quiz session:', session)
				const res = await fetch(`/api/lessons/${session.lesson_id}/challenges`)
				const challenges = await res.json()
				setLessonData({ title: session.lesson_title, challenges })
				setGameStarted(true)
				setCurrentIndex(0)
			} else {
				console.log('ℹ️ No active quiz session found')
			}
		}

		checkActiveSession() // ✅ now defined inside effect, so no external dep

		const channel = supabase.channel(`group-${studyGroupId}`)

		channel
			.on('broadcast', { event: 'game-started' }, (payload) => {
				console.log('🎮 Game started!', payload)
				setLessonData(payload.payload)
				setGameStarted(true)
				setGameOver(false)
				setPoints(0)
				setHasAnswered(false)
				setCurrentIndex(0)
			})
			.on('broadcast', { event: 'show-question' }, (payload) => {
				console.log('📜 Next question', payload)
				setCurrentIndex(payload.payload.index)
				setHasAnswered(false)
			})
			.on('broadcast', { event: 'game-ended' }, async () => {
				console.log('🏁 Game ended!')
				setGameOver(true)
				setGameStarted(false)
				setLessonData(null)

				const { data } = await supabase
					.from('game_results')
					.select('points')
					.eq('study_group_id', studyGroupId)
					.eq('user_id', userId)
					.single()

				if (data?.points !== undefined) setPoints(data.points)
			})
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [studyGroupId, userId])

	// 🧩 Handle Answer Click
	const handleAnswer = async (option: any) => {
		if (hasAnswered) return // 🔒 prevent multiple clicks

		setHasAnswered(true)
		const isCorrect = option.correct === true

		let newPoints = points
		if (isCorrect) {
			newPoints = points + 1
			setPoints(newPoints)
		}

		// 🔹 Save updated score to DB
		await supabase.from('game_results').upsert(
			{
				study_group_id: studyGroupId,
				user_id: userId,
				user_name: userName,
				points: newPoints,
			},
			{ onConflict: 'study_group_id,user_id' }
		)

		// 🔹 Notify instructor
		await supabase.channel(channelName).send({
			type: 'broadcast',
			event: 'player-answered',
			payload: { userId, userName, correct: isCorrect },
		})

		console.log('✅ Answer sent:', { userName, correct: isCorrect, newPoints })
	}

	// 🧩 Current challenge
	const challenge = lessonData?.challenges?.[currentIndex]

	// 💭 Waiting screen
	if (!gameStarted && !gameOver)
		return (
			<p className="text-gray-500 mt-4 text-center">
				⌛ Waiting for instructor to start the game...
			</p>
		)

	// 🏁 End screen
	if (gameOver)
		return (
			<div className="text-center mt-8">
				<h2 className="text-2xl font-bold text-green-700 mb-2">
					Quiz Complete 🎉
				</h2>
				<p className="text-xl text-gray-800">
					You scored <span className="font-semibold">{points}</span> point
					{points === 1 ? '' : 's'}!
				</p>
			</div>
		)

	// Guard fallback
	if (!challenge)
		return (
			<p className="text-green-600 text-center mt-6 text-lg">
				Quiz complete 🎉 Thanks for playing!
			</p>
		)

	// 🎮 Quiz in progress
	return (
		<div className="text-center">
			<h2 className="text-lg mb-4 font-semibold">
				Question {currentIndex + 1} / {lessonData.challenges.length}
			</h2>

			{/* Answer Options */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-center">
				{(challenge.options || []).map((opt: any) => (
					<Button
						key={opt.id}
						onClick={() => handleAnswer(opt)}
						disabled={hasAnswered}
						className={`flex flex-col items-center justify-center p-4 text-lg h-48 w-48 bg-white border shadow transition 
							${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
					>
						{opt.imageSrc ? (
							<Image
								src={opt.imageSrc}
								alt="Option"
								width={160}
								height={160}
								className="rounded object-contain"
							/>
						) : opt.audioSrc ? (
							<audio
								key={opt.audioSrc}
								controls
								autoPlay={false}
								className="w-full"
							>
								<source src={opt.audioSrc} type="audio/mpeg" />
							</audio>
						) : opt.hebNiqqud ? (
							<span className="text-4xl font-hebrew text-gray-800">
								{opt.hebNiqqud}
							</span>
						) : (
							<p className="text-gray-400 italic text-sm">No media</p>
						)}
					</Button>
				))}
			</div>

			{/* 🧮 Show live player score */}
			<p className="mt-4 text-gray-600 text-sm">
				Your score: <span className="font-semibold">{points}</span>
			</p>
		</div>
	)
}
