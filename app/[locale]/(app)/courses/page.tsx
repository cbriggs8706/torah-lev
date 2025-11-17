// app/[locale]/(app)/courses/page.tsx
import { CurrentPublicCoursesList } from '@/components/courses/CurrentPublicCoursesList'
import { JoinCourseModal } from '@/components/courses/JoinCourseModal'
import { Separator } from '@/components/ui/separator'
import { getCurrentPublicCourses } from '@/db/queries/courses'
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

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">{t('title')}</h1>

			{session && (
				<>
					<h2 className="text-3xl font-bold">Private Study Groups</h2>
					<JoinCourseModal locale={locale} />
				</>
			)}
			<Separator className="my-10" />
			<h2 className="text-3xl font-bold">Available Courses/Study Groups</h2>

			{/* TODO figure out why this isn't disabling courses I'm enrolled in */}
			<CurrentPublicCoursesList courses={publicCurrent} />
		</div>
	)
}
