'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LiveQuizSection({
	isInstructor,
	isLiveQuizActive,
	liveLessonTitle,
	studyGroupId,
	onJoinQuiz,
}: {
	isInstructor: boolean
	isLiveQuizActive: boolean
	liveLessonTitle: string | null
	studyGroupId: string | number
	onJoinQuiz: () => void
}) {
	return (
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
					<Button className="mt-3" onClick={onJoinQuiz}>
						Join Quiz
					</Button>
				</div>
			) : (
				<div className="text-gray-500">
					<p>No quiz currently running.</p>
					{isInstructor && (
						<Link href={`/study-group/${studyGroupId}/live-quiz`}>
							<Button className="mt-3">Start New Quiz</Button>
						</Link>
					)}
				</div>
			)}
		</div>
	)
}
