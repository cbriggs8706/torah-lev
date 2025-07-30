'use server'

import { auth } from '@clerk/nextjs'
import { userProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'
import db from '@/db/drizzle'

export const updateLastSeen = async () => {
	const { userId } = await auth()
	if (!userId) return

	await db
		.update(userProgress)
		.set({ lastSeen: new Date() })
		.where(eq(userProgress.userId, userId))
}
