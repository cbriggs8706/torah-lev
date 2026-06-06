import Image from 'next/image'
import { asc, and, eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

import db from '@/db/drizzle'
import {
	publicCourse,
	publicCourseEnrollment,
	publicCourseEnrollmentActivityProgress,
	publicCourseEnrollmentLesson,
	publicCourseLesson,
	publicCourseLessonActivity,
} from '@/db/schema'
import { getSession } from '@/lib/auth'
import PublicCourseActivityBrowser from '@/components/courses/public-course-activity-browser'
import { getHebrewLessonScriptIdsByLessonIds } from '@/lib/server/public-course-activity-options'
import type {
	PublicCourseActivityFilters,
	PublicCourseActivityKey,
	PublicCourseActivityStatus,
} from '@/lib/public-course-activities'

export const dynamic = 'force-dynamic'

export default async function PublicCourseDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const courseId = Number((await params).id)

	if (!Number.isFinite(courseId)) {
		notFound()
	}

	const session = await getSession()
	const userId = session?.user?.id ?? null

	const course = await db.query.publicCourse.findFirst({
		where: eq(publicCourse.id, courseId),
		with: {
			lessons: {
				orderBy: [asc(publicCourseLesson.order)],
				with: {
					platformCourse: {
						columns: {
							id: true,
							title: true,
						},
					},
					lesson: {
						columns: {
							id: true,
							title: true,
							lessonNumber: true,
						},
						with: {
							unit: {
								columns: {
									title: true,
								},
							},
						},
					},
					activities: {
						orderBy: [asc(publicCourseLessonActivity.order)],
					},
				},
			},
		},
	})

	if (!course) {
		notFound()
	}

	const enrollment = userId
		? await db.query.publicCourseEnrollment.findFirst({
				where: and(
					eq(publicCourseEnrollment.publicCourseId, courseId),
					eq(publicCourseEnrollment.userId, userId)
				),
				with: {
					lessons: {
						orderBy: [asc(publicCourseEnrollmentLesson.order)],
					},
					activityProgress: {
						orderBy: [asc(publicCourseEnrollmentActivityProgress.createdAt)],
					},
				},
			})
		: null

	const lessonScriptIdsByLessonId = await getHebrewLessonScriptIdsByLessonIds(
		course.lessons.map((lesson) => lesson.lesson.id)
	)

	const plannerLessons = course.lessons.map((lesson) => ({
		publicCourseLessonId: lesson.id,
		order: lesson.order,
		lessonId: lesson.lesson.id,
		title: lesson.lesson.title,
		lessonNumber: lesson.lesson.lessonNumber,
		unitTitle: lesson.lesson.unit?.title ?? null,
		platformCourseId: lesson.platformCourse.id,
		platformCourseTitle: lesson.platformCourse.title,
		lessonScriptId: lessonScriptIdsByLessonId.get(lesson.lesson.id) ?? null,
		activities: ((lesson as typeof lesson & {
			activities?: Array<{
				id: number
				activityKey: PublicCourseActivityKey
				order: number
				isEnabled: boolean
				filterConfig: PublicCourseActivityFilters
			}>
		}).activities ?? []).map((activity) => ({
			id: activity.id,
			activityKey: activity.activityKey,
			order: activity.order,
			isEnabled: activity.isEnabled,
			filterConfig: activity.filterConfig,
		})),
	}))

	return (
		<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
			<div className="space-y-8">
				<div className="space-y-6">
					<div className="relative h-72 overflow-hidden rounded-3xl bg-slate-100">
						<Image
							src={course.imageUrl}
							alt={course.name}
							fill
							sizes="(min-width: 1024px) 60vw, 100vw"
							className="object-cover"
						/>
					</div>

					<div className="space-y-3">
						<p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
							Public Course
						</p>
						<h1 className="text-3xl font-bold text-slate-900">{course.name}</h1>
						<p className="text-base text-slate-600">
							This self-paced course is curated by an admin and lets you choose
							how many days you want to take to finish it.
						</p>
						<p className="text-sm text-slate-600">
							Starting level: {course.proficiencyLevel || 'Not set'} · Ending
							level: {course.endingProficiencyLevel || 'Not set'}
						</p>
					</div>

				</div>

				<PublicCourseActivityBrowser
					courseId={course.id}
					isAuthenticated={Boolean(userId)}
					lessons={plannerLessons}
					initialEnrollment={
						enrollment
							? {
									id: enrollment.id,
									goalDays: enrollment.goalDays,
									startDate: enrollment.startDate.toISOString().slice(0, 10),
									targetEndDate:
										enrollment.targetEndDate.toISOString().slice(0, 10),
									lessons: enrollment.lessons.map((lesson) => ({
										publicCourseLessonId: lesson.publicCourseLessonId,
										order: lesson.order,
										scheduledDate: lesson.scheduledDate.toISOString().slice(0, 10),
									})),
									activityProgress: enrollment.activityProgress.map((item) => ({
										publicCourseLessonId: item.publicCourseLessonId,
										publicCourseLessonActivityId: item.publicCourseLessonActivityId,
										status: item.status as PublicCourseActivityStatus,
										scorePercent: item.scorePercent,
										completedAt: item.completedAt
											? item.completedAt.toISOString()
											: null,
									})),
							  }
							: null
					}
				/>
			</div>
		</div>
	)
}
