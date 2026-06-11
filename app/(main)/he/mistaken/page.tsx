import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewMistaken from '@/components/hebrew/hebrew-mistaken'
import { getUserProgress } from '@/db/queries'
import { getSession } from '@/lib/auth'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'

export default async function HebrewMistakenPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	const userProgress = userId ? await getUserProgress() : null

	const activeCourseId = userProgress?.activeCourseId ?? 6
	const currentLesson = userProgress?.activeLessonNumber ?? ''
	const hebrewData = await getHebrewVocabByCourseId(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col items-center">
					<Image
						src="/gameIcons/matchingPairs.png"
						alt="Similar Words"
						height={48}
						width={48}
					/>
					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						מילים דומות
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">
						Similar Words
					</p>

					<DismissibleAlert storageKey="hebrew-mistaken" className="mb-4">
						Choose one lesson, then drag each English meaning onto the Hebrew
						word it belongs to. This activity focuses on words that are commonly
						confused for each other.
					</DismissibleAlert>

					<HebrewMistaken
						courseId={activeCourseId}
						data={hebrewData}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
