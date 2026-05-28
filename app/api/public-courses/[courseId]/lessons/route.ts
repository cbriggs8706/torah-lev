import { NextResponse } from 'next/server'
import { asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
	lessons,
	publicCourse,
	publicCourseLesson,
} from '@/db/schema'
import { isAdmin } from '@/lib/admin'

const lessonAssignmentSchema = z.object({
	platformCourseId: z.number().int().positive(),
	lessonId: z.number().int().positive(),
	order: z.number().int().positive(),
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

		await db
			.delete(publicCourseLesson)
			.where(eq(publicCourseLesson.publicCourseId, courseId))

		if (parsed.data.lessons.length > 0) {
			await db.insert(publicCourseLesson).values(
				parsed.data.lessons.map((lesson) => ({
					publicCourseId: courseId,
					platformCourseId: lesson.platformCourseId,
					lessonId: lesson.lessonId,
					order: lesson.order,
				}))
			)
		}

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
