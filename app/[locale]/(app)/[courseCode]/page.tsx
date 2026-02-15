// app/[locale]/(app)/[courseCode]/page.tsx
import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { getCourseByCodeWithRelations } from '@/db/queries/courses'
import { CourseQRModal } from '@/components/courses/CourseQRModal'
import { JoinSuccessToast } from '@/components/courses/JoinSuccessToast'
import { Button } from '@/components/ui/button'
import CourseStudentWorkspace from '@/components/courses/CourseStudentWorkspace'
import {
	canAccessPrivateCourse,
	canManageCourse,
	getCourseAccessByCode,
} from '@/lib/courses/access'
import { parseLessonNumber } from '@/lib/lessons/lessonNumber'

type CoursePageData = NonNullable<
	Awaited<ReturnType<typeof getCourseByCodeWithRelations>>
>
type CourseUnit = CoursePageData['units'][number]
type CourseLesson = CourseUnit['lessons'][number]

function formatSlug(slug: string) {
	return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function groupLessons(lessons: CourseLesson[]) {
	const grouped = new Map<number, CourseLesson[]>()
	const standalone: CourseLesson[] = []

	for (const lesson of lessons) {
		const parsed = parseLessonNumber(lesson.lessonNumber ?? '')
		const groupNumber = lesson.lessonGroupNumber ?? parsed.lessonGroupNumber
		if (groupNumber === null) {
			standalone.push(lesson)
			continue
		}
		const list = grouped.get(groupNumber) ?? []
		list.push(lesson)
		grouped.set(groupNumber, list)
	}

	const groupedEntries = [...grouped.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([groupNumber, rows]) => ({
			groupNumber,
			lessons: rows.sort((a, b) => {
				const av = (a.lessonVariant || parseLessonNumber(a.lessonNumber).lessonVariant || '')
					.toLowerCase()
				const bv = (b.lessonVariant || parseLessonNumber(b.lessonNumber).lessonVariant || '')
					.toLowerCase()
				return av.localeCompare(bv)
			}),
		}))

	return { groupedEntries, standalone }
}

function PublicCourseModules({ course }: { course: CoursePageData }) {
	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">Syllabus</h2>

			<ul className="space-y-4">
				{course.units?.map((unit: CourseUnit) => {
					const groupedLessons = groupLessons(unit.lessons)
					return (
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
						<div className="ml-4 space-y-3">
							{groupedLessons.groupedEntries.map((group) => (
								<div key={group.groupNumber}>
									<p className="text-sm font-medium text-muted-foreground">
										Lesson {group.groupNumber} series
									</p>
									<ul className="list-disc space-y-1">
										{group.lessons.map((lesson) => (
											<li key={lesson.id}>
												Lesson {lesson.lessonNumber}:{' '}
												{lesson.title || lesson.description}
											</li>
										))}
									</ul>
								</div>
							))}
							{groupedLessons.standalone.length > 0 ? (
								<ul className="list-disc space-y-1">
									{groupedLessons.standalone.map((lesson) => (
										<li key={lesson.id}>
											Lesson {lesson.lessonNumber}:{' '}
											{lesson.title || lesson.description}
										</li>
									))}
								</ul>
							) : null}
						</div>
					</li>
					)
				})}
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
	// const t = await getTranslations({ locale, namespace: 'courses' })

	// Session (optional)
	const session = await getServerSession(authOptions)
	const userRole = session?.user?.role ?? 'guest'
	const userId = session?.user?.id

	// Fetch course record
	const course = await getCourseByCodeWithRelations(courseCode)

	if (!course) return notFound()
	const access = await getCourseAccessByCode(courseCode, userId)
	const canManage = canManageCourse(access, userRole)
	const showWorkspace = Boolean(session?.user?.id)

	// ──────────────────────────────────────────────
	// Access Rules
	// ──────────────────────────────────────────────
	if (!canAccessPrivateCourse(access, userRole)) {
		return redirect(`/${locale}/register`)
	}

		return (
			<div className="space-y-6">
				<JoinSuccessToast />
				<header className="space-y-3">
					<h1 className="text-3xl font-bold">{course.slug}</h1>
					<p className="text-gray-600">{course.description}</p>
					<div className="flex flex-wrap gap-2">
						<Button asChild variant="outline" size="sm">
							<Link href={`/${locale}/${course.courseCode}/messages`}>
								Message Center
							</Link>
						</Button>
						{canManage && (
							<Button asChild size="sm">
								<Link href={`/${locale}/${course.courseCode}/update`}>
									Manage Course
								</Link>
							</Button>
						)}
					</div>
				</header>

				<div className="space-y-6">
					<PublicCourseModules course={course} />
				</div>
				{session?.user.id === course.organizerId && (
					<CourseQRModal courseCode={course.courseCode} locale={locale} />
				)}
				{showWorkspace && (
					<CourseStudentWorkspace
						courseId={course.id}
						currentUserId={session?.user?.id ?? ''}
						messageCenterHref={`/${locale}/${course.courseCode}/messages`}
					/>
				)}
			</div>
		)
}
