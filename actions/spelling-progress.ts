'use server'

import { eq, sql } from 'drizzle-orm'

import db from '@/db/drizzle'
import { getFreshUserProgress } from '@/db/queries'
import { getSession } from '@/lib/auth'
import { tribes, userCourseProgress, userProgress } from '@/db/schema'

type AwardSpellingCompletionInput = {
	courseId: number
	points: number
	hearts: number
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.length < 10

export async function awardSpellingCompletion({
	courseId,
	points,
	hearts,
}: AwardSpellingCompletionInput) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!courseId || points <= 0 || hearts < 0) {
		throw new Error('Invalid spelling reward payload')
	}

	if (isGuestId(userId)) {
		return {
			guest: true,
			awardedPoints: points,
			hearts,
			tribePointAwarded: false,
		}
	}

	const currentUserProgress = await getFreshUserProgress(userId)
	const now = new Date()

	await db
		.insert(userCourseProgress)
		.values({
			userId: userId!,
			courseId,
			points,
			hearts,
			lastSeen: now,
		})
		.onConflictDoUpdate({
			target: [userCourseProgress.userId, userCourseProgress.courseId],
			set: {
				points: sql`${userCourseProgress.points} + ${points}`,
				hearts,
				lastSeen: now,
			},
		})

	await db
		.update(userProgress)
		.set({
			activeCourseId: courseId,
			lastSeen: now,
		})
		.where(eq(userProgress.userId, userId!))

	let tribePointAwarded = false

	if (currentUserProgress?.tribeId) {
		await db
			.update(tribes)
			.set({ points: sql`${tribes.points} + 1` })
			.where(eq(tribes.id, currentUserProgress.tribeId))
		tribePointAwarded = true
	}

	return {
		guest: false,
		awardedPoints: points,
		hearts,
		tribePointAwarded,
	}
}
