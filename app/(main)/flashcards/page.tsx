// app/(whatever)/flashcards/[lang]/page.tsx
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

import awaGreekVocab from '@/lib/data/vocab/awaVocab.json'
import ewbEnglishVocab from '@/lib/data/vocab/ewbVocab.json'
import type { HebrewVocab, GreekVocab, EnglishVocab } from '@/lib/vocab'

// ✅ DB loader
import { getHebrewVocab } from '@/db/getHebrewVocab'

// ✅ Dynamic imports
const HebrewFlashcards2 = dynamic(
	() => import('@/components/hebrew/hebrew-flashcards2'),
	{ ssr: false }
)
const GreekFlashcards = dynamic(
	() => import('@/components/greek/greek-flashcards'),
	{ ssr: false }
)
const EnglishFlashcards = dynamic(
	() => import('@/components/english/english-flashcards'),
	{ ssr: false }
)

// ✅ allFields
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
const allFieldsGreek: (keyof GreekVocab)[] = [
	'grk',
	'eng',
	'genderPerson',
	'partOfSpeech',
	'ipa',
	'engTransliteration',
	'images',
	'grkAudio',
]
const allFieldsEnglish: (keyof EnglishVocab)[] = [
	'eng',
	'engDefinition',
	'genderPerson',
	'partOfSpeech',
	'ipa',
	'engTransliteration',
	'images',
	'engAudio',
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

	const currentLesson = userChallengeData?.activeLesson?.lessonNumber

	// ✅ Prepare vocab data (DB-backed Hebrew, JSON for others)
	let hebrewData: HebrewVocab[] = []
	if (![12, 13].includes(userProgress.activeCourseId ?? -1)) {
		// If you want to scope to the current lesson (and its “b” variants), pass it here.
		// If `currentLesson` can be like "24b", great—DB will match with overlaps.
		hebrewData = await getHebrewVocab({
			lessons: currentLesson ? [currentLesson] : undefined,
			includeForms: true,
		})
	}

	const greekData: GreekVocab[] =
		userProgress.activeCourseId === 12 ? (awaGreekVocab as GreekVocab[]) : []

	const englishData: EnglishVocab[] =
		userProgress.activeCourseId === 13
			? (ewbEnglishVocab as EnglishVocab[])
			: []

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
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Flashcards
					</h1>

					<DismissibleAlert storageKey="flashcard" className="mb-4">
						These will default to your current lesson in the Learn section. You
						can customize the cards to your hearts desire. There are 7 spots on
						front and back where you can place whatever you would like.
					</DismissibleAlert>

					{userProgress.activeCourseId === 12 && (
						<GreekFlashcards
							data={greekData}
							allFields={allFieldsGreek}
							currentLesson={currentLesson ?? ''}
							layout="greek"
						/>
					)}

					{userProgress.activeCourseId === 13 && (
						<EnglishFlashcards
							data={englishData}
							allFields={allFieldsEnglish}
							currentLesson={currentLesson ?? ''}
							layout="english"
						/>
					)}

					{![12, 13].includes(userProgress.activeCourseId ?? -1) && (
						<HebrewFlashcards2
							data={hebrewData}
							allFields={allFieldsHebrew}
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
