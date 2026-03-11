import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewSpeedQuiz from '@/components/hebrew/hebrew-speed-quiz'

export default async function HebrewSpeedQuizPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// ✅ Only query database when user is logged in
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// ✅ Safe defaults for guests
	const courseId = userProgress?.activeCourseId ?? 6 // default to AwB
	const currentLesson = userChallengeData?.activeLesson?.lessonNumber ?? '1'
	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconRunning.png"
						alt="Speed Quiz"
						height={90}
						width={90}
					/>

					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						חִידוֹן מָהִיר
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Speed Quiz
					</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="speedquiz" className="mb-4">
						It may take a few seconds to load even if it looks blank at first.
						Click the filter to select a different lesson or category.
					</DismissibleAlert>

					<HebrewSpeedQuiz
						userId={userId ?? 'guest'}
						currentLesson={currentLesson}
						courseId={courseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
