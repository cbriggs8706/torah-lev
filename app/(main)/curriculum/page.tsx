export const dynamic = 'force-dynamic'
import { unstable_noStore as noStore } from 'next/cache'
import { getCourses, getUserProgress } from '@/db/queries'
import { List } from './list'
import { getSession } from '@/lib/auth'

const CurriculumPage = async () => {
	noStore()

	// 🧠 Session may be null for guests
	const session = await getSession()
	const userId = session?.user?.id || null

	// 🧩 Fetch courses (always safe)
	const coursesPromise = getCourses()

	// 🧩 Try fetching progress if user is signed in
	let userProgress = null
	if (userId) {
		try {
			userProgress = await getUserProgress(userId)
		} catch (err) {
			console.warn('⚠️ Failed to fetch userProgress:', err)
		}
	}

	// 🧱 Resolve both
	const courses = await coursesPromise

	// Default flags for guests
	const isHebrewFriend = userProgress?.isHebrewFriend ?? false
	const isSpanishFriend = userProgress?.isSpanishFriend ?? false
	const isBookclubFriend = userProgress?.isBookclubFriend ?? false

	// ✅ Filter visible courses
	const visibleCourses = courses.filter((course) => {
		if (course.id === 11 && !isHebrewFriend) return false
		if (course.id === 2 && !isSpanishFriend) return false
		if (course.id === 19 && !isBookclubFriend) return false
		return true
	})

	console.log('userProgress', userProgress)

	return (
		<div className="h-full max-w-[912px] px-3 mx-auto">
			<h1 className="text-2xl font-bold text-neutral-700">
				Language Curriculum
			</h1>
			<p className="text-xl text-neutral-700">
				The first dot indicates the level needed to start the course, and the
				second dot indicates the level you can reach by completing the course.
			</p>

			{/* ✅ For guests, just pass null activeCourseId */}
			<List
				courses={visibleCourses}
				activeCourseId={userProgress?.activeCourseId ?? null}
			/>

			<h1 className="text-2xl font-bold text-neutral-700 mt-8">
				Language Proficiency Levels
			</h1>

			<div className="flex flex-col mt-6 space-y-4">
				{/* Pre */}
				<div className="w-full border-2 bg-red-600 rounded-xl border-b-4 p-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
					<div className="text-white sm:w-1/6 font-bold text-center sm:text-left my-auto text-lg sm:text-xl md:text-2xl lg:text-3xl">
						Pre
					</div>
					<div className="text-white sm:w-5/6 font-semibold text-sm sm:text-base md:text-lg lg:text-xl leading-snug break-words">
						Baby: Ability to replicate phonemes and phonemic combinations with
						and without stimuli. {'< 50 words'}
					</div>
				</div>

				{/* A1 */}
				<div className="w-full border-2 bg-orange-600 rounded-xl border-b-4 p-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
					<div className="text-white sm:w-1/6 font-bold text-center sm:text-left my-auto text-lg sm:text-xl md:text-2xl lg:text-3xl">
						A1
					</div>
					<div className="text-white sm:w-5/6 font-semibold text-sm sm:text-base md:text-lg lg:text-xl leading-snug break-words">
						Toddler: Communicate about familiar topics in simple ways,
						understand short conversations with people who speak slowly and
						clearly. ~200 words
					</div>
				</div>

				{/* A2 */}
				<div className="w-full border-2 bg-yellow-600 rounded-xl border-b-4 p-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
					<div className="text-white sm:w-1/6 font-bold text-center sm:text-left my-auto text-lg sm:text-xl md:text-2xl lg:text-3xl">
						A2
					</div>
					<div className="text-white sm:w-5/6 font-semibold text-sm sm:text-base md:text-lg lg:text-xl leading-snug break-words">
						K-2: Make themselves understood, talk about routine situations, ask
						questions and answer them on familiar topics. ~1000 words
					</div>
				</div>

				{/* B1 */}
				<div className="w-full border-2 bg-green-600 rounded-xl border-b-4 p-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
					<div className="text-white sm:w-1/6 font-bold text-center sm:text-left my-auto text-lg sm:text-xl md:text-2xl lg:text-3xl">
						B1
					</div>
					<div className="text-white sm:w-5/6 font-semibold text-sm sm:text-base md:text-lg lg:text-xl leading-snug break-words">
						3-6: Express themselves coherently and justify decisions on a wide
						range of topics, understand main points of a conversation when
						standardized language is used and the focus is on topics of personal
						interest and familiar themes. ~2800 words
					</div>
				</div>

				{/* B2 */}
				<div className="w-full border-2 bg-sky-600 rounded-xl border-b-4 p-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
					<div className="text-white sm:w-1/6 font-bold text-center sm:text-left my-auto text-lg sm:text-xl md:text-2xl lg:text-3xl">
						B2
					</div>
					<div className="text-white sm:w-5/6 font-semibold text-sm sm:text-base md:text-lg lg:text-xl leading-snug break-words">
						7-12: Able to comprehend the main points of complex texts on a wide
						range of concrete and abstract topics. Communicate clearly and
						discuss advantages and disadvantages of various options and
						positions in a fairly sophisticated way. ~4600 words
					</div>
				</div>

				{/* C1 */}
				<div className="w-full border-2 bg-indigo-600 rounded-xl border-b-4 p-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
					<div className="text-white sm:w-1/6 font-bold text-center sm:text-left my-auto text-lg sm:text-xl md:text-2xl lg:text-3xl">
						C1
					</div>
					<div className="text-white sm:w-5/6 font-semibold text-sm sm:text-base md:text-lg lg:text-xl leading-snug break-words">
						College: Understand longer and more challenging texts in detail and
						also grasp implicit meanings. Able to have spontaneous conversations
						without being lost for words, using the language in social and
						professional life. ~6400 words
					</div>
				</div>

				{/* C2 */}
				<div className="w-full border-2 bg-violet-600 rounded-xl border-b-4 p-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
					<div className="text-white sm:w-1/6 font-bold text-center sm:text-left my-auto text-lg sm:text-xl md:text-2xl lg:text-3xl">
						C2
					</div>
					<div className="text-white sm:w-5/6 font-semibold text-sm sm:text-base md:text-lg lg:text-xl leading-snug break-words">
						Fluent: Can effortlessly understand almost everything they hear or
						read, and express themselves spontaneously about any topic without
						making noticeable grammatical errors. ~8200 words
					</div>
				</div>
			</div>
		</div>
	)
}

export default CurriculumPage
