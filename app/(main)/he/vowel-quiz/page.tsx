import Image from 'next/image'

import { DismissibleAlert } from '@/components/dismissible-alert'
import { FeedWrapper } from '@/components/feed-wrapper'
import HebrewVowelsQuiz from '@/components/hebrew/hebrew-vowels-quiz'
import { getSession } from '@/lib/auth'
import { getUserProgress } from '@/db/queries'
import { hebrewNiqqud } from '@/lib/data/hebrew/hebrew-niqqud'

export default async function HebrewVowelQuizPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null
	const userProgress = userId ? await getUserProgress() : null
	const courseId = userProgress?.activeCourseId ?? 6

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/gameIcons/groupSort.png"
						alt="Vowel Quiz"
						height={48}
						width={48}
					/>
					<h1 className="my-6 text-center font-cardo text-6xl text-neutral-800">
						חִידוֹן תְּנוּעוֹת
					</h1>
					<p className="mb-2 text-center font-bold text-neutral-800">
						Vowels Quiz
					</p>

					{!userId && (
						<p className="mb-3 italic text-gray-500">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert
						storageKey="vowel-quiz-topic"
						className="mb-6 max-w-3xl"
					>
						Practice Niqqud Names here with the same quiz flow that used to live
						inside Letter Quiz.
					</DismissibleAlert>

					<div className="mb-6 w-full max-w-5xl">
						<HebrewVowelsQuiz
							niqqud={hebrewNiqqud}
							userId={userId ?? 'guest'}
							courseId={courseId}
						/>
					</div>
				</div>
			</FeedWrapper>
		</div>
	)
}
