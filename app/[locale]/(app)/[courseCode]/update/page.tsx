// app/[locale]/(app)/[courseCode]/update/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCourseByCode } from '@/db/queries/courses'
import { getUnitsForCourse } from '@/db/queries/units'
import { redirect, notFound } from 'next/navigation'
import { CourseForm } from '@/components/courses/CourseForm'

type PageProps = {
	params: Promise<{ locale: string; courseCode: string }>
}

export default async function UpdateCoursePage({ params }: PageProps) {
	const { locale, courseCode } = await params

	const session = await getServerSession(authOptions)
	if (!session?.user) redirect(`/${locale}/login`)

	const course = await getCourseByCode(courseCode)
	if (!course) notFound()

	const units = await getUnitsForCourse(course.id)

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

		units: units.map((u) => ({
			id: u.id,
			slug: u.slug,
			description: u.description ?? '',
			lessons: u.lessons.map((l) => ({
				id: l.id,
				slug: l.slug,
				lessonNumber: l.lessonNumber,
				description: l.description,
			})),
		})),
	}

	return <CourseForm mode="update" initialData={normalized} />
}
