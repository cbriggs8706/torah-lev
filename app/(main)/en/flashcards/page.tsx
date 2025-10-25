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
import { EnglishVocab } from '@/lib/vocab'
import EnglishFlashcards from '@/components/english/english-flashcards'

// --- vocab sets ---
import efwEnglishVocab from '@/lib/data/vocab/efwVocab.json'
import ewbEnglishVocab from '@/lib/data/vocab/ewbVocab.json'
import lrEnglishVocab from '@/lib/data/vocab/lrVocab.json'
import ec1EnglishVocab from '@/lib/data/vocab/ec1Vocab.json'
import ec2EnglishVocab from '@/lib/data/vocab/ec2Vocab.json'

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

export default async function EFWFlashcardPage() {
	// Session may be null for guests
	const session = await getServerSession(options)

	// Fetch user + course info (safe for guests)
	const [userProgress, userSubscription, courseProgress] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
		getCourseProgress(),
	])

	const isPro = !!userSubscription?.isActive

	// ✅ Default courseId for guests (EFW)
	const activeCourseId = userProgress?.activeCourseId ?? 16
	const currentLesson = courseProgress?.activeLesson?.lessonNumber ?? '1'

	// ✅ Always load the proper dataset
	const englishData: EnglishVocab[] =
		activeCourseId === 16
			? (efwEnglishVocab as EnglishVocab[])
			: activeCourseId === 13
			? (ewbEnglishVocab as EnglishVocab[])
			: activeCourseId === 17
			? (lrEnglishVocab as EnglishVocab[])
			: activeCourseId === 3
			? (ec1EnglishVocab as EnglishVocab[])
			: activeCourseId === 4
			? (ec2EnglishVocab as EnglishVocab[])
			: (efwEnglishVocab as EnglishVocab[]) // ✅ default fallback

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
						can customize the cards to your heart’s desire. There are 7 spots on
						front and back where you can place whatever you’d like.
					</DismissibleAlert>

					<EnglishFlashcards
						data={englishData}
						allFields={allFieldsEnglish}
						currentLesson={currentLesson}
						courseId={activeCourseId}
						layout="english"
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
