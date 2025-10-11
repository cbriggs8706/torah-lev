'use server'

import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import {
	userProgress,
	userCourseProgress,
	challengeProgress,
	units,
} from '@/db/schema'

export const updateActiveLesson = async () => {
	const { userId } = await auth()
	if (!userId) return

	const user = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
	})
	if (!user?.activeCourseId) return

	// 🧭 Get all lessons in the active course
	const unitsInActiveCourse = await db.query.units.findMany({
		where: eq(units.courseId, user.activeCourseId),
		orderBy: (units, { asc }) => [asc(units.order)],
		with: {
			lessons: {
				orderBy: (lessons, { asc }) => [asc(lessons.order)],
				with: {
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

	const allLessons = unitsInActiveCourse.flatMap((unit) => unit.lessons)

	// 🧩 Determine which lesson to set as “active”
	const firstUncompletedIndex = allLessons.findIndex((lesson) =>
		lesson.challenges.some(
			(challenge) =>
				!challenge.challengeProgress ||
				challenge.challengeProgress.length === 0 ||
				challenge.challengeProgress.some((p) => !p.completed)
		)
	)

	let lessonIdToSet: number | null = null

	if (firstUncompletedIndex === -1) {
		// all lessons done → last lesson
		lessonIdToSet = allLessons.at(-1)?.id ?? null
	} else if (firstUncompletedIndex > 0) {
		// mark previous lesson as active
		lessonIdToSet = allLessons[firstUncompletedIndex - 1].id
	}
	// else: leave null if very first lesson uncompleted

	// ✅ Update only per-course table (not global user_progress)
	await db
		.insert(userCourseProgress)
		.values({
			userId,
			courseId: user.activeCourseId,
			activeLessonId: lessonIdToSet,
			lastSeen: new Date(),
		})
		.onConflictDoUpdate({
			target: [userCourseProgress.userId, userCourseProgress.courseId],
			set: {
				activeLessonId: lessonIdToSet,
				lastSeen: new Date(),
			},
		})

	console.log(
		`✅ Updated activeLessonId=${lessonIdToSet} for user ${userId}, course ${user.activeCourseId}`
	)
}
