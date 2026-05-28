import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
	publicCourse,
	publicCourseEnrollment,
	publicCourseEnrollmentLesson,
	publicCourseLesson,
} from '@/db/schema'
import { getUserOrThrow } from '@/lib/auth'
import { getTargetEndDate } from '@/lib/public-course-scheduling'

const enrollmentSchema = z.object({
	goalDays: z.number().int().positive(),
	lessonSchedules: z.array(
		z.object({
			publicCourseLessonId: z.number().int().positive(),
			scheduledDate: z.string().trim().min(1),
			order: z.number().int().positive(),
		})
	),
})

function parseId(value: string) {
	const id = Number(value)
	return Number.isFinite(id) ? id : null
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ courseId: string }> }
) {
	try {
		const userId = await getUserOrThrow()
		const courseId = parseId((await params).courseId)

		if (!courseId) {
			return NextResponse.json({ error: 'Invalid course id' }, { status: 400 })
		}

		const enrollment = await db.query.publicCourseEnrollment.findFirst({
			where: and(
				eq(publicCourseEnrollment.publicCourseId, courseId),
				eq(publicCourseEnrollment.userId, userId)
			),
			with: {
				lessons: {
					orderBy: [asc(publicCourseEnrollmentLesson.order)],
					with: {
						publicCourseLesson: {
							with: {
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
								platformCourse: {
									columns: {
										id: true,
										title: true,
									},
								},
							},
						},
					},
				},
			},
		})

		return NextResponse.json({ enrollment })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error fetching public course enrollment:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch public course enrollment' },
			{ status: 500 }
		)
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ courseId: string }> }
) {
	try {
		const userId = await getUserOrThrow()
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

		const body = await request.json()
		const parsed = enrollmentSchema.safeParse(body)

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid enrollment data' },
				{ status: 400 }
			)
		}

		const courseLessons = await db.query.publicCourseLesson.findMany({
			where: eq(publicCourseLesson.publicCourseId, courseId),
			orderBy: [asc(publicCourseLesson.order)],
		})

		const expectedLessonIds = courseLessons.map((lesson) => lesson.id)
		const submittedLessonIds = parsed.data.lessonSchedules
			.map((lesson) => lesson.publicCourseLessonId)
			.sort((a, b) => a - b)

		if (
			expectedLessonIds.length !== submittedLessonIds.length ||
			expectedLessonIds
				.slice()
				.sort((a, b) => a - b)
				.some((id, index) => id !== submittedLessonIds[index])
		) {
			return NextResponse.json(
				{ error: 'Schedule must include every curated lesson exactly once.' },
				{ status: 400 }
			)
		}

		for (const lesson of parsed.data.lessonSchedules) {
			const date = new Date(`${lesson.scheduledDate}T00:00:00`)

			if (Number.isNaN(date.getTime())) {
				return NextResponse.json(
					{ error: 'Each scheduled date must be valid.' },
					{ status: 400 }
				)
			}
		}

		const startDate = new Date()
		const targetEndDate = getTargetEndDate(startDate, parsed.data.goalDays)

		const existing = await db.query.publicCourseEnrollment.findFirst({
			where: and(
				eq(publicCourseEnrollment.publicCourseId, courseId),
				eq(publicCourseEnrollment.userId, userId)
			),
			columns: { id: true },
		})

		let enrollmentId = existing?.id ?? null

		if (enrollmentId) {
			await db
				.update(publicCourseEnrollment)
				.set({
					goalDays: parsed.data.goalDays,
					startDate,
					targetEndDate,
					updatedAt: new Date(),
				})
				.where(eq(publicCourseEnrollment.id, enrollmentId))

			await db
				.delete(publicCourseEnrollmentLesson)
				.where(eq(publicCourseEnrollmentLesson.enrollmentId, enrollmentId))
		} else {
			const [created] = await db
				.insert(publicCourseEnrollment)
				.values({
					publicCourseId: courseId,
					userId,
					goalDays: parsed.data.goalDays,
					startDate,
					targetEndDate,
				})
				.returning({ id: publicCourseEnrollment.id })

			enrollmentId = created.id
		}

		await db.insert(publicCourseEnrollmentLesson).values(
			parsed.data.lessonSchedules.map((lesson) => ({
				enrollmentId: enrollmentId!,
				publicCourseLessonId: lesson.publicCourseLessonId,
				order: lesson.order,
				scheduledDate: new Date(`${lesson.scheduledDate}T00:00:00`),
			}))
		)

		const enrollment = await db.query.publicCourseEnrollment.findFirst({
			where: eq(publicCourseEnrollment.id, enrollmentId!),
			with: {
				lessons: {
					orderBy: [asc(publicCourseEnrollmentLesson.order)],
					with: {
						publicCourseLesson: {
							with: {
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
								platformCourse: {
									columns: {
										id: true,
										title: true,
									},
								},
							},
						},
					},
				},
			},
		})

		return NextResponse.json({ enrollment }, { status: existing ? 200 : 201 })
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.error('Error saving public course enrollment:', error)
		return NextResponse.json(
			{ error: 'Failed to save public course enrollment' },
			{ status: 500 }
		)
	}
}
