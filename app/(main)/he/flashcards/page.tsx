import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getUserProgress } from '@/db/queries'
import {
	getFilteredHebrewVocabByCourseId,
	getHebrewVocabByCourseId,
} from '@/lib/server/vocab'
import HebrewFlashcards from '@/components/hebrew/hebrew-flashcards'
import { parseScheduledPublicCourseQuery } from '@/lib/public-course-activities'
import type { HebrewVocab } from '@/lib/vocab'

export default async function HebrewFlashcardPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const resolvedSearchParams = (await searchParams) ?? {}

	// Fetch data only for logged-in users
	const userProgress = userId ? await getUserProgress() : null

	// ✅ Guest fallback values
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
		: userProgress?.activeLessonNumber ?? ''
	// ✅ Select vocab set
	const hebrewData: HebrewVocab[] = publicCourseQuery.scheduled
		? await getFilteredHebrewVocabByCourseId(
				activeCourseId,
				publicCourseQuery.filters,
		  )
		: await getHebrewVocabByCourseId(activeCourseId)

	const displayTitle = activeCourseId === 6 || activeCourseId === 11 || activeCourseId === 14

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconFlashcards.png"
						alt="Flashcards"
						height={48}
						width={48}
						style={{ width: 'auto', height: 'auto' }}
					/>
					{displayTitle ? (
						<>
							<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
								כַּרְטִיסִיּוֹת
							</h1>
							<p className="text-center font-bold text-neutral-800 mb-2">
								Flashcards
							</p>
						</>
					) : (
						<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
							Flashcards
						</h1>
					)}

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress won’t be saved.
						</p>
					)}

					<DismissibleAlert storageKey="flashcard" className="mb-4">
						These will default to your current lesson in the Learn section. You
						can choose a simple front and back side, while root, suffix,
						grammar, and IPA always stay visible.
					</DismissibleAlert>

					<HebrewFlashcards
						data={hebrewData}
						courseId={activeCourseId}
						currentLesson={currentLesson}
						layout="hebrew"
						returnTo={returnTo}
						lockedLesson={
							publicCourseQuery.scheduled ? publicCourseQuery.lesson ?? undefined : undefined
						}
						hideFilters={publicCourseQuery.scheduled}
						initialFilters={publicCourseQuery.filters}
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
