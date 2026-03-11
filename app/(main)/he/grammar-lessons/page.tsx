import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getCourseProgress,
	getGrammarLessons,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import GrammarLessonViewer from '@/components/hebrew/hebrew-grammar-lessons'
import { DismissibleAlert } from '@/components/dismissible-alert'

export default async function HebrewGrammarLessonsPage() {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	// ✅ Fetch grammar lessons (available to everyone)
	const lessons = await getGrammarLessons()

	// ✅ Fetch progress info only for authenticated users
	const [userProgress, userSubscription, userChallengeData] = userId
		? await Promise.all([
				getUserProgress(),
				getUserSubscription(),
				getCourseProgress(),
		  ])
		: [null, null, null]

	// ✅ Fallbacks for guests
	const isPro = !!userSubscription?.isActive
	const currentLesson = userChallengeData?.activeLesson?.lessonNumber ?? ''

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/bookmark-tabs-svgrepo-com (1).svg"
						alt="Grammar Lessons"
						height={90}
						width={90}
					/>
					<h1 className="text-center text-neutral-800 text-6xl font-cardo my-4">
						שִׁעוּרֵי דִּקְדּוּק
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Grammar Lessons
					</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="grammar-lessons" className="mb-4">
						Study Hebrew grammar by lesson number or topic. Lessons may include
						tables, explanations, and examples. Feel free to explore at your own
						pace.
					</DismissibleAlert>

					<GrammarLessonViewer
						lessons={lessons}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
