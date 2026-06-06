'use server'

import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import db from '@/db/drizzle'
import { getSession } from '@/lib/auth'
import { userProgress, userVideoProgress } from '@/db/schema'

type AwardVideoCompletionInput = {
	videoId: number
	points: number
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.length < 10

export async function awardVideoCompletion({
	videoId,
	points,
}: AwardVideoCompletionInput) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!videoId || points <= 0) {
		throw new Error('Invalid video reward payload')
	}

	if (isGuestId(userId)) {
		return {
			guest: true,
			awardedPoints: points,
			completed: true,
		}
	}

	const existing = await db.query.userVideoProgress.findFirst({
		where: and(
			eq(userVideoProgress.userId, userId!),
			eq(userVideoProgress.videoId, videoId)
		),
		columns: {
			id: true,
		},
	})

	const now = new Date()
	let awardedPoints = 0

	if (!existing) {
		await db.insert(userVideoProgress).values({
			userId: userId!,
			videoId,
			pointsAwarded: points,
			completedAt: now,
			lastInteractedAt: now,
			updatedAt: now,
		})

		await db
			.update(userProgress)
			.set({
				points: sql`${userProgress.points} + ${points}`,
				lastSeen: now,
			})
			.where(eq(userProgress.userId, userId!))

		awardedPoints = points
	} else {
		await db
			.update(userVideoProgress)
			.set({
				lastInteractedAt: now,
				updatedAt: now,
			})
			.where(and(eq(userVideoProgress.id, existing.id), eq(userVideoProgress.userId, userId!)))
	}

	revalidatePath('/he/videos')
	revalidatePath('/progress')

	return {
		guest: false,
		awardedPoints,
		completed: true,
	}
}
