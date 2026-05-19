import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getSession } from '@/lib/auth'
import { getCourseProgress, getUserProgress } from '@/db/queries'
import VocabQuiz from '@/components/vocab/vocab-quiz'
import { getEnglishVocabByCourseId } from '@/lib/server/vocab'

export default async function EnglishQuizPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? 'guest'

	const [userProgress, courseProgress] = await Promise.all([
		getUserProgress(),
		getCourseProgress(),
	])

	const activeCourseId = userProgress?.activeCourseId ?? 16
	const currentLesson = courseProgress?.activeLesson?.lessonNumber ?? '1'
	const englishData = await getEnglishVocabByCourseId(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col items-center">
					<Image src="/gameIcons/quiz.png" alt="Quiz" height={90} width={90} />
					<h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
						Quiz
					</h1>

					<DismissibleAlert storageKey="vocabquiz-en" className="mb-4">
						This quiz defaults to lessons up through your current Learn lesson.
						Choose the prompt you want, adjust the timer, and practice with any
						vocab in your current course.
					</DismissibleAlert>

					<VocabQuiz
						data={englishData}
						currentLesson={currentLesson}
						courseId={activeCourseId}
						userId={userId}
						layout="english"
						initialHearts={userProgress?.hearts ?? 5}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
