import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import HebrewMatchup from '@/components/hebrew/hebrew-matchup'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { HebrewVocab } from '@/lib/vocab'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'

export default async function HebrewMatchupPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const resolvedSearchParams = (await searchParams) ?? {}

	// ✅ Fetch user-related data only for authenticated users
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

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
	const activeCourseId = isScheduled
		? scheduledCourseId
		: userProgress?.activeCourseId ?? 6 // Default to AwB
	const isPro = !!userSubscription?.isActive

	const currentLesson = isScheduled
		? scheduledLesson
		: userChallengeData?.activeLesson?.lessonNumber ?? undefined

	// ✅ Select vocab source based on course (guest or user)
	const hebrewData: HebrewVocab[] = await getHebrewVocabByCourseId(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconSocks.png"
						alt="Matchup"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						הִתְאָמָה
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Matchup</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="matchup" className="mb-4">
						It will load up to 12 words from your current lesson by default. You
						can change between text, images and audio in the filters. Known bug:
						drag and drop doesn&apos;t work on Android devices.
					</DismissibleAlert>

					<HebrewMatchup
						data={hebrewData}
						currentLesson={
							typeof currentLesson === 'string' ? Number(currentLesson) : currentLesson
						}
						courseId={activeCourseId}
						userId={userId ?? 'guest'}
						lockedLesson={isScheduled ? scheduledLesson : undefined}
						hideFilters={isScheduled}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
