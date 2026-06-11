import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress } from '@/db/queries'
import { hebrewNumbers } from '@/lib/data/hebrew/hebrew-numbers'
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewNumberQuiz from '@/components/hebrew/hebrew-number-quiz'

export default async function HebrewNumberQuizPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// ✅ Fetch user data only when logged in
	const userProgress = userId ? await getUserProgress() : null

	// ✅ Fallbacks for guest mode
	const courseId = userProgress?.activeCourseId ?? 6 // Default to AwB

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconNumber.png"
						alt="Number Quiz"
						height={48}
						width={48}
					/>

					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						חִידוֹן מִסְפָּרִים
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Number Quiz
					</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="numberquiz" className="mb-4">
						Test your knowledge of Hebrew numbers. Try to answer within 3
						seconds for an extra challenge!
					</DismissibleAlert>

					<HebrewNumberQuiz
						numbers={hebrewNumbers}
						userId={userId ?? 'guest'}
						courseId={courseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
