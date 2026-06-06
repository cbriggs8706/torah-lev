import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getCourseProgress, getUserProgress } from '@/db/queries'
import HebrewIntroduction from '@/components/hebrew/hebrew-introduction'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'
import type { HebrewVocab } from '@/lib/vocab'
import { parseScheduledPublicCourseQuery } from '@/lib/public-course-activities'

export default async function HebrewIntroductionPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const resolvedSearchParams = (await searchParams) ?? {}

	const [userProgress, userChallengeData] = userId
		? await Promise.all([getUserProgress(), getCourseProgress()])
		: [null, null]

	const publicCourseQuery = parseScheduledPublicCourseQuery(resolvedSearchParams)
	const activeCourseId = publicCourseQuery.scheduled
		? publicCourseQuery.courseId ?? 6
		: userProgress?.activeCourseId ?? 6
	const currentLesson = publicCourseQuery.scheduled
		? publicCourseQuery.lesson ?? ''
		: userChallengeData?.activeLesson?.lessonNumber ?? ''
	const hebrewData: HebrewVocab[] =
		await getHebrewVocabByCourseId(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col items-center">
					<Image
						src="/speech-balloon-svgrepo-com.svg"
						alt="Introduction"
						height={90}
						width={90}
					/>
					<h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
						Introduction
					</h1>

					<DismissibleAlert storageKey="hebrew-introduction" className="mb-4">
						This activity teaches one new Hebrew vocab item at a time, starting
						with the first two, then quizzes all learned words each round. Each
						new word will repeat 3 times and then present 2-3 images as options
						to match the audio. Click the audio button to repeat the prompt.
						Each word of the lesson will earn a point. You will not lose points
						for incorrect quesses. Select a lesson to begin.
					</DismissibleAlert>

					<HebrewIntroduction
						data={hebrewData}
						activeCourseId={activeCourseId}
						currentLesson={currentLesson}
						initialHearts={userProgress?.hearts ?? 5}
						filtersLocked={publicCourseQuery.scheduled}
						initialFilters={publicCourseQuery.filters}
						completionContext={
							publicCourseQuery.enrollmentId && publicCourseQuery.publicCourseLessonId
								? {
										enrollmentId: publicCourseQuery.enrollmentId,
										publicCourseLessonId: publicCourseQuery.publicCourseLessonId,
								  }
								: undefined
						}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
