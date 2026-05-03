import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getCourseProgress, getUserProgress } from '@/db/queries'
import HebrewIntroduction from '@/components/hebrew/hebrew-introduction'
import { getHebrewVocabByCourseId } from '@/lib/server/vocab'
import type { HebrewVocab } from '@/lib/vocab'

export default async function HebrewIntroductionPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	const [userProgress, userChallengeData] = userId
		? await Promise.all([getUserProgress(), getCourseProgress()])
		: [null, null]

	const activeCourseId = userProgress?.activeCourseId ?? 6
	const currentLesson = userChallengeData?.activeLesson?.lessonNumber ?? ''
	const hebrewData: HebrewVocab[] = await getHebrewVocabByCourseId(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col items-center">
					<Image
						src="/speech-balloon-svgrepo-com.svg"
						alt="Introduction"
						height={90}
						width={90}
					/>
					<h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
						Introduction
					</h1>

					<DismissibleAlert storageKey="hebrew-introduction" className="mb-4">
						This activity teaches one new Hebrew vocab item at a time, starting
						with the first two, then quizzes all learned words each round.
					</DismissibleAlert>

					<HebrewIntroduction
						data={hebrewData}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
