import Image from 'next/image'
import { asc, and, eq, inArray } from 'drizzle-orm'
import { notFound } from 'next/navigation'

import db from '@/db/drizzle'
import {
	publicCourseActivityCompletion,
	publicCourse,
	publicCourseEnrollment,
	publicCourseEnrollmentActivityProgress,
	publicCourseEnrollmentLesson,
	publicCourseLesson,
	publicCourseLessonActivity,
	videos,
	userVideoProgress,
} from '@/db/schema'
import { getSession } from '@/lib/auth'
import PublicCourseActivityBrowser from '@/components/courses/public-course-activity-browser'
import {
	getPublicCourseActivityVideoId,
	normalizePublicCourseActivityFilters,
} from '@/lib/public-course-activities'
import { getHebrewLessonVideoIdsByLessonIds } from '@/lib/server/public-course-activity-options'
import { buildPublicCourseActivitySignature } from '@/lib/server/public-course-activity-signature'
import type {
	PublicCourseActivityFilters,
	PublicCourseActivityKey,
	PublicCourseActivityStatus,
} from '@/lib/public-course-activities'

export const dynamic = 'force-dynamic'

type PublicVideoType = 'lesson' | 'review' | 'story' | 'song'

type CourseLessonActivityRow = {
	id: number
	activityKey: PublicCourseActivityKey
	order: number
	isEnabled: boolean
	filterConfig: PublicCourseActivityFilters
}

type MergedActivityProgress = {
	publicCourseLessonId: number
	publicCourseLessonActivityId: number
	status: PublicCourseActivityStatus
	scorePercent: number | null
	completedAt: Date | string | null
}

function toIsoStringOrNull(
	value: Date | string | null | undefined,
) {
	if (!value) return null
	if (value instanceof Date) return value.toISOString()
	return value
}

function normalizeActivityRow(activity: {
	id: number
	activityKey: string
	order: number
	isEnabled: boolean
	filterConfig: unknown
}): CourseLessonActivityRow {
	return {
		id: activity.id,
		activityKey: activity.activityKey as PublicCourseActivityKey,
		order: activity.order,
		isEnabled: activity.isEnabled,
		filterConfig: normalizePublicCourseActivityFilters(activity.filterConfig),
	}
}

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

	const [course, enrollment] = await Promise.all([
		db.query.publicCourse.findFirst({
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
							columns: {
								id: true,
								activityKey: true,
								order: true,
								isEnabled: true,
								filterConfig: true,
							},
							orderBy: [asc(publicCourseLessonActivity.order)],
						},
					},
				},
			},
		}),
		userId
			? db.query.publicCourseEnrollment.findFirst({
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
			: Promise.resolve(null),
	])

	if (!course) {
		notFound()
	}

	const lessonVideoIdsByLessonId = await getHebrewLessonVideoIdsByLessonIds(
		course.lessons.map((lesson) => lesson.lesson.id)
	)

	const lessonVideoIds = Array.from(
		new Set(
			Array.from(lessonVideoIdsByLessonId.values()).flatMap((ids) => [
				ids.lessonScriptId,
				ids.lessonScriptPartBId,
				ids.lessonScriptReviewId,
			])
		)
	).filter((id): id is number => typeof id === 'number')
	const customLessonVideoIds = course.lessons.flatMap((lesson) =>
		((lesson as typeof lesson & {
			activities?: Array<{
				id: number
				activityKey: string
				order: number
				isEnabled: boolean
				filterConfig: unknown
			}>
		}).activities ?? [])
			.map(normalizeActivityRow)
			.map((activity) =>
				getPublicCourseActivityVideoId({
					activityKey: activity.activityKey,
					filterConfig: activity.filterConfig,
					lessonScriptId: null,
					lessonScriptPartBId: null,
					lessonScriptReviewId: null,
				}),
			)
			.filter((id): id is number => typeof id === 'number'),
	)
	const allLessonVideoIds = Array.from(
		new Set([...lessonVideoIds, ...customLessonVideoIds]),
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
		lessonScriptId: lessonVideoIdsByLessonId.get(lesson.lesson.id)?.lessonScriptId ?? null,
		lessonScriptPartBId:
			lessonVideoIdsByLessonId.get(lesson.lesson.id)?.lessonScriptPartBId ?? null,
		lessonScriptReviewId:
			lessonVideoIdsByLessonId.get(lesson.lesson.id)?.lessonScriptReviewId ?? null,
		activities: ((lesson as typeof lesson & {
			activities?: Array<{
				id: number
				activityKey: string
				order: number
				isEnabled: boolean
				filterConfig: unknown
			}>
		}).activities ?? []).map(normalizeActivityRow).map((activity) => ({
			id: activity.id,
			activityKey: activity.activityKey,
			order: activity.order,
			isEnabled: activity.isEnabled,
			filterConfig: activity.filterConfig,
			completionSignature: buildPublicCourseActivitySignature({
				activityKey: activity.activityKey,
				platformCourseId: lesson.platformCourse.id,
				lessonId: lesson.lesson.id,
				lessonNumber: lesson.lesson.lessonNumber,
				filterConfig: activity.filterConfig,
				lessonScriptId:
					lessonVideoIdsByLessonId.get(lesson.lesson.id)?.lessonScriptId ?? null,
				lessonScriptPartBId:
					lessonVideoIdsByLessonId.get(lesson.lesson.id)?.lessonScriptPartBId ?? null,
				lessonScriptReviewId:
					lessonVideoIdsByLessonId.get(lesson.lesson.id)?.lessonScriptReviewId ?? null,
			}),
		})),
	}))

	const activitySignatureRows = plannerLessons.flatMap((lesson) =>
		lesson.activities.map((activity) => ({
			publicCourseLessonId: lesson.publicCourseLessonId,
			publicCourseLessonActivityId: activity.id,
			signature: activity.completionSignature,
		}))
	)

	const [videoTypeById, completedLessonVideoIds, sharedCompletionRows] =
		await Promise.all([
			allLessonVideoIds.length
				? db
						.select({
							id: videos.id,
							type: videos.type,
						})
						.from(videos)
						.where(inArray(videos.id, allLessonVideoIds))
						.then((rows) =>
							rows.reduce<Record<number, PublicVideoType>>((acc, row) => {
								if (row.type) {
									acc[row.id] = row.type
								}
								return acc
							}, {}),
						)
				: Promise.resolve({}),
			userId && allLessonVideoIds.length > 0
				? db.query.userVideoProgress
						.findMany({
							where: and(
								eq(userVideoProgress.userId, userId),
								inArray(userVideoProgress.videoId, allLessonVideoIds)
							),
							columns: {
								videoId: true,
							},
						})
						.then((rows) => rows.map((row) => row.videoId))
				: Promise.resolve([]),
			userId && activitySignatureRows.length > 0
				? db
						.select({
							activitySignature: publicCourseActivityCompletion.activitySignature,
							status: publicCourseActivityCompletion.status,
							scorePercent: publicCourseActivityCompletion.scorePercent,
							completedAt: publicCourseActivityCompletion.completedAt,
						})
						.from(publicCourseActivityCompletion)
						.where(
							and(
								eq(publicCourseActivityCompletion.userId, userId),
								inArray(
									publicCourseActivityCompletion.activitySignature,
									activitySignatureRows.map((row) => row.signature),
								),
							),
						)
				: Promise.resolve([]),
		])

	const sharedCompletionBySignature = new Map(
		sharedCompletionRows.map((row) => [row.activitySignature, row]),
	)

	const localActivityProgressByActivityId = new Map(
		(enrollment?.activityProgress ?? []).map((item) => [
			item.publicCourseLessonActivityId,
			item,
		]),
	)

	const mergedActivityProgress: MergedActivityProgress[] =
		activitySignatureRows.flatMap<MergedActivityProgress>((activity) => {
			const localProgress = localActivityProgressByActivityId.get(
				activity.publicCourseLessonActivityId,
			)
			if (localProgress) {
				return [
					{
						publicCourseLessonId: localProgress.publicCourseLessonId,
						publicCourseLessonActivityId:
							localProgress.publicCourseLessonActivityId,
						status: localProgress.status as PublicCourseActivityStatus,
						scorePercent: localProgress.scorePercent,
						completedAt: localProgress.completedAt,
					},
				]
			}

			const sharedProgress = sharedCompletionBySignature.get(activity.signature)
			if (!sharedProgress) return []

			return [
				{
					publicCourseLessonId: activity.publicCourseLessonId,
					publicCourseLessonActivityId: activity.publicCourseLessonActivityId,
					status: sharedProgress.status as PublicCourseActivityStatus,
					scorePercent: sharedProgress.scorePercent,
					completedAt: toIsoStringOrNull(sharedProgress.completedAt),
				},
			]
		})

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
							{course.description ||
								'This self-paced course is curated by an admin and lets you choose how many days you want to take to finish it.'}
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
					completedLessonVideoIds={completedLessonVideoIds}
					videoTypeById={videoTypeById}
					initialEnrollment={
						enrollment
						? {
								id: enrollment.id,
								goalDays: enrollment.goalDays,
								startDate: toIsoStringOrNull(enrollment.startDate)?.slice(0, 10) ?? '',
								targetEndDate:
									toIsoStringOrNull(enrollment.targetEndDate)?.slice(0, 10) ?? '',
								lessons: enrollment.lessons.map((lesson) => ({
									publicCourseLessonId: lesson.publicCourseLessonId,
									order: lesson.order,
									scheduledDate:
										toIsoStringOrNull(lesson.scheduledDate)?.slice(0, 10) ?? '',
								})),
								activityProgress: mergedActivityProgress.map((item) => ({
									publicCourseLessonId: item.publicCourseLessonId,
									publicCourseLessonActivityId: item.publicCourseLessonActivityId,
										status: item.status as PublicCourseActivityStatus,
										scorePercent: item.scorePercent,
										completedAt: toIsoStringOrNull(item.completedAt),
									})),
						  }
						: null
				}
				/>
			</div>
		</div>
	)
}
