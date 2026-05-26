import Image from 'next/image'

import { FeedWrapper } from '@/components/feed-wrapper'
import StudyGroupSettings from '@/components/study-group/study-group-settings'
import { getStudyGroupWithMessages, getUserProgress } from '@/db/queries'

export default async function StudyGroupSettingsPage({ params }: any) {
	const { id } = await params
	const userProgress = await getUserProgress()

	if (!userProgress) {
		return (
			<div className="mt-10 text-center text-red-500">
				You must be logged in to manage this study group.
			</div>
		)
	}

	const studyGroupId = Number(id)
	const studyGroup = await getStudyGroupWithMessages(studyGroupId)

	if (!studyGroup) {
		return (
			<p className="mt-10 text-center text-gray-500">
				This study group could not be found.
			</p>
		)
	}

	if (studyGroup.teacherId !== userProgress.userId) {
		return (
			<p className="mt-10 text-center text-gray-500">
				Only the study group leader can manage these settings.
			</p>
		)
	}

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/left-speech-bubble-svgrepo-com.svg"
						alt="Study Group Settings"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						{studyGroup.name} Settings
					</h1>

					<StudyGroupSettings
						studyGroupId={studyGroup.id}
						initialCourses={studyGroup.courses ?? []}
						initialEvents={studyGroup.scheduleEvents ?? []}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
