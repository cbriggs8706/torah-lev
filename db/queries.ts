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
import { getActiveCourseId, getUserId } from '@/lib/auth'

// import { events } from '@/db/schema'

import db from '@/db/drizzle'
import {
	challengeProgress,
	curriculum,
	hebrewPrayerLibrary,
	hebrewPrayerLine,
	lessons,
	videos,
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
	englishStories,
	studyGroupCourse,
	studyGroupSchedule,
	studyGroupScheduleLessons,
	studyGroups,
	studyGroupMembers,
	users,
	vocabEntries,
} from '@/db/schema'
import { tr } from 'date-fns/locale'
import {
	fallbackConstructAbsoluteWords,
	toConstructAbsoluteWord,
	type ConstructAbsoluteWord,
} from '@/lib/data/hebrew/construct-absolute'
import { toConstructAbsoluteActivityWord } from '@/lib/construct-absolute'
import { parseStudyGroupScheduleMeta } from '@/lib/study-group-schedule-meta'

export async function getUserProgress(userIdOverride?: string | null) {
	const userId = userIdOverride ?? (await getUserId())

	// ✅ Define a common base shape so TS infers one consistent object type
	const defaultProgress = {
		userId: userId ?? 'guest',
		userName: 'Guest',
		userImageSrc: '/mascot.svg',
		activeCourseId: null as number | null,
		activeCourse: null as any,
		points: 0,
		hearts: 5,
		activeLessonId: null as number | null,
		activeLessonNumber: null as string | null,
		lastSeen: null as Date | null,
		isHebrewFriend: false,
		isSpanishFriend: false,
		isEnglishFriend: false,
		isTester: false,
		isBookclubFriend: false,
		tribeId: null as number | null,
		hebrewName: 'אני',
		spanishName: 'nombre',
		hebrewImageSrc: '/mascot.svg',
		email: '',
	}

	// ✅ Handle guests gracefully
	if (!userId || userId.startsWith('guest')) {
		return defaultProgress
	}

	// ✅ Pull base user progress (profile, activeCourseId, etc.)
	const baseProgress = await db
		.select({
			userId: userProgress.userId,
			userName: userProgress.userName,
			hebrewName: userProgress.hebrewName,
			spanishName: userProgress.spanishName,
			// 🔄 Pull from users table instead of user_progress
			userImageSrc: users.image,
			hebrewImageSrc: userProgress.hebrewImageSrc,
			email: users.email,
			isHebrewFriend: userProgress.isHebrewFriend,
			isSpanishFriend: userProgress.isSpanishFriend,
			isEnglishFriend: userProgress.isEnglishFriend,
			isBookclubFriend: userProgress.isBookclubFriend,
			tribeId: userProgress.tribeId,
			isTester: userProgress.isTester,
			points: userProgress.points,
			hearts: userProgress.hearts,
			activeCourseId: userProgress.activeCourseId,
			lastSeen: userProgress.lastSeen,
			activeCourse: {
				id: curriculum.id,
				title: curriculum.title,
				imageSrc: curriculum.imageSrc,
			},
		})
		.from(userProgress)
		.innerJoin(users, eq(users.id, userProgress.userId)) // ✅ join users
		.leftJoin(curriculum, eq(userProgress.activeCourseId, curriculum.id))
		.where(eq(userProgress.userId, userId))
		.then((rows) => rows[0])

	if (!baseProgress) {
		return { ...defaultProgress, userId, userName: 'Unknown User' }
	}

	// ✅ Fetch their course progress for the active course
	let courseProgress = null
	if (baseProgress.activeCourseId) {
		courseProgress = await db.query.userCourseProgress.findFirst({
			where: and(
				eq(userCourseProgress.userId, userId),
				eq(userCourseProgress.courseId, baseProgress.activeCourseId)
			),
			with: {
				activeLesson: {
					columns: { id: true, lessonNumber: true },
				},
			},
		})
	}

	const liveCoursePosition = await getLiveCoursePosition(
		userId,
		baseProgress.activeCourseId
	)

	// ✅ Return a merged and always-consistent shape
	return {
		...defaultProgress,
		...baseProgress,
		points: courseProgress?.points ?? 0,
		hearts: courseProgress?.hearts ?? 5,
		activeLessonId:
			liveCoursePosition.activeLessonId ?? courseProgress?.activeLessonId ?? null,
		activeLessonNumber:
			liveCoursePosition.activeLessonNumber ??
			courseProgress?.activeLesson?.lessonNumber ??
			null,
		lastSeen: courseProgress?.lastSeen ?? baseProgress.lastSeen ?? null,
	}
}

export const getCurrentUserActiveCourseId = cache(async () => {
	const userId = await getUserId()

	if (!userId) return null
	if (userId.startsWith('guest')) return await getActiveCourseId()

	const data = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
		columns: {
			activeCourseId: true,
		},
	})

	return data?.activeCourseId ?? null
})

async function getLiveCoursePosition(
	userId: string | null,
	courseId: number | null
): Promise<{
	activeLessonId: number | null
	activeLessonNumber: string | null
}> {
	if (!courseId) {
		return {
			activeLessonId: null as number | null,
			activeLessonNumber: null as string | null,
		}
	}

	const lessonsInCourse = await db.query.lessons.findMany({
		where: eq(lessons.courseId, courseId),
		orderBy: (tbl, { asc }) => [asc(tbl.order)],
		with: {
			challenges: {
				orderBy: (tbl, { asc }) => [asc(tbl.order)],
				with:
					userId && !userId.startsWith('guest')
						? {
								challengeProgress: {
									where: eq(challengeProgress.userId, userId),
								},
						  }
						: undefined,
			},
		},
	})

	let fallbackLesson: {
		id: number
		lessonNumber: string
	} | null = null

	for (const lesson of lessonsInCourse) {
		fallbackLesson = {
			activeLessonId: lesson.id,
			activeLessonNumber: lesson.lessonNumber,
		}

		if (!userId || userId.startsWith('guest')) {
			return fallbackLesson
		}

		const isUncompleted = lesson.challenges.some((ch) => {
			const progressList = (ch as any).challengeProgress ?? []
			return (
				progressList.length === 0 || progressList.some((p: any) => !p.completed)
			)
		})

		if (isUncompleted) {
			return fallbackLesson
		}
	}

	return {
		activeLessonId: fallbackLesson?.activeLessonId ?? null,
		activeLessonNumber: fallbackLesson?.activeLessonNumber ?? null,
	}
}

export const getCourseLessons = cache(async (userIdOverride?: string | null) => {
	const userId = userIdOverride ?? (await getUserId())
	const userProg = await getUserProgress(userId)
	const activeCourseId =
		userProg?.activeCourseId ?? (await getActiveCourseId()) ?? null

	if (!activeCourseId) return []

	const data = await db.query.lessons.findMany({
		where: eq(lessons.courseId, activeCourseId),
		orderBy: (tbl, { asc }) => [asc(tbl.order)],
		with: {
			challenges: {
				orderBy: (tbl, { asc }) => [asc(tbl.order)],
				with:
					userId && !userId.startsWith('guest')
						? {
								challengeProgress: {
									where: eq(challengeProgress.userId, userId),
								},
						  }
						: undefined,
			},
		},
	})

	return data.map((lesson) => {
		if (!userId || userId.startsWith('guest')) {
			return { ...lesson, completed: false }
		}

		const allCompletedChallenges =
			lesson.challenges.length > 0 &&
			lesson.challenges.every((ch) => {
				const progressList = (ch as any).challengeProgress ?? []
				return (
					progressList.length > 0 &&
					progressList.every((p: any) => p.completed)
				)
			})

		return { ...lesson, completed: allCompletedChallenges }
	})
})
// export const getUnits = cache(async () => {
// 	const userId = await getUserId()
// 	const userProgress = await getUserProgress()

// 	if (!userId || !userProgress?.activeCourseId) {
// 		return []
// 	}

// 	const data = await db.query.units.findMany({
// 		orderBy: (units, { asc }) => [asc(units.order)],
// 		where: eq(units.courseId, userProgress.activeCourseId),
// 		with: {
// 			lessons: {
// 				orderBy: (lessons, { asc }) => [asc(lessons.order)],
// 				with: {
// 					challenges: {
// 						orderBy: (challenges, { asc }) => [asc(challenges.order)],
// 						with: {
// 							challengeProgress: {
// 								where: eq(challengeProgress.userId, userId),
// 							},
// 						},
// 					},
// 				},
// 			},
// 		},
// 	})

// 	const normalizedData = data.map((unit) => {
// 		const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
// 			if (lesson.challenges.length === 0) {
// 				return { ...lesson, completed: false }
// 			}

// 			const allCompletedChallenges = lesson.challenges.every((challenge) => {
// 				return (
// 					challenge.challengeProgress &&
// 					challenge.challengeProgress.length > 0 &&
// 					challenge.challengeProgress.every((progress) => progress.completed)
// 				)
// 			})

// 			return { ...lesson, completed: allCompletedChallenges }
// 		})

// 		return { ...unit, lessons: lessonsWithCompletedStatus }
// 	})

// 	return normalizedData
// })

export const getCourses = cache(async () => {
	const data = await db.query.curriculum.findMany()

	return data
})

export const getCourseById = cache(async (courseId: number) => {
	const data = await db.query.curriculum.findFirst({
		where: eq(curriculum.id, courseId),
		with: {
			lessons: {
				orderBy: (lessons, { asc }) => [asc(lessons.order)],
			},
		},
	})

	return data
})

export async function getAllUserCourseProgress() {
	const userId = await getUserId()
	if (!userId) return []

	const results = await db
		.select({
			courseId: userCourseProgress.courseId,
			points: userCourseProgress.points,
			hearts: userCourseProgress.hearts,
			activeLessonId: userCourseProgress.activeLessonId,
			lastSeen: userCourseProgress.lastSeen,
			courseTitle: curriculum.title,
			courseImage: curriculum.imageSrc,
			proficiencyLevel: curriculum.proficiencyLevel,
			endingProficiencyLevel: curriculum.endingProficiencyLevel,
		})
		.from(userCourseProgress)
		.innerJoin(curriculum, eq(userCourseProgress.courseId, curriculum.id))
		.where(eq(userCourseProgress.userId, userId))
		.orderBy(asc(curriculum.id))

	return results
}

export const getCourseProgress = cache(
	async (userIdOverride?: string | null) => {
		const userId = userIdOverride ?? (await getUserId())
		const userProg = await getUserProgress(userId)
		const activeCourseId =
			userProg?.activeCourseId ?? (await getActiveCourseId()) ?? null

		// 👇 Guest or no active course
		if (!activeCourseId) {
			return {
				activeLesson: undefined,
				activeLessonId: undefined,
				lessonsInActiveCourse: [],
			}
		}

		const lessonsInActiveCourse = await db.query.lessons.findMany({
			where: eq(lessons.courseId, activeCourseId),
			orderBy: (tbl, { asc }) => [asc(tbl.order)],
			with: {
				course: true,
				challenges: {
					orderBy: (tbl, { asc }) => [asc(tbl.order)],
					with:
						userId && !userId.startsWith('guest')
							? {
									challengeProgress: {
										where: eq(challengeProgress.userId, userId),
									},
							  }
							: undefined,
				},
			},
		})

		let firstUncompletedLesson:
			| (typeof lessonsInActiveCourse)[number]
			| null = null

		if (userId && !userId.startsWith('guest')) {
			for (const lesson of lessonsInActiveCourse) {
				const isUncompleted = lesson.challenges.some((ch) => {
					const progressList = (ch as any).challengeProgress ?? []
					return (
						progressList.length === 0 ||
						progressList.some((p: any) => !p.completed)
					)
				})
				if (isUncompleted) {
					firstUncompletedLesson = lesson
					break
				}
			}
		} else {
			firstUncompletedLesson = lessonsInActiveCourse[0] ?? null
		}

		return {
			activeLesson: firstUncompletedLesson ?? undefined,
			activeLessonId: firstUncompletedLesson?.id ?? undefined,
			lessonsInActiveCourse,
		}
	}
)

export const getConstructAbsoluteWords = cache(
	async ({
		courseId,
		activeLessonId,
		activity,
		}: {
			courseId: number
			activeLessonId?: number | null
			activity: 'wordSort' | 'converter' | 'identifyForm'
		}) => {
		const getFirstLessonRows = <
			T extends {
				lessonOrder: number
			},
		>(
			items: T[]
		) => {
			const first = items[0]
			if (!first) return items

			return items.filter(
				(item) => item.lessonOrder === first.lessonOrder
			)
		}

		try {
			const lessonRows = await db
				.select({
					lessonNumber: lessons.lessonNumber,
					lessonTitle: lessons.title,
					lessonId: lessons.id,
					lessonOrder: lessons.order,
				})
				.from(lessons)
				.where(eq(lessons.courseId, courseId))
				.orderBy(asc(lessons.order))

			const lessonPositionByNumber = new Map(
				lessonRows.map((row) => [row.lessonNumber, row])
			)

			const constructRows = await db.query.vocabEntries.findMany({
				where: and(eq(vocabEntries.courseId, courseId), eq(vocabEntries.language, 'he')),
				orderBy: asc(vocabEntries.id),
			})

			const linkedConstructRows = constructRows.filter(
				(row) =>
					row.state?.trim().toLowerCase() === 'construct' &&
					typeof row.rootId === 'number'
			)

			const rootIds = Array.from(
				new Set(
					linkedConstructRows
						.map((row) => row.rootId)
						.filter((value): value is number => typeof value === 'number')
				)
			)

			const rootRows = rootIds.length
				? await db.query.vocabEntries.findMany({
						where: inArray(vocabEntries.id, rootIds),
					})
				: []

			const rootById = new Map(rootRows.map((row) => [row.id, row]))

			const rows = linkedConstructRows
				.map((constructRow) => {
					const rootRow = rootById.get(constructRow.rootId!)
					if (!rootRow) return null

					const absolute =
						rootRow.lemma?.trim() ||
						rootRow.heb?.trim() ||
						null
					const construct =
						constructRow.lemma?.trim() ||
						constructRow.heb?.trim() ||
						null

					if (!absolute || !construct) return null

					if (activity !== 'identifyForm' && absolute.normalize('NFC') === construct.normalize('NFC')) {
						return null
					}

					const firstLessonNumber =
						constructRow.lessons[0] ?? rootRow.lessons[0] ?? ''
					const lessonPosition = lessonPositionByNumber.get(firstLessonNumber)
					if (!lessonPosition) return null

					return {
						id: constructRow.id,
						lessonId: lessonPosition.lessonId,
						lessonNumber: lessonPosition.lessonNumber,
						lessonTitle: lessonPosition.lessonTitle,
						lessonOrder: lessonPosition.lessonOrder,
						absolute,
						construct,
					}
				})
				.filter((row): row is NonNullable<typeof row> => row !== null)

			if (!rows.length) {
				return getFallbackConstructAbsoluteWords(activity)
			}

			let activePosition:
				| {
						lessonOrder: number
				  }
				| undefined

			if (activeLessonId) {
				const [currentLesson] = await db
					.select({
						lessonOrder: lessons.order,
					})
					.from(lessons)
					.where(
						and(eq(lessons.id, activeLessonId), eq(lessons.courseId, courseId))
					)
					.limit(1)

				activePosition = currentLesson
			}

			const visibleRows = rows.filter((row) => {
				if (!activePosition) {
					return row.lessonOrder === rows[0].lessonOrder
				}
				return row.lessonOrder <= activePosition.lessonOrder
			})

			return (visibleRows.length ? visibleRows : getFirstLessonRows(rows)).map(
				(row) => toConstructAbsoluteActivityWord(row)
			)
		} catch (error) {
			console.warn('Falling back to local construct/absolute words.', error)
			return getFallbackConstructAbsoluteWords(activity)
		}
	}
)

function getFallbackConstructAbsoluteWords(
	activity: 'wordSort' | 'converter' | 'identifyForm'
): ConstructAbsoluteWord[] {
	return fallbackConstructAbsoluteWords.map(toConstructAbsoluteWord)
}

// export const getCourseProgress = cache(async () => {
// 	const userId = await getUserId()
// 	const userProgress = await getUserProgress()

// 	if (!userId || !userProgress?.activeCourseId) {
// 		return null
// 	}

// 	const unitsInActiveCourse = await db.query.units.findMany({
// 		orderBy: (units, { asc }) => [asc(units.order)],
// 		where: eq(units.courseId, userProgress.activeCourseId),
// 		with: {
// 			lessons: {
// 				orderBy: (lessons, { asc }) => [asc(lessons.order)],
// 				with: {
// 					unit: true,
// 					challenges: {
// 						with: {
// 							challengeProgress: {
// 								where: eq(challengeProgress.userId, userId),
// 							},
// 						},
// 					},
// 				},
// 			},
// 		},
// 	})

// 	const firstUncompletedLesson = unitsInActiveCourse
// 		.flatMap((unit) => unit.lessons)
// 		.find((lesson) => {
// 			return lesson.challenges.some((challenge) => {
// 				return (
// 					!challenge.challengeProgress ||
// 					challenge.challengeProgress.length === 0 ||
// 					challenge.challengeProgress.some(
// 						(progress) => progress.completed === false
// 					)
// 				)
// 			})
// 		})

// 	return {
// 		activeLesson: firstUncompletedLesson,
// 		activeLessonId: firstUncompletedLesson?.id,
// 		unitsInActiveCourse,
// 	}
// })

export const getLesson = cache(
	async (id?: number, userIdOverride?: string | null) => {
		const userId = userIdOverride ?? (await getUserId())
		const courseProgress = await getCourseProgress(userId)
		const lessonId = id || courseProgress?.activeLessonId
		if (!lessonId) return null

		const data = await db.query.lessons.findFirst({
			where: eq(lessons.id, lessonId),
			with: {
				challenges: {
					orderBy: (ch, { asc }) => [asc(ch.order)],
					with: {
						challengeOptions: true,
						challengeProgress:
							userId && !userId.startsWith('guest')
								? { where: eq(challengeProgress.userId, userId) }
								: undefined,
					},
				},
			},
		})

		if (!data) return null

		const normalizedChallenges = data.challenges.map((ch) => {
			const completed =
				ch.challengeProgress && ch.challengeProgress.length > 0
					? ch.challengeProgress.every((p) => p.completed)
					: false

			return { ...ch, completed }
		})

		return { ...data, challenges: normalizedChallenges }
	}
)

export async function getAllHebrewLessonScripts(courseId?: number) {
	const base = db
		.select({
			id: videos.id,
			curriculumId: videos.curriculumId,
			lessonId: videos.lessonId,
			lessonNumber: lessons.lessonNumber,
			part: videos.part,
			content: videos.content,
			contentPlain: videos.contentPlain,
			audioSrc: videos.audioSrc,
			url: videos.videoUrl,
			type: videos.type,
			title: lessons.title,
		})
		.from(videos)
		.innerJoin(lessons, eq(videos.lessonId, lessons.id))

	const q =
		courseId != null
			? base.where(
					and(
						sql`${videos.type} IS DISTINCT FROM 'story'::video_type`,
						sql`${courseId} = ANY(${videos.curriculumId})`
					)
				)
			: base.where(sql`${videos.type} IS DISTINCT FROM 'story'::video_type`)

	return q.orderBy(asc(videos.lessonId), asc(videos.part))
}

export const getHebrewLessonScripts = async (courseId: number) => {
	const results = await db
		.select({
			id: videos.id,
			curriculumId: videos.curriculumId,
			lessonScriptId: videos.lessonId,
			part: videos.part,
			content: videos.content,
			contentPlain: videos.contentPlain,
			audioSrc: videos.audioSrc,
			url: videos.videoUrl,
			type: videos.type,
			title: lessons.title,
			lessonId: lessons.id,
		})
		.from(videos)
		.innerJoin(lessons, eq(videos.lessonId, lessons.id))
		.where(
			and(
				sql`${videos.type} IS DISTINCT FROM 'story'::video_type`,
				sql`${courseId} = ANY(${videos.curriculumId})`
			)
		)
		.orderBy(asc(videos.lessonId), asc(videos.part))

	return results
}

export async function getHebrewLessonScript(lessonScriptId: number) {
	return db.query.videos.findFirst({
		where: eq(videos.id, lessonScriptId),
	})
}

// TODO fix to match hebrew
// export async function getAllEnglishLessonScripts(courseId?: number) {
// 	const base = db
// 		.select({
// 			id: englishLessonScripts.id,
// 			courseId: englishLessonScripts.courseId,
// 			lessonId: englishLessonScripts.lessonId,
// 			content: englishLessonScripts.content,
// 			audioSrc: englishLessonScripts.audioSrc,
// 			// 👇 from lessons
// 			title: lessons.title,
// 		})
// 		.from(englishLessonScripts)
// 		.innerJoin(lessons, eq(englishLessonScripts.lessonId, lessons.id))

// 	const q =
// 		courseId != null
// 			? base.where(sql`${courseId} = ANY(${englishLessonScripts.courseId})`)
// 			: base

// 	return q.orderBy(
// 		asc(englishLessonScripts.lessonId),
// 	)
// }

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

export async function getLessonPercentage(userIdOverride?: string | null) {
	const userId = userIdOverride ?? (await getUserId())
	if (!userId || userId.startsWith('guest')) return 0

	const courseProg = await getCourseProgress(userId)
	if (!courseProg?.activeLessonId) return 0

	const lesson = await getLesson(courseProg.activeLessonId, userId)
	if (!lesson?.challenges?.length) return 0

	const completedCount = lesson.challenges.filter((c) => c.completed).length
	return Math.round((completedCount / lesson.challenges.length) * 100)
}

const DAY_IN_MS = 86_400_000
export const getUserSubscription = cache(async () => {
	const userId = await getUserId()

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
	const userId = await getUserId()

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
	return await db
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
}

export async function getTopTwentyHebrewUsersByCourse(courseId: number) {
	return await db
		.select({
			userId: userCourseProgress.userId,
			userName: userProgress.userName,
			hebrewName: userProgress.hebrewName,

			// ✅ Prefer Hebrew image → fallback to English → fallback to mascot
			userImageSrc: sql<string>`
        COALESCE(${userProgress.hebrewImageSrc}, ${userProgress.userImageSrc}, '/mascot.svg')
      `.as('user_image_src'),

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
	const userId = await getUserId()
	if (!userId) return null

	const result = await db
		.select({
			userId: userProgress.userId,
			userName: userProgress.userName,
			hebrewName: userProgress.hebrewName,
			spanishName: userProgress.spanishName,

			// ✅ COALESCE fallback (explicitly cast to text so TypeScript sees it as string)
			userImageSrc: sql<string>`COALESCE(${userProgress.userImageSrc}, ${users.image})`,

			hebrewImageSrc: userProgress.hebrewImageSrc,
			points: userProgress.points,
			hearts: userProgress.hearts,
			currentLesson: lessons.lessonNumber,
			tribeId: userProgress.tribeId,
			tribeEngName: tribes.engName,
			tribeHebName: tribes.hebName,
			tribePoints: tribes.points,
			tribeImage: tribes.imgSrc,
			activeCourse: {
				id: curriculum.id,
				title: curriculum.title,
				imageSrc: curriculum.imageSrc,
				proficiencyLevel: curriculum.proficiencyLevel,
				endingProficiencyLevel: curriculum.endingProficiencyLevel,
			},
		})
		.from(userProgress)
		.innerJoin(users, eq(users.id, userProgress.userId))
		.leftJoin(tribes, eq(userProgress.tribeId, tribes.id))
		.leftJoin(lessons, eq(userProgress.activeLessonId, lessons.id))
		.leftJoin(curriculum, eq(userProgress.activeCourseId, curriculum.id))
		.where(eq(userProgress.userId, userId))

	const base = result[0]
	if (!base) return null

	return {
		...base,
		currentLesson: base.currentLesson ?? null,
	}
}

export async function getTribeMembers(tribeId: number) {
	if (!tribeId) return []

	const members = await db
		.select({
			userId: userProgress.userId,
			userName: userProgress.userName,
			hebrewName: userProgress.hebrewName,
			userImageSrc: sql<string>`COALESCE(${userProgress.userImageSrc}, ${users.image})`,
			hebrewImageSrc: userProgress.hebrewImageSrc,
			points: userProgress.points,
			hearts: userProgress.hearts,
			activeLesson: lessons.lessonNumber, // 👈 include lesson number
		})
		.from(userProgress)
		.innerJoin(users, eq(users.id, userProgress.userId))
		.leftJoin(lessons, eq(userProgress.activeLessonId, lessons.id))
		.where(eq(userProgress.tribeId, tribeId))

	return members
}

// function parseLessonNumber(lesson: string | null) {
// 	if (!lesson) return 0
// 	const match = lesson.match(/^(\d+)([a-z])?$/i)
// 	if (!match) return 0
// 	const base = parseInt(match[1], 10)
// 	const part = match[2]?.toLowerCase()
// 	if (part === 'a') return base - 0.25
// 	if (part === 'b') return base - 0.125
// 	return base
// }

function parseLessonNumber(lesson: string | null): number {
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
	// 🧩 Get all users with tribe assignment
	const users = await db
		.select({
			tribeId: userProgress.tribeId,
			userName: userProgress.userName,
			hebrewName: userProgress.hebrewName,
			points: userProgress.points,
			lessonNumber: lessons.lessonNumber,
			// ✅ prefer Hebrew image, fallback to user image, fallback to mascot
			userImageSrc: sql<string>`
				COALESCE(${userProgress.hebrewImageSrc}, ${userProgress.userImageSrc}, '/mascot.svg')
			`.as('user_image_src'),
		})
		.from(userProgress)
		.leftJoin(lessons, eq(userProgress.activeLessonId, lessons.id))
		.where(sql`${userProgress.tribeId} IS NOT NULL`)

	// 🧩 Get all base tribes
	const tribeBase = await db
		.select({
			tribeId: tribes.id,
			tribeEngName: tribes.engName,
			tribeHebName: tribes.hebName,
			tribePoints: tribes.points,
			tribeImage: tribes.imgSrc,
		})
		.from(tribes)

	// 🧮 Group tribe data
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
			members: members.map((m) => ({
				userName: m.userName,
				hebrewName: m.hebrewName,
				userImageSrc: m.userImageSrc,
			})),
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

// export async function listEvents(filter: EventsFilter = {}) {
// 	const { categories, fromStr, toStr } = filter

// 	// Build Postgres-side timestamp (naive) boundaries
// 	const fromExpr = fromStr ? sql`${fromStr}::date::timestamp` : undefined
// 	const toExpr = toStr
// 		? sql`${toStr}::date::timestamp + interval '1 day' - interval '1 millisecond'`
// 		: undefined

// 	return db
// 		.select({
// 			id: events.id,
// 			name: events.name,
// 			category: events.category,
// 			startTime: events.startTime,
// 			endTime: events.endTime,
// 			zoomUrl: events.zoomUrl,
// 			recordingUrl: events.recordingUrl,
// 			address: events.address,
// 			notes: events.notes,
// 		})
// 		.from(events)
// 		.where(
// 			and(
// 				categories?.length ? inArray(events.category, categories) : undefined,
// 				fromExpr ? gte(events.startTime, fromExpr) : undefined,
// 				toExpr ? lte(events.startTime, toExpr) : undefined
// 			)
// 		)
// 		.orderBy(events.startTime)
// }

export async function getAllHebrewStories(courseId?: number) {
	const rows = await db
		.select({
			id: videos.id,
			lessonId: videos.lessonId,
			curriculumId: videos.curriculumId,
			title: videos.title,
			hebTitle: videos.hebTitle,
			titleTransliteration: videos.titleTransliteration,
			order: videos.order,
			video: videos.videoUrl,
			image: videos.image,
			public: videos.public,
			category: videos.category,
			content: videos.content,
			contentPlain: videos.contentPlain,
			audio: videos.audio,
		})
		.from(videos)
		.where(
			and(
				eq(videos.type, 'story'),
				courseId != null
					? sql`${courseId} = ANY(${videos.curriculumId})`
					: undefined
			)
		)
		.orderBy(asc(videos.order))

	return rows
}

export async function getHebrewStory(storyId: number) {
	const [story] = await db
		.select({
			id: videos.id,
			title: videos.title,
			hebTitle: videos.hebTitle,
			titleTransliteration: videos.titleTransliteration,
			video: videos.videoUrl,
			image: videos.image,
			content: videos.content,
			contentPlain: videos.contentPlain,
			audio: videos.audio,
			lessonId: videos.lessonId,
			curriculumId: videos.curriculumId,
			category: videos.category,
			public: videos.public,
		})
		.from(videos)
		.where(and(eq(videos.id, storyId), eq(videos.type, 'story')))
		.limit(1)

	return story
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

	let studyGroupCourses: any[] = []
	let scheduleEvents: any[] = []

	try {
		studyGroupCourses = await db.query.studyGroupCourse.findMany({
			where: eq(studyGroupCourse.studyGroupId, studyGroupId),
			orderBy: (table, helpers) => [helpers.desc(table.createdAt)],
		})
	} catch (error) {
		console.warn(
			'Study group courses unavailable. Has drizzle/0013_study_group_course.sql been applied?',
			error
		)
	}

	try {
		const scheduleRows = await db
			.select({
				id: studyGroupSchedule.id,
				classDate: studyGroupSchedule.classDate,
				notes: studyGroupSchedule.notes,
				platformCourseId: units.courseId,
				platformCourseTitle: curriculum.title,
				lessonId: lessons.id,
				lessonTitle: lessons.title,
				lessonNumber: lessons.lessonNumber,
			})
			.from(studyGroupSchedule)
			.leftJoin(
				studyGroupScheduleLessons,
				eq(studyGroupSchedule.id, studyGroupScheduleLessons.scheduleId)
			)
			.leftJoin(lessons, eq(studyGroupScheduleLessons.lessonId, lessons.id))
			.leftJoin(units, eq(lessons.unitId, units.id))
			.leftJoin(curriculum, eq(units.courseId, curriculum.id))
			.where(eq(studyGroupSchedule.studyGroupId, studyGroupId))
			.orderBy(asc(studyGroupSchedule.classDate))

		scheduleEvents = scheduleRows.map((row) => {
			const { meta, userNotes } = parseStudyGroupScheduleMeta(row.notes)

			return {
				id: row.id,
				classDate: row.classDate,
				title: meta?.title ?? null,
				notes: userNotes,
				studyGroupCourseId: meta?.studyGroupCourseId ?? null,
				groupCourseName: meta?.groupCourseName ?? null,
				platformCourseId: row.platformCourseId ?? meta?.platformCourseId ?? null,
				platformCourseTitle: row.platformCourseTitle,
				lessonId: row.lessonId,
				lessonTitle: row.lessonTitle,
				lessonNumber: row.lessonNumber,
			}
		})
	} catch (error) {
		console.warn(
			'Study group schedule unavailable. Has drizzle/0017_study_group_schedule_settings.sql been applied?',
			error
		)
	}

	const groupWithCourses = {
		...group,
		courses: studyGroupCourses,
		scheduleEvents,
	}

	// ✅ Collect all member IDs
	const memberIds = group.members.map((m) => m.user.userId)
	if (memberIds.length === 0) return groupWithCourses

	// ✅ Fetch progress info joined to lessons & userProgress (for image fallback)
	const progressRows = await db
		.select({
			userId: userProgress.userId,
			lastSeen: userProgress.lastSeen,
			activeCourseId: userProgress.activeCourseId,
			userImageSrc: sql<string>`
        COALESCE(${users.image}, ${userProgress.userImageSrc}, '/mascot.svg')
      `.as('user_image_src'),
		})
		.from(userProgress)
		.leftJoin(users, eq(users.id, userProgress.userId))
		.where(inArray(userProgress.userId, memberIds))

	const progressMap = new Map(
		await Promise.all(
			progressRows.map(async (row) => {
				const liveCoursePosition = await getLiveCoursePosition(
					row.userId,
					row.activeCourseId
				)
				return [
					row.userId,
					{
						...row,
						lessonNumber: liveCoursePosition.activeLessonNumber,
					},
				] as const
			})
		)
	)

	// ✅ Attach extended fields safely
	for (const m of group.members) {
		const row = progressMap.get(m.user.userId)
		const user = m.user as any

		user.lastSeen = row?.lastSeen ?? null
		user.activeLessonNumber = row?.lessonNumber ?? null

		// ✅ Prefer users.image → userProgress.userImageSrc → /mascot.svg
		user.userImageSrc =
			row?.userImageSrc ||
			m.user.userImageSrc ||
			m.user.userImageSrc ||
			'/mascot.svg'
	}

	return groupWithCourses
}

export async function getUserStudyGroupsWithTeaching(userId: string) {
	// Groups where the user is the teacher
	const teachingGroups = await db.query.studyGroups.findMany({
		where: eq(studyGroups.teacherId, userId),
		columns: {
			id: true,
			name: true,
			startDate: true,
			groupType: true,
			organization: true,
			level: true,
			section: true,
			time: true,
			zoomLink: true,
			current: true, // ✅ include current flag
		},
	})

	// Groups where the user is a student
	const memberGroups = await db.query.studyGroupMembers.findMany({
		where: eq(studyGroupMembers.userId, userId),
		with: {
			studyGroup: {
				columns: {
					id: true,
					name: true,
					startDate: true,
					groupType: true,
					organization: true,
					level: true,
					section: true,
					time: true,
					zoomLink: true,
					current: true, // ✅ include current flag
				},
			},
		},
	})

	// Combine both types, flatten, and normalize shape
	const combined = [
		...teachingGroups.map((g) => ({
			id: g.id,
			name: g.name,
			startDate: g.startDate,
			groupType: g.groupType,
			organization: g.organization,
			level: g.level,
			section: g.section,
			time: g.time,
			zoomLink: g.zoomLink,
			current: g.current, // ✅ keep boolean
			isTeacher: true,
		})),
		...memberGroups.map((m) => ({
			id: m.studyGroup.id,
			name: m.studyGroup.name,
			startDate: m.studyGroup.startDate,
			groupType: m.studyGroup.groupType,
			organization: m.studyGroup.organization,
			level: m.studyGroup.level,
			section: m.studyGroup.section,
			time: m.studyGroup.time,
			zoomLink: m.studyGroup.zoomLink,
			current: m.studyGroup.current, // ✅ keep boolean
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
