'use server'

import { auth } from '@clerk/nextjs/server'
import { userProgress, tribes } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import db from '@/db/drizzle'

export const updateLastSeen = async () => {
	const { userId } = await auth()
	if (!userId) return { tribePointAwarded: false }

	const currentUser = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
	})
	if (!currentUser) return { tribePointAwarded: false }

	const now = new Date()
	const lastSeen = currentUser.lastSeen ? new Date(currentUser.lastSeen) : null
	const isNewDay = !lastSeen || lastSeen.toDateString() !== now.toDateString()

	if (isNewDay && currentUser.tribeId !== null) {
		await db
			.update(tribes)
			.set({ points: sql`${tribes.points} + 1` })
			.where(eq(tribes.id, currentUser.tribeId))
	}

	await db
		.update(userProgress)
		.set({ lastSeen: now })
		.where(eq(userProgress.userId, userId))

	return { tribePointAwarded: isNewDay && currentUser.tribeId !== null }
}
