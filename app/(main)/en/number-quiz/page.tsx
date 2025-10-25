import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { numbers } from '@/lib/numbers'
import EnglishNumberQuiz from '@/components/english/english-number-quiz'

export default async function EnglishNumberQuizPage() {
	const session = await getServerSession(options)
	const userId = session?.user?.id ?? null

	// Fetch only if logged in
	const [userProgress, userSubscription] = userId
		? await Promise.all([getUserProgress(), getUserSubscription()])
		: [null, null]

	// Fallback defaults for guests
	const activeCourseId = userProgress?.activeCourseId ?? 3 // EC1 default for guests
	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/input-numbers-svgrepo-com.svg"
						alt="Number Quiz"
						height={90}
						width={90}
					/>

					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Number Quiz
					</h1>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress won’t be saved.
						</p>
					)}

					<EnglishNumberQuiz
						numbers={numbers}
						userId={userId ?? 'guest'}
						courseId={activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
