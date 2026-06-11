'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import db from '@/db/drizzle'
import { getFreshUserProgress } from '@/db/queries'
import { getSession } from '@/lib/auth'
import { tribes, userCourseProgress, userVideoProgress } from '@/db/schema'

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
			hearts: 5,
			tribePointAwarded: false,
			completed: true,
		}
	}

	const now = new Date()
	const currentUserProgress = await getFreshUserProgress(userId)
	const existing = await db.query.userVideoProgress.findFirst({
		where: and(
			eq(userVideoProgress.userId, userId!),
			eq(userVideoProgress.videoId, videoId)
		),
		columns: {
			id: true,
		},
	})

	const isRewatch = Boolean(existing)
	const awardedPoints = isRewatch ? 0 : points

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
				points: awardedPoints,
				hearts: 5,
				lastSeen: now,
			})
			.onConflictDoUpdate({
				target: [userCourseProgress.userId, userCourseProgress.courseId],
				set: {
					points: sql`${userCourseProgress.points} + ${awardedPoints}`,
					hearts: 5,
					lastSeen: now,
				},
			})
	} else {
		await db
			.insert(userCourseProgress)
			.values({
				userId: userId!,
				courseId,
				points: 0,
				hearts: 5,
				lastSeen: now,
			})
			.onConflictDoUpdate({
				target: [userCourseProgress.userId, userCourseProgress.courseId],
				set: {
					hearts: 5,
					lastSeen: now,
				},
			})
	}

	let tribePointAwarded = false

	if (!isRewatch && currentUserProgress?.tribeId) {
		await db
			.update(tribes)
			.set({ points: sql`${tribes.points} + 1` })
			.where(eq(tribes.id, currentUserProgress.tribeId))
		tribePointAwarded = true
	}

	revalidatePath('/he/videos')
	revalidatePath('/he/music')
	revalidatePath('/progress')
	revalidatePath('/he/dashboard')
	revalidatePath('/leaderboard')

	return {
		guest: false,
		awardedPoints,
		hearts: 5,
		tribePointAwarded,
		completed: true,
	}
}
