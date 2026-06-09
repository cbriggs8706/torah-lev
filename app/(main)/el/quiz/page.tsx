import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import { getSession } from '@/lib/auth'
import { getCourseProgress, getUserProgress } from '@/db/queries'
import VocabQuiz from '@/components/vocab/vocab-quiz'
import { getGreekVocabByCourseId } from '@/lib/server/vocab'

export default async function GreekQuizPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? 'guest'

	const [userProgress, courseProgress] = await Promise.all([
		getUserProgress(),
		getCourseProgress(),
	])

	const activeCourseId = userProgress?.activeCourseId ?? 12
	const currentLesson = courseProgress?.activeLesson?.lessonNumber ?? '1'
	const greekData = await getGreekVocabByCourseId(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="flex w-full flex-col items-center">
					<Image
						src="/gameIcons/quiz.png"
						alt="Quiz"
						height={90}
						width={90}
						style={{ width: 'auto', height: 'auto' }}
					/>
					<h1 className="my-6 text-center text-2xl font-bold text-neutral-800">
						Quiz
					</h1>

					<DismissibleAlert storageKey="vocabquiz-el" className="mb-4">
						This quiz defaults to lessons up through your current Learn lesson.
						Choose the prompt you want, adjust the timer, and practice with any
						vocab in your current course.
					</DismissibleAlert>

					<VocabQuiz
						data={greekData}
						currentLesson={currentLesson}
						courseId={activeCourseId}
						userId={userId}
						layout="greek"
						initialHearts={userProgress?.hearts ?? 5}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
