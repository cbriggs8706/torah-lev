'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'

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
	const channelName = `group-${studyGroup.id}`

	useEffect(() => {
		// Subscribe to realtime quiz events
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
						<Link href={`/study-group/${studyGroup.id}/live-quiz`}>
							<Button className="mt-3">Join Quiz</Button>
						</Link>
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
			<div className="p-4 border rounded-lg shadow-sm bg-gray-50">
				<h2 className="font-semibold text-lg mb-3">👥 Members</h2>
				<ul className="divide-y divide-gray-200">
					{studyGroup.members.map((m: any) => (
						<li key={m.user.userId} className="py-2 flex items-center gap-3">
							<div className="relative w-8 h-8 flex-shrink-0">
								<Image
									src={m.user.userImageSrc || '/mascot.svg'}
									alt={m.user.userName}
									fill
									className="object-cover rounded-full border"
									sizes="32px"
								/>
							</div>
							<span className="text-gray-800">{m.user.userName}</span>
						</li>
					))}
				</ul>
			</div>

			{/* 🔹 Messageboard Link */}
			<div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-center">
				<h2 className="font-semibold text-lg mb-3">💬 Group Messages</h2>
				<Link href={`/study-group/${studyGroup.id}/messages`}>
					<Button>Open Messageboard</Button>
				</Link>
			</div>

			{/* Future Modules */}
			<div className="p-4 border rounded-lg shadow-sm bg-gray-50 text-center text-gray-500 italic">
				Coming soon: Attendance, Homework, Announcements, Files, etc.
			</div>
		</div>
	)
}
