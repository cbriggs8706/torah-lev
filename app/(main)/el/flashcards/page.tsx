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

import { GreekVocab } from '@/lib/vocab'
import TorahScrollLoader from '@/components/hebrew/hebrew-loader'

const GreekFlashcards = dynamic(
	() => import('@/components/greek/greek-flashcards'),
	{
		ssr: false,
	}
)

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
		;[12].includes(userProgress?.activeCourse.id ?? 0) && <TorahScrollLoader />
	}

	const currentLesson = userChallengeData?.activeLesson?.lessonNumber

	const greekData: GreekVocab[] =
		userProgress.activeCourseId === 12 ? (awaGreekVocab as GreekVocab[]) : []

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
							courseId={userProgress.activeCourseId}
							currentLesson={currentLesson ?? ''}
							layout="greek"
						/>
					)}
				</div>
			</FeedWrapper>
		</div>
	)
}
