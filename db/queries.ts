import { cache } from 'react'
import {
	and,
	asc,
	desc,
	eq,
	gte,
	ilike,
	inArray,
	like,
	lte,
	sql,
} from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/clerk-sdk-node'

// import { events } from '@/db/schema'

import db from '@/db/drizzle'
import {
	challengeProgress,
	courses,
	hebrewPrayerLibrary,
	hebrewPrayerLine,
	lessons,
	hebrewLessonScripts,
	greekLessonScripts,
	englishLessonScripts,
	englishSlides,
	grammarLessons,
	tribes,
	units,
	userProgress,
	userCourseProgress,
	userSubscription,
	hebrewMusicLibrary,
	hebrewMusicLine,
	hebrewStories,
	englishStories,
	studyGroups,
	studyGroupMembers,
} from '@/db/schema'
import { tr } from 'date-fns/locale'

export async function getUserProgress() {
	const { userId } = await auth()
	if (!userId) return null

	// Pull their global progress (activeCourseId, profile info)
	const baseProgress = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
		with: {
			activeCourse: true, // assuming you have relation set up
		},
	})

	if (!baseProgress) return null

	const clerkUser = await clerkClient.users.getUser(userId)
	const liveImage = clerkUser?.imageUrl || '/mascot.svg'

	// Pull course-specific progress for activeCourseId
	let courseProgress = null
	if (baseProgress.activeCourseId) {
		courseProgress = await db.query.userCourseProgress.findFirst({
			where: and(
				eq(userCourseProgress.userId, userId),
				eq(userCourseProgress.courseId, baseProgress.activeCourseId)
			),
		})
	}

	// Merge the data — fallback to zeros if no course row yet
	return {
		...baseProgress,
		userImageSrc: liveImage, // ✅ override with live image
		points: courseProgress?.points ?? 0,
		hearts: courseProgress?.hearts ?? 5,
		activeLessonId: courseProgress?.activeLessonId ?? null,
		lastSeen: courseProgress?.lastSeen ?? null,
	}
}
// export const getUserProgress = cache(async () => {
// 	const { userId } = await auth()

// 	if (!userId) {
// 		console.warn('⚠️ No userId found in getUserProgress')

// 		return null
// 	}

// 	// Try to get existing progress
// 	let progress = await db.query.userProgress.findFirst({
// 		where: eq(userProgress.userId, userId),
// 		with: {
// 			activeCourse: true,
// 		},
// 	})

// 	// If not found, seed default progress
// 	if (!progress) {
// 		const clerk = await clerkClient()

// 		const user = await clerk.users.getUser(userId)
// 		console.log('user', user)
// 		await db.insert(userProgress).values({
// 			userId,
// 			userName: user?.username ?? 'Anonymous',
// 			activeCourseId: 6,
// 		})

// 		progress = await db.query.userProgress.findFirst({
// 			where: eq(userProgress.userId, userId),
// 			with: {
// 				activeCourse: true,
// 			},
// 		})
// 	}

// 	return progress
// })

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

export async function getAllUserCourseProgress() {
	const { userId } = await auth()
	if (!userId) return []

	const results = await db
		.select({
			courseId: userCourseProgress.courseId,
			points: userCourseProgress.points,
			hearts: userCourseProgress.hearts,
			activeLessonId: userCourseProgress.activeLessonId,
			lastSeen: userCourseProgress.lastSeen,
			courseTitle: courses.title,
			courseImage: courses.imageSrc,
			proficiencyLevel: courses.proficiencyLevel,
			endingProficiencyLevel: courses.endingProficiencyLevel,
		})
		.from(userCourseProgress)
		.innerJoin(courses, eq(userCourseProgress.courseId, courses.id))
		.where(eq(userCourseProgress.userId, userId))
		.orderBy(asc(courses.id))

	return results
}

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

export async function getAllHebrewLessonScripts(courseId?: number) {
	const base = db
		.select({
			id: hebrewLessonScripts.id,
			courseId: hebrewLessonScripts.courseId,
			lessonId: hebrewLessonScripts.lessonId,
			part: hebrewLessonScripts.part,
			content: hebrewLessonScripts.content,
			contentPlain: hebrewLessonScripts.contentPlain,
			audioSrc: hebrewLessonScripts.audioSrc,
			// 👇 from lessons
			title: lessons.title,
		})
		.from(hebrewLessonScripts)
		.innerJoin(lessons, eq(hebrewLessonScripts.lessonId, lessons.id))

	const q =
		courseId != null
			? base.where(sql`${courseId} = ANY(${hebrewLessonScripts.courseId})`)
			: base

	return q.orderBy(
		asc(hebrewLessonScripts.lessonId),
		asc(hebrewLessonScripts.part)
	)
}

export const getHebrewLessonScripts = async (courseId: number) => {
	const results = await db
		.select({
			id: hebrewLessonScripts.id,
			courseId: hebrewLessonScripts.courseId,
			lessonScriptId: hebrewLessonScripts.lessonId,
			part: hebrewLessonScripts.part,
			content: hebrewLessonScripts.content,
			contentPlain: hebrewLessonScripts.contentPlain,
			audioSrc: hebrewLessonScripts.audioSrc,
			title: lessons.title, // Select the title from the lessons table
			lessonId: lessons.id,
		})
		.from(hebrewLessonScripts)
		.innerJoin(lessons, eq(hebrewLessonScripts.lessonId, lessons.id))
		.where(sql`${courseId} = ANY(${hebrewLessonScripts.courseId})`)
		.orderBy(asc(hebrewLessonScripts.lessonId), asc(hebrewLessonScripts.part))

	return results
}

export async function getHebrewLessonScript(lessonScriptId: number) {
	return db.query.hebrewLessonScripts.findFirst({
		where: eq(hebrewLessonScripts.id, lessonScriptId),
	})
}

export const getEnglishLessonScripts = async () => {
	const rows = await db
		.select({
			id: englishLessonScripts.id,
			lessonId: englishLessonScripts.lessonId,
			content: englishLessonScripts.content,
			audioSrc: englishLessonScripts.audioSrc,
			lessonTitle: lessons.title,
		})
		.from(englishLessonScripts)
		.innerJoin(
			lessons,
			sql`${englishLessonScripts.lessonId}::int = ${lessons.id}`
		)

	return rows
}
export const getEnglishSlideDecks = async () => {
	const rows = await db
		.select({
			id: englishSlides.id,
			lessonId: englishSlides.lessonId,
			googleUrl: englishSlides.googleUrl,
			lessonNumber: englishSlides.lessonNumber,
			lessonTitle: lessons.title,
		})
		.from(englishSlides)
		.innerJoin(lessons, sql`${englishSlides.lessonId}::int = ${lessons.id}`)

	return rows
}

// export const getEnglishLessonScripts = async (prefix?: string) => {
// 	const whereParts = [
// 		prefix ? ilike(lessons.lessonNumber, `${prefix}%`) : undefined,
// 	].filter(Boolean)

// 	const rows = await db
// 		.select({
// 			id: englishLessonScripts.id,
// 			// cast to int so downstream code treats it as number
// 			lessonId: sql<number>`${englishLessonScripts.lessonId}::int`,
// 			content: englishLessonScripts.content,
// 			audioSrc: englishLessonScripts.audioSrc,
// 			lessonTitle: lessons.title,
// 			lessonNumber: lessons.lessonNumber,
// 		})
// 		.from(englishLessonScripts)
// 		.innerJoin(
// 			lessons,
// 			// join string column to numeric id by casting string -> int
// 			sql`${englishLessonScripts.lessonId}::int = ${lessons.id}`
// 		)
// 		.where(and(...whereParts))
// 		.orderBy(lessons.lessonNumber)

// 	return rows
// }

export async function getEnglishLessonScript(lessonScriptId: number) {
	return db.query.englishLessonScripts.findFirst({
		where: eq(englishLessonScripts.id, lessonScriptId),
	})
}
export async function getEnglishSlideDeck(slideDeckId: number) {
	return db.query.englishSlides.findFirst({
		where: eq(englishSlides.id, slideDeckId),
	})
}

export const getGrammarLessons = async () => {
	const results = await db
		.select({
			id: grammarLessons.id,
			lessonId: grammarLessons.lessonId,
			content: grammarLessons.content,
			contentPlain: grammarLessons.contentPlain,
			audioSrc: grammarLessons.audioSrc,
		})
		.from(grammarLessons)
		.orderBy(grammarLessons.lessonId)

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

// 🆕 NEW: Per-course leaderboard using user_course_progress
export async function getTopTwentyUsersByCourse(courseId: number) {
	const rawUsers = await db
		.select({
			userId: userCourseProgress.userId,
			userName: userProgress.userName,
			userImageSrc: userProgress.userImageSrc,
			points: userCourseProgress.points,
			hearts: userCourseProgress.hearts,
			lastSeen: userCourseProgress.lastSeen,
			activeLessonNumber: lessons.lessonNumber,
			courseId: userCourseProgress.courseId,
		})
		.from(userCourseProgress)
		.innerJoin(userProgress, eq(userCourseProgress.userId, userProgress.userId))
		.leftJoin(lessons, eq(userCourseProgress.activeLessonId, lessons.id))
		.where(eq(userCourseProgress.courseId, courseId))
		.orderBy(desc(userCourseProgress.points))
		.limit(20)

	// 🔄 refresh Clerk avatars
	const updated = await Promise.all(
		rawUsers.map(async (u) => {
			let fresh = u.userImageSrc
			try {
				const clerkUser = await clerkClient.users.getUser(u.userId)
				fresh = clerkUser?.imageUrl || '/mascot.svg'
			} catch {
				/* fallback to stored value */
			}
			return {
				...u,
				userImageSrc: fresh?.trim().replace(/\s|\n|\r/g, '') || '/mascot.svg',
			}
		})
	)

	return updated
}

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
				proficiencyLevel: courses.proficiencyLevel,
				endingProficiencyLevel: courses.endingProficiencyLevel,
			},
		})
		.from(userProgress)
		.leftJoin(tribes, eq(userProgress.tribeId, tribes.id))
		.leftJoin(lessons, eq(userProgress.activeLessonId, lessons.id))
		.leftJoin(courses, eq(userProgress.activeCourseId, courses.id))
		.where(eq(userProgress.userId, userId))

	const base = result[0]
	if (!base) return null

	// 🧠 Always refresh from Clerk
	let freshImage = base.userImageSrc
	try {
		const clerkUser = await clerkClient.users.getUser(userId)
		freshImage = clerkUser?.imageUrl || '/mascot.svg'
	} catch {
		console.warn('Failed to refresh Clerk image, using fallback.')
	}

	return {
		...base,
		userImageSrc: freshImage.trim().replace(/\s|\n|\r/g, ''),
	}
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

export type EventsFilter = {
	categories?: string[] // e.g. ['virtual','inperson','dinner','bookclub']
	fromStr?: string // 'YYYY-MM-DD' (local day start)
	toStr?: string // 'YYYY-MM-DD' (local day end)
}

export async function listEvents(filter: EventsFilter = {}) {
	const { categories, fromStr, toStr } = filter

	// Build Postgres-side timestamp (naive) boundaries
	const fromExpr = fromStr ? sql`${fromStr}::date::timestamp` : undefined
	const toExpr = toStr
		? sql`${toStr}::date::timestamp + interval '1 day' - interval '1 millisecond'`
		: undefined

	return db
		.select({
			id: events.id,
			name: events.name,
			category: events.category,
			startTime: events.startTime,
			endTime: events.endTime,
			zoomUrl: events.zoomUrl,
			recordingUrl: events.recordingUrl,
			address: events.address,
			notes: events.notes,
		})
		.from(events)
		.where(
			and(
				categories?.length ? inArray(events.category, categories) : undefined,
				fromExpr ? gte(events.startTime, fromExpr) : undefined,
				toExpr ? lte(events.startTime, toExpr) : undefined
			)
		)
		.orderBy(events.startTime)
}

export async function getAllHebrewStories(courseId?: number) {
	return db.query.hebrewStories.findMany({
		where: sql`${courseId} = ANY(${hebrewStories.courseId})`,
		orderBy: asc(hebrewStories.order),
	})
}

export async function getHebrewStory(storyId: number) {
	return db.query.hebrewStories.findFirst({
		where: eq(hebrewStories.id, storyId),
	})
}

export async function getAllEnglishStories() {
	return db.query.englishStories.findMany({
		orderBy: asc(englishStories.order),
	})
}

export async function getEnglishStory(storyId: number) {
	return db.query.englishStories.findFirst({
		where: eq(englishStories.id, storyId),
	})
}

export async function getGreekLessonScript(lessonScriptId: number) {
	return db.query.greekLessonScripts.findFirst({
		where: eq(greekLessonScripts.id, lessonScriptId),
	})
}

export async function getAllGreekLessonScripts(courseId?: number) {
	const base = db
		.select({
			id: greekLessonScripts.id,
			courseId: greekLessonScripts.courseId,
			lessonId: greekLessonScripts.lessonId,
			part: greekLessonScripts.part,
			content: greekLessonScripts.content,
			audioSrc: greekLessonScripts.audioSrc,
			// 👇 from lessons
			title: lessons.title,
		})
		.from(greekLessonScripts)
		.innerJoin(lessons, eq(greekLessonScripts.lessonId, lessons.id))

	const q =
		courseId != null
			? base.where(sql`${courseId} = ANY(${greekLessonScripts.courseId})`)
			: base

	return q.orderBy(
		asc(greekLessonScripts.lessonId),
		asc(greekLessonScripts.part)
	)
}

export async function getUserStudyGroups(userId: string) {
	return await db.query.studyGroupMembers.findMany({
		where: eq(studyGroupMembers.userId, userId),
		with: {
			studyGroup: true,
		},
	})
}

type ExtendedUser = {
	userId: string
	userName: string
	userImageSrc: string
	lastSeen?: Date | null
	activeLessonNumber?: string | null
}

export async function getStudyGroupWithMessages(studyGroupId: number) {
	const group = await db.query.studyGroups.findFirst({
		where: eq(studyGroups.id, studyGroupId),
		with: {
			teacher: true,
			members: { with: { user: true } },
			messages: {
				with: { sender: true },
				orderBy: (messages, { asc }) => [asc(messages.createdAt)],
			},
		},
	})

	if (!group) return null

	// 🔄 Refresh avatars
	const refreshImage = async (user: any) => {
		try {
			const clerkUser = await clerkClient.users.getUser(user.userId)
			return clerkUser?.imageUrl || '/mascot.svg'
		} catch {
			return user.userImageSrc || '/mascot.svg'
		}
	}

	group.teacher.userImageSrc = await refreshImage(group.teacher)
	for (const m of group.members) {
		m.user.userImageSrc = await refreshImage(m.user)
	}

	// ✅ Collect all member IDs
	const memberIds = group.members.map((m) => m.user.userId)
	if (memberIds.length === 0) return group

	// ✅ Fetch progress info joined to lessons
	const progressRows = await db
		.select({
			userId: userCourseProgress.userId,
			lastSeen: userCourseProgress.lastSeen,
			lessonNumber: lessons.lessonNumber,
		})
		.from(userCourseProgress)
		.leftJoin(lessons, eq(userCourseProgress.activeLessonId, lessons.id))
		.where(inArray(userCourseProgress.userId, memberIds))

	const progressMap = new Map(progressRows.map((r) => [r.userId, r]))

	// ✅ Attach extended fields safely
	for (const m of group.members) {
		const row = progressMap.get(m.user.userId)
		const user = m.user as ExtendedUser
		user.lastSeen = row?.lastSeen ?? null
		user.activeLessonNumber = row?.lessonNumber ?? null
	}

	return group
}

export async function getUserStudyGroupsWithTeaching(userId: string) {
	// Groups where the user is the teacher
	const teachingGroups = await db.query.studyGroups.findMany({
		where: eq(studyGroups.teacherId, userId),
	})

	// Groups where the user is a student
	const memberGroups = await db.query.studyGroupMembers.findMany({
		where: eq(studyGroupMembers.userId, userId),
		with: { studyGroup: true },
	})

	// Combine both types, flatten, and normalize shape
	const combined = [
		...teachingGroups.map((g) => ({
			id: g.id,
			name: g.name,
			organization: g.organization,
			level: g.level,
			section: g.section,
			time: g.time,
			zoomLink: g.zoomLink,
			isTeacher: true,
		})),
		...memberGroups.map((m) => ({
			id: m.studyGroup.id,
			name: m.studyGroup.name,
			organization: m.studyGroup.organization,
			level: m.studyGroup.level,
			section: m.studyGroup.section,
			time: m.studyGroup.time,
			zoomLink: m.studyGroup.zoomLink,
			isTeacher: false,
		})),
	]

	// Deduplicate by group id
	return Object.values(
		combined.reduce((acc, g) => {
			acc[g.id] = g
			return acc
		}, {} as Record<number, any>)
	)
}

export async function getStudyGroupWithCourses(studyGroupId: number) {
	// 1️⃣ Get base group with teacher and members
	const group = await db.query.studyGroups.findFirst({
		where: eq(studyGroups.id, studyGroupId),
		with: {
			teacher: true,
			members: { with: { user: true } },
		},
	})

	if (!group) return null

	// 2️⃣ Refresh avatars for everyone
	const refreshImage = async (user: any) => {
		try {
			const clerkUser = await clerkClient.users.getUser(user.userId)
			return clerkUser?.imageUrl || '/mascot.svg'
		} catch {
			return user.userImageSrc || '/mascot.svg'
		}
	}

	group.teacher.userImageSrc = await refreshImage(group.teacher)
	for (const m of group.members) {
		m.user.userImageSrc = await refreshImage(m.user)
	}

	// 3️⃣ Add available courses (currently all courses)
	const availableCourses = await db.query.courses.findMany({
		orderBy: (courses, { asc }) => [asc(courses.id)],
		columns: {
			id: true,
			title: true,
		},
	})

	return {
		...group,
		availableCourses,
	}
}
