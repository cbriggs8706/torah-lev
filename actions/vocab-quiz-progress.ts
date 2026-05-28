'use server'

import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getUserProgress } from '@/db/queries'
import db from '@/db/drizzle'
import { userCourseProgress, userProgress } from '@/db/schema'

type AwardVocabQuizCompletionInput = {
	courseId: number
	points: number
}

const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.length < 10

export async function awardVocabQuizCompletion({
	courseId,
	points,
}: AwardVocabQuizCompletionInput) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!courseId || points <= 0) {
		throw new Error('Invalid vocab quiz reward payload')
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

	await db
		.insert(userCourseProgress)
		.values({
			userId: userId!,
			courseId,
			points,
			hearts: currentUserProgress?.hearts ?? 5,
			lastSeen: new Date(),
		})
		.onConflictDoUpdate({
			target: [userCourseProgress.userId, userCourseProgress.courseId],
			set: {
				points: sql`${userCourseProgress.points} + ${points}`,
				lastSeen: new Date(),
			},
		})

	await db
		.update(userProgress)
		.set({
			activeCourseId: courseId,
			lastSeen: new Date(),
		})
		.where(eq(userProgress.userId, userId!))

	// Refresh common surfaces that read user/course progress.
	revalidatePath('/he/quiz')
	revalidatePath('/el/quiz')
	revalidatePath('/he/learn')
	revalidatePath('/el/learn')
	revalidatePath('/progress')
	revalidatePath('/leaderboard')

	return {
		guest: false,
		awardedPoints: points,
		hearts: currentUserProgress?.hearts ?? 5,
		tribePointAwarded: false,
	}
}
