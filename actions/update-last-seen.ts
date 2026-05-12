'use server'

import { users, userProgress, tribes } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import db from '@/db/drizzle'

type UpdateLastSeenUser = {
	id?: string | null
	email?: string | null
	name?: string | null
	image?: string | null
}

export const updateLastSeen = async (user?: UpdateLastSeenUser) => {
	const userId = user?.id
	const email = user?.email
	const name = user?.name
	const image = user?.image

	// 2️⃣ Handle guests gracefully
	if (!userId) {
		console.log('👋 Guest detected — skipping DB update (updateLastSeen)')
		return { guest: true, tribePointAwarded: false }
	}

	await db
		.insert(users)
		.values({
			id: userId,
			username: name || email?.split('@')[0] || 'User',
			email: email || '',
			passwordHash: 'google-oauth',
			image,
		})
		.onConflictDoNothing()

	await db
		.insert(userProgress)
		.values({
			userId,
			email: email || '',
			userName: name || email?.split('@')[0] || 'User',
			userImageSrc: image || '/mascot.svg',
			hearts: 5,
			points: 0,
			activeCourseId: null,
			lastSeen: new Date(),
			tribeId: null,
		})
		.onConflictDoNothing()

	const currentUser = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
	})

	if (!currentUser) {
		console.error('❌ userProgress record could not be created for:', userId)
		return { tribePointAwarded: false }
	}

	const now = new Date()
	const lastSeen = currentUser.lastSeen ? new Date(currentUser.lastSeen) : null
	const isNewDay = !lastSeen || lastSeen.toDateString() !== now.toDateString()

	if (isNewDay && currentUser.tribeId !== null) {
		await db
			.update(tribes)
			.set({ points: sql`${tribes.points} + 1` })
			.where(eq(tribes.id, currentUser.tribeId))

		console.log(
			`🌿 Tribe ${currentUser.tribeId} awarded +1 point for user ${userId}`
		)
	}

	await db
		.update(userProgress)
		.set({ lastSeen: now })
		.where(eq(userProgress.userId, userId))

	return {
		guest: false,
		tribePointAwarded: isNewDay && currentUser.tribeId !== null,
	}
}
