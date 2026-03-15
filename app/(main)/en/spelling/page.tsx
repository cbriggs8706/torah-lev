'use server'

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
import EnglishSpelling from '@/components/english/english-spelling'
import { getEnglishVocabByCourseId } from '@/lib/server/vocab'

export default async function EnglishSpellingPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// Fetch only when signed in
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// Fallback defaults for guests
	const activeCourseId = userProgress?.activeCourseId ?? 3 // Default EC1
	const currentLesson = userChallengeData?.activeLesson?.lessonNumber ?? ''
	const isPro = !!userSubscription?.isActive

	// Choose vocab data by course
	const englishData: EnglishVocab[] = await getEnglishVocabByCourseId(
		activeCourseId
	)

	const filteredData = englishData.filter((entry) => entry.type === 'word')

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/input-latin-letters-svgrepo-com.svg"
						alt="Spelling"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Spelling
					</h1>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress won’t be saved.
						</p>
					)}

					<DismissibleAlert storageKey="spelling" className="mb-4">
						Customize your prompt type. My favorite is letter-by-letter. For
						sofit ending letters tap the Alt/Opt button. For additional vowels
						and dagesh, tap the shift button. For the backspace to work properly
						you need to have your cursor at the end/left of the word.
					</DismissibleAlert>

					<EnglishSpelling
						data={filteredData}
						currentLesson={currentLesson}
						userId={userId ?? 'guest'}
						courseId={activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
