import Image from 'next/image'

import { getSession } from '@/lib/auth'
import {
	getConstructAbsoluteWords,
	getCourseProgress,
	getUserProgress,
} from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewConstructAbsoluteIdentifyForm from '@/components/hebrew/hebrew-construct-absolute-identify-form'

export default async function HebrewConstructAbsoluteIdentifyFormPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	const [userProgress, courseProgress] = userId
		? await Promise.all([getUserProgress(), getCourseProgress()])
		: [null, null]

	const activeCourseId = userProgress?.activeCourseId ?? 6
	const currentLesson =
		userProgress?.activeLessonNumber ??
		courseProgress?.activeLesson?.lessonNumber ??
		''
	const words = await getConstructAbsoluteWords({
		courseId: activeCourseId,
		activeLessonId: courseProgress?.activeLessonId ?? null,
		activity: 'identifyForm',
	})

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/construction-worker-medium-skin-tone-svgrepo-com.svg"
						alt="Identify Form"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						זִהוּי נִסְמָךְ אוֹ מוּחְלָט
					</h1>
					<p className="text-center font-nunito font-bold text-neutral-800 mb-2">
						Identify The Form
					</p>

					<DismissibleAlert
						storageKey="construct-absolute-identify-form"
						className="mb-4 max-w-3xl"
					>
						See one Hebrew word and choose whether it is in the absolute state
						or the construct state. It uses the same lesson-based word bank as
						the other construct activities.
					</DismissibleAlert>

					<HebrewConstructAbsoluteIdentifyForm
						words={words}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
