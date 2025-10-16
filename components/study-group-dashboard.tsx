'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'

function formatTimeAgo(dateString: string) {
	const date = new Date(dateString)
	const diffMs = Date.now() - date.getTime()
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (diffDays <= 0) return 'today'
	if (diffDays === 1) return '1 day ago'
	return `${diffDays} days ago`
}

export default function StudyGroupDashboard({
	userId,
	userName,
	studyGroup,
}: {
	userId: string
	userName: string
	studyGroup: any
}) {
	const [isLiveQuizActive, setIsLiveQuizActive] = useState(false)
	const [liveLessonTitle, setLiveLessonTitle] = useState<string | null>(null)
	const router = useRouter()
	const channelName = `group-${studyGroup.id}`

	useEffect(() => {
		// define channel name inside effect so it's not an external dep
		const channelName = `group-${studyGroup.id}`

		const channel = supabase.channel(channelName)

		channel
			.on('broadcast', { event: 'game-started' }, (payload) => {
				setIsLiveQuizActive(true)
				setLiveLessonTitle(payload.payload.title || 'Lesson in progress')
			})
			.on('broadcast', { event: 'game-ended' }, () => {
				setIsLiveQuizActive(false)
				setLiveLessonTitle(null)
			})
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [studyGroup.id])

	const isInstructor = studyGroup.teacher.userId === userId

	// 🧩 Handle join click — broadcast player info before navigating
	const handleJoinQuiz = async () => {
		try {
			const member = studyGroup.members.find(
				(m: any) => m.user.userId === userId
			)
			const userImageSrc = member?.user.userImageSrc || '/mascot.svg'

			await supabase.channel(channelName).send({
				type: 'broadcast',
				event: 'player-joined',
				payload: {
					userId,
					userName,
					userImageSrc, // 👈 send image
				},
			})

			router.push(`/study-group/${studyGroup.id}/live-quiz`)
		} catch (err) {
			console.error('Failed to join quiz:', err)
		}
	}

	return (
		<div className="w-full max-w-2xl mx-auto space-y-6">
			{/* 🔹 Live Quiz Section */}
			<div className="p-4 border rounded-lg shadow-sm bg-gray-50">
				<h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
					🧠 Live Quiz Status
				</h2>
				{isLiveQuizActive ? (
					<div className="text-green-700 font-medium">
						✅ A live quiz is in progress!
						<p className="text-gray-700 mt-1">
							Lesson: <strong>{liveLessonTitle}</strong>
						</p>
						<Button className="mt-3" onClick={handleJoinQuiz}>
							Join Quiz
						</Button>
					</div>
				) : (
					<div className="text-gray-500">
						<p>No quiz currently running.</p>
						{isInstructor && (
							<Link href={`/study-group/${studyGroup.id}/live-quiz`}>
								<Button className="mt-3">Start New Quiz</Button>
							</Link>
						)}
					</div>
				)}
			</div>
			{/* 🔹 Members List */}
			<div className="p-4 border rounded-lg shadow-sm bg-gray-50 relative">
				<div className="flex justify-between items-center mb-4">
					<h2 className="font-semibold text-lg">👥 Members</h2>
					<Link href={`/study-group/${studyGroup.id}/messages`}>
						<Button size="sm">Open Messageboard</Button>
					</Link>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full border-collapse">
						<thead>
							<tr className="text-left text-sm text-gray-600 border-b">
								<th className="py-2">Profile</th>
								<th className="py-2">Name</th>
								<th className="py-2">Current Lesson</th>
								<th className="py-2">Last Sign In</th>
							</tr>
						</thead>
						<tbody>
							{studyGroup.members.map((m: any) => {
								const isHebrew = /[\u0590-\u05FF]/.test(m.user.userName)
								const lastSeen = m.user.lastSeen
									? formatTimeAgo(m.user.lastSeen)
									: '—'
								return (
									<tr
										key={m.user.userId}
										className="border-b hover:bg-gray-100"
									>
										<td className="py-2">
											<div className="relative w-10 h-10">
												<Image
													src={m.user.userImageSrc || '/mascot.svg'}
													alt={m.user.userName}
													fill
													className="object-cover rounded-full border"
													sizes="40px"
												/>
											</div>
										</td>
										<td className="py-2">
											<span
												className={
													isHebrew
														? 'font-serif text-4xl text-gray-800'
														: 'text-gray-800 text-lg font-medium'
												}
											>
												{m.user.userName}
											</span>
										</td>
										<td className="py-2 text-gray-700">
											{m.user.activeLessonNumber
												? `Lesson ${m.user.activeLessonNumber}`
												: '—'}
										</td>
										<td className="py-2 text-gray-500">{lastSeen}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Future Modules */}
			<div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-center text-gray-500 italic">
				Coming soon: Archive, Homework, Announcements, Files, etc.
			</div>
		</div>
	)
}
