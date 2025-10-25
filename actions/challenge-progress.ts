'use server'

import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import db from '@/db/drizzle'
import { getUserProgress, getUserSubscription } from '@/db/queries'
import {
	challengeProgress,
	challenges,
	tribes,
	userProgress,
	userCourseProgress,
} from '@/db/schema'
import { getSession } from '@/lib/auth'

export const upsertChallengeProgress = async (challengeId: number) => {
	console.log('challengeId', challengeId)
	const session = await getSession()
	const userId = session?.user?.id

	if (!userId) throw new Error('Unauthorized')

	const currentUserProgress = await getUserProgress()
	console.log('currentUserProgress', currentUserProgress)
	const userSubscription = await getUserSubscription()
	if (!currentUserProgress) throw new Error('User progress not found')

	const challenge = await db.query.challenges.findFirst({
		where: eq(challenges.id, challengeId),
	})
	if (!challenge) throw new Error('Challenge not found')

	const lessonId = challenge.lessonId

	const existing = await db.query.challengeProgress.findFirst({
		where: and(
			eq(challengeProgress.userId, userId),
			eq(challengeProgress.challengeId, challengeId)
		),
	})
	const isPractice = !!existing

	// 🧡 Check hearts/subscription
	if (
		currentUserProgress.hearts === 0 &&
		!isPractice &&
		!userSubscription?.isActive
	) {
		return { error: 'hearts' }
	}

	// Calculate point value
	const pointsToAdd = challenge.type === 'WATCH' ? 10 : 1
	const heartsToAdd = Math.min((currentUserProgress.hearts ?? 5) + 1, 5)

	// 🎯 PRACTICE MODE (replay)
	if (isPractice) {
		await db
			.update(challengeProgress)
			.set({ completed: true })
			.where(eq(challengeProgress.id, existing.id))

		// update per-course stats
		if (currentUserProgress.activeCourseId) {
			await db
				.insert(userCourseProgress)
				.values({
					userId,
					courseId: currentUserProgress.activeCourseId,
					points: pointsToAdd,
					hearts: heartsToAdd,
					// activeLessonId: lessonId,
					lastSeen: new Date(),
				})
				.onConflictDoUpdate({
					target: [userCourseProgress.userId, userCourseProgress.courseId],
					set: {
						points: sql`${userCourseProgress.points} + ${pointsToAdd}`,
						hearts: sql`LEAST(${userCourseProgress.hearts} + 1, 5)`,
						// activeLessonId: lessonId,
						lastSeen: new Date(),
					},
				})
		}

		revalidateAll(lessonId)
		return
	}

	// 🎯 FIRST-TIME COMPLETION
	await db.insert(challengeProgress).values({
		challengeId,
		userId,
		completed: true,
	})

	if (currentUserProgress.activeCourseId) {
		await db
			.insert(userCourseProgress)
			.values({
				userId,
				courseId: currentUserProgress.activeCourseId,
				points: pointsToAdd,
				activeLessonId: lessonId,
				lastSeen: new Date(),
			})
			.onConflictDoUpdate({
				target: [userCourseProgress.userId, userCourseProgress.courseId],
				set: {
					points: sql`${userCourseProgress.points} + ${pointsToAdd}`,
					activeLessonId: lessonId,
					lastSeen: new Date(),
				},
			})
	}

	// ✅ Optionally keep lastSeen fresh globally
	await db
		.update(userProgress)
		.set({ lastSeen: new Date() })
		.where(eq(userProgress.userId, userId))

	// 🧩 Check if entire lesson completed
	const lessonChallenges = await db.query.challenges.findMany({
		where: eq(challenges.lessonId, lessonId),
		with: {
			challengeProgress: { where: eq(challengeProgress.userId, userId) },
		},
	})

	const allCompleted = lessonChallenges.every(
		(c) =>
			c.challengeProgress.length > 0 &&
			c.challengeProgress.every((p) => p.completed)
	)

	if (allCompleted && currentUserProgress.tribeId) {
		await db
			.update(tribes)
			.set({ points: sql`${tribes.points} + 1` })
			.where(eq(tribes.id, currentUserProgress.tribeId))
	}

	revalidateAll(lessonId)
}

// ✅ Small helper
function revalidateAll(lessonId: number) {
	revalidatePath('/he/learn')
	revalidatePath('/el/learn')
	revalidatePath('/en/learn')
	revalidatePath('/lesson')
	revalidatePath('/quests')
	revalidatePath('/leaderboard')
	revalidatePath(`/lesson/${lessonId}`)
}
