import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCourseByCode } from '@/db/queries/courses'
import { redirect, notFound } from 'next/navigation'
import { CourseForm } from '@/components/courses/form'

type PageProps = {
	params: Promise<{ locale: string; courseCode: string }>
}

export default async function UpdateCoursePage({ params }: PageProps) {
	const { locale, courseCode } = await params

	const session = await getServerSession(authOptions)
	if (!session || !session.user) redirect(`/${locale}/login`)

	const course = await getCourseByCode(courseCode)
	if (!course) notFound()

	const normalized = {
		...course,

		section: course.section ?? undefined,
		description: course.description ?? undefined,
		category: course.category ?? undefined,
		imageSrc: course.imageSrc ?? undefined,
		startDate: course.startDate?.toISOString() ?? undefined,
		endDate: course.endDate?.toISOString() ?? undefined,

		organizerGroupName: course.organizerGroupName ?? undefined,
		location: course.location ?? undefined,
		zoomLink: course.zoomLink ?? undefined,

		maxEnrollment: course.maxEnrollment ?? undefined,

		current: course.current ?? undefined,
		public: course.public ?? undefined,
		enrollmentOpen: course.enrollmentOpen ?? undefined,
	}

	return <CourseForm mode="update" initialData={normalized} />
}
