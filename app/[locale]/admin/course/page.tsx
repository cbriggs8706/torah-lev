// app/[locale]/admin/course/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCoursesByOrganizer } from '@/db/queries/courses'
import { redirect } from 'next/navigation'
import { OrganizerCoursesList } from '@/components/admin/courses/CoursesList'

type CoursesPageProps = {
	params: Promise<{ locale: string }>
}

export default async function CoursesPage({ params }: CoursesPageProps) {
	const { locale } = await params
	const session = await getServerSession(authOptions)
	if (!session || !session.user) redirect(`/${locale}/login`)

	const courses = await getCoursesByOrganizer(session.user.id)
	console.log(courses[0].enrollments)
	return <OrganizerCoursesList courses={courses} locale={locale} />
}
