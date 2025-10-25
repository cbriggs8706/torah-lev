import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import HebrewMatchup from '@/components/hebrew/hebrew-matchup'

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import abcHebrewVocab from '@/lib/data/vocab/abcVocab.json'
import hsHebrewVocab from '@/lib/data/vocab/hsVocab.json'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { HebrewVocab } from '@/lib/vocab'

export default async function HebrewMatchupPage() {
	const session = await getServerSession(options)
	const userId = session?.user?.id ?? null

	// ✅ Fetch user-related data only for authenticated users
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// ✅ Guest-safe fallbacks
	const activeCourseId = userProgress?.activeCourseId ?? 6 // Default to AwB
	const title = userChallengeData?.activeLesson?.title ?? ''
	const isPro = !!userSubscription?.isActive

	// ✅ Course prefix map
	const coursePrefixes: Record<number, string> = {
		6: 'AwB',
		11: 'HS',
		14: 'ABC',
	}

	const prefix =
		typeof activeCourseId === 'number'
			? coursePrefixes[activeCourseId] ?? ''
			: ''

	const match = prefix ? title.match(new RegExp(`${prefix} (\\d{1,3})`)) : null
	const currentLesson = match ? parseInt(match[1], 10) : undefined

	// ✅ Select vocab source based on course (guest or user)
	const hebrewData: HebrewVocab[] =
		activeCourseId === 6
			? (awbHebrewVocab as HebrewVocab[])
			: activeCourseId === 11
			? (hsHebrewVocab as HebrewVocab[])
			: activeCourseId === 14
			? (abcHebrewVocab as HebrewVocab[])
			: []

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconSocks.png"
						alt="Matchup"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						הִתְאָמָה
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">Matchup</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="matchup" className="mb-4">
						It will load up to 12 words from your current lesson by default. You
						can change between text, images and audio in the filters. Known bug:
						drag and drop doesn&apos;t work on Android devices.
					</DismissibleAlert>

					<HebrewMatchup
						data={hebrewData}
						currentLesson={currentLesson}
						courseId={activeCourseId}
						userId={userId ?? 'guest'}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
