import Image from 'next/image'

import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress, getStudyGroupWithMessages } from '@/db/queries'
import StudyGroupDashboard from '@/components/study-group/dashboard'

export default async function StudyGroupDashboardPage({ params }: any) {
	const { id } = await params
	const userProgress = await getUserProgress()

	if (!userProgress) {
		return (
			<div className="text-center text-red-500 mt-10">
				You must be logged in to view the dashboard.
			</div>
		)
	}

	const studyGroupId = Number(id)
	const studyGroup = await getStudyGroupWithMessages(studyGroupId)

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
					<Image
						src="/left-speech-bubble-svgrepo-com.svg"
						alt="Study Group"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						{studyGroup.name}
					</h1>

					<StudyGroupDashboard studyGroup={studyGroup} />
				</div>
			</FeedWrapper>
		</div>
	)
}
