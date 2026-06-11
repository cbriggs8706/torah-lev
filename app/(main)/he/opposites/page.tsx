import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getSession } from '@/lib/auth'
import { getUserProgress } from '@/db/queries'
import {
	getFilteredHebrewVocabWithAntonymsByCourseId,
	getHebrewVocabByCourseId,
} from '@/lib/server/vocab'
import HebrewOpposites from '@/components/hebrew/hebrew-opposites'
import { parseScheduledPublicCourseQuery } from '@/lib/public-course-activities'

export default async function HebrewOppositesPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const resolvedSearchParams = (await searchParams) ?? {}
	const publicCourseQuery = parseScheduledPublicCourseQuery(resolvedSearchParams)
	const rawReturnTo = resolvedSearchParams.returnTo
	const returnTo =
		typeof rawReturnTo === 'string' && rawReturnTo.startsWith('/')
			? rawReturnTo
			: undefined

	const userProgress = userId ? await getUserProgress() : null

	const activeCourseId = publicCourseQuery.scheduled
		? (publicCourseQuery.courseId ?? 6)
		: (userProgress?.activeCourseId ?? 6)
	const currentLesson = publicCourseQuery.scheduled
		? (publicCourseQuery.lesson ?? '')
		: (userProgress?.activeLessonNumber ?? '')
	const hebrewData = publicCourseQuery.scheduled
		? await getFilteredHebrewVocabWithAntonymsByCourseId(
				activeCourseId,
				publicCourseQuery.filters,
			)
		: await getHebrewVocabByCourseId(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col items-center">
					<Image
						src="/gameIcons/matchingPairs.png"
						alt="Opposites"
						height={48}
						width={48}
					/>
					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						הֲפָכִים
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">
						Opposites
					</p>

					<DismissibleAlert storageKey="hebrew-opposites" className="mb-4">
						Choose one lesson, then match each Hebrew word to its antonym. Tap a
						word to inspect it in the center, see its translation, and replay its
						audio before making your match.
					</DismissibleAlert>

					<HebrewOpposites
						courseId={activeCourseId}
						data={hebrewData}
						currentLesson={currentLesson}
						userId={userId ?? 'guest'}
						initialHearts={userProgress?.hearts ?? 5}
						returnTo={returnTo}
						hideFilters={publicCourseQuery.scheduled}
						initialFilters={publicCourseQuery.filters}
						lockedLesson={
							publicCourseQuery.scheduled
								? (publicCourseQuery.lesson ?? undefined)
								: undefined
						}
						completionContext={
							publicCourseQuery.enrollmentId &&
							publicCourseQuery.publicCourseLessonId
								? {
										enrollmentId: publicCourseQuery.enrollmentId,
										publicCourseLessonId:
											publicCourseQuery.publicCourseLessonId,
									}
								: undefined
						}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
