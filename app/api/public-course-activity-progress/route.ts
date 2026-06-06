import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
	publicCourseEnrollment,
	publicCourseEnrollmentActivityProgress,
	publicCourseLesson,
	publicCourseLessonActivity,
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

		const { enrollmentId, publicCourseLessonId, activityKey, scorePercent, metadata } =
			parsed.data

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

			return NextResponse.json({ progress: updated })
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

		return NextResponse.json({ progress: created }, { status: 201 })
	} catch (error) {
		console.error('Error saving public course activity progress:', error)
		return NextResponse.json(
			{ error: 'Failed to save public course activity progress.' },
			{ status: 500 }
		)
	}
}
