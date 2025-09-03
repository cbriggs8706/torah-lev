'use server'
import { getCourses, getUserProgress } from '@/db/queries'

import { List } from './list'

const CoursesPage = async () => {
	const coursesData = getCourses()
	const userProgressData = getUserProgress()

	const [courses, userProgress] = await Promise.all([
		coursesData,
		userProgressData,
	])

	const isHebrewFriend = userProgress?.isHebrewFriend ?? false

	const isEnglishFriend = userProgress?.isEnglishFriend ?? false

	const visibleCourses = courses.filter((course) => {
		if (course.id === 11 && !isHebrewFriend) return false
		if (course.id === 17 && !isEnglishFriend) return false
		return true
	})

	return (
		<div className="h-full max-w-[912px] px-3 mx-auto">
			<h1 className="text-2xl font-bold text-neutral-700">Language Courses</h1>
			<p className="text-xl text-neutral-700">
				Select a course in order to access the flashcards for that language.
			</p>
			<List
				courses={visibleCourses}
				activeCourseId={userProgress?.activeCourseId}
			/>

			<h1 className="text-2xl font-bold text-neutral-700 mt-8">
				Language Proficiency Levels
			</h1>

			<div className="flex flex-col items-center justify-between mt-6">
				<div className="h-20 w-full border-2 bg-red-600 rounded-xl border-b-4 p-3 flex flex-row">
					<div className="text-white w-1/6 font-bold my-auto text-center text-2xl">
						Pre
					</div>
					<div className="text-white w-5/6 font-semibold text-xl py-auto">
						Baby: Ability to replicate phonemes and phonemic combinations with
						and without stimuli. {'< 50 words'}
					</div>
				</div>
				<div className="h-20 w-full border-2 bg-orange-600 rounded-xl border-b-4 p-3 flex flex-row">
					<div className="text-white w-1/6 font-bold my-auto text-center text-2xl">
						A1
					</div>
					<div className="text-white w-5/6 font-semibold text-xl py-auto">
						Toddler: Communicate about familiar topics in simple ways,
						understand short conversations with people who speak slowly and
						clearly. ~200 words
					</div>
				</div>
				<div className="h-20 w-full border-2 bg-yellow-600 rounded-xl border-b-4 p-3 flex flex-row">
					<div className="text-white w-1/6 font-bold my-auto text-center text-2xl">
						A2
					</div>
					<div className="text-white w-5/6 font-semibold text-xl py-auto">
						K-2 Make themselves understood, talk about routine situations, ask
						questions and answer them on familiar topics. ~1000 words
					</div>
				</div>
				<div className="h-30 w-full border-2 bg-green-600 rounded-xl border-b-4 p-3 flex flex-row">
					<div className="text-white w-1/6 font-bold my-auto text-center text-2xl">
						B1
					</div>
					<div className="text-white w-5/6 font-semibold text-xl py-auto">
						3-6: Express themselves coherently and justify decisions on wide
						range of topics, understand main points of a conversation when
						standardized language is used and the focus is on topics of personal
						interest and familiar themes. ~2800 words
					</div>
				</div>
				<div className="h-30 w-full border-2 bg-sky-600 rounded-xl border-b-4 p-3 flex flex-row">
					<div className="text-white w-1/6 font-bold my-auto text-center text-2xl">
						B2
					</div>
					<div className="text-white w-5/6 font-semibold text-xl py-auto">
						7-12: Able to comprehend the main points of complex texts on a wide
						range of concrete and abstract topics. Communicate themselves in a
						clear manner and discuss the advantages and disadvantages of various
						options and positions in a fairly sophisticated way. ~4600 words
					</div>
				</div>
				<div className="h-30 w-full border-2 bg-indigo-600 rounded-xl border-b-4 p-3 flex flex-row">
					<div className="text-white w-1/6 font-bold my-auto text-center text-2xl">
						C1
					</div>
					<div className="text-white w-5/6 font-semibold text-xl py-auto">
						College: Understand longer and more challenging texts in detail and
						also grasp implicit meanings. Able to have spontaneous conversations
						without being lost for words, and they can use the language in their
						social as well as their professional life. ~6400 words
					</div>
				</div>
				<div className="h-26 w-full border-2 bg-purple-600 rounded-xl border-b-4 p-3 flex flex-row">
					<div className="text-white w-1/6 font-bold my-auto text-center text-2xl">
						C2
					</div>
					<div className="text-white w-5/6 font-semibold text-xl py-auto">
						Fluent: Can effortlessly understand almost everything they hear or
						read, and they are able to express themselves spontaneously about
						any topic without making noticeable grammatical errors. ~8200 words
					</div>
				</div>
			</div>
		</div>
	)
}

export default CoursesPage
