import Image from 'next/image'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getUserProgress,
	getUserSubscription,
	getStudyGroupWithCourses,
} from '@/db/queries'
import StudyGroupLiveQuiz from '@/components/dashboard/study-group-live-quiz'

export default async function StudyGroupLiveQuizPage({ params }: any) {
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	if (!userProgress) {
		return (
			<div className="text-center text-red-500 mt-10">
				You must be logged in to view the dashboard.
			</div>
		)
	}

	const studyGroupId = Number(params.id)
	const studyGroup = await getStudyGroupWithCourses(studyGroupId)

	if (!studyGroup) {
		return (
			<p className="text-center mt-10 text-gray-500">
				This study group could not be found.
			</p>
		)
	}

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					{/* <Image
						src="/left-speech-bubble-svgrepo-com.svg"
						alt="Study Group"
						height={90}
						width={90}
					/> */}
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Live Quiz
					</h1>
					<StudyGroupLiveQuiz
						userId={userProgress.userId}
						userName={userProgress.userName}
						studyGroup={studyGroup}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
