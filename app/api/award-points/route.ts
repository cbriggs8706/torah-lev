import db from '@/db/drizzle'
import { getFreshUserProgress } from '@/db/queries'
import { tribes, userCourseProgress } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

type ProgressPayload = {
	userId?: string | null
	courseId?: number
	points?: number
}

// ✅ Helper to detect guest IDs
const isGuestId = (id?: string | null) =>
	!id || id.startsWith('guest-') || id.length < 10

export async function POST(req: Request) {
	try {
		const { userId, courseId, points } = (await req.json()) as ProgressPayload

		// 🔍 Validate payload
		if (!courseId || typeof points !== 'number') {
			return new Response(JSON.stringify({ error: 'Invalid payload' }), {
				status: 400,
			})
		}

		// 👋 Guest mode: skip DB write
		if (isGuestId(userId)) {
			console.log('⚠️ Guest detected — skipping DB write in /progress')
			return new Response(JSON.stringify({ guest: true, success: false }), {
				status: 200,
			})
			}

			// ✅ Authenticated user path
			const currentUserProgress = await getFreshUserProgress(userId!)
			await db
				.insert(userCourseProgress)
				.values({
					userId: userId!,
				courseId,
				points,
				lastSeen: new Date(),
			})
			.onConflictDoUpdate({
				target: [userCourseProgress.userId, userCourseProgress.courseId],
				set: {
					points: sql`${userCourseProgress.points} + ${points}`,
					lastSeen: new Date(),
					},
				})

			let tribePointAwarded = false
			if (currentUserProgress?.tribeId) {
				await db
					.update(tribes)
					.set({ points: sql`${tribes.points} + 1` })
					.where(eq(tribes.id, currentUserProgress.tribeId))
				tribePointAwarded = true
			}

			return new Response(
				JSON.stringify({ success: true, tribePointAwarded }),
				{ status: 200 },
			)
		} catch (error) {
		console.error('❌ Error updating progress:', error)
		return new Response(JSON.stringify({ error: 'Server error' }), {
			status: 500,
		})
	}
}
