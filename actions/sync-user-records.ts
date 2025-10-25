'use server'

import db from '@/db/drizzle'
import {
	users,
	userProgress,
	userCourseProgress,
	challengeProgress,
	userRoles,
	messages,
	houseMembers,
	studyGroupMembers,
	userSubscription,
} from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function syncUserRecords({
	newUserId,
	email,
	userName,
	image,
}: {
	newUserId: string
	email: string
	userName?: string
	image?: string
}) {
	if (!email || !newUserId) return

	console.log(`🔍 Checking for existing userProgress by email: ${email}`)

	// 1️⃣ Ensure a base users record exists (NextAuth → Google ID)
	const existingUser = await db.query.users.findFirst({
		where: eq(users.id, newUserId),
	})
	if (!existingUser) {
		await db
			.insert(users)
			.values({
				id: newUserId,
				username: userName || email.split('@')[0],
				email,
				passwordHash: 'google-oauth',
				image,
			})
			.onConflictDoNothing()
		console.log(`👤 Added users row for ${email}`)
	}

	// 2️⃣ Find the old progress record (by email)
	const oldProgress = await db.query.userProgress.findFirst({
		where: eq(userProgress.email, email),
	})

	// 🆕 No existing progress → create fresh record
	if (!oldProgress) {
		await db.insert(userProgress).values({
			userId: newUserId,
			email,
			userName: userName || 'User',
			userImageSrc: image || '/mascot.svg',
			hearts: 5,
			points: 0,
			lastSeen: new Date(),
		})
		console.log(`🆕 Created new userProgress for ${email}`)
		return
	}

	// 3️⃣ If new userId already has a record, skip duplication
	const alreadyExists = await db.query.userProgress.findFirst({
		where: eq(userProgress.userId, newUserId),
	})
	if (alreadyExists) {
		console.log(`⚠️ New ID ${newUserId} already has userProgress; skipping.`)
		return
	}

	// 4️⃣ Duplicate user_progress under new ID
	await db.insert(userProgress).values({
		userId: newUserId,
		email,
		userName: oldProgress.userName || userName || 'User',
		userImageSrc: oldProgress.userImageSrc || image || '/mascot.svg',
		activeCourseId: oldProgress.activeCourseId,
		hearts: oldProgress.hearts,
		points: oldProgress.points,
		tribeId: oldProgress.tribeId,
		isHebrewFriend: oldProgress.isHebrewFriend,
		isSpanishFriend: oldProgress.isSpanishFriend,
		isEnglishFriend: oldProgress.isEnglishFriend,
		isBookclubFriend: oldProgress.isBookclubFriend,
		isTester: oldProgress.isTester,
		activeLessonId: oldProgress.activeLessonId,
		lastSeen: oldProgress.lastSeen || new Date(),
	})
	console.log(`📋 Duplicated user_progress for ${email} (new ID: ${newUserId})`)

	// 5️⃣ Optional: duplicate dependent data (non-destructive)
	const tablesToDuplicate = [
		{ table: userCourseProgress, column: userCourseProgress.userId },
		{ table: challengeProgress, column: challengeProgress.userId },
		{ table: userRoles, column: userRoles.userId },
		{ table: houseMembers, column: houseMembers.userId },
		{ table: studyGroupMembers, column: studyGroupMembers.userId },
		{ table: userSubscription, column: userSubscription.userId },
	] as const

	for (const { table, column } of tablesToDuplicate) {
		try {
			const oldRows = await db
				.select()
				.from(table)
				.where(eq(column, oldProgress.userId))
			if (oldRows.length > 0) {
				const duplicates = oldRows.map((row: any) => ({
					...row,
					id: undefined, // reset PK
					userId: newUserId,
				}))
				await db.insert(table).values(duplicates).onConflictDoNothing()
				console.log(`📦 Duplicated ${duplicates.length} row(s) from table`)
			}
		} catch (err) {
			console.warn(`⚠️ Skipped duplicating ${table}`, err)
		}
	}

	console.log(`✅ Finished duplicating records for ${email}`)
}
