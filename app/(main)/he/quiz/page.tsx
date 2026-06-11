import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getSession } from '@/lib/auth'
import { getUserProgress } from '@/db/queries'
import VocabQuiz from '@/components/vocab/vocab-quiz'
import {
	getFilteredHebrewVocabByCourseId,
	getHebrewVocabByCourseId,
} from '@/lib/server/vocab'
import { parseScheduledPublicCourseQuery } from '@/lib/public-course-activities'

export default async function HebrewQuizPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const session = await getSession()
	const userId = session?.user?.id ?? 'guest'
	const resolvedSearchParams = (await searchParams) ?? {}

	const userProgress = userId !== 'guest' ? await getUserProgress() : null

	const publicCourseQuery = parseScheduledPublicCourseQuery(resolvedSearchParams)
	const rawReturnTo = resolvedSearchParams.returnTo
	const returnTo =
		typeof rawReturnTo === 'string' && rawReturnTo.startsWith('/')
			? rawReturnTo
			: '/he/learn'
	const activeCourseId = publicCourseQuery.scheduled
		? publicCourseQuery.courseId ?? 6
		: userProgress?.activeCourseId ?? 6
	const currentLesson = publicCourseQuery.scheduled
		? publicCourseQuery.lesson ?? ''
		: userProgress?.activeLessonNumber ?? '1'
	const hebrewData = publicCourseQuery.scheduled
		? await getFilteredHebrewVocabByCourseId(
				activeCourseId,
				publicCourseQuery.filters,
		  )
		: await getHebrewVocabByCourseId(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col items-center">
					<Image
						src="/gameIcons/quiz.png"
						alt="Quiz"
						height={48}
						width={48}
						style={{ width: 'auto', height: 'auto' }}
					/>
					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						חידון
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">Quiz</p>

					<DismissibleAlert storageKey="vocabquiz-he" className="mb-4">
						This quiz defaults to lessons up through your current Learn lesson.
						Choose the prompt you want, adjust the timer, and practice with any
						vocab in your current course.
					</DismissibleAlert>

					<VocabQuiz
						data={hebrewData}
						currentLesson={currentLesson}
						courseId={activeCourseId}
						userId={userId}
						layout="hebrew"
						initialHearts={userProgress?.hearts ?? 5}
						returnTo={returnTo}
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
