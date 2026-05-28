import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getCourseProgress, getUserProgress } from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewScramble from '@/components/hebrew/hebrew-scramble'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'

export default async function HebrewScramblePage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const resolvedSearchParams = (await searchParams) ?? {}

	// ✅ Only fetch data if user is logged in
	const [userProgress, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getCourseProgress(),
		  ])
		: [null, null]

	// ✅ Guest-safe fallbacks
	const scheduledCourseId = Number(resolvedSearchParams.courseId)
	const scheduledLesson =
		typeof resolvedSearchParams.lesson === 'string'
			? resolvedSearchParams.lesson
			: ''
	const isScheduled =
		resolvedSearchParams.scheduled === '1' &&
		Number.isFinite(scheduledCourseId) &&
		scheduledCourseId > 0 &&
		Boolean(scheduledLesson)
	const courseId = isScheduled
		? scheduledCourseId
		: userProgress?.activeCourseId ?? 6
	const currentLesson = isScheduled
		? scheduledLesson
		: userChallengeData?.activeLesson?.lessonNumber ?? '1'
	const hebrewData = await getHebrewVocabByCourseId(courseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconScrambled.png"
						alt="Scramble"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						עִרְבּוּב
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Scramble
					</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="scramble" className="mb-4">
						Much more coming soon to this activity! Below is a scrambled
						sentence of 2–10 words. Click on them in order to unscramble. To
						take a word out, tap on the corresponding green word again to
						remove. Don&apos;t forget to go right-to-left!
					</DismissibleAlert>

					<HebrewScramble
						data={hebrewData}
						currentLesson={currentLesson}
						userId={userId ?? 'guest'}
						hideFilters={isScheduled}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
