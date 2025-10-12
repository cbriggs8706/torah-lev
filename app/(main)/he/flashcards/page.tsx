import Image from 'next/image'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'

import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'

import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'

import awbHebrewVocab from '@/lib/data/vocab/awbVocab.json'
import hsVocab from '@/lib/data/vocab/hsVocab.json'
import abcHebrewVocab from '@/lib/data/vocab/abcVocab.json'

import { HebrewVocab } from '@/lib/vocab'
import TorahScrollLoader from '@/components/hebrew/hebrew-loader'

// ✅ Dynamic imports for each language
const HebrewFlashcards = dynamic(
	() => import('@/components/hebrew/hebrew-flashcards'),
	{ ssr: false }
)

// ✅ allFields constants
const allFieldsHebrew: (keyof HebrewVocab)[] = [
	'hebNiqqud',
	'heb',
	'eng',
	'genderPerson',
	'partOfSpeech',
	'ipa',
	'engTransliteration',
	'images',
	'hebAudio',
]

export default async function FlashcardPage({
	params,
}: {
	params: { lang: string }
}) {
	const userProgressData = getUserProgress()
	const userChallengeData = await getCourseProgress()
	const userSubscriptionData = getUserSubscription()

	const [userProgress, userSubscription] = await Promise.all([
		userProgressData,
		userSubscriptionData,
	])

	if (!userProgress || !userProgress.activeCourse) {
		redirect('/courses')
	}

	{
		;[6, 11, 14].includes(userProgress?.activeCourse.id ?? 0) && (
			<TorahScrollLoader />
		)
	}

	const currentLesson = userChallengeData?.activeLesson?.lessonNumber

	// ✅ Prepare vocab data
	const hebrewData: HebrewVocab[] =
		userProgress.activeCourseId === 6
			? (awbHebrewVocab as HebrewVocab[])
			: userProgress.activeCourseId === 11
			? (hsVocab as HebrewVocab[])
			: userProgress.activeCourseId === 14
			? (abcHebrewVocab as HebrewVocab[])
			: []

	// console.log(userProgress.activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/card-file-box.svg"
						alt="Flashcards"
						height={90}
						width={90}
					/>
					{[6, 11, 14].includes(userProgress.activeCourseId ?? 0) ? (
						<>
							<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
								כַּרְטִיסִיּוֹת
							</h1>
							<p className="text-center font-bold text-neutral-800 mb-2">
								Flashcards
							</p>
						</>
					) : (
						<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
							Flashcards
						</h1>
					)}

					<DismissibleAlert storageKey="flashcard" className="mb-4">
						These will default to your current lesson in the Learn section. You
						can customize the cards to your hearts desire. There are 7 spots on
						front and back where you can place whatever you would like.
					</DismissibleAlert>

					{userProgress.activeCourseId === 6 && (
						<HebrewFlashcards
							data={hebrewData}
							allFields={allFieldsHebrew}
							courseId={userProgress.activeCourseId}
							currentLesson={currentLesson ?? ''}
							layout="hebrew"
							userId={userProgress.userId}
						/>
					)}
					{userProgress.activeCourseId === 11 && (
						<HebrewFlashcards
							data={hebrewData}
							allFields={allFieldsHebrew}
							courseId={userProgress.activeCourseId}
							currentLesson={currentLesson ?? ''}
							layout="hebrew"
							userId={userProgress.userId}
						/>
					)}
					{userProgress.activeCourseId === 14 && (
						<HebrewFlashcards
							data={hebrewData}
							allFields={allFieldsHebrew}
							courseId={userProgress.activeCourseId}
							currentLesson={currentLesson ?? ''}
							layout="hebrew"
							userId={userProgress.userId}
						/>
					)}
				</div>
			</FeedWrapper>
		</div>
	)
}
