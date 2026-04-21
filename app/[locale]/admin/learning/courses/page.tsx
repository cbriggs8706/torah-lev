import { SimpleResourcePage } from '@/components/admin/learning/SimpleResourcePage'
import { supabaseDb as db } from '@/db'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function CoursesPage({ params }: PageProps) {
	const { locale } = await params
	const courses = await db.query.courses.findMany({
		with: {
			courseLessons: true,
		},
		orderBy: (courses, { asc }) => [asc(courses.title)],
	})

	return (
		<SimpleResourcePage
			locale={locale}
			title="Courses"
			description="Courses collect multiple lessons and can be assigned to study groups."
			columns={['Title', 'Lessons']}
			basePath="/admin/learning/courses"
			createHref={`/${locale}/admin/learning/courses/create`}
			rows={courses.map((course) => ({
				id: course.id,
				cells: [course.title, String(course.courseLessons.length)],
			}))}
			emptyText="No courses yet."
		/>
	)
}
