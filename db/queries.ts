import { cache } from 'react'
import { asc, desc, eq, like, sql } from 'drizzle-orm'
import { auth, clerkClient } from '@clerk/nextjs/server'

import db from '@/db/drizzle'
import {
	challengeProgress,
	courses,
	hebrewPrayerLibrary,
	hebrewPrayerLine,
	lessons,
	lessonScripts,
	tribes,
	units,
	userProgress,
	userSubscription,
	hebrewMusicLibrary,
	hebrewMusicLine,
} from '@/db/schema'
import { tr } from 'date-fns/locale'

export const getUserProgress = cache(async () => {
	const { userId } = await auth()

	if (!userId) {
		console.warn('⚠️ No userId found in getUserProgress')

		return null
	}

	// Try to get existing progress
	let progress = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
		with: {
			activeCourse: true,
		},
	})

	// If not found, seed default progress
	if (!progress) {
		const user = await clerkClient.users.getUser(userId)
		console.log('user', user)
		await db.insert(userProgress).values({
			userId,
			userName: user?.username ?? 'Anonymous',
			activeCourseId: 6,
		})

		progress = await db.query.userProgress.findFirst({
			where: eq(userProgress.userId, userId),
			with: {
				activeCourse: true,
			},
		})
	}

	return progress
})

export const getUnits = cache(async () => {
	const { userId } = await auth()
	const userProgress = await getUserProgress()

	if (!userId || !userProgress?.activeCourseId) {
		return []
	}

	const data = await db.query.units.findMany({
		orderBy: (units, { asc }) => [asc(units.order)],
		where: eq(units.courseId, userProgress.activeCourseId),
		with: {
			lessons: {
				orderBy: (lessons, { asc }) => [asc(lessons.order)],
				with: {
					challenges: {
						orderBy: (challenges, { asc }) => [asc(challenges.order)],
						with: {
							challengeProgress: {
								where: eq(challengeProgress.userId, userId),
							},
						},
					},
				},
			},
		},
	})

	const normalizedData = data.map((unit) => {
		const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
			if (lesson.challenges.length === 0) {
				return { ...lesson, completed: false }
			}

			const allCompletedChallenges = lesson.challenges.every((challenge) => {
				return (
					challenge.challengeProgress &&
					challenge.challengeProgress.length > 0 &&
					challenge.challengeProgress.every((progress) => progress.completed)
				)
			})

			return { ...lesson, completed: allCompletedChallenges }
		})

		return { ...unit, lessons: lessonsWithCompletedStatus }
	})

	return normalizedData
})

export const getCourses = cache(async () => {
	const data = await db.query.courses.findMany()

	return data
})

export const getCourseById = cache(async (courseId: number) => {
	const data = await db.query.courses.findFirst({
		where: eq(courses.id, courseId),
		with: {
			units: {
				orderBy: (units, { asc }) => [asc(units.order)],
				with: {
					lessons: {
						orderBy: (lessons, { asc }) => [asc(lessons.order)],
					},
				},
			},
		},
	})

	return data
})

export const getCourseProgress = cache(async () => {
	const { userId } = await auth()
	const userProgress = await getUserProgress()

	if (!userId || !userProgress?.activeCourseId) {
		return null
	}

	const unitsInActiveCourse = await db.query.units.findMany({
		orderBy: (units, { asc }) => [asc(units.order)],
		where: eq(units.courseId, userProgress.activeCourseId),
		with: {
			lessons: {
				orderBy: (lessons, { asc }) => [asc(lessons.order)],
				with: {
					unit: true,
					challenges: {
						with: {
							challengeProgress: {
								where: eq(challengeProgress.userId, userId),
							},
						},
					},
				},
			},
		},
	})

	const firstUncompletedLesson = unitsInActiveCourse
		.flatMap((unit) => unit.lessons)
		.find((lesson) => {
			return lesson.challenges.some((challenge) => {
				return (
					!challenge.challengeProgress ||
					challenge.challengeProgress.length === 0 ||
					challenge.challengeProgress.some(
						(progress) => progress.completed === false
					)
				)
			})
		})

	return {
		activeLesson: firstUncompletedLesson,
		activeLessonId: firstUncompletedLesson?.id,
		unitsInActiveCourse,
	}
})

export const getLesson = cache(async (id?: number) => {
	const { userId } = await auth()

	if (!userId) {
		return null
	}

	const courseProgress = await getCourseProgress()

	const lessonId = id || courseProgress?.activeLessonId

	if (!lessonId) {
		return null
	}

	const data = await db.query.lessons.findFirst({
		where: eq(lessons.id, lessonId),
		with: {
			challenges: {
				orderBy: (challenges, { asc }) => [asc(challenges.order)],
				with: {
					challengeOptions: true,
					challengeProgress: {
						where: eq(challengeProgress.userId, userId),
					},
				},
			},
		},
	})

	if (!data || !data.challenges) {
		return null
	}

	const normalizedChallenges = data.challenges.map((challenge) => {
		const completed =
			challenge.challengeProgress &&
			challenge.challengeProgress.length > 0 &&
			challenge.challengeProgress.every((progress) => progress.completed)

		return { ...challenge, completed }
	})

	return { ...data, challenges: normalizedChallenges }
})

export const getLessonScripts = async () => {
	const results = await db
		.select({
			id: lessonScripts.id,
			lessonId: lessonScripts.lessonId,
			content: lessonScripts.content,
			contentPlain: lessonScripts.contentPlain,
			audioSrc: lessonScripts.audioSrc,
		})
		.from(lessonScripts)
		.orderBy(lessonScripts.lessonId)

	return results
}

export const getLessonPercentage = cache(async () => {
	const courseProgress = await getCourseProgress()

	if (!courseProgress?.activeLessonId) {
		return 0
	}

	const lesson = await getLesson(courseProgress.activeLessonId)

	if (!lesson) {
		return 0
	}

	const completedChallenges = lesson.challenges.filter(
		(challenge) => challenge.completed
	)
	const percentage = Math.round(
		(completedChallenges.length / lesson.challenges.length) * 100
	)

	return percentage
})

const DAY_IN_MS = 86_400_000
export const getUserSubscription = cache(async () => {
	const { userId } = await auth()

	if (!userId) return null

	const data = await db.query.userSubscription.findFirst({
		where: eq(userSubscription.userId, userId),
	})

	if (!data) return null

	const isActive =
		data.stripePriceId &&
		data.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now()

	return {
		...data,
		isActive: !!isActive,
	}
})

export const getTopTenUsers = cache(async () => {
	const { userId } = await auth()

	if (!userId) {
		return []
	}

	const data = await db.query.userProgress.findMany({
		orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
		limit: 10,
		columns: {
			userId: true,
			userName: true,
			userImageSrc: true,
			points: true,
		},
	})

	return data
})

export const getTopTwentyUsers = cache(async () => {
	return await db
		.select({
			userId: userProgress.userId,
			userName: userProgress.userName,
			userImageSrc: userProgress.userImageSrc,
			points: userProgress.points,
			lastSeen: userProgress.lastSeen,
			activeLessonNumber: lessons.lessonNumber, // ✅ get the number
		})
		.from(userProgress)
		.leftJoin(lessons, eq(userProgress.activeLessonId, lessons.id))
		.orderBy(desc(userProgress.points))
		.limit(20)
})

export async function getPrayerWithLines(prayerId: number) {
	return db.query.hebrewPrayerLibrary.findFirst({
		where: eq(hebrewPrayerLibrary.id, prayerId),
		with: {
			lines: {
				orderBy: asc(sql`${hebrewPrayerLine.lineNumbers}[1]`),
			},
		},
	})
}

export async function getAllPrayersWithLines() {
	return db.query.hebrewPrayerLibrary.findMany({
		orderBy: asc(hebrewPrayerLibrary.order), // ✅ use correct column
		with: {
			lines: {
				orderBy: asc(sql`${hebrewPrayerLine.lineNumbers}[1]`),
			},
		},
	})
}

export async function getAllPrayers() {
	return db.query.hebrewPrayerLibrary.findMany({
		orderBy: asc(hebrewPrayerLibrary.order),
	})
}

export async function getPrayerLines(prayerId: number) {
	return db.query.hebrewPrayerLine.findMany({
		where: eq(hebrewPrayerLine.hebrewPrayerLibraryId, prayerId),
		orderBy: asc(sql`${hebrewPrayerLine.lineNumbers}[1]`),
	})
}

export async function getSongsWithLines(prayerId: number) {
	return db.query.hebrewMusicLibrary.findFirst({
		where: eq(hebrewMusicLibrary.id, prayerId),
		with: {
			lines: {
				orderBy: asc(sql`${hebrewMusicLine.lineNumbers}[1]`),
			},
		},
	})
}

export async function getAllSongsWithLines() {
	return db.query.hebrewMusicLibrary.findMany({
		orderBy: asc(hebrewMusicLibrary.order), // ✅ use correct column
		with: {
			lines: {
				orderBy: asc(sql`${hebrewMusicLine.lineNumbers}[1]`),
			},
		},
	})
}

export async function getAllSongs() {
	return db.query.hebrewMusicLibrary.findMany({
		orderBy: asc(hebrewMusicLibrary.order),
	})
}

export async function getSongLines(prayerId: number) {
	return db.query.hebrewMusicLine.findMany({
		where: eq(hebrewMusicLine.hebrewMusicLibraryId, prayerId),
		orderBy: asc(sql`${hebrewMusicLine.lineNumbers}[1]`),
	})
}

export async function getUserProgressWithTribe() {
	const { userId } = await auth()
	if (!userId) return null

	const result = await db
		.select({
			userId: userProgress.userId,
			userName: userProgress.userName,
			userImageSrc: userProgress.userImageSrc,
			points: userProgress.points,
			hearts: userProgress.hearts,
			currentLesson: lessons.lessonNumber,
			tribeId: userProgress.tribeId,
			tribeEngName: tribes.engName,
			tribeHebName: tribes.hebName,
			tribePoints: tribes.points,
			tribeImage: tribes.imgSrc,
			activeCourse: {
				id: courses.id,
				title: courses.title,
				imageSrc: courses.imageSrc,
			},
		})
		.from(userProgress)
		.leftJoin(tribes, eq(userProgress.tribeId, tribes.id))
		.leftJoin(lessons, eq(userProgress.activeLessonId, lessons.id))
		.leftJoin(courses, eq(userProgress.activeCourseId, courses.id)) // ✅ join courses
		.where(eq(userProgress.userId, userId))

	return result[0] || null
}

function parseLessonNumber(lesson: string | null) {
	if (!lesson) return 0
	const match = lesson.match(/^(\d+)([a-z])?$/i)
	if (!match) return 0
	const base = parseInt(match[1], 10)
	const part = match[2]?.toLowerCase()
	if (part === 'a') return base - 0.25
	if (part === 'b') return base - 0.125
	return base
}

export async function getTribeLeaderboard() {
	const users = await db
		.select({
			tribeId: userProgress.tribeId,
			userName: userProgress.userName,
			points: userProgress.points,
			lessonNumber: lessons.lessonNumber,
		})
		.from(userProgress)
		.leftJoin(lessons, eq(userProgress.activeLessonId, lessons.id))
		.where(sql`${userProgress.tribeId} IS NOT NULL`)

	const tribeBase = await db
		.select({
			tribeId: tribes.id,
			tribeEngName: tribes.engName,
			tribeHebName: tribes.hebName,
			tribePoints: tribes.points,
			tribeImage: tribes.imgSrc,
		})
		.from(tribes)

	// Group tribe data
	const tribeData = tribeBase.map((tribe) => {
		const members = users.filter((u) => u.tribeId === tribe.tribeId)

		if (members.length === 0) {
			return {
				...tribe,
				members: [],
				avgLesson: 0,
				totalMemberPoints: 0,
				score: 0,
			}
		}

		const totalPoints = members.reduce((sum, u) => sum + (u.points || 0), 0)
		const avgLesson =
			members.reduce((sum, u) => sum + parseLessonNumber(u.lessonNumber), 0) /
			members.length

		return {
			...tribe,
			members: members.map((m) => m.userName),
			avgLesson,
			totalMemberPoints: totalPoints,
		}
	})

	// ✅ Normalize values to 0–1 range
	const maxAvgLesson = Math.max(...tribeData.map((t) => t.avgLesson))
	const maxTotalPoints = Math.max(...tribeData.map((t) => t.totalMemberPoints))
	const maxTribePoints = Math.max(...tribeData.map((t) => t.tribePoints))

	const scoredData = tribeData.map((tribe) => {
		const normalizedLesson = maxAvgLesson ? tribe.avgLesson / maxAvgLesson : 0
		const normalizedPoints = maxTotalPoints
			? tribe.totalMemberPoints / maxTotalPoints
			: 0
		const normalizedTribePoints = maxTribePoints
			? tribe.tribePoints / maxTribePoints
			: 0

		const score =
			0.1 * normalizedLesson +
			0.4 * normalizedPoints +
			0.5 * normalizedTribePoints

		return { ...tribe, score }
	})

	return scoredData
		.filter((t) => t.members.length > 0)
		.sort((a, b) => b.score - a.score)
}
