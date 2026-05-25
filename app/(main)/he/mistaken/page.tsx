import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewMistaken from '@/components/hebrew/hebrew-mistaken'
import { getCourseProgress, getUserProgress } from '@/db/queries'
import { getSession } from '@/lib/auth'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'

export default async function HebrewMistakenPage() {
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
						alt="Mistaken"
						height={90}
						width={90}
					/>
					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						מִתְבַּלְבְּלִים
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">
						Mistaken
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
