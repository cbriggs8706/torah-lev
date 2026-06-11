'use server'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress } from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { HebrewVocab } from '@/lib/vocab'
import HebrewSpelling from '@/components/hebrew/hebrew-spelling'
import {
	getFilteredHebrewVocabByCourseId,
	getHebrewVocabByCourseId,
} from '@/lib/server/vocab'
import { parseScheduledPublicCourseQuery } from '@/lib/public-course-activities'

export default async function HebrewSpellingPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const resolvedSearchParams = (await searchParams) ?? {}

	// ✅ Only query if signed in
	const userProgress = userId ? await getUserProgress() : null

	// ✅ Fallback for guests
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
	// ✅ Determine vocab source
	const hebrewData: HebrewVocab[] = (
		await (publicCourseQuery.scheduled
			? getFilteredHebrewVocabByCourseId(activeCourseId, {
					...publicCourseQuery.filters,
					selectedType: 'word',
			  })
			: getHebrewVocabByCourseId(activeCourseId))
	).filter((w) => w.type?.toLowerCase() === 'word')

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col gap-4">
					<div className="flex flex-col items-center">
						<Image
							src="/icons/iconSpelling.png"
							alt="Spelling"
							height={48}
							width={48}
						/>

						<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
							אִיּוּת
						</h1>
						<p className="mb-2 text-center font-bold text-neutral-800">
							Spelling
						</p>

						{!userId && (
							<p className="mb-3 italic text-gray-500">
								You’re using guest mode — progress will not be saved.
							</p>
						)}

						<DismissibleAlert storageKey="spelling" className="mb-4">
							Customize your prompt type. My favorite is letter-by-letter. For
							sofit ending letters, tap the Alt/Opt button. For vowels or
							dagesh, tap the Shift button. Make sure your cursor is at the
							end/left of the word for backspace.
						</DismissibleAlert>
					</div>

					<HebrewSpelling
						data={hebrewData}
						currentLesson={currentLesson}
						userId={userId ?? 'guest'}
						courseId={activeCourseId}
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
