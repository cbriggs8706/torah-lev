import Image from 'next/image'

import { DismissibleAlert } from '@/components/dismissible-alert'
import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewSyllablesQuiz from '@/components/hebrew/hebrew-syllables-quiz'
import { getSession } from '@/lib/auth'
import { hebrewLetters } from '@/lib/data/hebrew/hebrew-letters'
import { getUserProgress } from '@/db/queries'

export default async function HebrewSyllablesPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const userProgress = userId ? await getUserProgress() : null
	const courseId = userProgress?.activeCourseId ?? 6

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col items-center">
					<Image
						src="/gameIcons/groupSort.png"
						alt="Syllables"
						height={90}
						width={90}
					/>

					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						חִידוֹן הֲבָרוֹת
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">Syllables</p>

					{!userId && (
						<p className="mb-3 italic text-gray-500">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="syllables1" className="mb-4">
						Quiz yourself on syllable sounds with the same study and timed quiz flow
						that used to live inside Letter Quiz.
					</DismissibleAlert>

					<DismissibleAlert storageKey="syllables2" className="mb-4">
						The goal is to say the correct answer in under 3 seconds with no
						more than 2 mistakes per round in order to pass it off in class.
					</DismissibleAlert>

					<HebrewSyllablesQuiz
						letters={hebrewLetters}
						userId={userId ?? 'guest'}
						courseId={courseId}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
