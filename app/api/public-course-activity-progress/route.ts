import { NextResponse } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import {
	publicCourseActivityCompletion,
	publicCourseEnrollment,
	publicCourseEnrollmentActivityProgress,
	publicCourseLesson,
	publicCourseLessonActivity,
	userCourseProgress,
} from '@/db/schema'
import { getSession } from '@/lib/auth'
import { buildPublicCourseActivitySignature } from '@/lib/server/public-course-activity-signature'

const completeActivitySchema = z.object({
	enrollmentId: z.number().int().positive(),
	publicCourseLessonId: z.number().int().positive(),
	activityKey: z.enum([
		'lesson_script',
		'lesson_script_part_b',
		'lesson_script_review',
		'lesson_video',
		'lesson_song',
		'introduction',
		'introduction_phrases',
		'flashcards',
		'quiz',
		'matchup',
		'opposites',
		'spelling',
		'scramble',
	]),
	scorePercent: z.number().int().min(0).max(100).optional(),
	points: z.number().int().positive().optional(),
	hearts: z.number().int().min(0).max(5).optional(),
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
			hearts,
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
				lessonId: true,
			},
			with: {
				lesson: {
					columns: {
						lessonNumber: true,
					},
				},
			},
		})

		if (!lesson) {
			return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 })
		}

		const activity = await db.query.publicCourseLessonActivity.findFirst({
			where: and(
				eq(publicCourseLessonActivity.publicCourseLessonId, publicCourseLessonId),
				eq(publicCourseLessonActivity.activityKey, activityKey)
			),
			columns: {
				id: true,
				filterConfig: true,
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

		const activitySignature = buildPublicCourseActivitySignature({
			activityKey,
			platformCourseId: lesson.platformCourseId,
			lessonId: lesson.lessonId,
			lessonNumber: lesson.lesson?.lessonNumber ?? null,
			filterConfig: activity.filterConfig as Record<string, unknown>,
		})

		const sharedExisting = await db.query.publicCourseActivityCompletion.findFirst({
			where: and(
				eq(publicCourseActivityCompletion.userId, userId),
				eq(publicCourseActivityCompletion.activitySignature, activitySignature)
			),
			columns: {
				id: true,
				status: true,
				points: true,
			},
		})

		const now = new Date()
		const shouldUpdateCourseProgress =
			(points ?? 0) > 0 || typeof hearts === 'number'
		const shouldAwardPoints =
			(points ?? 0) > 0 &&
			existing?.status !== 'completed' &&
			sharedExisting?.status !== 'completed'
		let awardedPoints = 0

		if (shouldUpdateCourseProgress) {
			await db
				.insert(userCourseProgress)
				.values({
					userId,
					courseId: lesson.platformCourseId,
					points: points ?? 0,
					hearts: hearts ?? 5,
					lastSeen: now,
				})
				.onConflictDoUpdate({
					target: [userCourseProgress.userId, userCourseProgress.courseId],
					set: {
						...(shouldAwardPoints
							? { points: sql`${userCourseProgress.points} + ${points ?? 0}` }
							: {}),
						...(typeof hearts === 'number' ? { hearts } : {}),
						lastSeen: now,
					},
				})
			if (shouldAwardPoints) {
				awardedPoints = points ?? 0
			}
		}

		if (sharedExisting) {
			await db
				.update(publicCourseActivityCompletion)
				.set({
					activityKey,
					status: 'completed',
					scorePercent: scorePercent ?? null,
					points: points ?? sharedExisting.points,
					lastInteractedAt: now,
					metadata: metadata ?? {},
					updatedAt: now,
				})
				.where(eq(publicCourseActivityCompletion.id, sharedExisting.id))
		} else {
			await db.insert(publicCourseActivityCompletion).values({
				userId,
				activityKey,
				activitySignature,
				status: 'completed',
				scorePercent: scorePercent ?? null,
				points: points ?? 0,
				completedAt: now,
				lastInteractedAt: now,
				metadata: metadata ?? {},
				updatedAt: now,
			})
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

		return NextResponse.json({
			progress: updated,
			awardedPoints,
			hearts: typeof hearts === 'number' ? hearts : undefined,
		})
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

		return NextResponse.json(
			{
				progress: created,
				awardedPoints,
				hearts: typeof hearts === 'number' ? hearts : undefined,
			},
			{ status: 201 }
		)
	} catch (error) {
		console.error('Error saving public course activity progress:', error)
		return NextResponse.json(
			{ error: 'Failed to save public course activity progress.' },
			{ status: 500 }
		)
	}
}
