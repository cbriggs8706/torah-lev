import Image from 'next/image'
import { getSession } from '@/lib/auth'
import {
	getConstructAbsoluteWords,
	getCourseProgress,
	getUserProgress,
} from '@/db/queries'

import { DismissibleAlert } from '@/components/dismissible-alert'
import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewConstructAbsoluteWordSort from '@/components/hebrew/hebrew-construct-absolute-word-sort'

export default async function HebrewConstructAbsoluteWordSortPage() {
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
		activity: 'wordSort',
	})

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/construction-worker-medium-skin-tone-svgrepo-com.svg"
						alt="Construct Word Sort"
						height={48}
						width={48}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						מִיּוּן נִסְמָךְ וּמוּחְלָט
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Construct Word Sort
					</p>

					<DismissibleAlert
						storageKey="construct-absolute-word-sort"
						className="mb-4 max-w-3xl"
					>
						Drag each word into the correct state zone. This activity uses the
						same lesson-based word bank as the conversion game, so new words can
						open up as lessons are added.
					</DismissibleAlert>

					<HebrewConstructAbsoluteWordSort
						words={words}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
