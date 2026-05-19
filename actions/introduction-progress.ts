'use server'

import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getUserProgress } from '@/db/queries'
import db from '@/db/drizzle'
import { tribes, userCourseProgress, userProgress } from '@/db/schema'

type AwardIntroductionCompletionInput = {
	courseId: number
	points: number
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.length < 10

export async function awardIntroductionCompletion({
	courseId,
	points,
}: AwardIntroductionCompletionInput) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!courseId || points <= 0) {
		throw new Error('Invalid introduction reward payload')
	}

	if (isGuestId(userId)) {
		return {
			guest: true,
			awardedPoints: points,
			heartsAwarded: 1,
			tribePointAwarded: false,
			hearts: 5,
		}
	}

	const currentUserProgress = await getUserProgress(userId)
	const nextHearts = Math.min((currentUserProgress?.hearts ?? 5) + 1, 5)

	await db
		.insert(userCourseProgress)
		.values({
			userId: userId!,
			courseId,
			points,
			hearts: nextHearts,
			lastSeen: new Date(),
		})
		.onConflictDoUpdate({
			target: [userCourseProgress.userId, userCourseProgress.courseId],
			set: {
				points: sql`${userCourseProgress.points} + ${points}`,
				hearts: sql`LEAST(${userCourseProgress.hearts} + 1, 5)`,
				lastSeen: new Date(),
			},
		})

	let tribePointAwarded = false

	if (currentUserProgress?.tribeId) {
		await db
			.update(tribes)
			.set({ points: sql`${tribes.points} + 1` })
			.where(eq(tribes.id, currentUserProgress.tribeId))
		tribePointAwarded = true
	}

	await db
		.update(userProgress)
		.set({
			activeCourseId: courseId,
			lastSeen: new Date(),
		})
		.where(eq(userProgress.userId, userId!))

	revalidatePath('/he/introduction')
	revalidatePath('/he/learn')
	revalidatePath('/quests')
	revalidatePath('/leaderboard')

	return {
		guest: false,
		awardedPoints: points,
		heartsAwarded: 1,
		tribePointAwarded,
		hearts: nextHearts,
	}
}
