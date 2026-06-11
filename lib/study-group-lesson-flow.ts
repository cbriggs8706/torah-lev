import 'server-only'

import { and, eq, inArray } from 'drizzle-orm'

import db from '@/db/drizzle'
import { publicCourseActivityCompletion } from '@/db/schema'
import { buildStudyGroupScheduledActivityLinks } from '@/lib/study-group-schedule-activities'
import { buildPublicCourseActivitySignature } from '@/lib/server/public-course-activity-signature'
import type { PublicCourseActivityKey } from '@/lib/public-course-activities'
import type { StudyGroupScheduleActivity } from '@/lib/study-group-schedule-meta'

export type StudyGroupScheduleEvent = {
	id: number
	studyGroupId: number
	classDate: string | Date
	title: string | null
	notes: string | null
	studyGroupCourseId: number | null
	groupCourseName: string | null
	platformCourseId: number | null
	platformCourseTitle: string | null
	lessonId: number | null
	lessonTitle: string | null
	lessonNumber: string | null
	lessonScriptId: number | null
	lessonScriptPartBId: number | null
	lessonScriptReviewId: number | null
	activities: StudyGroupScheduleActivity[] | null
}

export type StudyGroupLessonActivity = {
	key: PublicCourseActivityKey
	label: string
	href: string
	iconSrc: string
	completed: boolean
}

export type StudyGroupLessonFlow = {
	id: number
	classDate: string | Date
	title: string
	groupCourseName: string | null
	platformCourseTitle: string | null
	lessonTitle: string | null
	lessonNumber: string | null
	notes: string | null
	activities: StudyGroupLessonActivity[]
	completedCount: number
	totalCount: number
}

export async function buildStudyGroupLessonFlows({
	events,
	userId,
}: {
	events: StudyGroupScheduleEvent[]
	userId: string | null
}) {
	const activityRows = events.flatMap((event) => {
		const activities = buildStudyGroupScheduledActivityLinks({
			courseId: event.platformCourseId,
			lessonNumber: event.lessonNumber,
			studyGroupId: event.studyGroupId,
			lessonScriptId: event.lessonScriptId,
			lessonScriptPartBId: event.lessonScriptPartBId,
			lessonScriptReviewId: event.lessonScriptReviewId,
			activities: event.activities,
		})

		return activities
			.map((activity) => {
				if (
					event.platformCourseId == null ||
					event.lessonId == null ||
					event.lessonNumber == null
				) {
					return null
				}

				return {
					eventId: event.id,
					...activity,
					signature: buildPublicCourseActivitySignature({
						activityKey: activity.key,
						platformCourseId: event.platformCourseId,
						lessonId: event.lessonId,
						lessonNumber: event.lessonNumber,
						filterConfig:
							(event.activities?.find((item) => item.activityKey === activity.key)
								?.filterConfig as Record<string, unknown>) ?? {},
					}),
				}
			})
			.filter(
				(
					row,
				): row is {
					eventId: number
					key: PublicCourseActivityKey
					label: string
					href: string
					iconSrc: string
					signature: string
				} => Boolean(row),
			)
	})

	const completedSignatureSet =
		userId && activityRows.length > 0
			? new Set(
					await db
						.select({
							activitySignature: publicCourseActivityCompletion.activitySignature,
						})
						.from(publicCourseActivityCompletion)
						.where(
							and(
								eq(publicCourseActivityCompletion.userId, userId),
								inArray(
									publicCourseActivityCompletion.activitySignature,
									activityRows.map((row) => row.signature),
								),
							),
						)
						.then((rows) => rows.map((row) => row.activitySignature)),
				)
			: new Set<string>()

	return events.map((event) => {
		const activities = activityRows
			.filter((row) => row.eventId === event.id)
			.map((row) => ({
				key: row.key,
				label: row.label,
				href: row.href,
				iconSrc: row.iconSrc,
				completed: completedSignatureSet.has(row.signature),
			}))

		const completedCount = activities.filter((activity) => activity.completed).length
		const totalCount = activities.length

		return {
			id: event.id,
			classDate: event.classDate,
			title:
				event.lessonNumber && event.lessonTitle
					? `Lesson ${event.lessonNumber}: ${event.lessonTitle}`
					: event.title || 'Custom class',
			groupCourseName: event.groupCourseName,
			platformCourseTitle: event.platformCourseTitle,
			lessonTitle: event.lessonTitle,
			lessonNumber: event.lessonNumber,
			notes: event.notes,
			activities,
			completedCount,
			totalCount,
		}
	})
}
