import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { englishLetters } from '@/lib/english-letters'
import EnglishLetterQuiz from '@/components/english/english-letter-quiz'

export default async function EnglishLetterQuizPage() {
	const session = await getServerSession(options)
	const userId = session?.user?.id ?? null

	// Run queries only if signed in
	const [userProgress, userSubscription] = userId
		? await Promise.all([getUserProgress(), getUserSubscription()])
		: [null, null]

	// If not signed in → use default guest values
	const activeCourseId = userProgress?.activeCourseId ?? 3 // choose sensible default, e.g. EC1
	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			{/* Sidebar/UserProgress intentionally omitted for guests */}
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/a-button-blood-type-svgrepo-com.svg"
						alt="Letter Quiz"
						height={90}
						width={90}
					/>

					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Letter Quiz
					</h1>

					{/* Optional re-enable alerts later */}
					{/* <DismissibleAlert storageKey="letter1" className="mb-4">...</DismissibleAlert> */}

					<EnglishLetterQuiz
						letters={englishLetters}
						userId={userId ?? 'guest'}
						courseId={activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
