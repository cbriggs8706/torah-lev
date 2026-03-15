import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { EnglishVocab } from '@/lib/vocab'
import EnglishScramble from '@/components/english/english-scramble'
import { getEnglishVocabByCourseId } from '@/lib/server/vocab'

export default async function EnglishScramblePage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// Fetch only if logged in
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// Fallback defaults for guests
	const activeCourseId = userProgress?.activeCourseId ?? 3 // e.g. EC1
	const isPro = !!userSubscription?.isActive

	// Choose vocab dataset based on course ID
	const englishData: EnglishVocab[] = await getEnglishVocabByCourseId(
		activeCourseId
	)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/cooking-svgrepo-com.svg"
						alt="Scramble"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Scramble
					</h1>

					<DismissibleAlert storageKey="scramble" className="mb-4">
						Below is a scrambled-up sentence of 2–10 words. Click on them in
						order to unscramble. To take a word out, tap on the corresponding
						green word again to remove.
					</DismissibleAlert>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress won’t be saved.
						</p>
					)}

					<EnglishScramble
						data={englishData}
						currentLesson={'1'}
						userId={userId ?? 'guest'}
						courseId={activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
