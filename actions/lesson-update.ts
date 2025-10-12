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

export const updateActiveLesson = async (lessonId?: number | null) => {
	const { userId } = await auth()
	if (!userId) return

	const user = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
	})
	if (!user?.activeCourseId) return

	await db
		.insert(userCourseProgress)
		.values({
			userId,
			courseId: user.activeCourseId,
			activeLessonId: lessonId ?? null,
			lastSeen: new Date(),
		})
		.onConflictDoUpdate({
			target: [userCourseProgress.userId, userCourseProgress.courseId],
			set: {
				activeLessonId: lessonId ?? null,
				lastSeen: new Date(),
			},
		})

	console.log(`✅ Manually set activeLessonId=${lessonId}`)
}
