import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getSession } from '@/lib/auth'
import { getCourseProgress, getUserProgress } from '@/db/queries'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'
import HebrewOpposites from '@/components/hebrew/hebrew-opposites'

export default async function HebrewOppositesPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	const [userProgress, courseProgress] = userId
		? await Promise.all([getUserProgress(), getCourseProgress()])
		: [null, null]

	const activeCourseId = userProgress?.activeCourseId ?? 6
	const currentLesson = courseProgress?.activeLesson?.lessonNumber ?? ''
	const hebrewData = await getHebrewVocabByCourseId(activeCourseId)

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
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
