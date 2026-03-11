import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewSentenceBuilder from '@/components/hebrew/hebrew-sentence-builder'

export default async function HebrewSentenceBuilderPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// ✅ Only query for logged-in users
	const [userProgress, userSubscription] = userId
		? await Promise.all([getUserProgress(), getUserSubscription()])
		: [null, null]

	// ✅ Guest-safe fallbacks
	const courseId = userProgress?.activeCourseId ?? 6 // Default AwB
	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconBuilding.png"
						alt="Sentence Builder"
						height={90}
						width={90}
					/>

					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						בּוֹנֵה מִשְׁפָּטִים
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Sentence Builder
					</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="sentenceBuilder" className="mb-4">
						Drag words into the correct order to form a Hebrew sentence. The
						English translation will appear when you get it right.
					</DismissibleAlert>

					<HebrewSentenceBuilder
						userId={userId ?? 'guest'}
						courseId={courseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
