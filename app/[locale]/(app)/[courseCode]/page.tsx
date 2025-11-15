// app/[locale]/(app)/[courseCode]/page.tsx
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getCourseByCodeWithRelations } from '@/db/queries/courses'
import { getTranslations } from 'next-intl/server'
import { CourseQRModal } from '@/components/courses/CourseQRModal'

// ─────────────────────────────────────────────────────────────
// Placeholder UI Components – replace as you build real ones
// ─────────────────────────────────────────────────────────────
function CourseMessages() {
	return <div className="rounded-lg border p-4 bg-muted">📩 Messages</div>
}
function CourseSyllabus() {
	return <div className="rounded-lg border p-4 bg-muted">📘 Syllabus</div>
}
function CourseAnnouncements() {
	return <div className="rounded-lg border p-4 bg-muted">📢 Announcements</div>
}
function CourseProgress() {
	return <div className="rounded-lg border p-4 bg-muted">📊 Progress</div>
}
function PublicCourseModules({ course }: { course: any }) {
	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">Units & Lessons</h2>
			<ul className="space-y-2">
				{course.units?.map((unit: any) => (
					<li key={unit.id} className="border p-3 rounded-lg">
						<h3 className="font-semibold">{unit.title}</h3>
						<ul className="ml-4 list-disc">
							{unit.lessons?.map((lesson: any) => (
								<li key={lesson.id}>{lesson.title}</li>
							))}
						</ul>
					</li>
				))}
			</ul>
		</div>
	)
}

// ─────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────

interface CoursePageProps {
	params: Promise<{ locale: string; courseCode: string }>
}

export default async function Page({ params }: CoursePageProps) {
	const { locale, courseCode } = await params
	const t = await getTranslations({ locale, namespace: 'courses' })

	// Session (optional)
	const session = await getServerSession(authOptions)
	const userRole = session?.user?.role ?? 'guest'

	// Fetch course record
	const course = await getCourseByCodeWithRelations(courseCode)

	if (!course) return notFound()

	// ──────────────────────────────────────────────
	// Access Rules
	// ──────────────────────────────────────────────
	if (!course.public && !['admin', 'user'].includes(userRole)) {
		return redirect(`/${locale}/register`)
	}

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-3xl font-bold">{course.slug}</h1>
				<p className="text-gray-600">{course.description}</p>
			</header>

			{/* Public Course Content */}
			{course.public && (
				<div className="space-y-6">
					<PublicCourseModules course={course} />
				</div>
			)}
			{session?.user.id === course.organizerId && (
				<CourseQRModal courseCode={course.courseCode} locale={locale} />
			)}
			{/* Private Course Content */}
			{!course.public && (
				<div className="space-y-4">
					<PublicCourseModules course={course} />

					<CourseAnnouncements />
					<CourseMessages />
					<CourseProgress />
					<CourseSyllabus />
				</div>
			)}
		</div>
	)
}
