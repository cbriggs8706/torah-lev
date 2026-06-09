import Image from 'next/image'

import { getSession } from '@/lib/auth'
import {
	getConstructAbsoluteWords,
	getCourseProgress,
	getUserProgress,
} from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewConstructAbsoluteConversion from '@/components/hebrew/hebrew-construct-absolute-conversion'

export default async function HebrewConstructAbsoluteConversionPage() {
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
		activity: 'converter',
	})

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/construction-worker-medium-skin-tone-svgrepo-com.svg"
						alt="Construct Conversion"
						height={48}
						width={48}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						הֲמָרַת מוּחְלָט לְנִסְמָךְ
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Absolute To Construct
					</p>

					<DismissibleAlert
						storageKey="construct-absolute-conversion"
						className="mb-4 max-w-3xl"
					>
						Start with the absolute-state word, then drag vowels from the bank
						onto the consonants to build the construct-state version.
					</DismissibleAlert>

					<HebrewConstructAbsoluteConversion
						words={words}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
