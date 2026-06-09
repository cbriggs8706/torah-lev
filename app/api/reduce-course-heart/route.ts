import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import { getSession } from '@/lib/auth'
import { userCourseProgress } from '@/db/schema'

const reduceCourseHeartSchema = z.object({
	courseId: z.number().int().positive(),
})

export async function POST(request: Request) {
	const session = await getSession()
	const userId = session?.user?.id ?? null

	if (!userId) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = await request.json()
		const parsed = reduceCourseHeartSchema.safeParse(body)

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message || 'Invalid payload' },
				{ status: 400 },
			)
		}

		const now = new Date()
		const [updated] = await db
			.insert(userCourseProgress)
			.values({
				userId,
				courseId: parsed.data.courseId,
				hearts: 4,
				points: 0,
				lastSeen: now,
			})
			.onConflictDoUpdate({
				target: [userCourseProgress.userId, userCourseProgress.courseId],
				set: {
					hearts: sql`greatest(${userCourseProgress.hearts} - 1, 0)`,
					lastSeen: now,
				},
			})
			.returning({
				hearts: userCourseProgress.hearts,
			})

		if (!updated) {
			return NextResponse.json(
				{ error: 'Failed to update hearts' },
				{ status: 500 },
			)
		}

		return NextResponse.json({ hearts: updated.hearts })
	} catch (error) {
		console.error('Error reducing course hearts:', error)
		return NextResponse.json(
			{ error: 'Failed to reduce course hearts' },
			{ status: 500 },
		)
	}
}
