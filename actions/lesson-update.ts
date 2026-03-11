'use server'

import { eq } from 'drizzle-orm'
import db from '@/db/drizzle'
import {
	userProgress,
	userCourseProgress,
	lessons,
} from '@/db/schema'
import { getSession } from '@/lib/auth'

export const updateActiveLesson = async (lessonId?: number | null) => {
	const session = await getSession()
	const userId = session?.user?.id

	if (!userId) return

	const user = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
	})
	if (!lessonId) return

	const lesson = await db.query.lessons.findFirst({
		where: eq(lessons.id, lessonId),
		with: {
			unit: {
				columns: {
					courseId: true,
				},
			},
		},
	})
	if (!lesson?.unit?.courseId) return

	await db
		.insert(userCourseProgress)
		.values({
			userId,
			courseId: lesson.unit.courseId,
			activeLessonId: lessonId,
			lastSeen: new Date(),
		})
		.onConflictDoUpdate({
			target: [userCourseProgress.userId, userCourseProgress.courseId],
			set: {
				activeLessonId: lessonId,
				lastSeen: new Date(),
			},
		})

	await db
		.update(userProgress)
		.set({
			activeCourseId: lesson.unit.courseId,
			activeLessonId: lessonId,
			lastSeen: new Date(),
		})
		.where(eq(userProgress.userId, userId))

	console.log(`✅ Manually set activeLessonId=${lessonId}`)
}
