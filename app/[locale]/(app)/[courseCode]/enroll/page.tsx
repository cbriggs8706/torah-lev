// app/[locale]/(app)/[courseCode]/enroll/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { courses, courseEnrollments } from '@/db/schema/tables/courses'
import { eq } from 'drizzle-orm'
import { supabaseDb } from '@/db'

interface PageProps {
	params: Promise<{ locale: string; courseCode: string }>
}

export default async function Page({ params }: PageProps) {
	const { locale, courseCode } = await params

	const session = await getServerSession(authOptions)
	const userId = session?.user?.id

	// Find course
	const course = await supabaseDb.query.courses.findFirst({
		where: eq(courses.courseCode, courseCode),
	})

	if (!course) {
		return <div className="p-6 text-lg">Invalid or expired course code.</div>
	}

	// Must be logged in
	if (!userId) {
		redirect(`/${locale}/register?returnTo=/${locale}/${courseCode}/enroll`)
	}

	// Enroll user
	await supabaseDb
		.insert(courseEnrollments)
		.values({ courseId: course.id, studentId: userId })
		.onConflictDoNothing()

	// Redirect to course dashboard
	redirect(`/${locale}/${courseCode}`)
}
