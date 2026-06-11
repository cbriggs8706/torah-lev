import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import { getSession } from '@/lib/auth'
import { getFreshUserProgress } from '@/db/queries'
import { tribes, userCourseProgress, userProgress } from '@/db/schema'

const schema = z.object({
	courseId: z.number().int().positive(),
	points: z.number().int().positive(),
	hearts: z.number().int().min(0).max(5),
})

export async function POST(request: Request) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = await request.json()
		const parsed = schema.safeParse(body)

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid payload' },
				{ status: 400 },
			)
		}

		const { courseId, points, hearts } = parsed.data
		const now = new Date()
		const currentUserProgress = await getFreshUserProgress(userId)

		await db
			.insert(userCourseProgress)
			.values({
				userId,
				courseId,
				points,
				hearts,
				lastSeen: now,
			})
			.onConflictDoUpdate({
				target: [userCourseProgress.userId, userCourseProgress.courseId],
				set: {
					points: sql`${userCourseProgress.points} + ${points}`,
					hearts,
					lastSeen: now,
				},
			})

		await db
			.update(userProgress)
			.set({
				activeCourseId: courseId,
				lastSeen: now,
			})
			.where(eq(userProgress.userId, userId))

		let tribePointAwarded = false
		if (currentUserProgress?.tribeId) {
			await db
				.update(tribes)
				.set({ points: sql`${tribes.points} + 1` })
				.where(eq(tribes.id, currentUserProgress.tribeId))
			tribePointAwarded = true
		}

		return NextResponse.json({
			awardedPoints: points,
			hearts,
			tribePointAwarded,
		})
	} catch (error) {
		console.error('Error saving spelling completion:', error)
		return NextResponse.json(
			{ error: 'Failed to save spelling completion.' },
			{ status: 500 },
		)
	}
}
