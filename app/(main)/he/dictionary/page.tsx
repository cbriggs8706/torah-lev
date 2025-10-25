import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import hsHebrewVocab from '@/lib/data/vocab/hsVocab.json'
import abcHebrewVocab from '@/lib/data/vocab/abcVocab.json'

import HebrewDictionary from '@/components/hebrew/hebrew-dictionary'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { HebrewVocab } from '@/lib/vocab'

export default async function HebrewDictionaryPage() {
	const session = await getServerSession(options)
	const userId = session?.user?.id ?? null

	// Fetch user data only if signed in
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// Fallbacks for guests
	const activeCourseId = userProgress?.activeCourseId ?? 6 // Default to AwB
	const isPro = !!userSubscription?.isActive

	// Choose dataset based on course
	const hebrewData: HebrewVocab[] =
		activeCourseId === 6
			? (awbHebrewVocab as HebrewVocab[])
			: activeCourseId === 11
			? (hsHebrewVocab as HebrewVocab[])
			: activeCourseId === 14
			? (abcHebrewVocab as HebrewVocab[])
			: []

	// Filter cleanly
	const filteredWords = hebrewData.filter(
		(word) =>
			word.type?.toLowerCase() === 'word' &&
			!word.lessons?.some((lesson) =>
				lesson.toLowerCase().includes('classroom')
			)
	)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconDictionary.png"
						alt="Dictionary"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-4">
						מִלוֹן
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Dictionary
					</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress won’t be saved.
						</p>
					)}

					<DismissibleAlert storageKey="dictionary" className="mb-4">
						Make sure to look up words that you don&apos;t recognize in any
						lesson. Filter alphabetically or by Lesson #. Click on any entry to
						view more info.
					</DismissibleAlert>

					<HebrewDictionary data={filteredWords} />
				</div>
			</FeedWrapper>
		</div>
	)
}
