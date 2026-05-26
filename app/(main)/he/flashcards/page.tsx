import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { HebrewVocab } from '@/lib/vocab'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'
import HebrewFlashcards from '@/components/hebrew/hebrew-flashcards'

// ✅ allFields constants
const allFieldsHebrew: (keyof HebrewVocab)[] = [
	'hebNiqqud',
	'heb',
	'eng',
	'rootPerson',
	'rootGender',
	'rootNumber',
	'partOfSpeech',
	'ipa',
	'engTransliteration',
	'images',
	'hebAudio',
]

export default async function HebrewFlashcardPage({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const resolvedSearchParams = (await searchParams) ?? {}

	// Fetch data only for logged-in users
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// ✅ Guest fallback values
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
		: userProgress?.activeCourseId ?? 6
	const currentLesson = isScheduled
		? scheduledLesson
		: userChallengeData?.activeLesson?.lessonNumber ?? ''
	const isPro = !!userSubscription?.isActive

	// ✅ Select vocab set
	const hebrewData: HebrewVocab[] = await getHebrewVocabByCourseId(activeCourseId)

	const displayTitle = activeCourseId === 6 || activeCourseId === 11 || activeCourseId === 14

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconFlashcards.png"
						alt="Flashcards"
						height={90}
						width={90}
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
						can customize the cards to your heart’s desire. There are 7 spots on
						front and back where you can place whatever you would like.
					</DismissibleAlert>

					<HebrewFlashcards
						data={hebrewData}
						allFields={allFieldsHebrew}
						courseId={activeCourseId}
						currentLesson={currentLesson}
						layout="hebrew"
						lockedLesson={isScheduled ? scheduledLesson : undefined}
						hideFilters={isScheduled}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
