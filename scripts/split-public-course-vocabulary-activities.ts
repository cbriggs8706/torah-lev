import 'dotenv/config'

import { and, asc, eq, gt, sql } from 'drizzle-orm'

import db from '@/db/drizzle'
import {
	lessons,
	publicCourseLesson,
	publicCourseLessonActivity,
} from '@/db/schema'
import {
	applyDefaultPublicCourseActivityFilters,
	type PublicCourseActivityKey,
} from '@/lib/public-course-activities'

type LessonActivityRow = {
	publicCourseLessonId: number
	activityKey: PublicCourseActivityKey
	order: number
	isEnabled: boolean
	filterConfig: Record<string, unknown>
	lessonNumber: string | null
}

async function main() {
	const courseLessons = await db
		.select({
			publicCourseLessonId: publicCourseLesson.id,
			sourceLessonId: publicCourseLesson.lessonId,
			lessonNumber: lessons.lessonNumber,
		})
		.from(publicCourseLesson)
		.innerJoin(lessons, eq(publicCourseLesson.lessonId, lessons.id))

	const activityRows = await db
		.select({
			publicCourseLessonId: publicCourseLessonActivity.publicCourseLessonId,
			activityKey: publicCourseLessonActivity.activityKey,
			order: publicCourseLessonActivity.order,
			isEnabled: publicCourseLessonActivity.isEnabled,
			filterConfig: publicCourseLessonActivity.filterConfig,
			lessonNumber: lessons.lessonNumber,
		})
		.from(publicCourseLessonActivity)
		.innerJoin(
			publicCourseLesson,
			eq(publicCourseLessonActivity.publicCourseLessonId, publicCourseLesson.id),
		)
		.innerJoin(lessons, eq(publicCourseLesson.lessonId, lessons.id))
		.orderBy(
			asc(publicCourseLessonActivity.publicCourseLessonId),
			asc(publicCourseLessonActivity.order),
		)

	const activitiesByLessonId = new Map<number, LessonActivityRow[]>()
	for (const row of activityRows) {
		const next = activitiesByLessonId.get(row.publicCourseLessonId) ?? []
		next.push({
			publicCourseLessonId: row.publicCourseLessonId,
			activityKey: row.activityKey as PublicCourseActivityKey,
			order: row.order,
			isEnabled: row.isEnabled,
			filterConfig: row.filterConfig as Record<string, unknown>,
			lessonNumber: row.lessonNumber,
		})
		activitiesByLessonId.set(row.publicCourseLessonId, next)
	}

	let insertedCount = 0

	for (const lesson of courseLessons) {
		const activities = activitiesByLessonId.get(lesson.publicCourseLessonId) ?? []
		const wordsActivity = activities.find(
			(activity) => activity.activityKey === 'introduction',
		)
		const phrasesActivity = activities.find(
			(activity) => activity.activityKey === 'introduction_phrases',
		)

		if (!wordsActivity || phrasesActivity) continue

		await db.transaction(async (tx) => {
			const orderOffset = 1000
			const phrasesOrder = wordsActivity.order + 1

			await tx
				.update(publicCourseLessonActivity)
				.set({
					order: sql`${publicCourseLessonActivity.order} + ${orderOffset}`,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(publicCourseLessonActivity.publicCourseLessonId, lesson.publicCourseLessonId),
						gt(publicCourseLessonActivity.order, wordsActivity.order),
					),
				)

			await tx.insert(publicCourseLessonActivity).values({
				publicCourseLessonId: lesson.publicCourseLessonId,
				activityKey: 'introduction_phrases',
				order: phrasesOrder,
				isEnabled: wordsActivity.isEnabled,
				filterConfig: applyDefaultPublicCourseActivityFilters({
					filters: wordsActivity.filterConfig,
					activityKey: 'introduction_phrases',
					lessonNumber: lesson.lessonNumber,
				}),
			})

			await tx
				.update(publicCourseLessonActivity)
				.set({
					order: sql`${publicCourseLessonActivity.order} - ${orderOffset - 1}`,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(publicCourseLessonActivity.publicCourseLessonId, lesson.publicCourseLessonId),
						gt(publicCourseLessonActivity.order, wordsActivity.order + orderOffset),
					),
				)
		})

		insertedCount += 1
	}

	console.log(`Inserted phrases activities for ${insertedCount} lessons.`)
}

void main().catch((error) => {
	console.error(error)
	process.exit(1)
})
