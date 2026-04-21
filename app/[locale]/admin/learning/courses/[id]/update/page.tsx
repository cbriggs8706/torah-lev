import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { CourseEditorForm } from '@/components/admin/learning/CourseEditorForm'
import { supabaseDb as db } from '@/db'
import { courses } from '@/db/schema/tables/courses'

export default async function UpdateCoursePage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	const [course, lessons] = await Promise.all([
		db.query.courses.findFirst({
			where: eq(courses.id, id),
			with: {
				courseLessons: {
					with: {
						lesson: true,
					},
					orderBy: (courseLessons, { asc }) => [asc(courseLessons.sortOrder)],
				},
			},
		}),
		db.query.lessons.findMany({
			orderBy: (lessons, { asc }) => [
				asc(lessons.number),
				asc(lessons.title),
			],
		}),
	])

	if (!course) notFound()

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					Update Course
				</h1>
			</div>
			<CourseEditorForm
				locale={locale}
				mode="update"
				initialCourse={{
					id: course.id,
					title: course.title,
					lessonIds: course.courseLessons.map((item) => item.lessonId),
				}}
				lessons={lessons}
			/>
		</div>
	)
}
