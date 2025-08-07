'use server'

import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import { userProgress, challengeProgress, units } from '@/db/schema'

export const updateActiveLesson = async () => {
	const { userId } = await auth()
	if (!userId) return

	const user = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
	})
	if (!user?.activeCourseId) return

	// Get all lessons ordered by unit.order + lesson.order
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

	// Flatten and preserve lesson order
	const allLessons = unitsInActiveCourse.flatMap((unit) => unit.lessons)

	// Find first uncompleted lesson index
	const firstUncompletedIndex = allLessons.findIndex((lesson) =>
		lesson.challenges.some(
			(challenge) =>
				!challenge.challengeProgress ||
				challenge.challengeProgress.length === 0 ||
				challenge.challengeProgress.some((progress) => !progress.completed)
		)
	)

	let lessonIdToSet: number | null = null

	if (firstUncompletedIndex === -1) {
		// All lessons completed — set to last lesson
		lessonIdToSet = allLessons.at(-1)?.id ?? null
	} else if (firstUncompletedIndex > 0) {
		// Set to lesson before the first uncompleted
		lessonIdToSet = allLessons[firstUncompletedIndex - 1].id
	}
	// Else: first lesson is uncompleted, so lessonIdToSet remains null

	await db
		.update(userProgress)
		.set({ activeLessonId: lessonIdToSet, lastSeen: new Date() })
		.where(eq(userProgress.userId, userId))
}
