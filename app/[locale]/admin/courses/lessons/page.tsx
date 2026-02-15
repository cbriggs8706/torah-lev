import { asc } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseDb as db } from '@/db'
import { courses } from '@/db/schema/tables/courses'
import { units } from '@/db/schema/tables/units'
import { redirect } from 'next/navigation'
import { LessonCreationForm } from '@/components/admin/lessons/LessonCreationForm'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function AdminLessonsPage({ params }: PageProps) {
	const { locale } = await params
	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'guest'

	if (!session || !['admin', 'teacher'].includes(role)) {
		redirect(`/${locale}/login`)
	}

	const [courseRows, unitRows] = await Promise.all([
		db
			.select({
				id: courses.id,
				slug: courses.slug,
				courseCode: courses.courseCode,
			})
			.from(courses)
			.orderBy(asc(courses.slug)),
		db
			.select({
				id: units.id,
				slug: units.slug,
				courseId: units.courseId,
			})
			.from(units)
			.orderBy(asc(units.order), asc(units.slug)),
	])

	const coursesWithUnits = courseRows.map((course) => ({
		...course,
		units: unitRows.filter((unit) => unit.courseId === course.id),
	}))

	return <LessonCreationForm locale={locale} courses={coursesWithUnits} />
}
