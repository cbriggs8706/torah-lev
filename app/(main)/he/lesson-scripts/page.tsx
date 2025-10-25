import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import {
	getAllHebrewLessonScripts,
	getCourseProgress,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import { DismissibleAlert } from '@/components/dismissible-alert'
import LessonScriptList from '@/components/hebrew/hebrew-lesson-script-list'

export default async function HebrewLessonScriptsPage() {
	const session = await getServerSession(options)
	const userId = session?.user?.id ?? null

	// ✅ Always load scripts (guest access allowed)
	const lessonScripts = await getAllHebrewLessonScripts(6) // default course for guest (AwB)

	// ✅ Fetch user-related data only if signed in
	const [userProgress, userSubscription, courseProgress] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
		getCourseProgress(),
	])

	// ✅ Handle guest fallbacks
	const activeCourseId = userProgress?.activeCourseId ?? 6
	const isHebrewFriend = !!userProgress?.isHebrewFriend
	const isPro = !!userSubscription?.isActive
	// const currentLesson = userChallengeData?.activeLesson?.lessonNumber ?? null
	const currentLesson = courseProgress?.activeLesson?.id ?? null

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/icons/iconNotebook.png"
						alt="Lesson Scripts"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						תַּסְרִיטֵי שִׁעוּר
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Lesson Scripts
					</p>

					{!userId && (
						<p className="text-gray-500 italic mb-3">
							You’re using guest mode — progress will not be saved.
						</p>
					)}

					<DismissibleAlert storageKey="scripts" className="mb-4">
						Lessons 1–100 are available. Most have audio where you can click the
						play button to listen while you read. Some browsers may display
						images differently.
					</DismissibleAlert>

					<LessonScriptList
						lessonScripts={lessonScripts}
						isFriend={isHebrewFriend}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}
