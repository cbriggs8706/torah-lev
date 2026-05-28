import { asc } from 'drizzle-orm'

import db from '@/db/drizzle'
import { publicCourse, studyGroupCourse } from '@/db/schema'
import CatalogCard from '@/components/courses/catalog-card'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
	const [publicCourses, studyGroupCourses] = await Promise.all([
		db.query.publicCourse.findMany({
			orderBy: [asc(publicCourse.name)],
			with: {
				lessons: true,
			},
		}),
		db.query.studyGroupCourse.findMany({
			orderBy: [asc(studyGroupCourse.name)],
			with: {
				studyGroup: {
					columns: {
						id: true,
						name: true,
						groupType: true,
					},
				},
			},
		}),
	])

	const visibleStudyGroupCourses = studyGroupCourses.filter(
		(course) => course.studyGroup?.groupType === 'Public'
	)

	return (
		<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
			<div className="max-w-3xl space-y-3">
				<h1 className="text-3xl font-bold text-slate-900">Courses</h1>
				<p className="text-base text-slate-600">
					Explore self-paced public courses and public study-group tracks built
					from lessons across the curriculum.
				</p>
			</div>

			<div className="mt-8 space-y-10">
				<section className="space-y-4">
					<div>
						<h2 className="text-2xl font-semibold text-slate-900">
							Public Courses
						</h2>
						<p className="text-sm text-slate-600">
							Start on your own schedule and set your own target dates.
						</p>
					</div>
					<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
						{publicCourses.map((course) => (
							<CatalogCard
								key={`public-${course.id}`}
								href={`/courses/public/${course.id}`}
								title={course.name}
								imageUrl={course.imageUrl}
								kindLabel="Self-paced"
								subtitle={`${course.lessons.length} curated lesson${
									course.lessons.length === 1 ? '' : 's'
								}`}
								proficiencyLevel={course.proficiencyLevel}
								endingProficiencyLevel={course.endingProficiencyLevel}
							/>
						))}
					</div>
				</section>

				<section className="space-y-4">
					<div>
						<h2 className="text-2xl font-semibold text-slate-900">
							Public Study Groups
						</h2>
						<p className="text-sm text-slate-600">
							Join a public study group when you want a curated group-led path.
						</p>
					</div>
					<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
						{visibleStudyGroupCourses.map((course) => (
							<CatalogCard
								key={`study-group-${course.id}`}
								href={`/courses/study-group/${course.studyGroupId}/${course.id}`}
								title={course.name}
								imageUrl={course.imageUrl}
								kindLabel="Study group"
								subtitle={course.studyGroup?.name ?? 'Public study group'}
							/>
						))}
					</div>
				</section>
			</div>
		</div>
	)
}
