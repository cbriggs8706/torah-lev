import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import EnglishMatchup from '@/components/english/english-matchup'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { EnglishVocab } from '@/lib/vocab'
import { getEnglishVocabByCourseId } from '@/lib/server/vocab'

export default async function EnglishMatchupPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// Only fetch progress/subscription if signed in
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// Default guest course (e.g., EC1)
	const activeCourseId = userProgress?.activeCourseId ?? 3
	const title = userChallengeData?.activeLesson?.title ?? ''

	// Determine current lesson
	const coursePrefixes: Record<number, string> = {
		16: 'EfW',
		13: 'EwB',
		3: 'EC1',
		4: 'EC2',
		17: 'LR',
	}
	const prefix =
		typeof activeCourseId === 'number'
			? coursePrefixes[activeCourseId] ?? ''
			: ''
	const match = prefix ? title.match(new RegExp(`${prefix} (\\d{1,3})`)) : null
	const currentLesson = match ? parseInt(match[1], 10) : undefined

	// Select proper vocab list
	const englishData: EnglishVocab[] = await getEnglishVocabByCourseId(
		activeCourseId
	)

	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/socks-svgrepo-com.svg"
						alt="Matchup"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Matchup
					</h1>

					<DismissibleAlert storageKey="matchup" className="mb-4">
						It will load up to 12 words from your current lesson by default. You
						can change between text, images and audio in the filters. Known bug:
						drag and drop doesn&apos;t work on Android devices.
					</DismissibleAlert>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress won’t be saved.
						</p>
					)}

					<EnglishMatchup
						data={englishData}
						userId={userId ?? 'guest'}
						currentLesson={currentLesson}
						courseId={activeCourseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
