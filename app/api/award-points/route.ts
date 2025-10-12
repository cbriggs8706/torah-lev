import db from '@/db/drizzle'
import { userCourseProgress } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function POST(req: Request) {
	const { userId, courseId, points } = await req.json()

	if (!userId || !courseId || typeof points !== 'number') {
		return new Response(JSON.stringify({ error: 'Invalid payload' }), {
			status: 400,
		})
	}

	await db
		.insert(userCourseProgress)
		.values({
			userId,
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

	return new Response(JSON.stringify({ success: true }), { status: 200 })
}
