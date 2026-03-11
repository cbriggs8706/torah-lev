import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import { hebrewLetters } from '@/lib/data/hebrew/hebrew-letters'
import { hebrewNiqqud } from '@/lib/data/hebrew/hebrew-niqqud'
import { DismissibleAlert } from '@/components/dismissible-alert'
import HebrewLetterQuiz from '@/components/hebrew/hebrew-letter-quiz'

export default async function HebrewLetterQuizPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// ✅ Fetch user data only if signed in
	const [userProgress, userSubscription] = userId
		? await Promise.all([getUserProgress(), getUserSubscription()])
		: [null, null]

	// ✅ Fallbacks for guests
	const courseId = userProgress?.activeCourseId ?? 6 // Default to AwB for guests
	const isPro = !!userSubscription?.isActive

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconLetter.png"
						alt="Letter Quiz"
						height={90}
						width={90}
					/>

					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						חִידוֹן אוֹתִיּוֹת
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Letter Quiz
					</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="letter1" className="mb-4">
						Quiz yourself on letter names, letter sounds or syllable sounds.
						Play around with different fonts. New Study Alphabet button! More
						fonts coming soon.
					</DismissibleAlert>

					<DismissibleAlert storageKey="letter2" className="mb-4">
						The goal is to say the correct answer in under 3 seconds with no
						more than 2 mistakes per round in order to pass it off in class.
					</DismissibleAlert>

					<HebrewLetterQuiz
						letters={hebrewLetters}
						niqqud={hebrewNiqqud}
						userId={userId ?? 'guest'}
						courseId={courseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
