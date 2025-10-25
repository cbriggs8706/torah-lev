import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { FeedWrapper } from '@/components/feed-wrapper'
import { DismissibleAlert } from '@/components/dismissible-alert'
import {
	getCourseProgress,
	getEnglishLessonScripts,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import LessonScriptList from '@/components/english/english-lesson-script-list'
import { FileX } from 'lucide-react'

const EnglishLessonScriptsPage = async () => {
	// 🧠 Session may be null for guests
	const session = await getServerSession(options)

	// Fetch data safely (works for guests too)
	const [userProgress, userSubscription, courseProgress] = await Promise.all([
		getUserProgress(),
		getUserSubscription(),
		getCourseProgress(),
	])

	const isPro = !!userSubscription?.isActive

	// ✅ Fallback for guests — default to EC1 (courseId 3)
	const activeCourseId = userProgress?.activeCourseId ?? 3
	const currentLesson = courseProgress?.activeLesson?.id ?? null

	// Match prefix by courseId
	const coursePrefixes: Record<number, string> = {
		17: 'LR',
		13: 'EwB',
		16: 'EfW',
		3: 'EC1',
		4: 'EC2',
	}
	const prefix = coursePrefixes[activeCourseId]

	// Load all scripts and filter by prefix
	const lessonScripts = await getEnglishLessonScripts()
	// const lessonScripts = await getEnglishLessonScripts(prefix)

	// TODO Fix
	const filteredLessonScripts = lessonScripts
	// const filteredLessonScripts = prefix
	// 	? lessonScripts.filter((script) => script.lessonTitle?.startsWith(prefix))
	// 	: lessonScripts

	console.log('Fetched scripts:', lessonScripts.length)
	console.log('Filtered scripts:', filteredLessonScripts.length)
	// For guests, mark isEnglishFriend as false
	const isEnglishFriend = !!userProgress?.isEnglishFriend

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/spiral-notepad-svgrepo-com.svg"
						alt="Lesson Scripts"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Lesson Scripts
					</h1>

					{/* Optional note for guests */}
					{!session?.user && (
						<p className="text-gray-500 text-center mb-4">
							You’re browsing as a guest. Your progress won’t be saved.
						</p>
					)}

					{/* Optional alert if you want */}
					{/* <DismissibleAlert storageKey="scripts" className="mb-4">
						Lessons 1–100 are loaded. Most have audio you can play while reading.
					</DismissibleAlert> */}

					<LessonScriptList
						lessonScripts={filteredLessonScripts}
						isFriend={isEnglishFriend}
						currentLesson={currentLesson}
					/>
				</div>
			</FeedWrapper>
		</div>
	)
}

export default EnglishLessonScriptsPage
