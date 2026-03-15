'use server'
import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { HebrewVocab } from '@/lib/vocab'
import HebrewSpelling from '@/components/hebrew/hebrew-spelling'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'

export default async function HebrewSpellingPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// ✅ Only query if signed in
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// ✅ Fallback for guests
	const activeCourseId = userProgress?.activeCourseId ?? 6 // Default: AwB
	const currentLesson = userChallengeData?.activeLesson?.lessonNumber ?? '1'
	const isPro = !!userSubscription?.isActive

	// ✅ Determine vocab source
	const hebrewData: HebrewVocab[] = (
		await getHebrewVocabByCourseId(activeCourseId)
	).filter((w) => w.type?.toLowerCase() === 'word')

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconSpelling.png"
						alt="Spelling"
						height={90}
						width={90}
					/>

					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						אִיּוּת
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Spelling
					</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="spelling" className="mb-4">
						Customize your prompt type. My favorite is letter-by-letter. For
						sofit ending letters, tap the Alt/Opt button. For vowels or dagesh,
						tap the Shift button. Make sure your cursor is at the end/left of
						the word for backspace.
					</DismissibleAlert>

					<HebrewSpelling
						data={hebrewData}
						currentLesson={currentLesson}
						userId={userId ?? 'guest'}
						courseId={activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
