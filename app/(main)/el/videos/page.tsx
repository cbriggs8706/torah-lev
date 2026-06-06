import Image from 'next/image'
import { getSession } from '@/lib/auth'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import GreekLessonScriptList from '@/components/greek/greek-lesson-script-list'
import {
	getAllGreekLessonScripts,
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'

const GreekLessonScriptsPage = async () => {
	// Session may be null for guests
	const session = await getSession()

	// Always try to get user data, safe for guests
	const [userProgress, userSubscription, courseProgress] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
		getCourseProgress(),
	])

	const isPro = !!userSubscription?.isActive

	// ✅ Use a default Greek course if userProgress doesn’t have one
	const activeCourseId = userProgress?.activeCourseId ?? 12
	const currentLesson = courseProgress?.activeLesson?.id ?? null

	// ✅ Always get Greek scripts for the course
	const lessonScripts = await getAllGreekLessonScripts(activeCourseId)

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/youtube.svg"
						alt="Videos"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Videos
					</h1>

					<DismissibleAlert storageKey="scripts" className="mb-4">
						Lessons 1–100 are loaded. Most include audio playback so you can
						listen while you read. Guests can explore freely, but progress is
						not saved.
					</DismissibleAlert>

					<GreekLessonScriptList
						lessonScripts={lessonScripts}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default GreekLessonScriptsPage
