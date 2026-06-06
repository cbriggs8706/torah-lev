import { NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
	publicCourseEnrollment,
	publicCourseEnrollmentActivityProgress,
	publicCourseLesson,
	publicCourseLessonActivity,
	userCourseProgress,
} from '@/db/schema'
import { getSession } from '@/lib/auth'

const completeActivitySchema = z.object({
	enrollmentId: z.number().int().positive(),
	publicCourseLessonId: z.number().int().positive(),
	activityKey: z.enum([
		'lesson_script',
		'introduction',
		'flashcards',
		'quiz',
		'matchup',
		'spelling',
		'scramble',
	]),
	scorePercent: z.number().int().min(0).max(100).optional(),
	points: z.number().int().positive().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: Request) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = await request.json()
		const parsed = completeActivitySchema.safeParse(body)

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid activity progress' },
				{ status: 400 }
			)
		}

		const {
			enrollmentId,
			publicCourseLessonId,
			activityKey,
			scorePercent,
			points,
			metadata,
		} = parsed.data

		const enrollment = await db.query.publicCourseEnrollment.findFirst({
			where: and(
				eq(publicCourseEnrollment.id, enrollmentId),
				eq(publicCourseEnrollment.userId, userId)
			),
			columns: {
				id: true,
			},
		})

		if (!enrollment) {
			return NextResponse.json(
				{ error: 'Enrollment not found.' },
				{ status: 404 }
			)
		}

		const lesson = await db.query.publicCourseLesson.findFirst({
			where: eq(publicCourseLesson.id, publicCourseLessonId),
			columns: {
				platformCourseId: true,
			},
		})

		if (!lesson) {
			return NextResponse.json(
				{ error: 'Lesson not found.' },
				{ status: 404 }
			)
		}

		const activity = await db.query.publicCourseLessonActivity.findFirst({
			where: and(
				eq(publicCourseLessonActivity.publicCourseLessonId, publicCourseLessonId),
				eq(publicCourseLessonActivity.activityKey, activityKey)
			),
			columns: {
				id: true,
			},
		})

		if (!activity) {
			return NextResponse.json(
				{ error: 'Activity configuration not found.' },
				{ status: 404 }
			)
		}

		const existing = await db.query.publicCourseEnrollmentActivityProgress.findFirst({
			where: and(
				eq(publicCourseEnrollmentActivityProgress.enrollmentId, enrollmentId),
				eq(
					publicCourseEnrollmentActivityProgress.publicCourseLessonActivityId,
					activity.id
				)
			),
			columns: {
				id: true,
				status: true,
			},
		})

		const now = new Date()
		const shouldAwardPoints = (points ?? 0) > 0 && existing?.status !== 'completed'
		let awardedPoints = 0

		if (shouldAwardPoints) {
			await db
				.insert(userCourseProgress)
				.values({
					userId,
					courseId: lesson.platformCourseId,
					points: points ?? 0,
					lastSeen: now,
				})
				.onConflictDoUpdate({
					target: [userCourseProgress.userId, userCourseProgress.courseId],
					set: {
						points: sql`${userCourseProgress.points} + ${points ?? 0}`,
						lastSeen: now,
					},
				})

			awardedPoints = points ?? 0
		}

		if (existing) {
			const [updated] = await db
				.update(publicCourseEnrollmentActivityProgress)
				.set({
					status: 'completed',
					scorePercent: scorePercent ?? null,
					completedAt: existing.status === 'completed' ? undefined : now,
					lastInteractedAt: now,
					metadata: metadata ?? {},
					updatedAt: now,
				})
				.where(eq(publicCourseEnrollmentActivityProgress.id, existing.id))
				.returning()

			return NextResponse.json({ progress: updated, awardedPoints })
		}

		const [created] = await db
			.insert(publicCourseEnrollmentActivityProgress)
			.values({
				enrollmentId,
				publicCourseLessonId,
				publicCourseLessonActivityId: activity.id,
				status: 'completed',
				scorePercent: scorePercent ?? null,
				completedAt: now,
				lastInteractedAt: now,
				metadata: metadata ?? {},
				updatedAt: now,
			})
			.returning()

		return NextResponse.json({ progress: created, awardedPoints }, { status: 201 })
	} catch (error) {
		console.error('Error saving public course activity progress:', error)
		return NextResponse.json(
			{ error: 'Failed to save public course activity progress.' },
			{ status: 500 }
		)
	}
}
