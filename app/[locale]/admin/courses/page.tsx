// app/[locale]/(app)/courses/page.tsx
import { OrganizerCoursesList } from '@/components/admin/courses/CoursesList'
import { getCoursesByOrganizer } from '@/db/queries/courses'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'

interface CoursesPageProps {
	params: Promise<{ locale: string }>
}

export default async function CoursesPage({ params }: CoursesPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'courses' })
	const session = await getServerSession(authOptions)
	const organizerId = session?.user?.id
	const courses = organizerId ? await getCoursesByOrganizer(organizerId) : []

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">{t('title')}</h1>

			<ul className="space-y-3">
				<h2 className="text-3xl font-bold">Courses I&apos;m Leading</h2>
				<OrganizerCoursesList courses={courses} locale={locale} />
			</ul>
		</div>
	)
}
