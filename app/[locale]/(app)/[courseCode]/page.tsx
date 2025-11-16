// app/[locale]/(app)/[courseCode]/page.tsx
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { getCourseByCodeWithRelations } from '@/db/queries/courses'
import { getTranslations } from 'next-intl/server'
import { CourseQRModal } from '@/components/courses/CourseQRModal'
import { JoinSuccessToast } from '@/components/courses/JoinSuccessToast'

function formatSlug(slug: string) {
	return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

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
			<h2 className="text-xl font-bold">Syllabus</h2>

			<ul className="space-y-4">
				{course.units?.map((unit: any) => (
					<li
						key={unit.id}
						className="border rounded-lg p-4 bg-muted/40 space-y-2"
					>
						<div className="flex items-center justify-between">
							{/* <h3 className="font-semibold text-lg">
								{unit.slug}
								{unit.description && (
									<span className="text-muted-foreground text-sm block">
										{unit.description}
									</span>
								)}
							</h3> */}
							<h3 className="font-semibold text-lg">
								Unit {unit.order + 1}:{' '}
								{unit.description || formatSlug(unit.slug)}
							</h3>
						</div>

						{/* <ul className="ml-4 list-disc space-y-1">
							{unit.lessons?.map((lesson: any) => (
								<li key={lesson.id}>
									<span className="font-medium">{lesson.lessonNumber}.</span>{' '}
									{lesson.slug}
								</li>
							))}
						</ul> */}
						<ul className="ml-4 list-disc space-y-1">
							{unit.lessons.map((lesson: any, idx: any) => (
								<li key={lesson.id}>
									Lesson {idx + 1}: {lesson.description}
								</li>
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
			<JoinSuccessToast />
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
