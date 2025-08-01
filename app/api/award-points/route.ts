import db from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function POST(req: Request) {
	const { userId, points } = await req.json()

	await db
		.update(userProgress)
		.set({ points: sql`${userProgress.points} + ${points}` })
		.where(eq(userProgress.userId, userId))

	return new Response(JSON.stringify({ success: true }), { status: 200 })
}
