'use server'

import { getSession } from '@/lib/auth'
import { users, userProgress, tribes } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import db from '@/db/drizzle'

export const updateLastSeen = async () => {
	// 1️⃣ Get session (Google/Credentials login)
	const session = await getSession()
	const userId = session?.user?.id
	const email = session?.user?.email
	const name = session?.user?.name
	const image = session?.user?.image

	// 2️⃣ Handle guests gracefully
	if (!userId) {
		console.log('👋 Guest detected — skipping DB update (updateLastSeen)')
		// Save a local marker in the browser (if client calls this action)
		// In server-only context, just return safely
		return { guest: true, tribePointAwarded: false }
	}

	// 3️⃣ Ensure users row exists (for FK integrity)
	let existingUser = await db.query.users.findFirst({
		where: eq(users.id, userId),
	})

	if (!existingUser) {
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

		// Re-fetch to ensure consistency
		existingUser = await db.query.users.findFirst({
			where: eq(users.id, userId),
		})

		console.log(`👤 Created users row for ${email}`)
	}

	// 4️⃣ Ensure userProgress row exists
	let currentUser = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, userId),
	})

	if (!currentUser) {
		console.log('🆕 Creating userProgress record for new user:', userId)
		await db
			.insert(userProgress)
			.values({
				userId,
				hearts: 5,
				points: 0,
				activeCourseId: null,
				lastSeen: new Date(),
				tribeId: null,
			})
			.onConflictDoNothing()

		currentUser = await db.query.userProgress.findFirst({
			where: eq(userProgress.userId, userId),
		})
	}

	// 5️⃣ Safety fallback
	if (!currentUser) {
		console.error('❌ userProgress record could not be created for:', userId)
		return { tribePointAwarded: false }
	}

	// 6️⃣ Calculate if we’ve crossed into a new day
	const now = new Date()
	const lastSeen = currentUser.lastSeen ? new Date(currentUser.lastSeen) : null
	const isNewDay = !lastSeen || lastSeen.toDateString() !== now.toDateString()

	// 7️⃣ Award tribe points (only once per day)
	if (isNewDay && currentUser.tribeId !== null) {
		await db
			.update(tribes)
			.set({ points: sql`${tribes.points} + 1` })
			.where(eq(tribes.id, currentUser.tribeId))

		console.log(
			`🌿 Tribe ${currentUser.tribeId} awarded +1 point for user ${userId}`
		)
	}

	// 8️⃣ Always update lastSeen timestamp
	await db
		.update(userProgress)
		.set({ lastSeen: now })
		.where(eq(userProgress.userId, userId))

	return {
		guest: false,
		tribePointAwarded: isNewDay && currentUser.tribeId !== null,
	}
}
