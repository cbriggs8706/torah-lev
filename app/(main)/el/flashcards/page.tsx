import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import {
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import awaGreekVocab from '@/lib/data/vocab/awaVocab.json'
import { GreekVocab } from '@/lib/vocab'
import GreekFlashcards from '@/components/greek/greek-flashcards'

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

export default async function FlashcardPage() {
	const session = await getServerSession(options)

	const [userProgress, userSubscription, courseProgress] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
		getCourseProgress(),
	])

	const isPro = !!userSubscription?.isActive
	const currentLesson = courseProgress?.activeLesson?.lessonNumber ?? ''
	const activeCourseId = userProgress?.activeCourseId ?? 12 // ✅ default to Greek

	// Always load the Greek vocab
	const greekData = awaGreekVocab as GreekVocab[]

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
						can customize the cards however you’d like. There are 7 fields on
						front and back for maximum flexibility.
					</DismissibleAlert>

					<GreekFlashcards
						data={greekData}
						allFields={allFieldsGreek}
						courseId={activeCourseId}
						currentLesson={currentLesson}
						layout="greek"
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
