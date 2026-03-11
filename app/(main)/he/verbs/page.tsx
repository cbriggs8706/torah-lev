import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress } from '@/db/queries'
import HebrewVerbList from '@/components/hebrew/hebrew-verb-list'
import allVerbs from '@/lib/data/hebrew/verbs/index.json'

export default async function HebrewVerbsPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// ✅ Only fetch progress if logged in
	const userProgress = userId ? await getUserProgress() : null

	// ✅ Fallbacks for guests
	const currentLessonNumber = userProgress?.activeLessonNumber ?? 1
	const isHebrewFriend = !!userProgress?.isHebrewFriend

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconRunning.png"
						alt="Verbs"
						height={90}
						width={90}
					/>

					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						פְּעָלִים
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Verbs</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}
				</div>

				<div className="space-y-4">
					<HebrewVerbList
						allVerbs={allVerbs}
						currentLesson={
							currentLessonNumber ? Number(currentLessonNumber) : null
						}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
