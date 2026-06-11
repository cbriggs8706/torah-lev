'use server'

import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getFreshUserProgress } from '@/db/queries'
import db from '@/db/drizzle'
import { tribes, userCourseProgress, userProgress } from '@/db/schema'

type AwardVocabQuizCompletionInput = {
	courseId: number
	points: number
	hearts: number
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.length < 10

export async function awardVocabQuizCompletion({
	courseId,
	points,
	hearts,
}: AwardVocabQuizCompletionInput) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!courseId || points <= 0 || hearts < 0) {
		throw new Error('Invalid vocab quiz reward payload')
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
	let tribePointAwarded = false
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

	if (currentUserProgress?.tribeId) {
		await db
			.update(tribes)
			.set({ points: sql`${tribes.points} + 1` })
			.where(eq(tribes.id, currentUserProgress.tribeId))
		tribePointAwarded = true
	}

	revalidatePath('/he/learn')
	revalidatePath('/el/learn')
	revalidatePath('/progress')
	revalidatePath('/leaderboard')

	return {
		guest: false,
		awardedPoints: points,
		hearts,
		tribePointAwarded,
	}
}
