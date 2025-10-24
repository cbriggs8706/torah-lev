'use server'

import { and, eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSession, getUserId } from '@/lib/auth'
import { z } from 'zod'

import db from '@/db/drizzle'
import { POINTS_TO_REFILL } from '@/constants'
import {
	getCourseById,
	getUserProgress,
	getUserSubscription,
} from '@/db/queries'
import {
	challengeProgress,
	challenges,
	tribes,
	userProgress,
	userCourseProgress,
} from '@/db/schema'

const getLanguageRoute = (courseId: number): string => {
	if ([6, 11, 14].includes(courseId)) return '/he/learn'
	if ([3, 4, 13, 16, 17].includes(courseId)) return '/en/learn'
	if (courseId === 2) return '/es/learn'
	if (courseId === 12) return '/el/learn'
	return '/courses' // fallback
}

export const upsertUserProgress = async (courseId: number) => {
	try {
		console.log('🟦 Upserting user progress for courseId:', courseId)
		const session = await getSession()
		const userId = session?.user?.id
		const user = session?.user
		if (!userId || !user) throw new Error('Unauthorized')

		const course = await getCourseById(courseId)
		if (!course) throw new Error('Course not found')
		if (!course.units?.length || !course.units[0]?.lessons?.length)
			throw new Error('Course has no lessons yet')

		const existingUserProgress = await getUserProgress()

		const usernameToUse =
			existingUserProgress?.userName && existingUserProgress.userName !== 'User'
				? existingUserProgress.userName
				: user.name || 'User'

		const avatarToUse =
			existingUserProgress?.userImageSrc &&
			existingUserProgress.userImageSrc !== '/mascot.svg'
				? existingUserProgress.userImageSrc
				: user.image || '/mascot.svg'

		// 1️⃣ Update global user_progress (switch active course)
		await db
			.update(userProgress)
			.set({
				activeCourseId: courseId,
				userName: usernameToUse,
				userImageSrc: avatarToUse,
			})
			.where(eq(userProgress.userId, userId))

		// 2️⃣ Ensure user_course_progress record exists
		//    (but do NOT copy points/hearts from another course)
		await db
			.insert(userCourseProgress)
			.values({
				userId,
				courseId,
				activeLessonId: null,
				points: 0,
				hearts: 5,
				lastSeen: new Date(),
			})
			.onConflictDoNothing() // if it already exists, leave it alone

		revalidatePath('/courses')
		revalidatePath('/learn')

		const targetPath = getLanguageRoute(courseId)
		return redirect(targetPath)
	} catch (error) {
		console.error('Error in upsertUserProgress:', error)
		throw error
	}
}

export const reduceHearts = async (challengeId: number) => {
	const userId = await getUserId()
	if (!userId) throw new Error('Unauthorized')

	const currentUserProgress = await getUserProgress()
	const userSubscription = await getUserSubscription()

	const challenge = await db.query.challenges.findFirst({
		where: eq(challenges.id, challengeId),
	})

	if (!challenge) {
		throw new Error('Challenge not found')
	}

	const lessonId = challenge.lessonId

	const existingChallengeProgress = await db.query.challengeProgress.findFirst({
		where: and(
			eq(challengeProgress.userId, userId),
			eq(challengeProgress.challengeId, challengeId)
		),
	})

	const isPractice = !!existingChallengeProgress

	if (isPractice) {
		return { error: 'practice' }
	}

	if (!currentUserProgress) {
		throw new Error('User progress not found')
	}

	if (userSubscription?.isActive) {
		return { error: 'subscription' }
	}

	if (currentUserProgress.hearts === 0) {
		return { error: 'hearts' }
	}

	await db
		.update(userProgress)
		.set({
			hearts: Math.max(currentUserProgress.hearts - 1, 0),
		})
		.where(eq(userProgress.userId, userId))

	revalidatePath('/market')
	revalidatePath('/learn')
	revalidatePath('/quests')
	revalidatePath('/leaderboard')
	revalidatePath(`/lesson/${lessonId}`)
}

export const refillHearts = async () => {
	const currentUserProgress = await getUserProgress()

	if (!currentUserProgress) {
		throw new Error('User progress not found')
	}

	if (currentUserProgress.hearts === 5) {
		throw new Error('Hearts are already full')
	}

	if (currentUserProgress.points < POINTS_TO_REFILL) {
		throw new Error('Not enough points')
	}

	await db
		.update(userProgress)
		.set({
			hearts: 5,
			points: currentUserProgress.points - POINTS_TO_REFILL,
		})
		.where(eq(userProgress.userId, currentUserProgress.userId))

	revalidatePath('/market')
	revalidatePath('/learn')
	revalidatePath('/quests')
	revalidatePath('/leaderboard')
}

const updateUserSchema = z.object({
	userName: z.string().min(2, 'Name must be at least 2 characters').optional(),
	userImageSrc: z.string().url('Must be a valid URL').optional(),
})

export const updateUserProfile = async (data: {
	userName?: string
	userImageSrc?: string
}) => {
	const userId = await getUserId()

	if (!userId) {
		throw new Error('Unauthorized')
	}

	// ✅ Validate input
	const parsed = updateUserSchema.safeParse(data)
	if (!parsed.success) {
		throw new Error(JSON.stringify(parsed.error.flatten().fieldErrors))
	}

	const currentUserProgress = await getUserProgress()
	if (!currentUserProgress) {
		throw new Error('User progress not found')
	}

	// ✅ Only update provided fields
	await db
		.update(userProgress)
		.set({
			...(parsed.data.userName && { userName: parsed.data.userName }),
			...(parsed.data.userImageSrc && {
				userImageSrc: parsed.data.userImageSrc,
			}),
		})
		.where(eq(userProgress.userId, userId))

	const [updatedUser] = await db
		.select()
		.from(userProgress)
		.where(eq(userProgress.userId, userId))

	// ✅ Revalidate relevant pages
	revalidatePath('/learn')
	revalidatePath('/leaderboard')
	revalidatePath('/profile')

	return updatedUser
}

export const exchangePointsForTribe = async () => {
	const userId = await getUserId()
	if (!userId) throw new Error('Unauthorized')

	const currentUserProgress = await getUserProgress()
	if (!currentUserProgress) throw new Error('User not found')
	if (!currentUserProgress.tribeId) throw new Error('No tribe assigned')
	if (currentUserProgress.points < 100) throw new Error('Not enough points')

	// ✅ Deduct user points
	await db
		.update(userProgress)
		.set({ points: currentUserProgress.points - 100 })
		.where(eq(userProgress.userId, userId))

	// ✅ Increment tribe points
	await db
		.update(tribes)
		.set({ points: sql`${tribes.points} + 1` }) // ✅ safer increment
		.where(eq(tribes.id, currentUserProgress.tribeId))

	revalidatePath('/market')
	revalidatePath('/leaderboard')
}
