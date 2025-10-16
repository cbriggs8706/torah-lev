import Image from 'next/image'
import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'

import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getUserProgress,
	getUserSubscription,
	getStudyGroupWithMessages,
} from '@/db/queries'

const StudyGroupDashboard = dynamic(
	() => import('@/components/study-group-dashboard'),
	{ ssr: false }
)

export default async function StudyGroupDashboardPage({
	params,
}: {
	params: { id: string }
}) {
	const [userProgress, userSubscription] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
	])

	if (!userProgress) {
		redirect('/login')
	}

	const studyGroupId = Number(params.id)
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
						{studyGroup.name} Dashboard
					</h1>

					<StudyGroupDashboard
						userId={userProgress.userId}
						userName={userProgress.userName}
						studyGroup={studyGroup}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
