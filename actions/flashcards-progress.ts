'use server'

import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import db from '@/db/drizzle'
import { getUserProgress } from '@/db/queries'
import { getSession } from '@/lib/auth'
import { tribes, userCourseProgress, userProgress } from '@/db/schema'

type AwardFlashcardsCompletionInput = {
	courseId: number
	points: number
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.length < 10

export async function awardFlashcardsCompletion({
	courseId,
	points,
}: AwardFlashcardsCompletionInput) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!courseId || points <= 0) {
		throw new Error('Invalid flashcards reward payload')
	}

	if (isGuestId(userId)) {
		return {
			guest: true,
			awardedPoints: points,
			hearts: 5,
			tribePointAwarded: false,
		}
	}

	const currentUserProgress = await getUserProgress(userId)
	const now = new Date()

	await db
		.insert(userCourseProgress)
		.values({
			userId: userId!,
			courseId,
			points,
			hearts: currentUserProgress?.hearts ?? 0,
			lastSeen: now,
		})
		.onConflictDoUpdate({
			target: [userCourseProgress.userId, userCourseProgress.courseId],
			set: {
				points: sql`${userCourseProgress.points} + ${points}`,
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

	revalidatePath('/he/learn')
	revalidatePath('/leaderboard')
	revalidatePath('/progress')

	return {
		guest: false,
		awardedPoints: points,
		hearts: currentUserProgress?.hearts ?? 5,
		tribePointAwarded,
	}
}
