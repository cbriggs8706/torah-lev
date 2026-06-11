import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress } from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewSpeedQuiz from '@/components/hebrew/hebrew-speed-quiz'

export default async function HebrewSpeedQuizPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// ✅ Only query database when user is logged in
	const userProgress = userId ? await getUserProgress() : null

	// ✅ Safe defaults for guests
	const courseId = userProgress?.activeCourseId ?? 6 // default to AwB
	const currentLesson = userProgress?.activeLessonNumber ?? '1'

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconRunning.png"
						alt="Speed Quiz"
						height={48}
						width={48}
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
