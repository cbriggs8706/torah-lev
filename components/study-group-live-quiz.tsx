'use client'
import LiveGameInstructor from './live-game-instructor-component'
import LiveGamePlayer from './live-game-player-component'

export default function StudyGroupLiveQuiz({
	userId,
	userName,
	studyGroup,
}: {
	userId: string
	userName: string
	studyGroup: any
}) {
	const isInstructor = studyGroup.teacher.userId === userId

	return (
		<div className="w-full flex flex-col items-center">
			<div className="text-center mb-6">
				<p className="text-sm text-gray-500">
					{isInstructor ? 'Instructor View' : 'Player View'}
				</p>
			</div>

			{isInstructor ? (
				<LiveGameInstructor studyGroupId={studyGroup.id} />
			) : (
				<LiveGamePlayer
					studyGroupId={studyGroup.id}
					userId={userId}
					userName={userName}
				/>
			)}
		</div>
	)
}
