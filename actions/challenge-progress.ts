'use server'

import { auth } from '@clerk/nextjs/server'
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

export const upsertChallengeProgress = async (challengeId: number) => {
	console.log('challengeId', challengeId)
	const { userId } = await auth()
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
					activeLessonId: lessonId,
					lastSeen: new Date(),
				})
				.onConflictDoUpdate({
					target: [userCourseProgress.userId, userCourseProgress.courseId],
					set: {
						points: sql`${userCourseProgress.points} + ${pointsToAdd}`,
						hearts: sql`LEAST(${userCourseProgress.hearts} + 1, 5)`,
						activeLessonId: lessonId,
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
	revalidatePath('/learn')
	revalidatePath('/lesson')
	revalidatePath('/quests')
	revalidatePath('/leaderboard')
	revalidatePath(`/lesson/${lessonId}`)
}

// 'use server'

// import { auth } from '@clerk/nextjs/server'
// import { and, eq, sql } from 'drizzle-orm'
// import { revalidatePath } from 'next/cache'

// import db from '@/db/drizzle'
// import { getUserProgress, getUserSubscription } from '@/db/queries'
// import {
// 	challengeProgress,
// 	challenges,
// 	tribes,
// 	userProgress,
// } from '@/db/schema'

// export const upsertChallengeProgress = async (challengeId: number) => {
// 	const { userId } = await auth()

// 	if (!userId) {
// 		throw new Error('Unauthorized')
// 	}

// 	const currentUserProgress = await getUserProgress()
// 	const userSubscription = await getUserSubscription()

// 	if (!currentUserProgress) {
// 		throw new Error('User progress not found')
// 	}

// 	const challenge = await db.query.challenges.findFirst({
// 		where: eq(challenges.id, challengeId),
// 	})

// 	if (!challenge) {
// 		throw new Error('Challenge not found')
// 	}

// 	const lessonId = challenge.lessonId

// 	const existingChallengeProgress = await db.query.challengeProgress.findFirst({
// 		where: and(
// 			eq(challengeProgress.userId, userId),
// 			eq(challengeProgress.challengeId, challengeId)
// 		),
// 	})

// 	const isPractice = !!existingChallengeProgress

// 	if (
// 		currentUserProgress.hearts === 0 &&
// 		!isPractice &&
// 		!userSubscription?.isActive
// 	) {
// 		return { error: 'hearts' }
// 	}

// 	if (isPractice) {
// 		await db
// 			.update(challengeProgress)
// 			.set({
// 				completed: true,
// 			})
// 			.where(eq(challengeProgress.id, existingChallengeProgress.id))

// 		await db
// 			.update(userProgress)
// 			.set({
// 				hearts: Math.min(currentUserProgress.hearts + 1, 5),
// 				points:
// 					currentUserProgress.points + (challenge.type === 'WATCH' ? 10 : 1),
// 				lastSeen: new Date(),
// 			})
// 			.where(eq(userProgress.userId, userId))

// 		revalidatePath('/learn')
// 		revalidatePath('/lesson')
// 		revalidatePath('/quests')
// 		revalidatePath('/leaderboard')
// 		revalidatePath(`/lesson/${lessonId}`)
// 		return
// 	}

// 	await db.insert(challengeProgress).values({
// 		challengeId,
// 		userId,
// 		completed: true,
// 	})

// 	await db
// 		.update(userProgress)
// 		.set({
// 			points:
// 				currentUserProgress.points + (challenge.type === 'WATCH' ? 10 : 1),
// 			lastSeen: new Date(),
// 		})
// 		.where(eq(userProgress.userId, userId))

// 	// ✅ After inserting/updating challengeProgress
// 	// Check if all challenges in this lesson are completed
// 	const lessonChallenges = await db.query.challenges.findMany({
// 		where: eq(challenges.lessonId, lessonId),
// 		with: {
// 			challengeProgress: {
// 				where: eq(challengeProgress.userId, userId),
// 			},
// 		},
// 	})

// 	// Check if every challenge has progress and is completed
// 	const allCompleted = lessonChallenges.every(
// 		(c) =>
// 			c.challengeProgress.length > 0 &&
// 			c.challengeProgress.every((p) => p.completed)
// 	)

// 	// ✅ Check if the lesson was already completed BEFORE this challenge
// 	const previouslyCompletedCount = lessonChallenges.filter((c) =>
// 		c.challengeProgress.some((p) => p.completed)
// 	).length

// 	// ✅ Only add tribe points if the user just completed the lesson for the first time
// 	if (
// 		allCompleted &&
// 		previouslyCompletedCount !== lessonChallenges.length - 1
// 	) {
// 		if (currentUserProgress.tribeId !== null) {
// 			await db
// 				.update(tribes)
// 				.set({ points: sql`${tribes.points} + 1` })
// 				.where(eq(tribes.id, currentUserProgress.tribeId))
// 		}
// 	}

// 	revalidatePath('/learn')
// 	revalidatePath('/lesson')
// 	revalidatePath('/quests')
// 	revalidatePath('/leaderboard')
// 	revalidatePath(`/lesson/${lessonId}`)
// }
