'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import db from '@/db/drizzle'
import { getSession } from '@/lib/auth'
import { userCourseProgress, userVideoProgress } from '@/db/schema'

type AwardVideoCompletionInput = {
	courseId: number
	videoId: number
	points: number
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.length < 10

export async function awardVideoCompletion({
	courseId,
	videoId,
	points,
}: AwardVideoCompletionInput) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!courseId || !videoId || points <= 0) {
		throw new Error('Invalid video reward payload')
	}

	if (isGuestId(userId)) {
		return {
			guest: true,
			awardedPoints: points,
			completed: true,
		}
	}

	const now = new Date()
	const existing = await db.query.userVideoProgress.findFirst({
		where: and(
			eq(userVideoProgress.userId, userId!),
			eq(userVideoProgress.videoId, videoId)
		),
		columns: {
			id: true,
		},
	})

	await db
		.insert(userVideoProgress)
		.values({
			userId: userId!,
			videoId,
			pointsAwarded: points,
			completedAt: now,
			lastInteractedAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: [userVideoProgress.userId, userVideoProgress.videoId],
			set: {
				lastInteractedAt: now,
				updatedAt: now,
			},
		})

	if (!existing) {
		await db
			.insert(userCourseProgress)
			.values({
				userId: userId!,
				courseId,
				points,
				lastSeen: now,
			})
			.onConflictDoUpdate({
				target: [userCourseProgress.userId, userCourseProgress.courseId],
				set: {
					points: sql`${userCourseProgress.points} + ${points}`,
					lastSeen: now,
				},
			})
	}

	revalidatePath('/he/videos')
	revalidatePath('/progress')

	return {
		guest: false,
		awardedPoints: points,
		completed: true,
	}
}
