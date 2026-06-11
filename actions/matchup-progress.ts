'use server'

import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getFreshUserProgress } from '@/db/queries'
import db from '@/db/drizzle'
import { userCourseProgress } from '@/db/schema'

type AwardMatchupCompletionInput = {
	courseId: number
	hearts: number
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.length < 10

export async function awardMatchupCompletion({
	courseId,
	hearts,
}: AwardMatchupCompletionInput) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!courseId || hearts < 0) {
		throw new Error('Invalid matchup reward payload')
	}

	if (isGuestId(userId)) {
		return {
			guest: true,
			hearts,
		}
	}

	const currentUserProgress = await getFreshUserProgress(userId)
	const now = new Date()

	await db
		.insert(userCourseProgress)
		.values({
			userId: userId!,
			courseId,
			hearts,
			points: 0,
			lastSeen: now,
		})
		.onConflictDoUpdate({
			target: [userCourseProgress.userId, userCourseProgress.courseId],
			set: {
				hearts,
				lastSeen: now,
			},
		})

	revalidatePath('/he/matchup')
	revalidatePath('/he/learn')
	revalidatePath('/progress')
	revalidatePath('/leaderboard')

	return {
		guest: false,
		hearts,
		activeCourseId: currentUserProgress?.activeCourseId ?? courseId,
	}
}
