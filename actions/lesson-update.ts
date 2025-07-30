'use server'

import { auth } from '@clerk/nextjs'
import { eq } from 'drizzle-orm'
import { userProgress } from '@/db/schema'
import db from '@/db/drizzle'

export const updateActiveLesson = async (nextLessonId: number) => {
	const { userId } = await auth()
	if (!userId) return

	await db
		.update(userProgress)
		.set({ activeLessonId: nextLessonId, lastSeen: new Date() })
		.where(eq(userProgress.userId, userId))
}
