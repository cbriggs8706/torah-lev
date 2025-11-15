// app/[locale]/(app)/courses/page.tsx
import { OrganizerCoursesList } from '@/components/admin/courses/CoursesList'
import { CurrentPublicCoursesList } from '@/components/courses/CurrentPublicCoursesList'
import { JoinCourseModal } from '@/components/courses/JoinCourseModal'
import { Separator } from '@/components/ui/separator'
import {
	getCoursesByOrganizer,
	getCurrentPublicCourses,
} from '@/db/queries/courses'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'

interface CoursesPageProps {
	params: Promise<{ locale: string }>
}

export default async function CoursesPage({ params }: CoursesPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'courses' })
	const publicCurrent = await getCurrentPublicCourses()
	const session = await getServerSession(authOptions)
	const organizerId = session?.user?.id
	const courses = organizerId ? await getCoursesByOrganizer(organizerId) : []

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">{t('title')}</h1>

			<ul className="space-y-3">
				{session?.user.role === 'admin' && (
					<>
						<h2 className="text-3xl font-bold">Courses I&apos;m Leading</h2>
						<OrganizerCoursesList courses={courses} locale={locale} />
						<Separator className="my-10" />
					</>
				)}
				<h2 className="text-3xl font-bold">
					{session?.user.role === 'admin'
						? 'Courses I Can Take'
						: 'Available Courses'}
				</h2>
				{session && <JoinCourseModal locale={locale} />}

				{/* TODO figure out why this isn't disabling courses I'm enrolled in */}
				<CurrentPublicCoursesList courses={publicCurrent} />
			</ul>
		</div>
	)
}
