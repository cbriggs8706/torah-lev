'use client'
import { StudyGroupType } from '@/types/study-group'
import LiveGameInstructor from '../live-game-instructor-component'
import LiveGamePlayer from '../live-game-player-component'

export default function StudyGroupLiveQuiz({
	userId,
	userName,
	studyGroup,
}: {
	userId: string
	userName: string
	studyGroup: StudyGroupType
}) {
	const isInstructor = studyGroup.teacher.userId === userId

	return (
		<div className="w-full flex flex-col items-center">
			{/* <div className="text-center mb-6">
				<p className="text-sm text-gray-500">
					{isInstructor ? 'Instructor View' : 'Player View'}
				</p>
			</div> */}

			{isInstructor ? (
				<LiveGameInstructor studyGroup={studyGroup} />
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
