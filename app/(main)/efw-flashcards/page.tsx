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

import efwEnglishVocab from '@/lib/data/vocab/efwVocab.json'
import { EnglishVocab } from '@/lib/vocab'

const EnglishFlashcards = dynamic(
	() => import('@/components/english/english-flashcards'),
	{ ssr: false }
)

const allFieldsEnglish: (keyof EnglishVocab)[] = [
	'eng',
	'spa',
	'por',
	'engDefinition',
	'gender',
	'person',
	'number',
	'partOfSpeech',
	'ipa',
	'spaTransliteration',
	'porTransliteration',
	'images',
	'engAudio',
]

export default async function EFWFlashcardPage({
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

	const englishForWorkData: EnglishVocab[] =
		userProgress.activeCourseId === 16
			? (efwEnglishVocab as EnglishVocab[])
			: []

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/card-file-box.svg"
						alt="Calendar"
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

					{userProgress.activeCourseId === 16 && (
						<EnglishFlashcards
							data={englishForWorkData}
							allFields={allFieldsEnglish}
							currentLesson={currentLesson ?? ''}
							layout="english"
						/>
					)}
				</div>
			</FeedWrapper>
		</div>
	)
}
