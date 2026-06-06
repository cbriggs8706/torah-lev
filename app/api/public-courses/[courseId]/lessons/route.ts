import { NextResponse } from 'next/server'
import { asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
	lessons,
	publicCourse,
	publicCourseLesson,
	publicCourseLessonActivity,
} from '@/db/schema'
import { isAdmin } from '@/lib/admin'
import {
	getDefaultPublicCourseLessonActivities,
	normalizePublicCourseActivityFilters,
	type PublicCourseActivityKey,
} from '@/lib/public-course-activities'

const lessonAssignmentSchema = z.object({
	platformCourseId: z.number().int().positive(),
	lessonId: z.number().int().positive(),
	order: z.number().int().positive(),
	activities: z
		.array(
			z.object({
				activityKey: z.enum([
					'lesson_script',
					'introduction',
					'flashcards',
					'quiz',
					'matchup',
					'spelling',
					'scramble',
				]),
				order: z.number().int().positive(),
				isEnabled: z.boolean(),
				filterConfig: z.record(z.string(), z.unknown()).optional(),
			})
		)
		.optional(),
})

const replaceLessonsSchema = z.object({
	lessons: z.array(lessonAssignmentSchema),
})

function parseId(value: string) {
	const id = Number(value)
	return Number.isFinite(id) ? id : null
}

async function getPublicCourseLessons(publicCourseId: number) {
	return db.query.publicCourseLesson.findMany({
		where: eq(publicCourseLesson.publicCourseId, publicCourseId),
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
					order: true,
				},
				with: {
					unit: {
						columns: {
							id: true,
							title: true,
							order: true,
						},
					},
					course: {
						columns: {
							id: true,
							title: true,
						},
					},
				},
			},
			activities: {
				orderBy: [asc(publicCourseLessonActivity.order)],
			},
		},
	})
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ courseId: string }> }
) {
	const courseId = parseId((await params).courseId)

	if (!courseId) {
		return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
	}

	const course = await db.query.publicCourse.findFirst({
		where: eq(publicCourse.id, courseId),
		columns: { id: true },
	})

	if (!course) {
		return NextResponse.json({ error: 'Public course not found' }, { status: 404 })
	}

	const courseLessons = await getPublicCourseLessons(courseId)
	return NextResponse.json({ lessons: courseLessons })
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ courseId: string }> }
) {
	if (!(await isAdmin())) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const courseId = parseId((await params).courseId)

		if (!courseId) {
			return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
		}

		const course = await db.query.publicCourse.findFirst({
			where: eq(publicCourse.id, courseId),
			columns: { id: true },
		})

		if (!course) {
			return NextResponse.json(
				{ error: 'Public course not found' },
				{ status: 404 }
			)
		}

		const body = await request.json()
		const parsed = replaceLessonsSchema.safeParse(body)

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid lesson list' },
				{ status: 400 }
			)
		}

		const uniqueLessonIds = [
			...new Set(parsed.data.lessons.map((lesson) => lesson.lessonId)),
		]
		const lessonRows =
			uniqueLessonIds.length > 0
				? await db
						.select({
							id: lessons.id,
							courseId: lessons.courseId,
						})
						.from(lessons)
						.where(inArray(lessons.id, uniqueLessonIds))
				: []

		const lessonMap = new Map(lessonRows.map((lesson) => [lesson.id, lesson]))

		for (const lesson of parsed.data.lessons) {
			const matchingLesson = lessonMap.get(lesson.lessonId)

			if (!matchingLesson || matchingLesson.courseId !== lesson.platformCourseId) {
				return NextResponse.json(
					{ error: 'Each lesson must belong to its selected source course.' },
					{ status: 400 }
				)
			}
		}

		await db.transaction(async (tx) => {
			await tx
				.delete(publicCourseLesson)
				.where(eq(publicCourseLesson.publicCourseId, courseId))

			if (parsed.data.lessons.length === 0) {
				return
			}

			const insertedLessons = await tx
				.insert(publicCourseLesson)
				.values(
					parsed.data.lessons.map((lesson) => ({
						publicCourseId: courseId,
						platformCourseId: lesson.platformCourseId,
						lessonId: lesson.lessonId,
						order: lesson.order,
					}))
				)
				.returning({
					id: publicCourseLesson.id,
					lessonId: publicCourseLesson.lessonId,
					order: publicCourseLesson.order,
				})

			const lessonIdsByOrder = new Map(
				insertedLessons.map((lesson) => [lesson.order, lesson.id])
			)

			const activityRows = parsed.data.lessons.flatMap((lesson) => {
				const publicCourseLessonId = lessonIdsByOrder.get(lesson.order)
				if (!publicCourseLessonId) return []

				const activities =
					lesson.activities?.length &&
					lesson.activities.some(
						(activity) => activity.activityKey === 'lesson_script'
					)
						? lesson.activities
						: getDefaultPublicCourseLessonActivities()

				const orderedActivities = [
					...activities.filter((activity) => activity.activityKey === 'lesson_script'),
					...activities.filter((activity) => activity.activityKey !== 'lesson_script'),
				]

				return orderedActivities.map((activity, index) => ({
					publicCourseLessonId,
					activityKey: activity.activityKey as PublicCourseActivityKey,
					order: index + 1,
					isEnabled:
						activity.activityKey === 'lesson_script' ? true : activity.isEnabled,
					filterConfig: normalizePublicCourseActivityFilters(
						activity.filterConfig ?? {}
					),
				}))
			})

			if (activityRows.length > 0) {
				await tx.insert(publicCourseLessonActivity).values(activityRows)
			}
		})

		const courseLessons = await getPublicCourseLessons(courseId)
		return NextResponse.json({ lessons: courseLessons })
	} catch (error) {
		console.error('Error saving public course lessons:', error)
		return NextResponse.json(
			{ error: 'Failed to save public course lessons' },
			{ status: 500 }
		)
	}
}
